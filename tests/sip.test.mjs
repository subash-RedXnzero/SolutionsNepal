/**
 * Tests for the SIP calculator engine.
 * Run: node --test tests/sip.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  formatNPR,
  formatNumberIN,
  validateField,
  calcMonthlySip,
  calcAnnualSip,
  calcStepUpSip,
  monthlySipSeries,
  calcFD,
  compareSipVsFd,
} from '../src/lib/calculators/sip.js';

const closeTo = (actual, expected, tol = 1) =>
  assert.ok(Math.abs(actual - expected) <= tol, `expected ~${expected}, got ${actual}`);

// ── Formatting ──────────────────────────────────────────────

test('formatNPR uses Nepali/Indian digit grouping', () => {
  assert.equal(formatNPR(1152000), 'Rs. 11,52,000');
  assert.equal(formatNPR(600000), 'Rs. 6,00,000');
  assert.equal(formatNPR(0), 'Rs. 0');
  assert.equal(formatNPR(-5000), '-Rs. 5,000');
});

test('formatNPR guards against NaN/Infinity', () => {
  assert.equal(formatNPR(NaN), 'Rs. 0');
  assert.equal(formatNPR(Infinity), 'Rs. 0');
});

test('formatNumberIN groups Indian-style', () => {
  assert.equal(formatNumberIN(1152000), '11,52,000');
});

// ── Validation ──────────────────────────────────────────────

test('validateField rejects empty, negative and non-numeric input', () => {
  assert.equal(validateField('', { label: 'monthly investment', min: 0 }).ok, false);
  assert.equal(validateField('abc', { label: 'x', min: 0 }).ok, false);
  const neg = validateField(-500, { label: 'monthly investment', min: 0 });
  assert.equal(neg.ok, false);
  assert.match(neg.error, /greater than/);
});

test('validateField rejects NaN and absurd values', () => {
  assert.equal(validateField('1e999', { label: 'amount', min: 0, max: 1e10 }).ok, false);
  assert.equal(validateField('70', { label: 'return', min: 0, max: 100, isPercent: true }).ok, true);
});

// ── Monthly SIP ─────────────────────────────────────────────

test('monthly SIP: Rs.5,000/mo, 12%, 10y → Rs. 11,50,193 (ordinary annuity)', () => {
  // FV = 5000 × ((1.01^120 − 1)/0.01) = 1,150,193.45
  const r = calcMonthlySip(5000, 12, 10);
  assert.equal(r.invested, 600000);
  closeTo(r.finalValue, 1150193.45, 1);
  closeTo(r.returns, 550193.45, 1);
});

test('monthly SIP with zero return returns exactly P×n', () => {
  const r = calcMonthlySip(3000, 0, 5);
  assert.equal(r.invested, 180000);
  assert.equal(r.finalValue, 180000);
  assert.equal(r.returns, 0);
});

test('monthly SIP handles decimal return rates', () => {
  const r = calcMonthlySip(10000, 9.5, 2);
  // brute-force reference implementation
  let bal = 0;
  for (let i = 0; i < 24; i++) bal = bal * (1 + 0.095 / 12) + 10000;
  closeTo(r.finalValue, bal, 0.01);
});

test('monthly SIP series matches closed form at final year', () => {
  const rows = monthlySipSeries(5000, 12, 10);
  assert.equal(rows.length, 10);
  const fv = calcMonthlySip(5000, 12, 10).finalValue;
  closeTo(rows[rows.length - 1].value, fv, 0.01);
  assert.equal(rows[4].totalInvested, 300000); // year 5
});

// ── Annual SIP ──────────────────────────────────────────────

test('annual SIP is NOT monthly × 12', () => {
  const annual = calcAnnualSip(60000, 10, 5);
  // A × ((1.1^5 − 1)/0.1) = 60000 × 6.1051 = 366,306.0
  assert.equal(annual.invested, 300000);
  closeTo(annual.finalValue, 366306.0, 1);

  // Monthly SIP investing the same total would differ:
  const monthlyEquiv = calcMonthlySip(5000, 10, 5);
  assert.notEqual(Math.round(monthlyEquiv.finalValue), Math.round(annual.finalValue));
});

test('annual SIP zero return sums contributions', () => {
  const r = calcAnnualSip(100000, 0, 7);
  assert.equal(r.finalValue, 700000);
});

// ── Step-up SIP ─────────────────────────────────────────────

test('step-up SIP total invested follows the step schedule', () => {
  // 5000 start, 10% step-up, 15 years → Σ 12×5000×1.1^(y−1)
  let invested = 0;
  for (let y = 1; y <= 15; y++) invested += 12 * 5000 * Math.pow(1.1, y - 1);
  const r = calcStepUpSip(5000, 10, 12, 15);
  closeTo(r.invested, invested, 0.01);
  assert.ok(r.finalValue > r.invested);
  assert.equal(r.series.length, 15);
  // Year 2 installment is Rs. 5,500
  closeTo(r.series[1].monthlyInstallment, 5500, 0.001);
});

test('step-up SIP matches an independent month-by-month simulation', () => {
  const Y = 3, start = 4000, step = 15, ratePct = 11;
  const r = ratePct / 100 / 12;
  let balance = 0, invested = 0;
  for (let y = 1; y <= Y; y++) {
    const m = start * Math.pow(1 + step / 100, y - 1);
    invested += m * 12;
    for (let k = 0; k < 12; k++) balance = balance * (1 + r) + m;
  }
  const result = calcStepUpSip(start, step, ratePct, Y);
  closeTo(result.finalValue, balance, 0.0001);
  closeTo(result.invested, invested, 0.0001);
});

// ── FD & comparison ─────────────────────────────────────────

test('FD quarterly compounding: 1,00,000 @10%, 1y → 1,10,381', () => {
  const fd = calcFD(100000, 10, 1, 'quarterly');
  // 100000 × 1.025^4 = 110,381.29
  closeTo(fd.finalValue, 110381.29, 1);
});

test('FD annually compounding is exact', () => {
  const fd = calcFD(200000, 8, 2, 'annually');
  closeTo(fd.finalValue, 200000 * 1.08 ** 2, 0.01);
});

test('compareSipVsFd uses same total money on both sides', () => {
  const c = compareSipVsFd(600000, 10, 12, 8, 'quarterly');
  assert.equal(c.sip.invested, 600000);
  assert.equal(c.fd.invested, 600000);
  closeTo(c.sip.monthlyInstallment, 5000, 0.0001);
  assert.ok(['sip', 'fd', 'tie'].includes(c.winner));
});
