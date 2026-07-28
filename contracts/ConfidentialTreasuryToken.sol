// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20ToERC7984Wrapper} from "@iexec-nox/nox-confidential-contracts/contracts/token/extensions/ERC20ToERC7984Wrapper.sol";

/// @title ConfidentialTreasuryToken
/// @notice A confidential wrapper around any ERC-20 a treasury already holds.
///
/// @dev This is the piece that makes the privacy guarantee hold all the way to
///      execution. A DAO deposits its ordinary, fully public ERC-20 and gets
///      back an ERC-7984 balance whose amount lives behind a Nox handle. From
///      that point on, transfers move encrypted amounts: the destination is
///      visible on-chain, the number never is.
///
///      Nothing about the underlying token is modified. It does not know this
///      contract exists, which is exactly the constraint the challenge sets:
///      add privacy on top of public infrastructure, leave the infrastructure
///      untouched.
contract ConfidentialTreasuryToken is ERC20ToERC7984Wrapper {
    constructor(
        string memory name,
        string memory symbol,
        string memory contractURI,
        IERC20 underlying
    ) ERC20ToERC7984Wrapper(name, symbol, contractURI, underlying) {}
}
