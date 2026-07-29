## The bigger the payment, the more signatures. And nobody sees the payment.

GhostLedger is a module for a Safe multisig. It compares every proposed payout against the treasury's own spending history and makes an unusual payout need more signatures than a routine one. It does the comparison inside a sealed processor that hands back a verdict and not the number.

So the treasury learns that a payout is large without the owners voting on it, the module, or anyone watching the chain learning how large. One role can, and it is named under Known limits below.

| Risk band | Rule | Signatures required |
|---|---|---|
| Within pattern | under 2× the trailing average | the Safe's own threshold |
| Review | 2× to 5× | threshold + 1 |
| Anomalous | over 5× | every owner |

The scoring rule is public so anyone can audit it. The data it runs on never is. A secret rule over secret data is something nobody can trust.

## The gap this closes, documented by an incumbent

Screening a Safe is already a solved, commercial problem. Hypernative Guardian is integrated natively in Safe{Wallet}, and the policy Safe's own help centre documents is "limit transfers above a specific amount", a static ceiling. Chainalysis Hexagate says its monitors learn how wallets behave over time, then enumerates timing, frequency and changes of authority. Safe Shield Copilot already does per-wallet novelty detection on counterparties, flagging "a destination with very limited history".

The incumbent has shipped half of this idea and left the amount half static. GhostLedger does not claim to detect better than any of them, and with one threshold rule it plainly does not.

Every one of those systems needs the amount in plaintext to evaluate it.

Confidential payouts are solved too. Zama and Bron ran confidential payroll on Ethereum mainnet in January 2026. ERC-7984 wallets, vaults and payroll tools ship encrypted amounts today. None of them score anything.

OpenZeppelin's [CMTAT Confidential audit](https://www.openzeppelin.com/news/cmtat-confidential-audit) records the gap precisely: under ERC-7984, amount-based policy rules cannot be evaluated on-chain because the value is hidden, so the rule engine is handed `0` as the amount and compliance degrades to address-based checks.

That is the sentence GhostLedger answers. The policy engine receives the real amount, evaluates it, and still never learns it.

## How the privacy holds end to end

1. The amount is encrypted in the browser with the Nox JS SDK before the transaction is signed, so it never appears in calldata.
2. `GhostLedgerModule` converts the external handle and grants the ACL to the five parties that will touch it. The scoring contract holds a reference, never a value.
3. `ConfidentialTreasuryLog` computes the verdict on handles: `safeDiv` for the running average, `safeMul` for the ceilings, `gt` and nested `select` for the band. Only the band gets `allowPublicDecryption`.
4. The verdict returns signed by the Nox gateway. `settle()` verifies that signature through `Nox.publicDecrypt` before it will accept a band at all.
5. Execution moves an ERC-7984 confidential token through the Safe, so the figure stays hidden past execution too.

Two design decisions worth calling out.

**An empty history never returns "all clear."** `safeDiv` reports failure when the movement count is zero, and that flag is carried into the result with a `select`, forcing the band to Review. A detector with no baseline says a human should look at this, not that it looks fine.

**Rejected movements never enter the history.** Otherwise an attacker could inflate the baseline with proposals they expect to be rejected until a large payout reads as normal.

## Nothing underneath was modified

The brief asked for privacy added on top of real open-source infrastructure without touching the protocol. GhostLedger declares the two Safe functions it needs as a local interface and installs through `enableModule`, Safe's own extension point. It can only ever **raise** the number of signatures a payout needs, never lower it, so adopting it cannot weaken a Safe.

The underlying ERC-20 is untouched as well: it is wrapped into an ERC-7984 confidential balance and the original contract does not know GhostLedger exists.

## Live on Ethereum Sepolia, all contracts verified

| Contract | Address |
|---|---|
| Safe, 4 owners at threshold 2 | [`0x7DC3B572…86A40372`](https://eth-sepolia.blockscout.com/address/0x7DC3B57286F4Fb4bF793B536B4380B3E86A40372) |
| GhostLedgerModule | [`0xf6bc97f8…bc134b08`](https://eth-sepolia.blockscout.com/address/0xf6bc97f8a9f399dd33517ed4f4a695f8bc134b08#code) |
| ConfidentialTreasuryLog | [`0x15d9cf24…4b926585`](https://eth-sepolia.blockscout.com/address/0x15d9cf24d1b33b37825cb79d1a4f56e24b926585#code) |
| ConfidentialTreasuryToken | [`0x60c2f255…925c4a9e`](https://eth-sepolia.blockscout.com/address/0x60c2f25557af2cde3dd7456527d3f54f925c4a9e#code) |
| TreasuryUSD, the wrapped ERC-20 | [`0xc399a3f3…1598d44e`](https://eth-sepolia.blockscout.com/address/0xc399a3f3474c31043140f44b8eb9b25b1598d44e#code) |

The dashboard at **https://kasbsquall.github.io/ghostledger/** reads every row live from these contracts. No mock data anywhere: if the endpoint fails it says so rather than rendering a plausible number. Looking requires no wallet; only publishing a band, signing or executing does.

## Ten tests against the real Nox stack

`npx hardhat test` boots the Nox offchain services in Docker, so encryption, the TEE runner and ACL enforcement are all real.

```
GhostLedgerModule end to end
  routes a routine payout through the Safe on its own threshold
  demands every owner before a flagged drain can move
  raises the bar by one signature for a movement in the review band
  refuses to execute before the band has been settled
  never exposes the amount, only the band
  keeps a rejected movement out of the baseline
  counts each owner once
  never says "all clear" before it has any history to judge against
  rejects a risk band the enclave did not sign
  refuses proposals from an address that is not a Safe owner

10 passing
```

Two of those carry the whole argument. One asserts that a public decryption of a confidential amount fails while the band derived from it succeeds. The other hands `settle()` a tampered proof and watches the transaction revert.

## Known limits, stated up front

The log's `owner` role can reconstruct executed amounts, and in this deployment that role is the deployer. `ConfidentialTreasuryLog` grants `owner` decrypt access to the running total on every write, and each executed movement folds exactly one payout into it, so decrypt before, decrypt after and subtract. The Safe owners, the module and every observer still never see the figure. "Nobody at all" is not what this deployment achieves. Pointing that grant at the Safe instead of an EOA makes revealing the aggregate itself require the multisig, and that is the right fix before anyone runs this for real.

A public comparison result is a comparison oracle. An owner can propose amounts and read bands to bisect the running average, and proposing is cheap. Rate limiting or a bond would raise the cost; neither is implemented here.

The destination address is public by design, because the Safe has to be able to send there. GhostLedger hides how much, not to whom.

The detector is a running mean with no window or variance. It is deliberately the simplest rule that demonstrates the mechanism, and the mechanism is the contribution, not the statistic.

## Built during the hackathon

Everything in `contracts/`, `test/`, `scripts/`, `frontend/` and `video/` was written during the WTF Hackathon Summer Edition. No code is reused from the previous VIBE Coding Hackathon.

Third-party packages used as published: `@iexec-nox/nox-protocol-contracts`, `@iexec-nox/nox-confidential-contracts` for ERC-7984 and the ERC-20 wrapper, `@iexec-nox/handle`, `@iexec-nox/nox-hardhat-plugin`, OpenZeppelin Contracts, viem and React.

Feedback on the iExec tooling, with eight reproducible defects and the fix each one needs, is in [feedback.md](https://github.com/kasbsquall/ghostledger/blob/main/feedback.md).

## Links

- **Live dashboard: https://kasbsquall.github.io/ghostledger/** (reads Sepolia directly, no wallet needed to look)
- Code: https://github.com/kasbsquall/ghostledger
- Demo video and submission post: https://x.com/p36649/status/2082238669327310868
- Feedback on iExec Nox: https://github.com/kasbsquall/ghostledger/blob/main/feedback.md
