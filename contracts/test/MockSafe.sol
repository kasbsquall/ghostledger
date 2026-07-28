// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

/// @notice Test double for the two Safe functions GhostLedgerModule relies on.
/// @dev Used only by the local integration test. The Sepolia deployment runs
///      against a real Safe, so this exists to make the flow reproducible
///      offline, not to stand in for one in production.
contract MockSafe {
    mapping(address => bool) private _isOwner;
    mapping(address => bool) public isModuleEnabled;

    address[] private _owners;
    uint256 private _threshold;

    constructor(address[] memory owners, uint256 threshold) {
        _owners = owners;
        _threshold = threshold;
        for (uint256 i = 0; i < owners.length; ++i) {
            _isOwner[owners[i]] = true;
        }
    }

    function isOwner(address owner) external view returns (bool) {
        return _isOwner[owner];
    }

    function getOwners() external view returns (address[] memory) {
        return _owners;
    }

    function getThreshold() external view returns (uint256) {
        return _threshold;
    }

    function enableModule(address module) external {
        isModuleEnabled[module] = true;
    }

    function execTransactionFromModule(
        address to,
        uint256 value,
        bytes calldata data,
        uint8 operation
    ) external returns (bool success) {
        require(isModuleEnabled[msg.sender], "MockSafe: module not enabled");
        require(operation == 0, "MockSafe: only CALL");
        (success, ) = to.call{value: value}(data);
    }
}
