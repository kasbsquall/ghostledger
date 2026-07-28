# GhostLedger dashboard

The signer-facing surface. Reads every row from the deployed contracts on
Ethereum Sepolia, encrypts a proposed amount in the browser before the
transaction is signed, and lets a signer on the access list reveal an
individual figure on demand.

```bash
npm install
npm run dev
```

No environment variables. Addresses come from `../deployments/sepolia.json`, so
clone the whole repository rather than this directory alone.

Connect a wallet that signs on the Safe to publish a risk band, sign, execute or
propose. Without one the dashboard is read-only, which is the honest state
rather than a disabled shell: every figure on screen is live chain data either
way.
