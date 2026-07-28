// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

import {Nox, euint256, externalEuint256} from "@iexec-nox/nox-protocol-contracts/contracts/sdk/Nox.sol";
import {ConfidentialTreasuryLog} from "./ConfidentialTreasuryLog.sol";

/// @dev The slice of the Safe API this module needs. Declared locally so the
///      project does not depend on the Safe contracts, and so it is obvious
///      that nothing in the Safe itself is modified or extended.
interface ISafe {
    function execTransactionFromModule(
        address to,
        uint256 value,
        bytes calldata data,
        uint8 operation
    ) external returns (bool success);

    function isOwner(address owner) external view returns (bool);

    function getThreshold() external view returns (uint256);

    function getOwners() external view returns (address[] memory);
}

/// @title GhostLedgerModule
/// @notice A Safe module where the number of signatures a payout needs is
///         computed from data nobody can read.
///
/// @dev Installed with `enableModule` on an existing Safe. The Safe's own code
///      is untouched.
///
///      A Safe module can normally execute unilaterally, which would turn an
///      m-of-n Safe into a 1-of-n Safe for anything routed through it. This
///      module refuses to do that: it counts its own approvals and never
///      accepts fewer than the Safe's own threshold. The encrypted risk band
///      can only ever raise that bar, never lower it.
///
///      | Band            | Signatures required        |
///      | --------------- | -------------------------- |
///      | Within pattern  | the Safe's own threshold   |
///      | Review          | threshold + 1              |
///      | Anomalous       | every owner                |
///
///      The band reaches the chain through `Nox.publicDecrypt`, which verifies
///      the gateway's EIP-712 signature over the handle. Nobody can assert a
///      band the TEE did not produce.
contract GhostLedgerModule {
    enum Status {
        Pending,
        Executed,
        Rejected
    }

    uint256 private constant BAND_UNSETTLED = 0;
    uint256 private constant BAND_CLEAR = 1;
    uint256 private constant BAND_WATCH = 2;
    uint256 private constant BAND_FLAG = 3;

    struct Movement {
        address destination;
        address proposer;
        uint64 proposedAt;
        Status status;
        uint8 band;
        uint8 approvals;
        euint256 amount;
        euint256 risk;
    }

    ISafe public immutable safe;
    address public immutable token;
    ConfidentialTreasuryLog public immutable log;

    Movement[] private _movements;
    mapping(uint256 movementId => mapping(address owner => bool)) public hasApproved;

    event MovementProposed(
        uint256 indexed id,
        address indexed proposer,
        address indexed destination,
        bytes32 riskHandle
    );
    event MovementSettled(uint256 indexed id, uint8 band, uint256 signaturesRequired);
    event MovementApproved(uint256 indexed id, address indexed owner, uint8 approvals);
    event MovementExecuted(uint256 indexed id);
    event MovementRejected(uint256 indexed id, address indexed by);

    error NotSafeOwner();
    error NotPending();
    error SafeExecutionFailed();
    error ZeroDestination();
    error BandNotSettled();
    error BandAlreadySettled();
    error UnknownBand(uint256 band);
    error AlreadyApproved();
    error NotEnoughApprovals(uint8 have, uint256 need);

    modifier onlySafeOwner() {
        if (!safe.isOwner(msg.sender)) revert NotSafeOwner();
        _;
    }

    constructor(address safe_, address token_, address log_) {
        safe = ISafe(safe_);
        token = token_;
        log = ConfidentialTreasuryLog(log_);
    }

    /// @notice Proposes a payout. The amount arrives already encrypted, so it
    ///         never appears in calldata. Scoring happens in the same
    ///         transaction; the band itself settles once the TEE has run.
    function propose(
        externalEuint256 amountHandle,
        bytes calldata amountProof,
        address destination
    ) external onlySafeOwner returns (uint256 id) {
        if (destination == address(0)) revert ZeroDestination();

        // A handle proof is bound to the signer and to the contract the signer
        // calls, so the conversion has to happen right here rather than deeper
        // in the call stack.
        euint256 amount = Nox.fromExternal(amountHandle, amountProof);

        // The Safe will be the caller of confidentialTransfer and the token
        // consumes the handle internally, so both need access. The log needs it
        // to score, and the proposer to reveal the detail on demand.
        Nox.allowThis(amount);
        Nox.allow(amount, address(log));
        Nox.allow(amount, address(safe));
        Nox.allow(amount, token);
        Nox.allow(amount, msg.sender);

        euint256 risk = log.scoreMovement(amount);

        id = _movements.length;
        _movements.push(
            Movement({
                destination: destination,
                proposer: msg.sender,
                proposedAt: uint64(block.timestamp),
                status: Status.Pending,
                band: uint8(BAND_UNSETTLED),
                approvals: 0,
                amount: amount,
                risk: risk
            })
        );

        emit MovementProposed(id, msg.sender, destination, euint256.unwrap(risk));
    }

    /// @notice Brings the decrypted band on-chain. Permissionless on purpose:
    ///         the proof is what carries the authority, not the caller. Anyone
    ///         can settle a movement, nobody can settle it dishonestly.
    /// @param decryptionProof Gateway signature over the risk handle, obtained
    ///        from the JS SDK's `publicDecrypt`.
    function settle(uint256 id, bytes calldata decryptionProof) external {
        Movement storage movement = _movements[id];
        if (movement.status != Status.Pending) revert NotPending();
        if (movement.band != BAND_UNSETTLED) revert BandAlreadySettled();

        uint256 band = Nox.publicDecrypt(movement.risk, decryptionProof);
        if (band != BAND_CLEAR && band != BAND_WATCH && band != BAND_FLAG) revert UnknownBand(band);

        movement.band = uint8(band);
        emit MovementSettled(id, uint8(band), _signaturesRequired(band));
    }

    /// @notice Records this owner's approval. A movement can only be approved
    ///         once its band is known, so nobody signs blind.
    function approve(uint256 id) external onlySafeOwner {
        Movement storage movement = _movements[id];
        if (movement.status != Status.Pending) revert NotPending();
        if (movement.band == BAND_UNSETTLED) revert BandNotSettled();
        if (hasApproved[id][msg.sender]) revert AlreadyApproved();

        hasApproved[id][msg.sender] = true;
        movement.approvals += 1;

        emit MovementApproved(id, msg.sender, movement.approvals);
    }

    /// @notice Executes a movement once it carries enough approvals for its
    ///         band, then folds it into the encrypted history.
    function execute(uint256 id) external onlySafeOwner {
        Movement storage movement = _movements[id];
        if (movement.status != Status.Pending) revert NotPending();
        if (movement.band == BAND_UNSETTLED) revert BandNotSettled();

        uint256 required = _signaturesRequired(movement.band);
        if (movement.approvals < required) revert NotEnoughApprovals(movement.approvals, required);

        movement.status = Status.Executed;

        // euint256 is a user-defined type over bytes32, so that is how it
        // appears in the ABI of the confidential token.
        bytes memory payload = abi.encodeWithSignature(
            "confidentialTransfer(address,bytes32)",
            movement.destination,
            euint256.unwrap(movement.amount)
        );

        if (!safe.execTransactionFromModule(token, 0, payload, 0)) revert SafeExecutionFailed();

        log.recordMovement(movement.amount, id);
        emit MovementExecuted(id);
    }

    /// @notice Discards a movement. Any single owner can block a payout, which
    ///         is the fail-safe direction: refusing to spend needs less consent
    ///         than spending. Rejected movements never reach the history, so a
    ///         blocked anomaly cannot drag the baseline upwards.
    function reject(uint256 id) external onlySafeOwner {
        Movement storage movement = _movements[id];
        if (movement.status != Status.Pending) revert NotPending();
        movement.status = Status.Rejected;
        emit MovementRejected(id, msg.sender);
    }

    /// @notice Signatures a band demands. Never below the Safe's own threshold,
    ///         so installing this module cannot weaken the Safe.
    function signaturesRequired(uint256 id) external view returns (uint256) {
        return _signaturesRequired(_movements[id].band);
    }

    function _signaturesRequired(uint256 band) private view returns (uint256) {
        uint256 threshold = safe.getThreshold();
        uint256 owners = safe.getOwners().length;

        if (band == BAND_FLAG) return owners;
        if (band == BAND_WATCH) return threshold + 1 > owners ? owners : threshold + 1;
        return threshold;
    }

    function movementCount() external view returns (uint256) {
        return _movements.length;
    }

    /// @notice Everything the dashboard needs for one row. `riskHandle` is
    ///         publicly decryptable, `amountHandle` only by the ACL.
    function movementAt(
        uint256 id
    )
        external
        view
        returns (
            address destination,
            address proposer,
            uint64 proposedAt,
            Status status,
            uint8 band,
            uint8 approvals,
            bytes32 riskHandle,
            bytes32 amountHandle
        )
    {
        Movement storage movement = _movements[id];
        return (
            movement.destination,
            movement.proposer,
            movement.proposedAt,
            movement.status,
            movement.band,
            movement.approvals,
            euint256.unwrap(movement.risk),
            euint256.unwrap(movement.amount)
        );
    }
}
