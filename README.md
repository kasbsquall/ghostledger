# GhostLedger

**Anomaly detection for a DAO treasury, where the amount is never revealed.**

Built for the [iExec WTF Hackathon Summer Edition](https://dorahacks.io/hackathon/wtf-hackathon/detail)
on [Nox](https://docs.noxprotocol.io), the confidential computing layer of iExec.

---

## The problem

Treasury tooling today makes you choose. Privacy tools hide your amounts and
therefore cannot tell you when something is wrong. Monitoring tools spot the
unusual payout, but only because every number is public to anyone with a block
explorer.

A DAO that wants both ends up publishing its entire spending pattern: what it
pays, to whom, how often, and how much runway it has left. Competitors read it.
So do the people planning to social-engineer a signer.

## What GhostLedger does

It installs on an existing Safe as a module and screens every proposed payout
against the treasury's own spending history. The comparison happens inside a
TEE on encrypted values. The only thing that becomes public is a risk band:

| Band | Meaning | Rule |
|---|---|---|
| Within pattern | routine | under 2× the running average |
| Review | worth a look | 2× to 5× the running average |
| Anomalous | stop and check | over 5× the running average |

The amount is encrypted in the browser before the transaction is signed, so it
never appears in calldata. It is compared without being decrypted. It is spent
as an ERC-7984 confidential token, so it stays private through execution too.
A signer on the access list can reveal any individual amount on demand.

**The scoring rule is public. The data it runs on is not.** A secret rule over
secret data is something nobody can trust; a public rule over private data is
auditable without being exposed.

## What already exists, and what does not

Transaction screening on a Safe is a solved, commercial problem. Being precise
about that is the point, because the gap left over is narrow and real.

**Hypernative Guardian** is integrated natively in Safe{Wallet} and advertises
behavioural anomaly detection on "unusual timing, amounts, counterparties, and
patterns." **Chainalysis Hexagate** baselines each wallet against its own
history. **Blockaid** and **Redefine** put risk colours in the Safe UI today.
**Safe Shield** is Safe's own framework for the same job. GhostLedger does not
claim to detect better than any of them, and with one threshold rule it plainly
does not.

Every one of those systems needs the amount in plaintext to evaluate it.

On the other side, confidential payouts are also solved. **Zama × Bron** ran
confidential payroll on mainnet in January 2026. ERC-7984 wallets, vaults and
payroll tools ship encrypted amounts today. None of them score anything.

The gap is documented by an incumbent. OpenZeppelin's
[CMTAT Confidential audit](https://www.openzeppelin.com/news/cmtat-confidential-audit)
records that under ERC-7984 amount-based policy rules cannot be evaluated
on-chain, because the value is hidden: the rule engine is handed `0` as the
amount, and compliance degrades to address-based checks.

That is the sentence GhostLedger answers. The policy engine receives the real
amount, evaluates it, and still never learns it.

What follows from that, and what makes the confidentiality load-bearing rather
than decorative: **the number of signatures a payout needs is derived from data
nobody can read.** A monitoring product tells you something looks wrong. This
changes what the treasury will actually let you do, without anyone, including
the operators of this contract, seeing the figure that decided it.

### Known limits

A public comparison result is a comparison oracle. An owner can propose amounts
and read bands to bisect the running average, and proposing is cheap. Rate
limiting or a bond would raise the cost, neither is implemented here.

The destination address is public, by design: the Safe has to be able to send
there. GhostLedger hides how much, not to whom. A treasury that needs both
should pair it with stealth addresses.

The detector is a running mean with no window or variance. It is deliberately
the simplest rule that demonstrates the mechanism, and the mechanism, not the
statistic, is the contribution.

## Why it fits the challenge

The brief asked for privacy added on top of real open-source infrastructure,
without modifying the underlying protocol.

GhostLedger never touches Safe. It declares the two Safe functions it needs as a
local interface and is installed with `enableModule`, the mechanism Safe already
provides. It never touches the underlying ERC-20 either: the token is wrapped
into an ERC-7984 confidential balance, and the original contract does not know
GhostLedger exists.

## Architecture

```
  Browser                    Sepolia                        Nox
  ───────                    ───────                        ───
  encryptInput(amount)  ──►  GhostLedgerModule
                             │  fromExternal + ACL grants
                             ▼
                             ConfidentialTreasuryLog
                             │  safeDiv(total, count)
                             │  safeMul(avg, factor)   ──►   Runner (Intel TDX)
                             │  gt, select                   computes on
                             ▼                                encrypted handles
                             risk band ──► allowPublicDecryption
                             │
                             ▼
                             Safe.execTransactionFromModule
                             │
                             ▼
                             ConfidentialTreasuryToken.confidentialTransfer
```

| Contract | Role |
|---|---|
| `GhostLedgerModule.sol` | Safe module. Takes custody of the encrypted amount, grants the ACL, asks the Safe to execute. |
| `ConfidentialTreasuryLog.sol` | Encrypted spending history and the scoring engine. Publishes only the band. |
| `ConfidentialTreasuryToken.sol` | ERC-7984 wrapper over any ERC-20 the treasury already holds. |
| `demo/TreasuryUSD.sol` | Stand-in ERC-20 for the demo. Sepolia has no way to hand out an arbitrary stablecoin. |

Two design decisions worth calling out:

**An empty history never returns "all clear."** `safeDiv` reports failure when
the movement count is zero, and that flag is carried into the result with a
`select`, forcing the band to Review. A detector with no baseline says "a human
should look at this", not "looks fine".

**Rejected movements never enter the history.** If a blocked anomaly still
raised the running average, an attacker could inflate the baseline with
proposals they expect to be rejected until a large payout reads as normal.

## Running it

### Requirements

- Node.js 22 or higher
- Docker, running (the test suite boots the Nox offchain stack in containers)
- A wallet with Sepolia ETH

### Install and test

```bash
npm install
npx hardhat compile
npx hardhat test
```

The suite runs against the real Nox stack in Docker, not mocks. It asserts,
among other things, that a public decryption of a confidential amount **fails**
while the band derived from it succeeds, and that a risk band the enclave never
signed is refused on chain.

```
  GhostLedgerModule end to end
    ✔ routes a routine payout through the Safe on its own threshold
    ✔ demands every owner before a flagged drain can move
    ✔ raises the bar by one signature for a movement in the review band
    ✔ refuses to execute before the band has been settled
    ✔ never exposes the amount, only the band
    ✔ keeps a rejected movement out of the baseline
    ✔ counts each owner once
    ✔ never says "all clear" before it has any history to judge against
    ✔ rejects a risk band the enclave did not sign
    ✔ refuses proposals from an address that is not a Safe owner

10 passing
```

### Deploy to Sepolia

Store a deployer key in Hardhat's encrypted keystore. It never touches the repo.

```bash
npx hardhat keystore set SEPOLIA_PRIVATE_KEY
```

Then:

```bash
npx hardhat run scripts/deploy.ts --network sepolia
npx hardhat run scripts/export-abis.ts
```

The script deploys the four contracts, wraps the treasury funding into the Safe,
seeds the spending baseline, and writes `deployments/sepolia.json`.

One step is left and no script can do it: a Safe can only be modified by its own
owners. From the Safe UI, open Transaction builder, target the Safe itself, and
call `enableModule` with the deployed module address.

### Run the dashboard

```bash
cd frontend
npm install
npm run dev
```

## Deployed on Ethereum Sepolia

See `deployments/sepolia.json` for the current addresses.

## What was built during the hackathon

Everything in `contracts/`, `test/`, `scripts/`, `frontend/` and `brand/` was
written during the hackathon. The project reuses no code from the previous VIBE
Coding Hackathon.

Third-party dependencies used as published: `@iexec-nox/nox-protocol-contracts`
(Nox Solidity library), `@iexec-nox/nox-confidential-contracts` (ERC-7984 and
the ERC-20 wrapper), `@iexec-nox/handle` (JS SDK),
`@iexec-nox/nox-hardhat-plugin`, OpenZeppelin Contracts, viem, React.

Feedback on the iExec tooling is in [feedback.md](feedback.md).

## License

MIT
