/**
 * Regenerates the favicon set from the current brand mark (public/favicon.svg).
 *
 *   public/favicon.ico           16/32/48 px, PNG-embedded ICO entries (root .ico
 *                                — the FIRST thing Bing's favicon service reads)
 *   public/favicon-48.png        crisp raster PNG
 *   public/favicon-96.png        hi-dpi browsers / Android
 *   public/favicon-192.png       shortcuts / PWA surfaces
 *   public/apple-touch-icon.png  180 px, opaque square (iOS rounds it itself)
 *
 * Run manually when the brand mark changes (not wired into the build):
 *   node scripts/build-favicons.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const svgPath = path.join(root, 'public', 'favicon.svg');
const svgRaw = fs.readFileSync(svgPath, 'utf8');

// The SVG viewBox is 72x72 at the default 72 DPI, so rendering at
// `density: size` produces exactly `size` pixels with no resampling blur.
async function render(size, { square = false } = {}) {
  const src = square ? svgRaw.replace('rx="16"', 'rx="0"') : svgRaw;
  return sharp(Buffer.from(src), { density: size })
    .resize(size, size)
    .png()
    .toBuffer();
}

async function writeIfChanged(relative, buf) {
  const abs = path.join(root, relative);
  let old = null;
  try {
    old = fs.readFileSync(abs);
  } catch {}
  if (old && old.equals(buf)) {
    console.log(`= ${relative} (unchanged)`);
    return;
  }
  fs.writeFileSync(abs, buf);
  console.log(`+ ${relative} (${buf.length} bytes)`);
}

// --- ICO: 16/32/48, PNG-embedded (supported everywhere since Vista) --------
const icons = [];
for (const size of [16, 32, 48]) {
  icons.push({ size, png: await render(size) });
}
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(icons.length, 4);
const dir = Buffer.alloc(icons.length * 16);
let offset = 6 + dir.length;
icons.forEach(({ size, png }, i) => {
  const e = i * 16;
  dir.writeUInt8(size, e); // width (0 would mean 256)
  dir.writeUInt8(size, e + 1); // height
  dir.writeUInt8(0, e + 2); // palette count (unused for PNG entries)
  dir.writeUInt8(0, e + 3); // reserved
  dir.writeUInt16LE(1, e + 4); // color planes
  dir.writeUInt16LE(32, e + 6); // bits per pixel
  dir.writeUInt32LE(png.length, e + 8); // bytes in resource
  dir.writeUInt32LE(offset, e + 12); // image data offset
  offset += png.length;
});
await writeIfChanged('public/favicon.ico', Buffer.concat([header, dir, ...icons.map((x) => x.png)]));

// --- PNG variants -----------------------------------------------------------
await writeIfChanged('public/favicon-48.png', await render(48));
await writeIfChanged('public/favicon-96.png', await render(96));
await writeIfChanged('public/favicon-192.png', await render(192));

// --- Apple touch icon: full-bleed opaque square, iOS applies its own mask ---
await writeIfChanged('public/apple-touch-icon.png', await render(180, { square: true }));

console.log('done.');
