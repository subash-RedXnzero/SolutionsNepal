/**
 * Tests for the shareable-result-links helper (pure functions only;
 * DOM/clipboard parts are exercised in the browser).
 * Run: node --test tests/
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { encodeParams, decodeParams } from '../src/lib/share-params.js';

test('encodeParams builds a query string and skips empties', () => {
  assert.equal(encodeParams({ p: 500000, rate: 8, note: '' }), 'p=500000&rate=8');
  assert.equal(encodeParams({}), '');
  assert.equal(encodeParams(null), '');
});

test('decodeParams handles leading ? and empty input', () => {
  assert.deepEqual(decodeParams('?p=500000&rate=8'), { p: '500000', rate: '8' });
  assert.deepEqual(decodeParams('p=500000'), { p: '500000' });
  assert.deepEqual(decodeParams(''), {});
});

test('round-trip preserves all keys as strings', () => {
  const original = { p: '500000', rate: '8', tenure: '1.5', unit: 'years', freq: 'quarterly', tds: '5', tdsOn: '1' };
  assert.deepEqual(decodeParams('?' + encodeParams(original)), original);
});

test('values are URL-encoded so Nepali text and symbols survive', () => {
  const encoded = encodeParams({ q: 'Rs. 5,00,000 & tax' });
  assert.deepEqual(decodeParams(encoded), { q: 'Rs. 5,00,000 & tax' });
});
