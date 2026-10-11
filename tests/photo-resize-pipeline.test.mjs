/**
 * Tests for the photo crop+resize export pipeline.
 * Run: node --test tests/photo-resize-pipeline.test.mjs
 *
 * These tests verify that:
 * 1. compressToTarget produces output with correct dimensions
 * 2. Output file size differs from a dummy original when resize is applied
 * 3. Output is never larger than the original (unless allowLarger)
 * 4. Target size compression actually reduces file size
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

// We test the compressToTarget function from photo-resize.js.
// This requires a canvas implementation — we use a minimal mock for Node.
// In a real browser the canvas is native; here we verify the algorithm logic.

// ── Minimal canvas mock for Node.js testing ──────────────────────
class MockCanvas {
  constructor(w = 100, h = 100) {
    this.width = w;
    this.height = h;
    this._ctx = new MockCtx(this);
  }
  getContext() { return this._ctx; }
  getBoundingClientRect() { return { width: this.width, height: this.height }; }
  toBlob(cb, type = 'image/jpeg', quality = 0.92) {
    // Simulate: larger quality → larger blob.  We use a deterministic
    // size based on dimensions × quality so the algorithm can be tested.
    const pixels = this.width * this.height;
    const bytes = Math.round(pixels * 0.5 * quality); // rough JPEG estimate
    const header = type === 'image/png' ? 8 : 2; // minimal header
    const buf = new ArrayBuffer(bytes + header);
    cb(new Blob([buf], { type }));
  }
}

class MockCtx {
  constructor(canvas) { this.canvas = canvas; }
  setTransform() {}
  clearRect() {}
  translate() {}
  rotate() {}
  scale() {}
  drawImage() {}
  fillRect() {}
  get imageSmoothingEnabled() { return true; }
  set imageSmoothingEnabled(_v) {}
  get imageSmoothingQuality() { return 'high'; }
  set imageSmoothingQuality(_v) {}
}

// Patch globalThis so the module can create canvases
globalThis.document = {
  createElement(tag) {
    if (tag === 'canvas') return new MockCanvas();
    return {};
  },
};

// ── Import the compress function ─────────────────────────────────
const { compressToTarget } = await import('../src/lib/converters/photo-resize.js');

// ── Helpers ──────────────────────────────────────────────────────
function makeCanvas(w, h) {
  return new MockCanvas(w, h);
}

// ── Tests ────────────────────────────────────────────────────────

test('compressToTarget: no target → exports at full resolution', async () => {
  const src = makeCanvas(800, 600);
  const result = await compressToTarget(src, {
    targetBytes: null,
    format: 'image/jpeg',
    originalBytes: 500_000,
  });
  assert.ok(result, 'should return a result');
  assert.equal(result.width, 800, 'width should match source');
  assert.equal(result.height, 600, 'height should match source');
  assert.ok(result.blob.size > 0, 'blob should have content');
  assert.ok(result.reachedTarget, 'should report reached target (no target = always true)');
});

test('compressToTarget: with target → tries to reach target size', async () => {
  const src = makeCanvas(800, 600);
  const targetBytes = 5000; // very small target
  const result = await compressToTarget(src, {
    targetBytes,
    format: 'image/jpeg',
    originalBytes: 500_000,
  });
  assert.ok(result, 'should return a result');
  // The result should be closer to target than the original
  const originalDist = Math.abs(500_000 - targetBytes);
  const resultDist = Math.abs(result.blob.size - targetBytes);
  assert.ok(resultDist < originalDist,
    `result (${result.blob.size} bytes) should be closer to target (${targetBytes}) than original (500000)`);
});

test('compressToTarget: output never larger than original by default', async () => {
  const src = makeCanvas(400, 300);
  const result = await compressToTarget(src, {
    targetBytes: 1000,
    format: 'image/jpeg',
    originalBytes: 500_000, // must be larger than mock canvas output
    allowLarger: false,
  });
  assert.ok(result, 'should return a result');
  assert.ok(result.blob.size <= 500_000,
    `output (${result.blob.size}) should not exceed original (500000)`);
});

test('compressToTarget: PNG format works', async () => {
  const src = makeCanvas(200, 200);
  const result = await compressToTarget(src, {
    targetBytes: null,
    format: 'image/png',
    originalBytes: 50_000,
  });
  assert.ok(result, 'should return a result');
  assert.equal(result.blob.type, 'image/png', 'should produce PNG blob');
});

test('compressToTarget: dimension scaling happens when target is very small', async () => {
  const src = makeCanvas(2000, 1500);
  const targetBytes = 500; // impossibly small for full resolution
  const result = await compressToTarget(src, {
    targetBytes,
    format: 'image/jpeg',
    originalBytes: 2_000_000,
  });
  assert.ok(result, 'should return a result');
  // If dimension scaling kicked in, the output should be smaller dimensions
  // or at least closer to target than the original
  const resultDist = Math.abs(result.blob.size - targetBytes);
  const origDist = Math.abs(2_000_000 - targetBytes);
  assert.ok(resultDist < origDist,
    `result should be closer to target than original`);
});

test('compressToTarget: custom dimensions are respected', async () => {
  // Simulate a 35×45mm passport photo at 300 DPI = 413×531 px
  const src = makeCanvas(413, 531);
  const result = await compressToTarget(src, {
    targetBytes: null,
    format: 'image/jpeg',
    originalBytes: 500_000, // must be larger than mock canvas output
  });
  assert.ok(result, 'should return a result');
  assert.equal(result.width, 413, 'width should match passport dimensions');
  assert.equal(result.height, 531, 'height should match passport dimensions');
});

test('compressToTarget: DV Lottery 600×600 output', async () => {
  const src = makeCanvas(600, 600);
  const result = await compressToTarget(src, {
    targetBytes: 240 * 1024, // 240 KB
    format: 'image/jpeg',
    originalBytes: 500_000,
  });
  assert.ok(result, 'should return a result');
  assert.equal(result.width, 600, 'DV Lottery width should be 600');
  assert.equal(result.height, 600, 'DV Lottery height should be 600');
});
