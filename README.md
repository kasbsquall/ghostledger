# GhostLedger

**Anomaly detection for a DAO treasury, where the signers never see the amount.**

**Live dashboard: https://kasbsquall.github.io/ghostledger/** — reads the
contracts below straight from Sepolia, no wallet needed to look.

**Demo video (1:53): https://youtu.be/iB0jUm5lIhU**

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
patterns", though it publishes no mechanism and what reaches Safe users is a
static ceiling: Safe's own help centre lists the policy as "limit transfers
above a specific amount." **Chainalysis Hexagate** says its monitors "learn how
wallets behave over time", and every capability it then enumerates is timing,
frequency, or a change of authority. **Blockaid** screens by simulation against
known-malicious heuristics. **Safe Shield Copilot** already does per-wallet
novelty detection, on counterparties: it "surfaces unusual patterns (e.g., a
destination with very limited history)."

So the incumbent has shipped half of this idea and left the amount half as a
static threshold. GhostLedger does not claim to detect better than any of them,
and with one threshold rule it plainly does not.

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
the signers themselves cannot read.** A monitoring product tells you something
looks wrong. This changes what the treasury will actually let you do, and the
owners voting on it never see the figure that set the bar. Nor does the module,
nor anyone watching the chain. One role can, and it is named under Known limits
below rather than left for a reader to find.

That is the line that separates this from every confidential-treasury tool
next to it. The rest encrypt what you can **see**; the amount is hidden on the
display and revealed again the moment it settles, because a plaintext transfer
carries its value in the clear. GhostLedger encrypts what the treasury will
**do**, and because the payout moves as an ERC-7984 confidential token, the
figure stays hidden through execution too. There is no settlement at which the
number becomes public and no arithmetic that recovers it from a transfer
amount. The only thing that is ever published is a three-way band, and a band
of "over 5× the average" is not a number anyone can divide back into a salary.

### See it for yourself in one command

The strongest claim a submission can make is one you can check without trusting
it. From a clone, with nothing installed but `curl`, no wallet and no Docker:

```bash
bash scripts/verify-live.sh
```

It reads Sepolia in front of you and prints that the module is enabled on the
real Safe, that thirteen movements exist, and that each one's published band matches
the exact number of signatures the contract demanded. What it cannot print is
any amount, because none is public. That asymmetry is the product.

### Real value has already moved under a confidential verdict

The module's on-chain history is not a single constructor call. It has thirteen
payouts proposed to several distinct destinations, twelve risk bands settled by
a gateway proof, sixteen owner approvals, and seven payouts executed through the
real Safe. Each execution released an ERC-7984 confidential token only after a
confidential comparison had published a band and that band's quorum was met.
The seven executions all succeeded:

| Payout | Execution transaction |
|---|---|
| routine | [`0x1f491640…d47e21b`](https://eth-sepolia.blockscout.com/tx/0x1f491640ad0dece6368f6824a52285735eca5d4710d332ab9b75b74afd47e21b) |
| routine | [`0x9f379c83…948760e`](https://eth-sepolia.blockscout.com/tx/0x9f379c83b91fcee9c1a70e802fff9987cbd1b2f3a37eee5a511b1c3eb948760e) |
| routine | [`0x28a36d08…663fb552`](https://eth-sepolia.blockscout.com/tx/0x28a36d08bdb8454b96d5253ff68c5d42c448a5f5f01ab3159c608786663fb552) |
| routine | [`0x26c86185…c79706`](https://eth-sepolia.blockscout.com/tx/0x26c861858504f3699197d0e4833dd37ab57810713f5ef2ba32641dc37ec79706) |
| routine | [`0xa25be5f5…986125`](https://eth-sepolia.blockscout.com/tx/0xa25be5f5e1c483617e24c70e924cec5e40a2cb5ae6e82c97da78afedf7986125) |
| routine | [`0xcaab783c…5403d9`](https://eth-sepolia.blockscout.com/tx/0xcaab783c2ebd7ef113fc342013a6a49a48d3a877fbd5ac464e47f7a1a55403d9) |
| routine | [`0x0a9feb01…e3baea`](https://eth-sepolia.blockscout.com/tx/0x0a9feb0122b2154de60a849eae58d4e351e91aefc102980b4031c59ca0e3baea) |

A confidential comparison here does not only hide a figure. It authorises real
transfers on a live multisig, to several distinct destinations, and the figure
it judged stays hidden through the transfer.

### Known limits

**The log's `owner` role can reconstruct executed amounts, and in this
deployment that role is the deployer.** `ConfidentialTreasuryLog` grants
`owner` decrypt access to the running total on every write, and each executed
movement folds exactly one payout into it. Decrypt before, decrypt after,
subtract, and you have the figure. The Safe owners, the module and every
observer still never see it, but "nobody at all" is not what this deployment
achieves. The grant exists so a treasury can audit its own aggregate; pointing
it at the Safe instead of an EOA makes revealing the aggregate itself require
the multisig. Three lines in the constructor and in `recordMovement`, and the
right fix before anyone runs this for real.

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

"Runner (Intel TDX)" describes Nox's own architecture, not something this
project demonstrates. Nothing here carries an attestation artefact, and the
test suite runs the Nox gateway and runner in local containers. What these
contracts do prove is narrower and checkable: the amount is compared without
being decrypted, only the derived band is ever publicly decryptable, and a
band the gateway did not sign is refused on chain.

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

It is already running at https://kasbsquall.github.io/ghostledger/ against the
Sepolia deployment below. To run it yourself:

```bash
cd frontend
npm install
npm run dev
```

## Deployed on Ethereum Sepolia

Every contract is verified. One caveat worth stating: Blockscout serves
`ConfidentialTreasuryToken` under the name `KairosWrappedToken`, because its
bytecode matches a third-party contract verified earlier and the explorer
resolved it from its bytecode database. The deployed bytecode is the one this
repository compiles, and the constructor arguments decode to "Confidential
Treasury USD" / "cTUSD", but the name on the explorer is not ours.

| Contract | Address |
|---|---|
| Safe (GhostLedger Treasury) | [`0x7DC3B572…86A40372`](https://eth-sepolia.blockscout.com/address/0x7DC3B57286F4Fb4bF793B536B4380B3E86A40372) |
| GhostLedgerModule | [`0xf6bc97f8…bc134b08`](https://eth-sepolia.blockscout.com/address/0xf6bc97f8a9f399dd33517ed4f4a695f8bc134b08#code) |
| ConfidentialTreasuryLog | [`0x15d9cf24…4b926585`](https://eth-sepolia.blockscout.com/address/0x15d9cf24d1b33b37825cb79d1a4f56e24b926585#code) |
| ConfidentialTreasuryToken | [`0x60c2f255…925c4a9e`](https://eth-sepolia.blockscout.com/address/0x60c2f25557af2cde3dd7456527d3f54f925c4a9e#code) |
| TreasuryUSD (the wrapped ERC-20) | [`0xc399a3f3…1598d44e`](https://eth-sepolia.blockscout.com/address/0xc399a3f3474c31043140f44b8eb9b25b1598d44e#code) |

The Safe runs four owners at a threshold of two, so the bands resolve to two,
three and four signatures. `deployments/sepolia.json` carries the same addresses
and is what the dashboard reads.

## What was built during the hackathon

Everything in `contracts/`, `test/`, `scripts/`, `frontend/` and `brand/` was
written during the hackathon. The project reuses no code from the previous VIBE
Coding Hackathon.

Third-party dependencies used as published: `@iexec-nox/nox-protocol-contracts`
(Nox Solidity library), `@iexec-nox/nox-confidential-contracts` (ERC-7984 and
the ERC-20 wrapper), `@iexec-nox/handle` (JS SDK),
`@iexec-nox/nox-hardhat-plugin`, OpenZeppelin Contracts, viem, React.

Feedback on the iExec tooling is in [feedback.md](feedback.md).

## Links

| | |
|---|---|
| Live dashboard | https://kasbsquall.github.io/ghostledger/ |
| Demo video, 1:53 | https://youtu.be/iB0jUm5lIhU |
| Submission post | https://x.com/p36649/status/2082516884591636544 |
| Feedback on iExec Nox | [feedback.md](feedback.md) |

## License

MIT
