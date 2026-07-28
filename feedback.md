# Feedback on the iExec Nox developer tools

Written after building GhostLedger during the WTF Hackathon Summer Edition, July
2026, against `@iexec-nox/nox-protocol-contracts@0.2.4`,
`@iexec-nox/nox-confidential-contracts@0.2.2`,
`@iexec-nox/nox-hardhat-plugin@0.1.0` and `@iexec-nox/handle@0.1.0-beta.13`.

This is written as a bug report rather than a review, because the useful parts
are the specific places where a first-time builder loses an hour.

## What worked, and why it mattered

**`allowPublicDecryption` is the primitive that made this project possible.**
GhostLedger needs to publish one derived fact, a risk band, while keeping every
input to that computation private. Selective public decryption at the handle
level does exactly that, with no ceremony. Most confidential-computing stacks
force an all-or-nothing choice at the contract boundary; being able to declare
"this one output is public, the values that produced it are not" is the whole
product. It should be featured far more prominently than it currently is.

**The local Docker test stack in the Hardhat plugin is underrated.** Being able
to run `hardhat test` and have real encryption, a real TEE runner and real ACL
enforcement come up in containers changed the pace of the build completely. The
project's ten integration tests, including one asserting that a public
decryption of a confidential amount *fails*, all run offline in about twelve
seconds. Please keep this working and document it louder. It is a stronger
selling point than the wizard.

**Shipping ERC-7984 plus an ERC-20 wrapper as a package was the difference
between a demo and a product.** Without `ERC20ToERC7984Wrapper` we would have
had to choose between writing a confidential token from scratch or accepting
that amounts become public at execution. Having it ready meant the privacy
guarantee holds end to end.

## Bugs and papercuts, in the order we hit them

### 1. The Hello World tells you the wrong compiler version

The tutorial says to compile with Solidity `0.8.27+`. Every file in
`@iexec-nox/nox-protocol-contracts` declares `pragma solidity ^0.8.35`. Anyone
following the tutorial literally gets four `ParserError`s on their first
compile, before they have any mental model to debug with. Worse, the error text
mentions nightly builds, which sends people to toggle "Include nightly builds"
in Remix, and that makes it worse: nightlies sort strictly below the release, so
`0.8.35-nightly` still fails `^0.8.35`.

Fix: change the tutorial to `0.8.35`, or relax the pragma in the SDK.

### 2. `nox-hardhat-starter` does not exist

The hackathon page links to
`https://github.com/iExec-Nox/nox-hardhat-starter`. It 404s, and no repository
by that name exists in the org. The first instruction in the challenge brief
sends builders to a dead link.

### 3. The Hardhat plugin's README is the unmodified template

`iExec-Nox/nox-hardhat-plugin` opens with `<!-- TODO update readme -->` and
documents how to build a Hardhat plugin, ending with a task that prints "Hola,
Hardhat!". The actual plugin *is* documented, but on the docs site, not in the
repo. Anyone who lands on the repository first concludes the tooling is
unfinished. It is not.

### 4. "App mismatch" is the error that costs the most time

A handle proof is bound to the pair (signer, contract the signer calls). We
originally had a module forward an `externalEuint256` down to a scoring
contract, which called `Nox.fromExternal`. That reverts with a custom error
whose payload decodes to the string `App mismatch`, surfaced by viem as
"reverted with an unrecognized custom error" plus a wall of hex.

The binding rule is correct and probably necessary. The problem is that it is
not stated anywhere near the `fromExternal` documentation, and the error does
not survive to the developer in readable form. Two cheap fixes: say plainly in
the Solidity library reference that `fromExternal` only validates in the
contract the signer transacts with directly, and export the custom error in the
ABI so tooling can decode it.

### 5. The Runner operations table undersells the protocol

`/protocol/runner` lists operations as `Arithmetic (add…)`. We read that as "add
and sub only" and spent real time designing around the assumption that
multiplication and division were unavailable, which would have forced a much
worse anomaly-detection rule. `Mul`, `Div`, `SafeMul` and `SafeDiv` are all in
the `Operator` enum and all exposed by the Solidity library. Spelling out the
full list would have saved that detour.

### 6. "Add to wallet" fails on any wallet that hides testnets

The button on `/getting-started/networks` calls `wallet_switchEthereumChain`
first and only falls back to `wallet_addEthereumChain` when the chain is
unknown. Rabby, with testnets disabled, reports Sepolia as a *known but
disabled* chain, so the switch fails with `Unrecognized chain ID "0xaa36a7"` and
the fallback never runs. The user is left reading an error that says the chain
is unrecognised on a page whose entire purpose is to add that chain. Trying
`addEthereumChain` on that specific failure would fix it.

### 7. The plugin binds the local node to `0.0.0.0`

`hardhat test` prints `Hardhat node listening on 0.0.0.0:8545`. On a laptop on
café or conference wifi, that is an unauthenticated JSON-RPC endpoint with
funded accounts exposed to the local network. It should bind `127.0.0.1` by
default and require an explicit flag to do otherwise. Hackathons are exactly the
setting where this matters.

### 8. Documentation URLs in the challenge brief are stale

Every `docs.iex.ec/nox-protocol/*` link 308-redirects to `docs.noxprotocol.io`.
Redirects work in a browser, but tools that refuse cross-host redirects, which
includes several AI coding assistants, simply fail. Worth updating the links in
the hackathon page.

## One design question, not a bug

The ACL model requires an explicit `Nox.allow` for every address that will touch
a handle. In our module a single proposal grants access to five parties: the
module, the log that scores it, the Safe that will spend it, the token that
consumes it, and the signer who may reveal it. That is five compute operations
before any real work happens, and forgetting any one of them produces a failure
one transaction later, which the docs themselves flag as "NOX bug #1 for new
developers".

The rule is sound. The ergonomics are not. Something like
`Nox.allowMany(handle, address[])`, or a compile-time lint that flags a handle
written to storage without a matching `allowThis`, would remove an entire
category of first-week bugs.

## Would we build on it again

Yes. The mental model, encrypt off-chain, compute on handles, decide what
becomes public, is clean enough that after the first day we stopped thinking
about the cryptography and started thinking about the product. That is the
correct outcome for infrastructure. The rough edges above are all documentation
and error-message problems, which is a much better place to be than protocol
problems.
