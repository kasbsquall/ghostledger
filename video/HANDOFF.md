# Film — where it stands, and what is left

Everything below is on disk. The only thing missing is the seven Remotion
scenes and the render.

## Ready

| Asset | Path | Note |
|---|---|---|
| Storyboard v3 | `storyboard.md` | survived four blind judges across two rounds |
| Voiceover + music | `remotion/public/final_audio.wav` | Cartesia (Quentin) over the Suno track, -18.3 LUFS |
| Scene timing | `remotion/src/data/scene_timing.json` | measured from the real audio, not estimated |
| Word-level captions | `remotion/src/data/captions.json` | for the burned subtitles |
| Product footage | `remotion/public/vid/demo.mp4` | 144s, 30fps CFR, live Sepolia state change on camera |
| The mark | `remotion/public/mark.svg` | Interferencia, same file as the app's favicon |
| Design tokens | `../frontend/src/styles/tokens.css` | port these, do not invent a palette |

## Scene timing, from the audio

```
intro     1.60 →  28.07   26.47s
demo     28.35 →  70.75   42.40s
sepolia  71.03 →  77.58    6.55s
trust    77.86 →  95.51   17.65s
safe     95.79 → 106.88   11.10s
close   107.16 → 112.09    4.92s
```

Plus a 7s cold open before the voice enters. The shipped master runs **1:53**
(3389 frames at 30fps); earlier estimates of 1:59 and 2:12 predate the final cut.
The cap is 4:00.

## Left to do, in order

1. **Seven scenes** in `src/scenes/`, registered in `src/Video.tsx` as a
   `<Series>` where each sequence takes its duration from `scene_timing.json`.
2. **SFX** from the CC0 library in the skill (`sfx_lib.py find --role ...`).
   Nothing synthesised: every generated effect that pipeline shipped was later
   rejected by ear.
3. **Audits before rendering**: `preflight.py`, `overflow_audit.py`,
   `stillness_audit.py`. Each one cried wolf on its first run in the skill's
   own history, so calibrate rather than raising thresholds until quiet.
4. **Render**, then the master pass to -14 LUFS and limited colour range.
5. **Thumbnail** at 1280x720, authored as its own composition. Three or four
   words, one high-contrast object. Check it at 168px before shipping.

## Two things a new session must not get wrong

**The attestation.** Beat 4 (`trust`) originally claimed the comparison runs in
an Intel TDX enclave. The iExec judge pointed out that the test proving it was
really proving that a contract checks a signature, which a server with a
keypair passes identically. The narration was cut back to what the handles and
the selective decryption genuinely demonstrate. **Do not put the hardware claim
back without an on-chain attestation artefact.** `iExec-Nox/nox-attestation-portal`
is where to look if you want to earn it.

**The voice is flat and that is not fixable in the mix.** LRA 2.4. Four Cartesia
voices were measured: Quentin 2.60, Zander 2.40, Rowan 1.90, Clive 1.60.
Quentin is the best available. Normalisation sets level, not dynamic range, and
compressing further makes it worse. Take it to -14 LUFS in the master and move
on.

## Gas

The co-signer wallets pay for the on-chain demo. `propose` is expensive (five
ACL grants plus scoring). Two takes cost owner2 about 0.0023 ETH. Top up before
re-recording.
