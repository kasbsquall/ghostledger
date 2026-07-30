/**
 * Adds routine payouts to DISTINCT external destinations, so the live history
 * shows a real spending pattern rather than ten payouts to one address.
 *
 *   CO_SIGNER_KEYS=/path/to/keys npx hardhat run scripts/add-vendors.ts --network sepolia
 *
 * Each payout is a routine amount that scores "within pattern", so it needs the
 * Safe's own threshold of two owner signatures, which owner2 and owner3 supply.
 * The amount is encrypted before it is proposed; only the band is ever public.
 */
import { network } from 'hardhat';
import { createViemHandleClient } from '@iexec-nox/handle';
import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { readFileSync } from 'node:fs';

import deployment from '../deployments/sepolia.json' with { type: 'json' };

const RPC = 'https://ethereum-sepolia-rpc.publicnode.com';
const UNIT = 1_000_000n;
const BANDS = ['unsettled', 'within pattern', 'review', 'anomalous'];

const KEYS = process.env.CO_SIGNER_KEYS;
if (!KEYS) throw new Error('Set CO_SIGNER_KEYS to the directory with owner2.key, owner3.key');

function signer(index: number) {
  return privateKeyToAccount(readFileSync(`${KEYS}/owner${index}.key`, 'utf8').trim());
}

// Three distinct fresh destinations, so the table stops paying one address.
// The private keys are discarded; these are only ever payment recipients.
const VENDORS = [
  { label: 'contractor invoice', to: privateKeyToAccount(generatePrivateKey()).address, amount: 90n * UNIT },
  { label: 'infra vendor', to: privateKeyToAccount(generatePrivateKey()).address, amount: 125n * UNIT },
  { label: 'grant disbursement', to: privateKeyToAccount(generatePrivateKey()).address, amount: 150n * UNIT },
];

async function main() {
  const { viem } = await network.connect({ network: 'sepolia', chainType: 'op' });
  const ghostModule = await viem.getContractAt(
    'GhostLedgerModule',
    deployment.ghostLedgerModule as `0x${string}`
  );

  const pub = createPublicClient({ chain: sepolia, transport: http(RPC) });
  const wallets = [2, 3].map((i) =>
    createWalletClient({ account: signer(i), chain: sepolia, transport: http(RPC) })
  );
  const handleClient = await createViemHandleClient(wallets[0]);

  async function waitForBand(handle: `0x${string}`, attempts = 25) {
    for (let i = 0; i < attempts; i += 1) {
      try {
        return await handleClient.publicDecrypt(handle);
      } catch (cause) {
        const message = String((cause as Error)?.message ?? cause);
        if (!/not publicly decryptable|access_denied/.test(message)) throw cause;
        process.stdout.write(`  waiting for the enclave (${i + 1}/${attempts})\r`);
        await new Promise((r) => setTimeout(r, 3_000));
      }
    }
    throw new Error('the band never became publicly decryptable');
  }

  const send = async (label: string, hash: `0x${string}`) => {
    const receipt = await pub.waitForTransactionReceipt({ hash });
    console.log(`  ${label.padEnd(24)} ${receipt.status}  ${hash}`);
    return receipt;
  };

  for (const v of VENDORS) {
    console.log(`\n── ${v.label}: ${v.amount / UNIT} TUSD → ${v.to} ──`);

    const { handle, handleProof } = await handleClient.encryptInput(
      v.amount,
      'uint256',
      deployment.ghostLedgerModule as `0x${string}`
    );
    await send('propose (encrypted)', await ghostModule.write.propose(
      [handle, handleProof, v.to], { account: wallets[0].account }
    ));

    const id = (await ghostModule.read.movementCount()) - 1n;
    const [, , , , , , riskHandle] = await ghostModule.read.movementAt([id]);
    const { value, decryptionProof } = await waitForBand(riskHandle as `0x${string}`);
    await send('settle band', await ghostModule.write.settle(
      [id, decryptionProof], { account: wallets[0].account }
    ));

    const required = Number(await ghostModule.read.signaturesRequired([id]));
    console.log(`  band                     ${BANDS[Number(value)]}, needs ${required} signatures`);

    if (Number(value) !== 1) {
      console.log('  not within pattern, leaving it pending (cannot reach quorum with two keys)');
      continue;
    }
    await send('approve by owner2', await ghostModule.write.approve([id], { account: wallets[0].account }));
    await send('approve by owner3', await ghostModule.write.approve([id], { account: wallets[1].account }));
    await send('execute through Safe', await ghostModule.write.execute([id], { account: wallets[0].account }));
  }

  console.log(`\ntotal movements now: ${await ghostModule.read.movementCount()}`);
}

main().catch((error) => {
  console.error(error?.shortMessage ?? error?.message ?? error);
  process.exitCode = 1;
});
