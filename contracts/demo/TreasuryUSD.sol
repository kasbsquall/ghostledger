// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Stand-in for whatever public ERC-20 a DAO actually holds. Sepolia
///         has no way to hand out an arbitrary stablecoin, so the demo mints
///         its own. Anything with an ERC-20 interface works with the wrapper.
/// @dev Testnet only. `mint` is deliberately open so the demo can be reset.
contract TreasuryUSD is ERC20 {
    constructor() ERC20("Treasury USD", "TUSD") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
