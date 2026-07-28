/**
 * Deploys the whole GhostLedger stack to Ethereum Sepolia and seeds the
 * detector with a spending baseline.
 *
 *   npx hardhat run scripts/deploy.ts --network sepolia
 *
 * The signing key is read from Hardhat's encrypted keystore, never from a file
 * in the repo. Set it once with:
 *
 *   npx hardhat keystore set SEPOLIA_PRIVATE_KEY
 *
 * After this script finishes there is one manual step left: enabling the module
 * on the Safe. A Safe can only be changed by its own owners, which is the whole
 * point of the design, so no script can do it for you.
 */
import { network } from 'hardhat';
import { createViemHandleClient } from '@iexec-nox/handle';
import { writeFileSync, mkdirSync } from 'node:fs';

const SAFE = '0x7DC3B57286F4Fb4bF793B536B4380B3E86A40372' as const;

const WATCH_FACTOR = 2n;
const FLAG_FACTOR = 5n;

const UNIT = 1_000_000n; // TUSD uses 6 decimals
const TREASURY_FUNDING = 500_000n * UNIT;

/** The DAO's ordinary rhythm: four payouts averaging about 100 TUSD. */
const BASELINE = [100n, 120n, 90n, 90n].map((n) => n * UNIT);

async function main() {
  const { viem } = await network.connect({ network: 'sepolia', chainType: 'op' });
  const [wallet] = await viem.getWalletClients();
  const deployer = wallet.account.address;

  console.log(`deployer  ${deployer}`);
  console.log(`safe      ${SAFE}\n`);

  const usd = await viem.deployContract('TreasuryUSD', []);
  console.log(`TreasuryUSD               ${usd.address}`);

  const token = await viem.deployContract('ConfidentialTreasuryToken', [
    'Confidential Treasury USD',
    'cTUSD',
    '',
    usd.address,
  ]);
  console.log(`ConfidentialTreasuryToken ${token.address}`);

  const log = await viem.deployContract('ConfidentialTreasuryLog', [WATCH_FACTOR, FLAG_FACTOR]);
  console.log(`ConfidentialTreasuryLog   ${log.address}`);

  const ghostModule = await viem.deployContract('GhostLedgerModule', [
    SAFE,
    token.address,
    log.address,
  ]);
  console.log(`GhostLedgerModule         ${ghostModule.address}\n`);

  await log.write.setRecorder([ghostModule.address]);
  console.log('recorder set to the module');

  // Fund the treasury and turn the public balance into a confidential one.
  await usd.write.mint([deployer, TREASURY_FUNDING]);
  await usd.write.approve([token.address, TREASURY_FUNDING]);
  await token.write.wrap([SAFE, TREASURY_FUNDING]);
  console.log(`wrapped ${TREASURY_FUNDING / UNIT} TUSD into the Safe`);

  // Give the detector something to compare against.
  const handleClient = await createViemHandleClient(wallet);
  for (const amount of BASELINE) {
    const { handle, handleProof } = await handleClient.encryptInput(
      amount,
      'uint256',
      log.address
    );
    await log.write.seedHistory([handle, handleProof]);
    console.log(`seeded a payout of ${amount / UNIT} TUSD`);
  }

  const deployment = {
    network: 'sepolia',
    chainId: 11155111,
    safe: SAFE,
    treasuryUSD: usd.address,
    confidentialToken: token.address,
    treasuryLog: log.address,
    ghostLedgerModule: ghostModule.address,
    watchFactor: Number(WATCH_FACTOR),
    flagFactor: Number(FLAG_FACTOR),
  };

  mkdirSync('deployments', { recursive: true });
  writeFileSync('deployments/sepolia.json', JSON.stringify(deployment, null, 2));

  console.log('\nwritten to deployments/sepolia.json');
  console.log('\nLast step, and it has to be done from the Safe itself:');
  console.log('  1. open app.safe.global and pick the GhostLedger Treasury Safe');
  console.log('  2. New transaction, Transaction builder');
  console.log(`  3. target the Safe itself: ${SAFE}`);
  console.log(`  4. call enableModule with ${ghostModule.address}`);
  console.log('  5. sign and execute');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
