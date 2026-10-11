/**
 * Tests for the SSF Calculator (rates centralized in src/data/nepal/ssf/current.js).
 * Run: node --test tests/ssf-calculator.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  SSF_CURRENT,
  calculateSSFContributions,
} from '../src/data/nepal/ssf/current.js';

test('central config holds the official 11/20/31 structure on basic salary', () => {
  assert.equal(SSF_CURRENT.employee.rate, 0.11);
  assert.equal(SSF_CURRENT.employer.rate, 0.20);
  assert.equal(SSF_CURRENT.combinedRate, 0.31);
  assert.deepEqual(
    SSF_CURRENT.employee.breakdown.map((b) => b.rate),
    [0.10, 0.01]
  );
  assert.deepEqual(
    SSF_CURRENT.employer.breakdown.map((b) => [b.key, b.rate]),
    [['pensionFund', 0.10], ['gratuity', 0.0833], ['additional', 0.0167]]
  );
});

test('Rs 15,000 basic salary', () => {
  const r = calculateSSFContributions(15000);
  assert.equal(r.employee.total, 1650);
  assert.equal(r.employer.total, 3000);
  assert.equal(r.combined, 4650);
});

test('Rs 30,000 basic salary', () => {
  const r = calculateSSFContributions(30000);
  assert.equal(r.employee.total, 3300);
  assert.deepEqual(r.employee.breakdown.map((b) => b.amount), [3000, 300]);
  assert.equal(r.employer.total, 6000);
  assert.deepEqual(r.employer.breakdown.map((b) => b.amount), [3000, 2499, 501]);
  assert.equal(r.combined, 9300);
});

test('Rs 50,000 basic salary', () => {
  const r = calculateSSFContributions(50000);
  assert.equal(r.employee.total, 5500);
  assert.equal(r.employer.total, 10000);
  assert.equal(r.combined, 15500);
});

test('Rs 100,000 basic salary', () => {
  const r = calculateSSFContributions(100000);
  assert.equal(r.employee.total, 11000);
  assert.equal(r.employer.total, 20000);
  assert.equal(r.combined, 31000);
});

test('decimal input stays deterministic and internally consistent', () => {
  const a = calculateSSFContributions(25500.5);
  const b = calculateSSFContributions(25500.5);
  assert.deepEqual(a, b);
  const empSum = a.employee.breakdown.reduce((s, x) => s + x.amount, 0);
  const emrSum = a.employer.breakdown.reduce((s, x) => s + x.amount, 0);
  assert.ok(Math.abs(empSum - a.employee.total) < 0.02);
  assert.ok(Math.abs(emrSum - a.employer.total) < 0.02);
  assert.ok(Math.abs(a.employee.total + a.employer.total - a.combined) < 0.02);
});

test('zero base yields zero contributions (page treats empty as invalid input)', () => {
  const r = calculateSSFContributions(0);
  assert.equal(r.employee.total, 0);
  assert.equal(r.employer.total, 0);
  assert.equal(r.combined, 0);
});

test('no official ceiling: large salaries scale linearly at 31%', () => {
  const r = calculateSSFContributions(1000000);
  assert.equal(r.employee.total, 110000);
  assert.equal(r.employer.total, 200000);
  assert.equal(r.combined, 310000);
});

test('annual overview is monthly times twelve', () => {
  const r = calculateSSFContributions(30000);
  assert.equal(r.employee.total * 12, 39600);
  assert.equal(r.employer.total * 12, 72000);
  assert.equal(r.combined * 12, 111600);
});
