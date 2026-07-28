/**
 * Completes a deployment whose contracts are already on chain: funds the
 * treasury, wraps it into the confidential token and seeds the baseline.
 *
 *   npx hardhat run scripts/finish-deploy.ts --network sepolia
 *
 * Split out from deploy.ts because every step here has to wait for its receipt.
 * Sending them back to back reuses the nonce and the node rejects the second
 * one as an underpriced replacement.
 */
import { network } from 'hardhat';
import { createViemHandleClient } from '@iexec-nox/handle';
import { writeFileSync, mkdirSync } from 'node:fs';

const SAFE = '0x7DC3B57286F4Fb4bF793B536B4380B3E86A40372' as const;
const USD = '0xc399a3f3474c31043140f44b8eb9b25b1598d44e' as const;
const TOKEN = '0x60c2f25557af2cde3dd7456527d3f54f925c4a9e' as const;
const LOG = '0x15d9cf24d1b33b37825cb79d1a4f56e24b926585' as const;
const MODULE = '0xf6bc97f8a9f399dd33517ed4f4a695f8bc134b08' as const;

const WATCH_FACTOR = 2;
const FLAG_FACTOR = 5;

const UNIT = 1_000_000n;
const TREASURY_FUNDING = 500_000n * UNIT;
const BASELINE = [100n, 120n, 90n, 90n].map((n) => n * UNIT);

async function main() {
  const { viem } = await network.connect({ network: 'sepolia', chainType: 'op' });
  const publicClient = await viem.getPublicClient();
  const [wallet] = await viem.getWalletClients();
  const deployer = wallet.account.address;

  const usd = await viem.getContractAt('TreasuryUSD', USD);
  const token = await viem.getContractAt('ConfidentialTreasuryToken', TOKEN);
  const log = await viem.getContractAt('ConfidentialTreasuryLog', LOG);

  /** Sends one transaction and does not return until it is mined. */
  async function settle(label: string, hash: `0x${string}`) {
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`${label.padEnd(28)} ${receipt.status} · gas ${receipt.gasUsed}`);
  }

  await settle('mint TUSD', await usd.write.mint([deployer, TREASURY_FUNDING]));
  await settle('approve wrapper', await usd.write.approve([TOKEN, TREASURY_FUNDING]));
  await settle('wrap into the Safe', await token.write.wrap([SAFE, TREASURY_FUNDING]));

  const handleClient = await createViemHandleClient(wallet);
  for (const amount of BASELINE) {
    const { handle, handleProof } = await handleClient.encryptInput(amount, 'uint256', LOG);
    await settle(`seed ${amount / UNIT} TUSD`, await log.write.seedHistory([handle, handleProof]));
  }

  const deployment = {
    network: 'sepolia',
    chainId: 11155111,
    safe: SAFE,
    treasuryUSD: USD,
    confidentialToken: TOKEN,
    treasuryLog: LOG,
    ghostLedgerModule: MODULE,
    watchFactor: WATCH_FACTOR,
    flagFactor: FLAG_FACTOR,
  };

  mkdirSync('deployments', { recursive: true });
  writeFileSync('deployments/sepolia.json', JSON.stringify(deployment, null, 2));
  console.log('\nwritten to deployments/sepolia.json');

  console.log('\nLast step, and it has to be done from the Safe itself:');
  console.log('  app.safe.global → New transaction → Transaction builder');
  console.log(`  address: ${SAFE}`);
  console.log(`  call enableModule(${MODULE})`);
}

main().catch((error) => {
  console.error(error?.shortMessage ?? error?.message ?? error);
  process.exitCode = 1;
});
