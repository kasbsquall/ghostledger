/**
 * Drives a full GhostLedger cycle against the live Sepolia deployment.
 *
 *   npx hardhat run scripts/live-demo.ts --network sepolia
 *
 * Signs as the co-signer wallets, so it exercises the real multi-owner path:
 * propose with an encrypted amount, settle the band with its gateway proof,
 * collect the signatures that band demands, execute through the Safe.
 */
import { network } from 'hardhat';
import { createViemHandleClient } from '@iexec-nox/handle';
import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { readFileSync } from 'node:fs';

import deployment from '../deployments/sepolia.json' with { type: 'json' };

const RPC = 'https://ethereum-sepolia-rpc.publicnode.com';

/**
 * Directory holding one `owner<N>.key` file per co-signer. Kept outside the
 * repository on purpose: point CO_SIGNER_KEYS at it before running.
 */
const KEYS = process.env.CO_SIGNER_KEYS;
if (!KEYS) {
  throw new Error('Set CO_SIGNER_KEYS to the directory holding owner2.key, owner3.key, owner4.key');
}

const UNIT = 1_000_000n;
const BANDS = ['unsettled', 'within pattern', 'review', 'anomalous'];

const VENDOR = '0x518F00E76ed0CaEFdFda8E65fbCc2BCBADABc218' as const;

function signer(index: number) {
  return privateKeyToAccount(readFileSync(`${KEYS}/owner${index}.key`, 'utf8').trim());
}

async function main() {
  const { viem } = await network.connect({ network: 'sepolia', chainType: 'op' });
  const ghostModule = await viem.getContractAt(
    'GhostLedgerModule',
    deployment.ghostLedgerModule as `0x${string}`
  );

  const pub = createPublicClient({ chain: sepolia, transport: http(RPC) });
  const wallets = [2, 3, 4].map((i) =>
    createWalletClient({ account: signer(i), chain: sepolia, transport: http(RPC) })
  );
  const handleClient = await createViemHandleClient(wallets[0]);

  const send = async (label: string, hash: `0x${string}`) => {
    const receipt = await pub.waitForTransactionReceipt({ hash });
    console.log(`  ${label.padEnd(26)} ${receipt.status}`);
    return receipt;
  };

  async function runCycle(amount: bigint, execute: boolean) {
    console.log(`\n── payout of ${amount / UNIT} TUSD ──`);

    const { handle, handleProof } = await handleClient.encryptInput(
      amount,
      'uint256',
      deployment.ghostLedgerModule as `0x${string}`
    );
    await send(
      'propose (encrypted)',
      await ghostModule.write.propose([handle, handleProof, VENDOR], {
        account: wallets[0].account,
      })
    );

    const id = (await ghostModule.read.movementCount()) - 1n;
    const [, , , , , , riskHandle] = await ghostModule.read.movementAt([id]);

    const { value, decryptionProof } = await handleClient.publicDecrypt(
      riskHandle as `0x${string}`
    );
    await send(
      'settle band on-chain',
      await ghostModule.write.settle([id, decryptionProof], { account: wallets[0].account })
    );

    const required = await ghostModule.read.signaturesRequired([id]);
    console.log(`  band                       ${BANDS[Number(value)]}`);
    console.log(`  signatures required        ${required} of 4 owners`);

    if (!execute) return;

    for (let i = 0; i < Number(required) && i < wallets.length; i += 1) {
      await send(`approve by signer ${i + 2}`, await ghostModule.write.approve([id], {
        account: wallets[i].account,
      }));
    }
    await send('execute through Safe', await ghostModule.write.execute([id], {
      account: wallets[0].account,
    }));
  }

  // A routine payout: inside the pattern, moves on the Safe's own threshold.
  await runCycle(110n * UNIT, true);

  // A drain attempt: same flow, but the treasury demands every owner.
  await runCycle(400_000n * UNIT, false);

  console.log('\nthe amount was never decrypted in this script, only the band');
}

main().catch((error) => {
  console.error(error?.shortMessage ?? error?.message ?? error);
  process.exitCode = 1;
});
