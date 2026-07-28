/**
 * Films the dashboard while a real Sepolia cycle runs against it.
 *
 *   node video/record-demo.js
 *
 * The point is that nothing here is staged. The browser sits on the live
 * dashboard, a separate process proposes and settles real movements on chain,
 * and the page's own 15s poll picks them up. The state change happens in the
 * recording because it happened on Sepolia, which is the difference between a
 * clip that proves something and a clip that illustrates it.
 */
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const URL = process.env.DASHBOARD_URL ?? 'http://localhost:5173';
const OUT = path.join(__dirname, 'raw');
const KEYS = process.env.CO_SIGNER_KEYS;
const RUN_MS = Number(process.env.RUN_MS ?? 210_000);

async function main() {
  if (!KEYS) throw new Error('Set CO_SIGNER_KEYS to the co-signer key directory');

  const browser = await chromium.launch({ args: ['--force-device-scale-factor=1'] });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    colorScheme: 'dark',
    recordVideo: { dir: OUT, size: { width: 1920, height: 1080 } },
  });

  const page = await context.newPage();
  await page.goto(URL, { waitUntil: 'networkidle' });

  // Let the first paint settle so the clip never opens on a skeleton.
  await page.waitForSelector('.movements, .empty', { timeout: 30_000 });
  await page.waitForTimeout(4_000);

  console.log('recording · launching the on-chain cycle');

  const demo = spawn(
    'npx',
    ['hardhat', 'run', 'scripts/live-demo.ts', '--network', 'sepolia'],
    {
      cwd: path.join(__dirname, '..'),
      shell: true,
      env: {
        ...process.env,
        SEPOLIA_PRIVATE_KEY: readFileSync(path.join(KEYS, 'deployer.key'), 'utf8').trim(),
      },
    }
  );

  demo.stdout.on('data', (chunk) => process.stdout.write(`  demo | ${chunk}`));
  demo.stderr.on('data', (chunk) => process.stderr.write(`  demo! | ${chunk}`));

  const finished = new Promise((resolve) => demo.on('close', resolve));
  const deadline = new Promise((resolve) => setTimeout(resolve, RUN_MS));
  await Promise.race([finished, deadline]);

  // Hold on the settled table so the shot has somewhere to land.
  await page.waitForTimeout(18_000);

  await context.close();
  await browser.close();
  console.log(`\nwritten to ${OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
