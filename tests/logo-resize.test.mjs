/**
 * Tests for the Logo Size Resizer engine (pure functions only).
 * Browser-only helpers (loadLogoImage, composeLogo, canvasToBlob) need
 * DOM/Canvas and are exercised in the browser, not here.
 *
 * Run: node --test tests/logo-resize.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  PRESETS,
  MIN_DIM,
  MAX_DIM,
  MAX_FILE_BYTES,
  validateLogoFile,
  isSvgFile,
  parseDim,
  clampDim,
  maxPadding,
  lockedSize,
  fitContain,
  fitCoverCrop,
  coverCropPercent,
  outputMime,
  extForFormat,
  formatSupportsAlpha,
  resolveBackground,
  buildFileName,
  parseSvgSize,
  sanitizeSvgText,
} from '../src/lib/converters/logo-resize.js';

// ── Presets ───────────────────────────────────────────────────────

test('presets: six suggested sizes, all positive', () => {
  assert.equal(PRESETS.length, 6);
  for (const p of PRESETS) {
    assert.ok(p.w > 0 && p.h > 0, p.id);
    assert.ok(p.label.length > 0, p.id);
  }
});

test('presets: favicon is 48x48, header is 250x80', () => {
  const fav = PRESETS.find((p) => p.id === 'favicon');
  const header = PRESETS.find((p) => p.id === 'header');
  assert.deepEqual([fav.w, fav.h], [48, 48]);
  assert.deepEqual([header.w, header.h], [250, 80]);
});

// ── validateLogoFile ──────────────────────────────────────────────

test('validateLogoFile: accepts png/jpg/webp/svg', () => {
  for (const t of ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']) {
    assert.equal(validateLogoFile({ name: 'logo.x', type: t, size: 1000 }).valid, true);
  }
});

test('validateLogoFile: accepts by extension when mime missing', () => {
  assert.equal(validateLogoFile({ name: 'logo.svg', type: '', size: 500 }).valid, true);
  assert.equal(validateLogoFile({ name: 'logo.PNG', type: '', size: 500 }).valid, true);
});

test('validateLogoFile: rejects unsupported formats', () => {
  const r = validateLogoFile({ name: 'doc.pdf', type: 'application/pdf', size: 500 });
  assert.equal(r.valid, false);
  assert.match(r.error, /Unsupported format/);
});

test('validateLogoFile: rejects empty and oversized files', () => {
  assert.equal(validateLogoFile({ name: 'a.png', type: 'image/png', size: 0 }).valid, false);
  const big = validateLogoFile({ name: 'a.png', type: 'image/png', size: MAX_FILE_BYTES + 1 });
  assert.equal(big.valid, false);
  assert.match(big.error, /20 MB/);
});

test('isSvgFile: detects by mime or extension', () => {
  assert.equal(isSvgFile({ name: 'a.svg', type: '' }), true);
  assert.equal(isSvgFile({ name: 'a.bin', type: 'image/svg+xml' }), true);
  assert.equal(isSvgFile({ name: 'a.png', type: 'image/png' }), false);
});

// ── parseDim / clampDim ───────────────────────────────────────────

test('parseDim: valid integers pass through', () => {
  assert.equal(parseDim('250'), 250);
  assert.equal(parseDim(80), 80);
});

test('parseDim: rejects fractions, zero, negatives, junk', () => {
  assert.equal(parseDim('12.5'), null);
  assert.equal(parseDim('0'), null);
  assert.equal(parseDim('-40'), null);
  assert.equal(parseDim('abc'), null);
  assert.equal(parseDim(''), null);
});

test('clampDim: enforces 16–4096 bounds', () => {
  assert.equal(clampDim(1), MIN_DIM);
  assert.equal(clampDim(9000), MAX_DIM);
  assert.equal(clampDim(250), 250);
  assert.equal(clampDim(NaN), null);
});

test('maxPadding: cannot exceed half the shortest side', () => {
  assert.equal(maxPadding(250, 80), 39);
  assert.equal(maxPadding(48, 48), 23);
  assert.equal(maxPadding(20, 20), 9);
});

// ── lockedSize ────────────────────────────────────────────────────

test('lockedSize: width edit preserves 2:1 ratio', () => {
  assert.deepEqual(lockedSize('w', 200, 400, 200), { w: 200, h: 100 });
});

test('lockedSize: height edit preserves ratio', () => {
  assert.deepEqual(lockedSize('h', 50, 400, 200), { w: 100, h: 50 });
});

test('lockedSize: rejects bad input', () => {
  assert.equal(lockedSize('w', 0, 400, 200), null);
  assert.equal(lockedSize('w', 100, 0, 200), null);
});

// ── fitContain ────────────────────────────────────────────────────

test('fitContain: wide logo letterboxes vertically', () => {
  const r = fitContain(400, 200, 250, 80, 0);
  // scale = min(250/400, 80/200) = min(0.625, 0.4) = 0.4 → 160×80
  assert.deepEqual([r.dw, r.dh], [160, 80]);
  assert.equal(r.dx, 45);
  assert.equal(r.dy, 0);
});

test('fitContain: padding insets the draw rect', () => {
  const r = fitContain(100, 100, 200, 200, 20);
  assert.deepEqual([r.dw, r.dh], [160, 160]);
  assert.deepEqual([r.dx, r.dy], [20, 20]);
});

test('fitContain: excessive padding is clamped', () => {
  const r = fitContain(100, 100, 100, 100, 90);
  assert.ok(r.dw > 0 && r.dh > 0);
  assert.ok(r.pad <= 49);
});

// ── fitCoverCrop ───────────────────────────────────────────────────

test('fitCoverCrop: wide source into square crops sides', () => {
  const c = fitCoverCrop(400, 200, 200, 200);
  // scale = max(0.5, 1) = 1 → crop 200×200 centered
  assert.deepEqual(c, { sx: 100, sy: 0, sw: 200, sh: 200 });
});

test('fitCoverCrop: matching ratios crop nothing', () => {
  const c = fitCoverCrop(400, 200, 200, 100);
  assert.deepEqual(c, { sx: 0, sy: 0, sw: 400, sh: 200 });
});

test('coverCropPercent: square-from-2:1 crops 50%', () => {
  assert.equal(coverCropPercent(400, 200, 200, 200), 50);
});

test('coverCropPercent: no crop when ratios match', () => {
  assert.equal(coverCropPercent(400, 200, 200, 100), 0);
});

// ── Formats ───────────────────────────────────────────────────────

test('outputMime/extForFormat map correctly', () => {
  assert.equal(outputMime('png'), 'image/png');
  assert.equal(outputMime('jpeg'), 'image/jpeg');
  assert.equal(outputMime('webp'), 'image/webp');
  assert.equal(extForFormat('jpeg'), 'jpg');
  assert.equal(extForFormat('png'), 'png');
  assert.equal(extForFormat('webp'), 'webp');
});

test('formatSupportsAlpha: png and webp only', () => {
  assert.equal(formatSupportsAlpha('png'), true);
  assert.equal(formatSupportsAlpha('webp'), true);
  assert.equal(formatSupportsAlpha('jpeg'), false);
});

test('resolveBackground: transparent png stays transparent', () => {
  assert.deepEqual(resolveBackground('png', 'transparent'), { color: null, coerced: false });
});

test('resolveBackground: jpeg coerces transparency to white', () => {
  const r = resolveBackground('jpeg', 'transparent');
  assert.equal(r.color, '#ffffff');
  assert.equal(r.coerced, true);
});

test('resolveBackground: custom color validated', () => {
  assert.equal(resolveBackground('png', 'custom', '#123abc').color, '#123abc');
  assert.equal(resolveBackground('png', 'custom', 'red').color, '#ffffff');
});

test('resolveBackground: black and white presets', () => {
  assert.equal(resolveBackground('webp', 'black').color, '#000000');
  assert.equal(resolveBackground('jpeg', 'white').color, '#ffffff');
});

// ── buildFileName ─────────────────────────────────────────────────

test('buildFileName: my-logo-250x80.png', () => {
  assert.equal(buildFileName('My Logo!.png', 250, 80, 'png'), 'my-logo-250x80.png');
});

test('buildFileName: falls back to logo on junk input', () => {
  assert.equal(buildFileName('!!!', 48, 48, 'jpg'), 'logo-48x48.jpg');
  assert.equal(buildFileName('', 192, 192, 'webp'), 'logo-192x192.webp');
});

// ── SVG ───────────────────────────────────────────────────────────

test('parseSvgSize: reads width/height attributes', () => {
  assert.deepEqual(parseSvgSize('<svg width="300" height="150">'), { w: 300, h: 150 });
});

test('parseSvgSize: falls back to viewBox', () => {
  assert.deepEqual(parseSvgSize('<svg viewBox="0 0 64 32">'), { w: 64, h: 32 });
});

test('parseSvgSize: returns null without sizing info', () => {
  assert.equal(parseSvgSize('<svg><rect/></svg>'), null);
});

test('sanitizeSvgText: strips scripts and event handlers', () => {
  const dirty = '<svg><script>alert(1)</script><rect onclick="evil()" width="10"/></svg>';
  const { svg, removed } = sanitizeSvgText(dirty);
  assert.equal(removed, true);
  assert.ok(!svg.includes('<script'));
  assert.ok(!svg.includes('onclick'));
  assert.ok(svg.includes('<rect'));
});

test('sanitizeSvgText: strips foreignObject and javascript hrefs', () => {
  const dirty = '<svg><foreignObject><div>hi</div></foreignObject><a href="javascript:alert(1)">x</a></svg>';
  const { svg } = sanitizeSvgText(dirty);
  assert.ok(!svg.includes('foreignObject'));
  assert.ok(!svg.includes('javascript:'));
});

test('sanitizeSvgText: keeps clean svg untouched', () => {
  const clean = '<svg width="10" height="10"><rect width="10" height="10" fill="red"/></svg>';
  const { svg, removed } = sanitizeSvgText(clean);
  assert.equal(removed, false);
  assert.equal(svg, clean);
});

test('sanitizeSvgText: rejects non-svg input', () => {
  const { svg } = sanitizeSvgText('<html></html>');
  assert.equal(svg, '');
});
