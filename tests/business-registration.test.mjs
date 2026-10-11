/**
 * Tests for the Business Registration Cost Estimator engine.
 * Run: npm test  (node --test tests/)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  formatNPR,
  formatNumberIN,
  parseCapitalInput,
  validateCapital,
  validateShareholders,
  validateFounders,
  validatePartners,
  privateLimitedFee,
  publicLimitedFee,
  estimatePrivateLimited,
  estimatePublicLimited,
} from '../src/lib/calculators/business-registration.js';

// ============================================================
// PRIVATE LIMITED — EVERY BRACKET
// ============================================================
test('private: minimum capital bracket (up to Rs. 1 lakh → Rs. 1,000)', () => {
  assert.equal(privateLimitedFee(1).fee, 1000);
  assert.equal(privateLimitedFee(50000).fee, 1000);
  assert.equal(privateLimitedFee(100000).fee, 1000);
});

test('private: each fee bracket', () => {
  const cases = [
    [100001, 4500],
    [500000, 4500],
    [500001, 9500],
    [2500000, 9500],
    [2500001, 16000],
    [10000000, 16000],
    [10000001, 19000],
    [20000000, 19000],
    [20000001, 22000],
    [30000000, 22000],
    [30000001, 25000],
    [40000000, 25000],
    [40000001, 28000],
    [50000000, 28000],
    [50000001, 31000],
    [60000000, 31000],
    [60000001, 34000],
    [70000000, 34000],
    [70000001, 37000],
    [80000000, 37000],
    [80000001, 40000],
    [90000000, 40000],
    [90000001, 43000],
    [100000000, 43000],
  ];
  for (const [capital, fee] of cases) {
    assert.equal(privateLimitedFee(capital).fee, fee, `Rs. ${capital} should be Rs. ${fee}`);
  }
});

test('private: boundary values just above/below each edge', () => {
  assert.equal(privateLimitedFee(99999).fee, 1000);
  assert.equal(privateLimitedFee(100000).fee, 1000);
  assert.equal(privateLimitedFee(100001).fee, 4500);
  assert.equal(privateLimitedFee(499999).fee, 4500);
  assert.equal(privateLimitedFee(500000).fee, 4500);
  assert.equal(privateLimitedFee(500001).fee, 9500);
  assert.equal(privateLimitedFee(9999999).fee, 16000);
  assert.equal(privateLimitedFee(10000000).fee, 16000);
  assert.equal(privateLimitedFee(10000001).fee, 19000);
  assert.equal(privateLimitedFee(99999999).fee, 43000);
  assert.equal(privateLimitedFee(100000000).fee, 43000);
});

test('private: above Rs. 10 crore uses Rs. 30 per extra lakh (rounded up)', () => {
  // Exactly 1 lakh over → 1 unit
  assert.equal(privateLimitedFee(100100000).fee, 43000 + 30);
  // 1 rupee over → still rounds up to 1 unit, never silently zero
  assert.equal(privateLimitedFee(100000001).fee, 43000 + 30);
  // 10 lakh over → 10 units
  assert.equal(privateLimitedFee(101000000).fee, 43000 + 300);
  // 1 crore over → 100 units
  assert.equal(privateLimitedFee(110000000).fee, 43000 + 3000);
  const r = privateLimitedFee(101000000);
  assert.equal(r.overTop, true);
  assert.equal(r.extraUnits, 10);
});

test('private: large capital values stay finite and monotonic', () => {
  const a = privateLimitedFee(200000000).fee;
  const b = privateLimitedFee(500000000).fee;
  const c = privateLimitedFee(1000000000).fee;
  assert.ok(Number.isFinite(a) && Number.isFinite(b) && Number.isFinite(c));
  assert.ok(a < b && b < c, 'fee must grow with capital');
  assert.equal(a, 43000 + 1000 * 30); // 1000 extra lakh
});

// ============================================================
// PUBLIC LIMITED — EVERY BRACKET
// ============================================================
test('public: each fee bracket', () => {
  const cases = [
    [100000, 15000],
    [10000000, 15000],
    [10000001, 40000],
    [100000000, 40000],
    [100000001, 70000],
    [200000000, 70000],
    [200000001, 100000],
    [300000000, 100000],
    [300000001, 130000],
    [400000000, 130000],
    [400000001, 160000],
    [500000000, 160000],
  ];
  for (const [capital, fee] of cases) {
    assert.equal(publicLimitedFee(capital).fee, fee, `Rs. ${capital} should be Rs. ${fee}`);
  }
});

test('public: above Rs. 50 crore uses Rs. 3,000 per extra crore (rounded up)', () => {
  assert.equal(publicLimitedFee(500000001).fee, 160000 + 3000);
  assert.equal(publicLimitedFee(510000000).fee, 160000 + 3000);
  assert.equal(publicLimitedFee(520000000).fee, 160000 + 6000);
  const r = publicLimitedFee(510000000);
  assert.equal(r.overTop, true);
  assert.equal(r.extraUnits, 1);
});

// ============================================================
// INVALID INPUT — NEVER SILENTLY GUESSES
// ============================================================
test('invalid capital throws instead of guessing', () => {
  for (const bad of [0, -5, -100000, NaN, 'abc', '', 'Rs. --', null, undefined]) {
    assert.throws(() => privateLimitedFee(bad), `private should throw for ${String(bad)}`);
    assert.throws(() => publicLimitedFee(bad), `public should throw for ${String(bad)}`);
  }
});

test('validateCapital rejects empty / zero / negative / non-numeric', () => {
  assert.equal(validateCapital('').ok, false);
  assert.equal(validateCapital('0').ok, false);
  assert.equal(validateCapital('-100').ok, false);
  assert.equal(validateCapital('abc').ok, false);
  assert.equal(validateCapital('1,00,000').ok, true);
  assert.equal(validateCapital('Rs. 5,00,000').ok, true);
  assert.equal(validateCapital('Rs. 5,00,000').value, 500000);
});

test('validateCapital rejects extremely large numbers safely', () => {
  assert.equal(validateCapital(1e13).ok, false);
  assert.equal(validateCapital('99999999999999').ok, false);
});

test('validateShareholders: 1–101 ok, anything else rejected', () => {
  assert.equal(validateShareholders(1).ok, true);
  assert.equal(validateShareholders(101).ok, true);
  assert.equal(validateShareholders(0).ok, false);
  assert.equal(validateShareholders(102).ok, false);
  assert.equal(validateShareholders('abc').ok, false);
});

test('validateFounders: minimum 7 enforced', () => {
  assert.equal(validateFounders(7).ok, true);
  assert.equal(validateFounders(20).ok, true);
  assert.equal(validateFounders(6).ok, false);
  assert.equal(validateFounders(1).ok, false);
  assert.equal(validateFounders('abc').ok, false);
});

test('validatePartners: minimum 2 enforced', () => {
  assert.equal(validatePartners(2).ok, true);
  assert.equal(validatePartners(5).ok, true);
  assert.equal(validatePartners(1).ok, false);
  assert.equal(validatePartners(0).ok, false);
});

// ============================================================
// ESTIMATE BUILDERS
// ============================================================
test('estimatePrivateLimited returns capital, fee and total', () => {
  const r = estimatePrivateLimited(500000);
  assert.equal(r.capital, 500000);
  assert.equal(r.fee, 4500);
  assert.equal(r.total, 4500);
  assert.equal(r.overTop, false);
});

test('estimatePublicLimited returns capital, fee and total', () => {
  const r = estimatePublicLimited(10000000);
  assert.equal(r.capital, 10000000);
  assert.equal(r.fee, 15000);
  assert.equal(r.total, 15000);
});

// ============================================================
// NUMBER FORMATTING (Nepal/Indian grouping)
// ============================================================
test('formatNPR uses Indian grouping', () => {
  assert.equal(formatNPR(1000), 'Rs. 1,000');
  assert.equal(formatNPR(10000), 'Rs. 10,000');
  assert.equal(formatNPR(100000), 'Rs. 1,00,000');
  assert.equal(formatNPR(500000), 'Rs. 5,00,000');
  assert.equal(formatNPR(4500), 'Rs. 4,500');
  assert.equal(formatNPR(10000000), 'Rs. 1,00,00,000');
});

test('formatNumberIN uses Indian grouping without currency', () => {
  assert.equal(formatNumberIN(100000), '1,00,000');
  assert.equal(formatNumberIN(500000), '5,00,000');
  assert.equal(formatNumberIN(10000000), '1,00,00,000');
});

test('parseCapitalInput handles Rs., commas and garbage', () => {
  assert.equal(parseCapitalInput('5,00,000'), 500000);
  assert.equal(parseCapitalInput('Rs. 5,00,000'), 500000);
  assert.equal(parseCapitalInput('10000000'), 10000000);
  assert.ok(Number.isNaN(parseCapitalInput('abc')));
  assert.ok(Number.isNaN(parseCapitalInput('')));
});
