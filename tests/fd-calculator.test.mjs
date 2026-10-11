/**
 * Tests for the FD (fixed deposit) calculator engine.
 * Reference values hand-verified with A = P × (1 + r/n)^(n×t).
 * Run: node --test tests/
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { calcFd, applyTds, fdSeries } from '../src/lib/calculators/fd.js';

const approx = (a, b, msg) =>
  assert.ok(Math.abs(a - b) < 0.01, `${msg || 'mismatch'}: ${a} != ${b}`);

test('quarterly: Rs. 100,000 @ 8% for 1 yr → maturity 108,243.22', () => {
  const r = calcFd(100000, 8, 1, 'quarterly');
  approx(r.maturity, 108243.22, 'maturity');
  approx(r.interest, 8243.22, 'interest');
});

test('annually: Rs. 100,000 @ 8% for 1 yr → maturity 108,000', () => {
  const r = calcFd(100000, 8, 1, 'annually');
  approx(r.maturity, 108000, 'maturity');
  approx(r.interest, 8000, 'interest');
});

test('quarterly beats annual compounding for the same nominal rate', () => {
  const q = calcFd(500000, 9, 3, 'quarterly');
  const a = calcFd(500000, 9, 3, 'annually');
  assert.ok(q.maturity > a.maturity, 'quarterly should exceed annual');
});

test('zero rate returns principal with no interest', () => {
  const r = calcFd(250000, 0, 5, 'quarterly');
  approx(r.maturity, 250000, 'maturity');
  approx(r.interest, 0, 'interest');
  assert.equal(r.effectiveYieldPct, 0);
});

test('effective yield: 8% nominal quarterly → ≈8.24% effective', () => {
  const r = calcFd(100000, 8, 1, 'quarterly');
  approx(r.effectiveYieldPct, 8.2432, 'effective yield');
});

test('TDS: 5% on Rs. 8,243.22 interest → tax 412.16, net 7,831.06', () => {
  const { tax, netInterest } = applyTds(8243.22, 5);
  approx(tax, 412.16, 'tax');
  approx(netInterest, 7831.06, 'net interest');
});

test('series: 3-year FD produces 3 rows, last value equals maturity', () => {
  const rows = fdSeries(100000, 8, 3, 'quarterly');
  assert.equal(rows.length, 3);
  const { maturity } = calcFd(100000, 8, 3, 'quarterly');
  approx(rows[2].value, maturity, 'final row = maturity');
  assert.ok(rows[0].value < rows[1].value && rows[1].value < rows[2].value, 'monotonic growth');
});

test('series: fractional tenure 1.5 yrs appends a final half-year row', () => {
  const rows = fdSeries(100000, 8, 1.5, 'quarterly');
  assert.equal(rows.length, 2);
  assert.equal(rows[1].year, 1.5);
});
