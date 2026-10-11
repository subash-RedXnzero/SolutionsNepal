/**
 * Tests for photo requirement presets.
 * Run: node --test tests/photo-requirements.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  PHOTO_REQUIREMENTS,
  getRequirement,
  toPixels,
  convertUnit,
  DEFAULT_DPI,
} from '../src/data/photo-requirements.js';

test('preset ids are unique', () => {
  const ids = PHOTO_REQUIREMENTS.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('every preset has label, short note and positive dimensions', () => {
  for (const r of PHOTO_REQUIREMENTS) {
    assert.ok(r.id && r.label && r.short, `${r.id}: missing basic fields`);
    assert.ok(r.width > 0 && r.height > 0, `${r.id}: dimensions must be positive`);
    assert.ok(r.note.length > 10, `${r.id}: note should guide users`);
  }
});

test('units and formats are from the supported set', () => {
  for (const r of PHOTO_REQUIREMENTS) {
    assert.ok(['mm', 'px', 'inch'].includes(r.unit), `${r.id}: bad unit ${r.unit}`);
    assert.ok(['JPG', 'PNG'].includes(r.format), `${r.id}: bad format ${r.format}`);
  }
});

test('verified presets must cite a source', () => {
  for (const r of PHOTO_REQUIREMENTS) {
    if (r.verified) {
      assert.ok(r.source, `${r.id}: verified=true requires a source`);
      assert.ok(r.sourceDate, `${r.id}: verified=true requires sourceDate`);
    }
  }
});

test('dv-lottery preset carries the official size limit', () => {
  const dv = getRequirement('dv-lottery');
  assert.equal(dv.width, 600);
  assert.equal(dv.height, 600);
  assert.equal(dv.maxSizeKB, 240);
  assert.equal(dv.verified, true);
});

test('getRequirement falls back to custom for unknown ids', () => {
  const r = getRequirement('does-not-exist');
  assert.equal(r.id, 'custom');
});

test('toPixels: px presets pass through exactly', () => {
  const { width, height, exact } = toPixels({ width: 600, height: 600, unit: 'px' });
  assert.deepEqual({ width, height }, { width: 600, height: 600 });
  assert.equal(exact, true);
});

test('toPixels: 35 × 45 mm at 300 DPI ≈ 413 × 531 px', () => {
  const { width, height } = toPixels({ width: 35, height: 45, unit: 'mm' });
  assert.equal(width, Math.round((35 / 25.4) * DEFAULT_DPI));
  assert.equal(height, Math.round((45 / 25.4) * DEFAULT_DPI));
});

test('toPixels: 2 × 2 inch at 300 DPI = 600 × 600 px', () => {
  const { width, height } = toPixels({ width: 2, height: 2, unit: 'inch' });
  assert.equal(width, 600);
  assert.equal(height, 600);
});

test('convertUnit round-trips between units', () => {
  const px = convertUnit(35, 'mm', 'px');
  assert.equal(px, Math.round((35 / 25.4) * DEFAULT_DPI));
  const mm = convertUnit(px, 'px', 'mm');
  assert.ok(Math.abs(mm - 35) < 0.2, `expected ~35 mm, got ${mm}`);
});
