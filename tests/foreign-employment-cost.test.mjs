/**
 * Tests for the Foreign Employment Cost engine.
 * Run: npm test  (node --test tests/)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateForeignEmploymentCost,
  convertSalaryToNPR,
  computeBudgetPlan,
  formatNPR,
  parseAmount,
} from '../src/lib/calculators/foreign-employment-cost.js';

const full = (overrides = {}) => ({
  destination: 'saudi-arabia',
  jobCategory: 'construction',
  visa: 20000,
  medical: 8000,
  insurance: 7000,
  orientation: 1500,
  recruitment: 50000,
  airTicket: 25000,
  documentation: 5000,
  other: 10000,
  payers: {},
  monthlySalary: 45000,
  monthlyExpenses: 18000,
  ...overrides,
});
const SUM = 20000 + 8000 + 7000 + 1500 + 50000 + 25000 + 5000 + 10000; // 126,500

// ── Cost calculation ────────────────────────────────────────────
test('sums all eight expenses into the total', () => {
  const r = calculateForeignEmploymentCost(full());
  assert.equal(r.valid, true);
  assert.equal(r.totalCost, SUM);
  assert.equal(r.breakdown.length, 8);
});

test('salary is never part of the migration cost', () => {
  const a = calculateForeignEmploymentCost(full({ monthlySalary: 45000 }));
  const b = calculateForeignEmploymentCost(full({ monthlySalary: 200000 }));
  assert.equal(a.totalCost, b.totalCost);
});

// ── Employer-covered / out-of-pocket ────────────────────────────
test('employer-covered costs are excluded from out-of-pocket only', () => {
  const r = calculateForeignEmploymentCost(full({ payers: { airTicket: 'employer' } }));
  assert.equal(r.totalCost, SUM);
  assert.equal(r.employerCovered, 25000);
  assert.equal(r.outOfPocketCost, SUM - 25000);
});

test('unknown payer is counted conservatively + warned', () => {
  const r = calculateForeignEmploymentCost(full({ payers: { visa: 'unknown' } }));
  assert.equal(r.outOfPocketCost, SUM);
  assert.equal(r.unknownCount, 1);
  assert.ok(r.warnings.some((w) => w.includes('Unknown')));
});

test('empty fields are not included, with a coverage warning', () => {
  const r = calculateForeignEmploymentCost(full({ visa: '', medical: '' }));
  assert.equal(r.totalCost, SUM - 28000);
  assert.equal(r.emptyCount, 2);
  assert.ok(r.warnings.some((w) => w.includes('2 of 8')));
});

// ── Savings / recovery ──────────────────────────────────────────
test('monthly savings and recovery: 125000 / 27000 ≈ 4.6 months', () => {
  const r = calculateForeignEmploymentCost(
    full({ visa: 125000, medical: '', insurance: '', orientation: '', recruitment: '', airTicket: '', documentation: '', other: '' }),
  );
  assert.equal(r.monthlySavings, 27000);
  assert.equal(r.recoveryMonths, 4.6);
});

test('zero salary -> savings negative -> incalculable message', () => {
  const r = calculateForeignEmploymentCost(full({ monthlySalary: 0 }));
  assert.equal(r.monthlySavings, -18000);
  assert.equal(r.recoveryMonths, null);
  assert.ok(r.recoveryNote.includes('equal to or higher than your salary'));
});

test('expenses greater than salary -> incalculable message', () => {
  const r = calculateForeignEmploymentCost(full({ monthlySalary: 45000, monthlyExpenses: 50000 }));
  assert.equal(r.monthlySavings, -5000);
  assert.equal(r.recoveryMonths, null);
  assert.ok(r.recoveryNote);
});

test('missing salary skips recovery without error', () => {
  const r = calculateForeignEmploymentCost(full({ monthlySalary: '', monthlyExpenses: '' }));
  assert.equal(r.valid, true);
  assert.equal(r.monthlySavings, null);
  assert.equal(r.recoveryMonths, null);
});

// ── Validation ──────────────────────────────────────────────────
test('missing destination / job category rejected', () => {
  const noDest = calculateForeignEmploymentCost(full({ destination: '' }));
  assert.equal(noDest.valid, false);
  assert.ok(noDest.errors.destination);
  const noJob = calculateForeignEmploymentCost(full({ jobCategory: '' }));
  assert.equal(noJob.valid, false);
  assert.ok(noJob.errors.jobCategory);
});

test('negative and non-numeric expenses rejected per field', () => {
  const r = calculateForeignEmploymentCost(full({ medical: -100 }));
  assert.equal(r.valid, false);
  assert.ok(r.errors.expenses.medical);
  const r2 = calculateForeignEmploymentCost(full({ visa: 'abc' }));
  assert.equal(r2.valid, false);
  assert.ok(r2.errors.expenses.visa);
});

test('empty values are valid (fields simply not included)', () => {
  const r = calculateForeignEmploymentCost({
    destination: 'qatar', jobCategory: 'driver',
    visa: '', medical: '', insurance: '', orientation: '', recruitment: '', airTicket: '', documentation: '', other: '',
  });
  assert.equal(r.valid, true);
  assert.equal(r.totalCost, 0);
  assert.equal(r.emptyCount, 8);
});

test('extremely large values rejected', () => {
  const r = calculateForeignEmploymentCost(full({ recruitment: 1e12 }));
  assert.equal(r.valid, false);
  assert.ok(r.errors.expenses.recruitment);
});

// ── Currency conversion ─────────────────────────────────────────
test('foreign salary converts at the given rate', () => {
  assert.equal(convertSalaryToNPR(1500, 72.5), 108750);
  assert.equal(convertSalaryToNPR('1500', '72.5'), 108750);
});

test('invalid currency input throws (bad rate / bad amount)', () => {
  assert.throws(() => convertSalaryToNPR(1500, 0), /exchange rate/);
  assert.throws(() => convertSalaryToNPR(1500, NaN), /exchange rate/);
  assert.throws(() => convertSalaryToNPR(-5, 70), /salary amount/);
  assert.throws(() => convertSalaryToNPR('abc', 70), /salary amount/);
});

// ── Budget plan ─────────────────────────────────────────────────
test('budget plan: remaining and over-budget states', () => {
  assert.deepEqual(computeBudgetPlan(125000, 150000), { budget: 150000, cost: 125000, remaining: 25000, over: false });
  const over = computeBudgetPlan(125000, 100000);
  assert.equal(over.remaining, -25000);
  assert.equal(over.over, true);
  assert.throws(() => computeBudgetPlan(125000, 0), /budget/);
});

// ── Number formatting (Nepal/Indian grouping) ───────────────────
test('formatNPR groups Indian-style', () => {
  assert.equal(formatNPR(125000), 'Rs. 1,25,000');
  assert.equal(formatNPR(500000), 'Rs. 5,00,000');
  assert.equal(formatNPR(1250000), 'Rs. 12,50,000');
  assert.equal(formatNPR(4500), 'Rs. 4,500');
  assert.equal(formatNPR(0), 'Rs. 0');
});

test('parseAmount: empty->null, commas ok, negatives rejected', () => {
  assert.deepEqual(parseAmount(''), { value: null });
  assert.deepEqual(parseAmount('1,25,000'), { value: 125000 });
  assert.ok(parseAmount('-50').error);
  assert.ok(parseAmount('xyz').error);
});
