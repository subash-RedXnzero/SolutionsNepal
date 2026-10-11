/**
 * Tests for the Dashain bonus calculator engine.
 * Implements Labour Act, 2074 s.37 (festival expense):
 *   one month's basic remuneration, proportional under a year —
 *   festival expense = basic × months / 12.
 * Reference values hand-verified against s.37(1) + s.37(3).
 * Run: node --test tests/dashain-bonus.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateDashainBonus,
  formatNPR,
  summarizeDashainBonus,
} from '../src/lib/calculators/dashain-bonus.js';

const approx = (a, b, msg) =>
  assert.ok(Math.abs(a - b) < 0.01, `${msg || 'mismatch'}: ${a} != ${b}`);

test('s.37 full year: Rs. 30,000 × 12 months → Rs. 30,000', () => {
  const r = calculateDashainBonus({ monthlyBasicSalary: 30000, monthsWorked: 12 });
  assert.equal(r.valid, true);
  approx(r.proportion, 1, 'proportion');
  approx(r.festivalExpense, 30000, 'festival expense');
});

test('s.37(3) proportion: Rs. 30,000 × 6 months → Rs. 15,000', () => {
  const r = calculateDashainBonus({ monthlyBasicSalary: 30000, monthsWorked: 6 });
  assert.equal(r.valid, true);
  approx(r.proportion, 0.5, 'proportion');
  approx(r.festivalExpense, 15000, 'festival expense');
});

test('s.37(3) single month: Rs. 30,000 × 1 → Rs. 2,500', () => {
  const r = calculateDashainBonus({ monthlyBasicSalary: 30000, monthsWorked: 1 });
  assert.equal(r.valid, true);
  approx(r.festivalExpense, 2500, 'festival expense');
});

test('formula cites the Act', () => {
  const r = calculateDashainBonus({ monthlyBasicSalary: 30000, monthsWorked: 6 });
  assert.ok(r.formula.includes('30,000') === false, 'formula uses raw numbers');
  assert.ok(r.formula.includes('s.37'), 'formula cites s.37');
});

test('missing salary is rejected', () => {
  const r = calculateDashainBonus({ monthlyBasicSalary: '', monthsWorked: 12 });
  assert.equal(r.valid, false);
  assert.ok(r.error, 'has error message');
});

test('zero and negative salary are rejected', () => {
  for (const s of [0, -30000, '-500']) {
    const r = calculateDashainBonus({ monthlyBasicSalary: s, monthsWorked: 12 });
    assert.equal(r.valid, false, `salary ${s} rejected`);
  }
});

test('non-numeric salary is rejected', () => {
  const r = calculateDashainBonus({ monthlyBasicSalary: 'abc', monthsWorked: 12 });
  assert.equal(r.valid, false);
});

test('months outside 1–12 are rejected', () => {
  for (const m of [0, 13, -1]) {
    const r = calculateDashainBonus({ monthlyBasicSalary: 30000, monthsWorked: m });
    assert.equal(r.valid, false, `months ${m} rejected`);
  }
});

test('fractional months are rejected (must be whole months)', () => {
  const r = calculateDashainBonus({ monthlyBasicSalary: 30000, monthsWorked: 6.5 });
  assert.equal(r.valid, false);
});

test('unreasonably large salary is rejected', () => {
  const r = calculateDashainBonus({ monthlyBasicSalary: 9999999999, monthsWorked: 12 });
  assert.equal(r.valid, false);
});

test('formatNPR uses Nepali grouping', () => {
  assert.equal(formatNPR(30000), 'Rs. 30,000');
  assert.equal(formatNPR(1500.4), 'Rs. 1,500');
});

test('summary copies a readable breakdown, not just the amount', () => {
  const r = calculateDashainBonus({ monthlyBasicSalary: 30000, monthsWorked: 6 });
  const text = summarizeDashainBonus(r);
  assert.ok(text.includes('Rs. 30,000'), 'includes basic remuneration');
  assert.ok(text.includes('6'), 'includes service months');
  assert.ok(text.includes('Rs. 15,000'), 'includes festival expense');
  assert.ok(text.includes('s.37'), 'cites the Act');
});
