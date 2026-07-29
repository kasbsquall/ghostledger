# Hilo de X, versión corregida

Borra el hilo actual completo (los tres posts) y publica este. El hilo viejo tiene 3 vistas y cero interacciones, así que no pierdes nada, y quedan más de dos días de plazo.

**Qué cambia y por qué:**

| Post viejo | Problema | Corregido |
|---|---|---|
| "without anyone ever seeing the amount" | El rol `owner` del log puede reconstruir montos ejecutados. El README ya lo declara como límite. Dos versiones distintas en público es peor que el límite. | "without the owners ever seeing the amount" |
| "the figure that decides is never read by anyone" | Igual que arriba. | "the owners never see the figure that set the bar" |
| "compared inside an Intel TDX enclave" | `HANDOFF.md` lo prohíbe sin atestación en cadena. Un jurado de iExec ya tumbó esta afirmación una vez. | "compared against the treasury's own encrypted history without ever being decrypted" |
| Video del corte anterior | Le faltan todas las correcciones de hoy. | El mp4 nuevo, o el enlace de YouTube |
| Sin dashboard | Era el único punto de rúbrica que los tres jurados descontaron. | Post 2 entero dedicado a eso |

---

## Post 1

Adjunta aquí el mp4: `video/remotion/out/ghostledger.mp4`

Súbelo como archivo, no como enlace de YouTube. X reproduce el video nativo dentro del timeline y el enlace obliga a salir. Si pesa demasiado para tu cuenta, pon el enlace de YouTube al final de este mismo post.

```
A DAO treasury that flags a suspicious payout without the owners ever seeing the amount.

GhostLedger is a Safe module. The bigger the payment, the more signatures it needs, and the owners never see the figure that set the bar.

Live on Sepolia, built on @iEx_ec Nox.
```

## Post 2

```
Open the treasury yourself. No wallet needed to look, it reads Sepolia directly:

kasbsquall.github.io/ghostledger

Ten movements on screen. Not one amount. Where the figure should be, a lock.
```

## Post 3

```
The amount is encrypted in your browser, compared against the treasury's own encrypted history without ever being decrypted, and spent as a confidential ERC-7984 token.

Only the risk band goes public. That band sets the quorum: 2 signatures, 3, or all 4.
```

## Post 4

```
Safe's own contract is untouched. It installs through enableModule and can only ever raise the signatures a payout needs. Never lower them.

Contracts verified on Sepolia. Code, ten tests against the Nox stack, and feedback.md:

github.com/kasbsquall/ghostledger
```

---

## Después de publicar

Pásame la URL nueva del primer post. Hay que cambiarla en tres sitios que hoy apuntan al hilo viejo:

- `README.md`, la tabla de enlaces al final
- `dorahacks-details.md`, la sección de enlaces
- El campo del post de X en el formulario BUIDL de DoraHacks

## Lo que no hago

No publico, no borro ni edito nada en tu cuenta. El hilo lo publicas tú.
