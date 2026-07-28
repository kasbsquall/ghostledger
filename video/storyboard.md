# GhostLedger — film v2

Rewritten after a blind two-judge pass on v1. Both judges independently placed
the product's first appearance at 1:22 and both stopped watching at ~0:35, in
the competitor beat. v1 also claimed 2:50 and summed to 3:10, and claimed two
rubric stars for content that was not in the film.

**Runtime 2:33.** Verified: 6+14+45+8+20+22+16+10+12 = 153s.

Sticky line, rebuilt around the concrete noun and landed three times:

> **The bigger the payment, the more signatures. And nobody sees the payment.**

Ground: the product's own `--ink` #0a0c0e. Chroma reserved for the risk scale.
Mark: Interferencia, ported from `frontend/src/components/Mark.tsx`.

---

## 0 — Cold open · 6s · no narration

The anomalous row from the live deployment, pushed in hard.
`Anomalous · 0 / 4 signatures · Reveal amount`. Hold two seconds on `0 / 4`.

One line types under it:

> Nobody in this room knows how much this payout is for.

Stamp hit, cut.

---

## 1 — What it is · 14s

The mark and the name arrive at 0:06, not at 1:04.

> GhostLedger is a module for a Safe treasury. It reads how far a payout sits
> from what this treasury normally spends, and it makes a bigger payout need
> more signatures. It does that without ever reading the amount.

On screen, one definition card, held still:

```
BAND   the verdict on a payout: within pattern, review, or anomalous
```

**Fix applied:** subject-verb sentence before 0:20, the name up front, and
"band" defined the first time it is used. Both judges asked for all three.

---

## 2 — The demo · 45s · everything rests here

Recorded browser, full frame, live Sepolia. Starts at **0:20**.

1. An amount is typed and proposed. Cut to the transaction on Etherscan with
   the **Input Data** panel open and the amount field highlighted: what sits
   there is a 32-byte handle, and the figure is nowhere in it. Show the
   absence, do not narrate it.
2. `Publish band` → the badge flips to `Within pattern`, signatures read `2 / 4`.
3. Two signatures land. `Execute`. The row goes `EXECUTED`.
4. Propose again, far larger. The badge flips to `Anomalous`, and the
   requirement becomes **4 of 4**.

> A routine payout moves on the Safe's own threshold. This one cannot move
> until every owner signs. Nobody saw either number.

**Proof:** the state changes on camera because it changed on chain. First and
last frame of the clip must differ.

---

## 3 — On Sepolia, verify it yourself · 8s

The module on Etherscan. Contract address legible and held still long enough
to be paused and read. A QR beside it.

> Every transaction in that demo is on Ethereum Sepolia. The address is on
> screen. Go and check it.

**Fix applied:** two rubric stars that v1 claimed and never showed.

---

## 4 — Why nobody had done it · 20s

Moved to AFTER the demo, and cut from 22s to 8s of competitors.

> Screening a Safe is a solved problem. Hypernative, Chainalysis and Blockaid
> all do it, and they do it well. Every one of them has to read the amount.

Three marks, 8s, then the quote at full frame, second sentence only:

> The rule engine is handed zero as the amount.

Under it, plainly, so the authority is not taken on trust:

```
OpenZeppelin — the most audited smart-contract library in Ethereum
CMTAT Confidential audit, on the ERC-7984 standard
```

> The people who wrote the standard wrote down what it could not do.

---

## 5 — Why the verdict can be trusted · 22s

v1 drew this as a diagram and both judges called it an unproven assertion.
Now it is a test running.

> The comparison happens inside an Intel TDX enclave. The verdict comes back
> carrying the enclave's signature, and the contract checks it.

Then the proof, on screen, a test executing:

```
✔ rejects a risk band the enclave did not sign
```

A tampered decryption proof handed to `settle()`, and the transaction
reverting. The claim and its refutation, in one frame.

---

## 6 — The raw terminal · 16s

Unretouched capture of `scripts/live-demo.ts`. No re-typesetting, no
substitution. The film's own font never touches it; the shot pushes in
instead.

```
  band                       within pattern
  signatures required        2 of 4 owners
  execute through Safe       success

  band                       anomalous
  signatures required        4 of 4 owners
```

**Fix applied:** v1 declared a re-typeset capture under the heaviest criterion
on the sheet, which a judge correctly read as planting doubt where it costs
most.

---

## 7 — Nothing underneath was touched · 10s

> Safe's own contract is unmodified. GhostLedger is installed the way Safe
> already allows, with enableModule, and it can only ever raise the number of
> signatures a payout needs. Never lower it.

The `enableModule` transaction on the Safe, and a scroll of `feedback.md`.

**Fix applied:** the brief's central requirement, never stated in v1, and the
2-star feedback file, which v1 claimed and never showed.

---

## 8 — Close · 12s

Mark. The line a third time. URL and QR held for the last five seconds.

> The bigger the payment, the more signatures. And nobody sees the payment.

`github.com/kasbsquall/ghostledger` · live on Ethereum Sepolia

---

## Cut from v1

- **Beat 8, "built here."** Worth nothing on this rubric, cost ten seconds.
- **14 seconds of competitor logos.** The four cleanest frames of v1's first
  minute were other companies' marks, held large, before the film had named
  itself.
- **The two-bad-options opener.** The cold open already states the problem by
  showing it.
- **"None of it scores anything."** An unattributed competitive claim about
  other people's shipped systems, which cost credibility rather than buying it.

## Rubric map, only what is actually in frame

| Criterion | Weight | Beat | On screen |
|---|---|---|---|
| Creativity | 3 | 2, 4 | the gap quoted by its own authors, closed on camera |
| End to end, no mock data | 3 | 2, 6 | live state change, unretouched terminal |
| Deployed on Sepolia | 2 | 3 | contract address, held and legible |
| feedback.md | 2 | 7 | the file scrolling |
| Under 4 minutes | 2 | — | 2:33 |
| Nox depth | 1 | 5 | a forged band being rejected |
| UX | 1 | 2 | the product carries it |
