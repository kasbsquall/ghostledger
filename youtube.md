# YouTube

Sube `video/remotion/out/ghostledger.mp4`. Puede ir como **público** o como **no listado**: las dos opciones sirven para el enlace de la submission. No listado es suficiente y evita que aparezca en tu canal antes de tiempo.

---

## Título

Copiar tal cual (81 caracteres, entra completo en escritorio y móvil):

```
GhostLedger: how many signatures a payout needs, decided without seeing the amount
```

---

## Descripción

Copiar desde aquí hasta el final del bloque:

```
A Safe multisig where the number of owner signatures a payout needs is derived from a confidential comparison against the treasury's own encrypted spending history. The amount is compared without being decrypted, and the owners voting on the payout never see the figure that set the bar.

Built on iExec Nox for the WTF Hackathon Summer Edition. Live on Ethereum Sepolia.

THE RULE, WHICH IS PUBLIC
  Within pattern   under 2x the trailing average   the Safe's own threshold
  Review           2x to 5x                        threshold + 1
  Anomalous        over 5x                         every owner

The scoring rule is public so anyone can audit it. The data it runs on is not.

WHAT IS ACTUALLY NEW
Transaction screening on a Safe is a solved, commercial problem, and every product that does it needs the amount in plaintext. Confidential payouts are solved too, and none of those products score anything. OpenZeppelin's CMTAT Confidential audit records the gap precisely: under ERC-7984 an amount-based policy rule cannot be evaluated on-chain, so the rule engine is handed 0 as the amount. That is the sentence this answers. The policy engine receives the real amount, evaluates it, and still never learns it.

LINKS
  Live dashboard   https://kasbsquall.github.io/ghostledger/
  Code             https://github.com/kasbsquall/ghostledger
  Feedback on iExec Nox   https://github.com/kasbsquall/ghostledger/blob/main/feedback.md

The dashboard reads every row live from the contracts below. No wallet is needed to look. There is no mock data anywhere: if the endpoint fails it says so rather than rendering a plausible number.

DEPLOYED ON ETHEREUM SEPOLIA, ALL VERIFIED
  Safe, 4 owners at threshold 2   0x7DC3B57286F4Fb4bF793B536B4380B3E86A40372
  GhostLedgerModule               0xf6bc97f8a9f399dd33517ed4f4a695f8bc134b08
  ConfidentialTreasuryLog         0x15d9cf24d1b33b37825cb79d1a4f56e24b926585
  ConfidentialTreasuryToken       0x60c2f25557af2cde3dd7456527d3f54f925c4a9e
  TreasuryUSD, the wrapped ERC-20 0xc399a3f3474c31043140f44b8eb9b25b1598d44e

NOTHING UNDERNEATH WAS MODIFIED
GhostLedger declares the Safe functions it needs as a local interface and installs through enableModule, Safe's own extension point. It can only ever raise the number of signatures a payout needs, never lower it, so adopting it cannot weaken a Safe. The underlying ERC-20 is untouched as well: it is wrapped into an ERC-7984 confidential balance and the original contract does not know GhostLedger exists.

KNOWN LIMITS, STATED UP FRONT
A public comparison result is a comparison oracle, and proposing is cheap. The destination address is public by design, because the Safe has to be able to send there: this hides how much, not to whom. The detector is a running mean with no window or variance. And the log's owner role holds a decrypt grant on the aggregate, so in this deployment that one address can reconstruct executed amounts. All of it is written out in the README rather than left for a reader to find.

CHAPTERS
0:00 The problem, in one payout
0:35 The dashboard, live
1:12 On Sepolia, and how the amount stays encrypted
1:36 Safe is untouched, and the rule in one line

#iExec #Nox #ConfidentialComputing #Safe #Ethereum
```

---

## Notas

**Los capítulos están calculados contra `video/remotion/src/data/scene_timing.json`**, que son los tiempos reales del audio, no estimaciones. YouTube exige que el primero sea 0:00, que haya al menos tres y que ninguno dure menos de diez segundos, incluido el último, que corre hasta el final del video.

Por eso son cuatro y no seis. El cierre empieza en 1:46 y el video dura 1:53, así que un capítulo ahí habría durado siete segundos y YouTube habría descartado la lista entera sin avisar. Va fusionado con el anterior. Los cuatro duran 35, 37, 24 y 17 segundos.

Si los pegas y no aparecen como capítulos, es que se rompió el salto de línea al copiar: cada uno tiene que ir en su propia línea.

**Miniatura**: ya existe en `video/thumbnail.png`, 1280x720. Súbela a mano, porque la que elige YouTube por defecto suele caer en un fotograma de transición.

**Idioma**: la narración y los subtítulos quemados están en inglés, y el jurado es internacional, así que el título y la descripción van en inglés. Si prefieres el canal en español, lo único que cambiaría son los títulos de capítulo.

**Subtítulos**: el video ya los lleva quemados, así que no necesitas subir un archivo aparte. Si quieres además los seleccionables de YouTube, están en `video/remotion/src/data/captions.json` con marca de tiempo por palabra y se puede generar un `.srt` desde ahí.
