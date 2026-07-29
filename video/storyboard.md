# GhostLedger — film v3

**Runtime 2:12.** Verified: 7+18+45+8+22+10+12 = 122s.

Third pass. Four blind judges across two rounds, none told whose project this
was. v3 acts on what all four converged on rather than on any single note.

Sticky line, landed three times:

> **The bigger the payment, the more signatures. And nobody sees the payment.**

Ground: the product's own `--ink` #0a0c0e. Chroma reserved for the risk scale.
Mark: Interferencia, from `frontend/src/components/Mark.tsx`.

---

## 0 — Cold open · 7s · no narration

The anomalous row, pushed in hard. **Crop the row so the `Reveal amount`
button is out of frame** — a judge read that button one second before the
narration said the amount was unknowable and called the contradiction before
anything else on the screen.

On screen: `Anomalous · 4 of 4 signatures required`.

One line types under it:

> Four people have to sign this payout. None of them can see how much it is.

Stamp hit, cut.

**Changed:** "nobody in this room" cut. There is no room, no people, no stakes
on screen, and the word asked a viewer to imagine something not shown.

**Changed again:** "what it is for" became "how much it is". The destination
address is public by design and visible in this very shot, so the film's first
claim was one the project itself disclaims two paragraphs into its README.
GhostLedger hides how much, not to whom, and the opening line now says that.

---

## 1 — What it is, and the trick · 18s

The mark and the name at 0:07.

> Safe is the multisig most DAOs keep their money in: several owners, and a
> payout needs a set number of them to sign.
>
> GhostLedger is a module you add to one. It compares each proposed payout
> against what that treasury normally spends, and makes an unusual payout need
> more signatures than a routine one.
>
> It does the comparison inside a sealed processor that hands back a verdict
> and not the number. So the treasury learns that a payout is large without
> anyone, including us, learning how large.

Definition card, held still:

```
BAND   the verdict on a payout: within pattern, review, or anomalous
```

**Changed, and this is the biggest fix in v3.** Every judge either misread
"Safe" as an adjective or hit the same riddle: if nobody sees the payment, how
does anything know it is bigger? That question went unanswered until 1:33 in
v2. It is now answered before the demo starts, which makes everything in the
demo readable.

---

## 2 — The demo · 45s · starts at 0:25

Recorded browser, full frame, live Sepolia.

1. **Side by side, 6s.** An ordinary ERC-20 transfer on Etherscan with the
   amount plainly legible in Input Data, next to ours, where that field holds a
   32-byte handle. Absence is invisible to anyone who has not been shown the
   presence, so show both.
2. **Where "normal" comes from, 5s.** The treasury's spend history, four past
   payouts, every one of them a handle. And the thresholds, on screen, from the
   contract: under 2× average, 2 to 5×, over 5×.
3. `Publish band` → `Within pattern`, signatures `2 / 4`. Two signatures land.
   `Execute`. Row goes `EXECUTED`.
4. Propose again, far larger. Badge flips to `Anomalous`. Requirement becomes
   `4 of 4`.

> A routine payout moves on the Safe's own threshold. This one cannot move
> until every owner signs. Nobody saw either number.

**Changed:** step 2 is new. Without the baseline and the cut-points on screen,
"Anomalous" is a tautology rather than an inference, and the history is the
most likely hiding place for seeded data under a 3-star no-mock-data criterion.

---

## 3 — On Sepolia, check it yourself · 8s

The module on Etherscan, address legible and held long enough to pause and
read. QR beside it.

> Every transaction you just watched is on Ethereum Sepolia.

---

## 4 — Why the verdict can be trusted · 22s · moved to 1:18

Moved ahead of everything argumentative. Two judges stopped watching in the
competitor beat, which sat in front of this one, so the protocol proof was
parked behind the exit.

> A signature only proves that whoever holds a key signed. It does not prove
> where the computation ran.

Then the attestation: the TDX measurement the enclave reports, next to the
signer the contract has registered, matching. Then the negative case that
actually bites:

```
✔ rejects a correctly signed band from an unattested signer
```

> This is the difference between a sealed processor and a server with a
> promise.

**OPEN, and it must be resolved before this beat is filmed.** v3 asserts an
attestation beat that has not been built. The iExec judge was explicit: the
forged-signature test in v2 proves the contract checks a signature, which a
box in a datacentre passes identically. If the attestation cannot be shown
on-chain, this beat must be cut and the narration reduced to what the handles
and the selective decryption genuinely demonstrate. **Do not film the claim
without the artefact.** `iExec-Nox/nox-attestation-portal` is the place to
look first.

---

## 5 — Nothing underneath was touched · 10s

> Safe's contract is unmodified. GhostLedger installs through enableModule,
> which is Safe's own extension point, and it can only ever raise the number of
> signatures a payout needs. Never lower it.

The `enableModule` transaction on the Safe, then `feedback.md` open at a
specific finding, large enough to read one sentence of it.

**Changed:** a file scrolling is not a file read. Land on one real finding.

---

## 6 — Close · 12s

Mark. The line a third time. URL and QR held for the last five seconds.

> The bigger the payment, the more signatures. And nobody sees the payment.

`github.com/kasbsquall/ghostledger` · live on Ethereum Sepolia

---

## Cut from v2

- **All competitor marks.** Cut from 22s in v1 to 8s in v2 and now to zero. Two
  judges disengaged there in v1, a third did in v2 after it moved. Relocating a
  beat that loses people does not fix it.
- **The raw terminal, 16s.** It showed the same four facts the demo had already
  shown live, less legibly, a third time.
- **The OpenZeppelin quote.** The strongest outside argument in the film, and
  still argument rather than evidence. If a 6s full-frame card fits after the
  close, it earns its place there; it does not earn 20s before the proof.
- **The self-scoring annotations.** v2 carried "fix applied" notes and a ledger
  admitting v1 claimed stars it never showed. A judge read the storyboard as a
  document scoring itself and discounted every remaining unproven claim.

## What each criterion has in frame

| Criterion | Weight | Beat | Artefact |
|---|---|---|---|
| Creativity | 3 | 1, 2 | a threshold that moves on data nobody read |
| End to end, no mock data | 3 | 2 | live state change, baseline and cut-points on screen |
| Deployed on Sepolia | 2 | 3 | contract address, held and legible |
| feedback.md | 2 | 5 | one finding, readable |
| Under 4 minutes | 2 | — | 2:12 |
| Nox depth | 1 | 4 | attestation, **pending the open item above** |
| UX | 1 | 2 | the product carries it |
