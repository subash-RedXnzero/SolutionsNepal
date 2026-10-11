/**
 * SolutionsNepal — generate public/og-default.png (1200×630 social share image).
 *
 * Run: node scripts/generate-og-image.mjs  (or: npm run og)
 *
 * Uses sharp (already present via Astro's dependency tree) to rasterize an
 * SVG layout in the brand colors. Font stack falls back Inter → Segoe UI →
 * Arial so the wordmark renders cleanly on any machine.
 *
 * The generated PNG is committed to the repo, so builds don't depend on this
 * script — rerun it only when the branding changes.
 */
import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'og-default.png');

// Brand tokens (match src/styles/global.css)
const BG = '#FAF8F4';
const INK = '#171717';
const MUTED = '#6B6B6B';
const ACCENT = '#E62B1E';
const BORDER = '#E8E3DC';
const FONT = "Inter, 'Segoe UI', Arial, sans-serif";

// Geometric "N" logo mark, drawn as paths (no font dependency).
const logoMark = `
  <svg width="72" height="72" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">
    <rect width="72" height="72" rx="16" fill="${ACCENT}"/>
    <path d="M22 52 V20 h8 l12 20 V20 h8 v32 h-8 L30 32 v20 z" fill="#FFFFFF"/>
  </svg>`;

const chip = (x, w, label) => `
  <g>
    <rect x="${x}" y="500" width="${w}" height="52" rx="26" fill="#FFFFFF" stroke="${BORDER}" stroke-width="2"/>
    <circle cx="${x + 26}" cy="526" r="5" fill="${ACCENT}"/>
    <text x="${x + 44}" y="534" font-family="${FONT}" font-size="24" font-weight="600" fill="${INK}">${label}</text>
  </g>`;

const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="${BG}"/>

  <!-- subtle top accent bar -->
  <rect width="1200" height="6" fill="${ACCENT}"/>

  <!-- faint oversized glyph for depth -->
  <text x="1058" y="600" font-family="${FONT}" font-size="560" font-weight="800"
        fill="${ACCENT}" opacity="0.05" text-anchor="middle">N</text>

  <!-- logo + wordmark -->
  <g transform="translate(80, 84)">${logoMark}</g>
  <text x="172" y="134" font-family="${FONT}" font-size="44" font-weight="700" fill="${INK}">SolutionsNepal</text>

  <!-- headline -->
  <text x="80" y="286" font-family="${FONT}" font-size="88" font-weight="800"
        letter-spacing="-2" fill="${INK}">Tools for everyday Nepal</text>

  <!-- subheading -->
  <text x="80" y="366" font-family="${FONT}" font-size="40" font-weight="500" fill="${MUTED}">Calculate. Convert. Check. Get things done.</text>

  <!-- red underline accent -->
  <rect x="80" y="408" width="112" height="6" rx="3" fill="${ACCENT}"/>

  <!-- feature chips -->
  ${chip(80, 220, 'Nepal Today — live')}
  ${chip(324, 210, '55+ free tools')}
  ${chip(558, 190, 'No signup')}
</svg>`;

mkdirSync(dirname(OUT), { recursive: true });
const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
writeFileSync(OUT, png);

// Sanity check: report dimensions and that the image isn't blank.
const meta = await sharp(png).metadata();
const stats = await sharp(png).stats();
const busy = stats.channels.some((c) => c.stdev > 10);
console.log(`[og-image] wrote ${OUT} (${meta.width}x${meta.height}, ${(png.length / 1024).toFixed(0)} KB) — ${busy ? 'content OK' : 'WARNING: image looks blank'}`);
if (!busy) process.exit(1);
