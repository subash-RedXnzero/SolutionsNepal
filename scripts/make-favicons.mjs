/**
 * Regenerates the favicon set from the brand mark in public/navbar.webp.
 *
 *   node scripts/make-favicons.mjs
 *
 * What it does:
 * 1. Loads public/navbar.webp (highest-resolution brand artwork available).
 * 2. Trims the white canvas padding around the mark.
 * 3.透明 background: pixels that are near-white AND connected to the canvas
 *    edge (flood fill) become transparent. White cutouts *inside* the mark
 *    stay white so the artwork keeps its die-cut design.
 * 4. Centers the mark on a square transparent canvas (~97% fill — favicons
 *    read much bolder in the tab than a padded artwork would).
 * 5. Writes: favicon-16x16.png, favicon-32x32.png, favicon.ico (16+32+48),
 *    apple-touch-icon.png (opaque white — iOS fills transparent icons with
 *    black on the home screen), android-chrome-192x192.png,
 *    android-chrome-512x512.png.
 * All output filenames are the ones head links / site.webmanifest expect,
 * so no code changes are needed when re-running this.
 */

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const pub = path.join(root, 'public');
const SRC = path.join(pub, 'navbar.webp');

// Near-white detection: min channel >= WHITE_MIN and low chroma spread
// (catches the warm off-white tint, not the red artwork itself).
const WHITE_MIN = 235;
const WHITE_SPREAD = 18;
// Anti-alias ramp start for pixels hugging the removed background.
const EDGE_MIN = 190;

function isWhiteish(r, g, b) {
  const mn = Math.min(r, g, b);
  const mx = Math.max(r, g, b);
  return mn >= WHITE_MIN && mx - mn <= WHITE_SPREAD;
}

// Pack PNG blobs into a .ico (PNG-compressed entries are supported by every
// modern browser; no BMP needed for <=48px sizes).
function packIco(entries) {
  const dir = Buffer.alloc(6 + 16 * entries.length);
  dir.writeUInt16LE(0, 0); // reserved
  dir.writeUInt16LE(1, 2); // type: icon
  dir.writeUInt16LE(entries.length, 4);
  let offset = 6 + 16 * entries.length;
  entries.forEach((e, i) => {
    const o = 6 + 16 * i;
    dir.writeUInt8(e.size === 256 ? 0 : e.size, o); // width (0 = 256)
    dir.writeUInt8(e.size === 256 ? 0 : e.size, o + 1); // height
    dir.writeUInt16LE(1, o + 4); // planes
    dir.writeUInt16LE(32, o + 6); // bpp
    dir.writeUInt32LE(e.data.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += e.data.length;
  });
  return Buffer.concat([dir, ...entries.map((e) => e.data)]);
}

const meta = await sharp(SRC).metadata();
console.log(`source: ${SRC} (${meta.width}x${meta.height})`);

// 1) Trim the white canvas padding.
let trimmed;
try {
  trimmed = await sharp(SRC).trim({ threshold: 18 }).png().toBuffer();
} catch {
  trimmed = await sharp(SRC).trim(18).png().toBuffer();
}
const tm = await sharp(trimmed).metadata();
console.log(`trimmed mark: ${tm.width}x${tm.height}`);

// 2) Raw RGBA pixel surgery.
const { data, info } = await sharp(trimmed).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width;
const H = info.height;

// Candidate background mask.
const cand = new Uint8Array(W * H);
for (let p = 0; p < W * H; p++) {
  const o = p * 4;
  cand[p] = isWhiteish(data[o], data[o + 1], data[o + 2]) ? 1 : 0;
}

// Flood fill from every near-white border pixel → outer background only.
const stack = [];
for (let x = 0; x < W; x++) {
  if (cand[x]) stack.push(x);
  if (cand[(H - 1) * W + x]) stack.push((H - 1) * W + x);
}
for (let y = 0; y < H; y++) {
  if (cand[y * W]) stack.push(y * W);
  if (cand[y * W + W - 1]) stack.push(y * W + W - 1);
}
const bg = new Uint8Array(W * H);
while (stack.length) {
  const p = stack.pop();
  if (bg[p] || !cand[p]) continue;
  bg[p] = 1;
  const x = p % W;
  const y = (p / W) | 0;
  if (x > 0) stack.push(p - 1);
  if (x < W - 1) stack.push(p + 1);
  if (y > 0) stack.push(p - W);
  if (y < H - 1) stack.push(p + W);
}

let opaque = 0;
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const p = y * W + x;
    const o = p * 4;
    if (bg[p]) {
      data[o + 3] = 0; // alpha byte
      continue;
    }
    // Smooth one-pixel AA ring next to the removed background.
    const touchesBg =
      (x > 0 && bg[p - 1]) ||
      (x < W - 1 && bg[p + 1]) ||
      (y > 0 && bg[p - W]) ||
      (y < H - 1 && bg[p + W]);
    if (touchesBg) {
      const mn = Math.min(data[o], data[o + 1], data[o + 2]);
      if (mn > EDGE_MIN) {
        const a = (WHITE_MIN - mn) / (WHITE_MIN - EDGE_MIN);
        data[o + 3] = Math.round(255 * Math.max(0, Math.min(1, a)));
      }
    }
    if (data[o + 3] > 0) opaque++;
  }
}
console.log(`mark coverage: ${(100 * opaque / (W * H)).toFixed(1)}% of trimmed bbox`);

// 3) Square transparent canvas.
const side = Math.ceil(Math.max(W, H) * 1.03); // ~97% fill — mark reads big in the tab
const padX = Math.floor((side - W) / 2);
const padY = Math.floor((side - H) / 2);
const master = await sharp(data, { raw: { width: W, height: H, channels: 4 } })
  .extend({
    top: padY,
    bottom: side - H - padY,
    left: padX,
    right: side - W - padX,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer();

// 4) Writes.
const pngSizes = [
  ['favicon-16x16.png', 16],
  ['favicon-32x32.png', 32],
  ['android-chrome-192x192.png', 192],
  ['android-chrome-512x512.png', 512],
];
for (const [file, size] of pngSizes) {
  await sharp(master).resize(size, size).png({ compressionLevel: 9 }).toFile(path.join(pub, file));
  console.log(`wrote ${file} (${size}x${size})`);
}

// apple-touch-icon: iOS home-screen icons must be opaque (transparent is
// composited onto black there) → flat white background.
await sharp(master).resize(180, 180).flatten({ background: '#FFFFFF' }).png().toFile(path.join(pub, 'apple-touch-icon.png'));
console.log('wrote apple-touch-icon.png (180x180, opaque white)');

const icoEntries = [];
for (const size of [16, 32, 48]) {
  icoEntries.push({ size, data: await sharp(master).resize(size, size).png().toBuffer() });
}
fs.writeFileSync(path.join(pub, 'favicon.ico'), packIco(icoEntries));
console.log(`wrote favicon.ico (${icoEntries.map((e) => e.size).join('/')})`);
