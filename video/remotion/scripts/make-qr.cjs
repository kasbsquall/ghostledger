/**
 * Draws the end-card QR as light modules on a transparent ground.
 *
 * The first version of this card was the library default: dark modules on a
 * white square. On a film graded to near-black that reads as a bright rectangle
 * with no code in it, and a phone camera pointed at a screen never resolves it.
 * Inverting the polarity puts the contrast where the scanner looks for it and
 * lets the card keep its ground.
 *
 * Error correction is set to Q rather than the default M: the code is on screen
 * for a few seconds, filmed off a display, and the extra redundancy is what
 * survives compression.
 */
const fs = require('node:fs');
const path = require('node:path');
const QRCode = require('qrcode');

const TARGET = 'https://kasbsquall.github.io/ghostledger/';
const MODULE_COLOR = '#e8eae7';
const QUIET = 2;

const {modules} = QRCode.create(TARGET, {errorCorrectionLevel: 'Q'});
const size = modules.size;
const span = size + QUIET * 2;

const rects = [];
for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    if (modules.data[y * size + x]) {
      rects.push(`<rect x="${x + QUIET}" y="${y + QUIET}" width="1" height="1"/>`);
    }
  }
}

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${span} ${span}" ` +
  `shape-rendering="crispEdges" role="img" aria-label="${TARGET}">` +
  `<g fill="${MODULE_COLOR}">${rects.join('')}</g></svg>`;

const out = path.join(__dirname, '..', 'public', 'qr.svg');
fs.writeFileSync(out, svg);
console.log(`${out}  ${span}x${span} modules  ${rects.length} filled  ->  ${TARGET}`);
