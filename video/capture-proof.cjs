/**
 * Captures the external artefacts the film uses as evidence: the deployed
 * module on Etherscan, and the transaction whose calldata carries a handle
 * where an ordinary transfer carries a number.
 *
 * These are not our screens. That is the point: a judge can open the same URL.
 */
const { chromium } = require('playwright');
const path = require('node:path');

const OUT = path.join(__dirname, 'shots');

// Etherscan sits behind a Cloudflare bot wall. Blockscout indexes the same
// chain and is open, so the artefact stays external and checkable.
const SHOTS = [
  {
    name: 'explorer-module',
    url: 'https://eth-sepolia.blockscout.com/address/0xf6bc97f8a9f399dd33517ed4f4a695f8bc134b08',
  },
  {
    name: 'explorer-enablemodule',
    url: 'https://eth-sepolia.blockscout.com/tx/0x871a23ac64c807e1125a9318885cd05447065a74e6dd40f95dffebdc1d9e332a',
  },
];

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1312, height: 820 },
    deviceScaleFactor: 2,
    colorScheme: 'dark',
  });
  const page = await context.newPage();

  for (const shot of SHOTS) {
    try {
      await page.goto(shot.url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await page.waitForTimeout(6_000);
      // Cookie banners are the one thing guaranteed to be in frame otherwise.
      for (const label of ['Got it', 'Accept', 'I Agree', 'Close']) {
        const b = page.getByRole('button', { name: label }).first();
        if (await b.isVisible().catch(() => false)) {
          await b.click().catch(() => undefined);
          break;
        }
      }
      await page.waitForTimeout(1_500);
      await page.screenshot({ path: path.join(OUT, `${shot.name}.png`) });
      console.log(`captured ${shot.name}`);
    } catch (cause) {
      console.error(`failed ${shot.name}: ${cause.message.split('\n')[0]}`);
    }
  }

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
