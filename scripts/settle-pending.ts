/**
 * Settles and executes the most recent movement if its band is now published
 * and lands within pattern. Used to finish a payout whose enclave band was not
 * ready when it was first proposed.
 *
 *   CO_SIGNER_KEYS=/path npx hardhat run scripts/settle-pending.ts --network sepolia
 */
import { network } from 'hardhat';
import { createViemHandleClient } from '@iexec-nox/handle';
import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { readFileSync } from 'node:fs';

import deployment from '../deployments/sepolia.json' with { type: 'json' };

const RPC = 'https://ethereum-sepolia-rpc.publicnode.com';
const BANDS = ['unsettled', 'within pattern', 'review', 'anomalous'];
const KEYS = process.env.CO_SIGNER_KEYS!;
const signer = (i: number) => privateKeyToAccount(readFileSync(`${KEYS}/owner${i}.key`, 'utf8').trim());

async function main() {
  const { viem } = await network.connect({ network: 'sepolia', chainType: 'op' });
  const m = await viem.getContractAt('GhostLedgerModule', deployment.ghostLedgerModule as `0x${string}`);
  const pub = createPublicClient({ chain: sepolia, transport: http(RPC) });
  const wallets = [2, 3].map((i) => createWalletClient({ account: signer(i), chain: sepolia, transport: http(RPC) }));
  const handleClient = await createViemHandleClient(wallets[0]);

  const id = (await m.read.movementCount()) - 1n;
  const [, , , , band, , riskHandle] = await m.read.movementAt([id]);
  console.log(`movement ${id}, current band ${Number(band)}`);

  const send = async (label: string, hash: `0x${string}`) => {
    const r = await pub.waitForTransactionReceipt({ hash });
    console.log(`  ${label.padEnd(24)} ${r.status}  ${hash}`);
  };

  if (Number(band) === 0) {
    let proof: `0x${string}` | null = null;
    for (let i = 0; i < 30 && !proof; i += 1) {
      try {
        proof = (await handleClient.publicDecrypt(riskHandle as `0x${string}`)).decryptionProof;
      } catch (cause) {
        const msg = String((cause as Error)?.message ?? cause);
        if (!/not publicly decryptable|access_denied|not yet been computed/.test(msg)) throw cause;
        process.stdout.write(`  waiting for the enclave (${i + 1}/30)\r`);
        await new Promise((r) => setTimeout(r, 4_000));
      }
    }
    if (!proof) throw new Error('band never published');
    await send('settle band', await m.write.settle([id, proof], { account: wallets[0].account }));
  }

  const value = Number((await m.read.movementAt([id]))[4]);
  const required = Number(await m.read.signaturesRequired([id]));
  console.log(`  band ${BANDS[value]}, needs ${required}`);
  if (value !== 1) { console.log('  not within pattern, left pending'); return; }

  await send('approve by owner2', await m.write.approve([id], { account: wallets[0].account }));
  await send('approve by owner3', await m.write.approve([id], { account: wallets[1].account }));
  await send('execute through Safe', await m.write.execute([id], { account: wallets[0].account }));
  console.log(`\ntotal movements now: ${await m.read.movementCount()}`);
}

main().catch((e) => { console.error(e?.shortMessage ?? e?.message ?? e); process.exitCode = 1; });
