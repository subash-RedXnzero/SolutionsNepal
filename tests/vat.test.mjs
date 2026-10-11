/**
 * Tests for the VAT calculator engine.
 * Run: node --test tests/vat.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_VAT_RATE,
  formatNPR,
  formatNumberIN,
  validateAmount,
  validateRate,
  addVat,
  removeVat,
} from '../src/lib/calculators/vat.js';

const closeTo = (actual, expected, tol = 1e-6) =>
  assert.ok(Math.abs(actual - expected) <= tol, `expected ~${expected}, got ${actual}`);

// ── Configuration ───────────────────────────────────────────

test('default VAT rate is Nepal standard 13%', () => {
  assert.equal(DEFAULT_VAT_RATE, 13);
});

// ── Add VAT ─────────────────────────────────────────────────

test('add VAT: Rs.10,000 at 13% → VAT Rs.1,300, total Rs.11,300', () => {
  const r = addVat(10000, DEFAULT_VAT_RATE);
  assert.equal(r.vat, 1300);
  assert.equal(r.total, 11300);
});

test('add VAT: Rs.1,000 at 13% → total Rs.1,130', () => {
  const r = addVat(1000, 13);
  closeTo(r.vat, 130);
  assert.equal(r.total, 1130);
});

// ── Remove VAT (reverse) ────────────────────────────────────

test('remove VAT: Rs.11,300 at 13% → before-VAT Rs.10,000, VAT Rs.1,300', () => {
  const r = removeVat(11300, DEFAULT_VAT_RATE);
  closeTo(r.amount, 10000, 1e-9);
  closeTo(r.vat, 1300, 1e-9);
});

test('remove VAT does NOT simply subtract the percentage', () => {
  // Wrong method: 11300 × 13% = 1469 subtracted → 9831 ≠ correct 10000
  const r = removeVat(11300, 13);
  assert.notEqual(Math.round(r.vat), Math.round(11300 * 0.13));
  assert.equal(r.amount + r.vat, 11300); // parts must sum back exactly
});

test('remove VAT: Rs.1,000 inclusive at 13%', () => {
  const r = removeVat(1000, 13);
  closeTo(r.amount, 884.956, 1e-3);
  closeTo(r.amount + r.vat, 1000, 1e-9);
});

// ── Other rates ─────────────────────────────────────────────

test('other rates: 5%, 10%, 15% on Rs.10,000', () => {
  assert.equal(addVat(10000, 5).total, 10500);
  assert.equal(addVat(10000, 10).total, 11000);
  assert.equal(addVat(10000, 15).total, 11500);

  closeTo(removeVat(10500, 5).amount, 10000);
  closeTo(removeVat(11000, 10).amount, 10000);
  closeTo(removeVat(11500, 15).amount, 10000);
});

test('decimal rates: 13.5% and 2.25% are precise', () => {
  const a = addVat(10000, 13.5);
  closeTo(a.vat, 1350, 1e-9);
  closeTo(a.total, 11350, 1e-9);

  const b = addVat(20000, 2.25);
  closeTo(b.vat, 450, 1e-9);

  // reverse with decimal rate round-trips
  const r = removeVat(a.total, 13.5);
  closeTo(r.amount, 10000, 1e-9);
});

// ── Edge cases ──────────────────────────────────────────────

test('zero amount produces zero everywhere', () => {
  const a = addVat(0, 13);
  assert.equal(a.vat, 0);
  assert.equal(a.total, 0);
  const r = removeVat(0, 13);
  assert.equal(r.amount, 0);
  assert.equal(r.vat, 0);
});

test('very large values stay accurate', () => {
  const big = 999999999;
  const a = addVat(big, 13);
  closeTo(a.vat, big * 0.13, 1e-3);
  closeTo(a.total, big * 1.13, 1e-3);
  const r = removeVat(a.total, 13);
  closeTo(r.amount, big, 1e-4);
});

test('decimal amounts keep paise precision', () => {
  const a = addVat(10500.5, 13);
  closeTo(a.vat, 1365.065, 1e-9);
  closeTo(a.total, 11865.565, 1e-9);
});

test('no rounded intermediates: chain add→remove returns original', () => {
  for (const amt of [7, 12345.67, 99999.99]) {
    for (const rate of [5, 10, 13, 15]) {
      const added = addVat(amt, rate);
      const removed = removeVat(added.total, rate);
      closeTo(removed.amount, amt, 1e-6);
      closeTo(removed.vat, added.vat, 1e-6);
    }
  }
});

// ── Validation ──────────────────────────────────────────────

test('validateAmount rejects empty, negative and non-numeric input', () => {
  assert.equal(validateAmount('').ok, false);
  assert.equal(validateAmount('abc').ok, false);
  assert.equal(validateAmount(-500).ok, false);
  assert.match(validateAmount(-500).error, /negative/);
  assert.equal(validateAmount(NaN).ok, false);
  assert.equal(validateAmount(Infinity).ok, false);
});

test('validateAmount allows zero', () => {
  assert.equal(validateAmount(0).ok, true);
  assert.equal(validateAmount('0').value, 0);
});

test('validateRate rejects invalid rates but accepts decimals', () => {
  assert.equal(validateRate('').ok, false);
  assert.equal(validateRate(-1).ok, false);
  assert.equal(validateRate(101).ok, false);
  assert.equal(validateRate('13.5').ok, true);
  assert.equal(validateRate('13.5').value, 13.5);
});

// ── Formatting ──────────────────────────────────────────────

test('formatNPR uses Nepali grouping without forced decimals', () => {
  assert.equal(formatNPR(11300), 'Rs. 11,300');
  assert.equal(formatNPR(100000), 'Rs. 1,00,000');
  assert.equal(formatNPR(1000000), 'Rs. 10,00,000');
  assert.equal(formatNPR(11300.5), 'Rs. 11,300.50');
  assert.equal(formatNPR(0), 'Rs. 0');
  assert.equal(formatNPR(NaN), 'Rs. 0');
});

test('formatNumberIN groups Indian-style', () => {
  assert.equal(formatNumberIN(100000), '1,00,000');
});
