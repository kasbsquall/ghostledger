// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

import {Nox, ebool, euint256, externalEuint256} from "@iexec-nox/nox-protocol-contracts/contracts/sdk/Nox.sol";

/// @title ConfidentialTreasuryLog
/// @notice Holds a treasury's spending history as encrypted handles and scores
///         each new movement against it. No amount is ever readable on-chain:
///         the only thing this contract publishes is the risk band.
/// @dev The scoring policy (watchFactor, flagFactor) is deliberately public so
///      anyone can audit the rule. What stays confidential is the data it runs
///      on: the running total, the movement count and the proposed amount.
contract ConfidentialTreasuryLog {
    uint256 public constant RISK_CLEAR = 1;
    uint256 public constant RISK_WATCH = 2;
    uint256 public constant RISK_FLAG = 3;

    /// @notice Multiples of the running average that separate the risk bands.
    uint256 public immutable watchFactor;
    uint256 public immutable flagFactor;

    address public immutable owner;

    /// @notice Contract allowed to record movements. Set once, to the module.
    address public recorder;

    euint256 private _totalSpent;
    euint256 private _movementCount;

    euint256 private _clearLevel;
    euint256 private _watchLevel;
    euint256 private _flagLevel;
    euint256 private _watchFactorEnc;
    euint256 private _flagFactorEnc;

    /// @notice Emitted once a movement has been scored. `riskHandle` is
    ///         publicly decryptable, `amountHandle` is not.
    event MovementScored(uint256 indexed movementId, bytes32 riskHandle, bytes32 amountHandle);
    event MovementRecorded(uint256 indexed movementId);

    uint256 public movementsScored;

    error NotOwner();
    error NotRecorder();
    error RecorderAlreadySet();
    error AmountNotShared();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyRecorder() {
        if (msg.sender != recorder) revert NotRecorder();
        _;
    }

    constructor(uint256 watchFactor_, uint256 flagFactor_) {
        owner = msg.sender;
        watchFactor = watchFactor_;
        flagFactor = flagFactor_;

        _totalSpent = Nox.toEuint256(0);
        _movementCount = Nox.toEuint256(0);
        _clearLevel = Nox.toEuint256(RISK_CLEAR);
        _watchLevel = Nox.toEuint256(RISK_WATCH);
        _flagLevel = Nox.toEuint256(RISK_FLAG);
        _watchFactorEnc = Nox.toEuint256(watchFactor_);
        _flagFactorEnc = Nox.toEuint256(flagFactor_);

        Nox.allowThis(_totalSpent);
        Nox.allowThis(_movementCount);
        Nox.allowThis(_clearLevel);
        Nox.allowThis(_watchLevel);
        Nox.allowThis(_flagLevel);
        Nox.allowThis(_watchFactorEnc);
        Nox.allowThis(_flagFactorEnc);

        Nox.allow(_totalSpent, owner);
        Nox.allow(_movementCount, owner);
    }

    function setRecorder(address recorder_) external onlyOwner {
        if (recorder != address(0)) revert RecorderAlreadySet();
        recorder = recorder_;
    }

    /// @notice Scores a proposed amount against the encrypted history.
    /// @dev Returns a handle that anyone can decrypt via `publicDecrypt`. The
    ///      amount handle itself is only shared with `viewer`, so signers can
    ///      reveal the detail on demand without making it public.
    /// @dev The caller must already be an admin of `amount` and must have
    ///      granted this contract access to it. Converting the external handle
    ///      happens in the caller on purpose: a handle proof is bound to the
    ///      pair (signer, contract the signer calls), so `fromExternal` only
    ///      validates inside the contract the signer transacts with directly.
    /// @param amount Encrypted amount this contract is already allowed to read.
    function scoreMovement(
        euint256 amount
    ) external onlyRecorder returns (euint256 riskLevel) {
        if (!Nox.isAllowed(amount, address(this))) revert AmountNotShared();

        // An empty history cannot justify a verdict, so safeDiv's success flag
        // is carried all the way into the result instead of being discarded.
        (ebool hasHistory, euint256 average) = Nox.safeDiv(_totalSpent, _movementCount);

        (, euint256 watchCeiling) = Nox.safeMul(average, _watchFactorEnc);
        (, euint256 flagCeiling) = Nox.safeMul(average, _flagFactorEnc);

        ebool overWatch = Nox.gt(amount, watchCeiling);
        ebool overFlag = Nox.gt(amount, flagCeiling);

        euint256 band = Nox.select(overFlag, _flagLevel, Nox.select(overWatch, _watchLevel, _clearLevel));

        // No history means "a human has to look at this", never "all clear".
        riskLevel = Nox.select(hasHistory, band, _watchLevel);

        Nox.allowThis(riskLevel);
        Nox.allowPublicDecryption(riskLevel);

        uint256 movementId = movementsScored++;
        emit MovementScored(movementId, euint256.unwrap(riskLevel), euint256.unwrap(amount));
    }

    /// @notice Folds an executed movement into the encrypted history so future
    ///         proposals are compared against an up-to-date pattern.
    function recordMovement(euint256 amount, uint256 movementId) external onlyRecorder {
        (, _totalSpent) = Nox.safeAdd(_totalSpent, amount);
        (, _movementCount) = Nox.safeAdd(_movementCount, _clearLevel);

        Nox.allowThis(_totalSpent);
        Nox.allowThis(_movementCount);
        Nox.allow(_totalSpent, owner);
        Nox.allow(_movementCount, owner);

        emit MovementRecorded(movementId);
    }

    /// @notice Seeds the history with a past movement. Owner only, used once to
    ///         give the detector a baseline before the first live proposal.
    function seedHistory(externalEuint256 amountHandle, bytes calldata amountProof) external onlyOwner {
        euint256 amount = Nox.fromExternal(amountHandle, amountProof);

        (, _totalSpent) = Nox.safeAdd(_totalSpent, amount);
        (, _movementCount) = Nox.safeAdd(_movementCount, _clearLevel);

        Nox.allowThis(_totalSpent);
        Nox.allowThis(_movementCount);
        Nox.allow(_totalSpent, owner);
        Nox.allow(_movementCount, owner);
    }

    /// @notice Handles of the aggregate history. Only the owner can decrypt
    ///         them; everyone else sees two meaningless 32-byte identifiers.
    function historyHandles() external view returns (bytes32 total, bytes32 count) {
        return (euint256.unwrap(_totalSpent), euint256.unwrap(_movementCount));
    }
}
