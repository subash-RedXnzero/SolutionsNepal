/**
 * Tests for the Wedding Budget engine.
 * Run: npm test  (node --test tests/)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateWeddingBudget,
  calcCateringCost,
  calcVenueCost,
  suggestBudgetAllocation,
  defaultWeddingState,
  formatNPR,
  formatNumberIN,
  parseAmount,
  sanitizeAmount,
  sanitizeGuests,
} from '../src/lib/calculators/wedding-budget.js';

const base = (overrides = {}) => ({
  guests: 300,
  events: [],
  cateringPerGuest: 2000,
  venue: { mode: 'total', total: '' },
  expenses: {},
  excluded: [],
  emergencyBuffer: { enabled: false, percent: 0 },
  targetBudget: null,
  ...overrides,
});

// ── Catering ────────────────────────────────────────────────

test('catering: 300 guests × Rs. 2,000 = Rs. 6,00,000', () => {
  const r = calculateWeddingBudget(base());
  assert.equal(r.cateringCost, 600000);
  assert.equal(r.subtotal, 600000);
  assert.equal(r.total, 600000);
});

test('calcCateringCost returns guest-nights and per-guest rate', () => {
  const c = calcCateringCost(300, 2000, []);
  assert.deepEqual(c, { cost: 600000, guestNights: 300, perGuest: 2000 });
});

// ── Multiple events ─────────────────────────────────────────

test('multiple events: wedding 300 + reception 300 @2000 = Rs. 12,00,000 catering', () => {
  const r = calculateWeddingBudget(
    base({ events: [{ id: 'wedding', guests: 300 }, { id: 'reception', guests: 300 }] }),
  );
  assert.equal(r.cateringCost, 1200000);
  assert.equal(r.cateringGuests, 600);
});

test('per-event guest counts can differ (mehendi 100 + wedding 300)', () => {
  const r = calculateWeddingBudget(
    base({ events: [{ id: 'mehendi', guests: 100 }, { id: 'wedding', guests: 300 }] }),
  );
  assert.equal(r.cateringCost, 400 * 2000);
});

// ── Venue ───────────────────────────────────────────────────

test('venue total mode adds the full amount', () => {
  const r = calculateWeddingBudget(base({ venue: { mode: 'total', total: 200000 } }));
  assert.equal(r.venueCost, 200000);
  assert.equal(r.subtotal, 600000 + 200000);
});

test('venue per-event mode multiplies by selected event count', () => {
  const v = calcVenueCost({ mode: 'per-event', perEvent: 50000 }, 3);
  assert.equal(v.cost, 150000);
  const r = calculateWeddingBudget(
    base({
      venue: { mode: 'per-event', perEvent: 50000 },
      events: [{ id: 'wedding', guests: 300 }, { id: 'reception', guests: 200 }],
    }),
  );
  assert.equal(r.venueCost, 100000);
});

// ── Category totals ─────────────────────────────────────────

test('category expenses sum into subtotal and breakdown', () => {
  const r = calculateWeddingBudget(
    base({
      venue: { mode: 'total', total: 200000 },
      expenses: { jewellery: 700000, decoration: 150000, bridalClothing: 80000, groomClothing: 30000, photography: 100000, makeup: 50000 },
    }),
  );
  assert.equal(r.subtotal, 600000 + 200000 + 700000 + 150000 + 80000 + 30000 + 100000 + 50000);
  const ids = r.categoryBreakdown.map((b) => b.id);
  assert.ok(ids.includes('catering') && ids.includes('jewellery') && ids.includes('photography'));
  // breakdown sorted largest-first
  for (let i = 1; i < r.categoryBreakdown.length; i++) {
    assert.ok(r.categoryBreakdown[i - 1].amount >= r.categoryBreakdown[i].amount);
  }
});

test('top expenses returns the 3 largest categories', () => {
  const r = calculateWeddingBudget(
    base({
      venue: { mode: 'total', total: 200000 },
      expenses: { jewellery: 700000, decoration: 150000, bridalClothing: 80000 },
    }),
  );
  assert.equal(r.topExpenses.length, 3);
  assert.equal(r.topExpenses[0].id, 'jewellery');
  assert.equal(r.topExpenses[1].id, 'catering');
  assert.equal(r.topExpenses[2].id, 'venue');
});

// ── Emergency buffer ────────────────────────────────────────

test('emergency buffer: 5% of subtotal is added transparently', () => {
  const r = calculateWeddingBudget(
    base({ venue: { mode: 'total', total: 200000 }, emergencyBuffer: { enabled: true, percent: 5 } }),
  );
  assert.equal(r.subtotal, 800000);
  assert.equal(r.emergencyBuffer, 40000);
  assert.equal(r.total, 840000);
  assert.equal(r.bufferPercent, 5);
});

test('buffer presets 3% and 10% scale correctly', () => {
  const three = calculateWeddingBudget(base({ emergencyBuffer: { enabled: true, percent: 3 } }));
  assert.equal(three.emergencyBuffer, 18000);
  const ten = calculateWeddingBudget(base({ emergencyBuffer: { enabled: true, percent: 10 } }));
  assert.equal(ten.emergencyBuffer, 60000);
});

test('buffer can be disabled entirely', () => {
  const r = calculateWeddingBudget(base({ emergencyBuffer: { enabled: false, percent: 10 } }));
  assert.equal(r.emergencyBuffer, 0);
  assert.equal(r.total, r.subtotal);
});

// ── Cost per guest ──────────────────────────────────────────

test('cost per guest = total ÷ guests', () => {
  const r = calculateWeddingBudget(base({ emergencyBuffer: { enabled: false, percent: 0 } }));
  assert.equal(r.costPerGuest, 2000);
  const r2 = calculateWeddingBudget(
    base({ venue: { mode: 'total', total: 200000 }, emergencyBuffer: { enabled: true, percent: 5 } }),
  );
  assert.equal(r2.costPerGuest, 840000 / 300);
});

// ── Budget under / over ─────────────────────────────────────

test('over budget: 22,50,000 estimate vs 20,00,000 budget', () => {
  const r = calculateWeddingBudget(
    base({
      cateringPerGuest: 2000,
      venue: { mode: 'total', total: 200000 },
      expenses: { jewellery: 700000, decoration: 150000, bridalClothing: 80000, groomClothing: 30000, photography: 100000, makeup: 50000, miscellaneous: 340000 },
      emergencyBuffer: { enabled: false, percent: 0 },
      targetBudget: 2000000,
    }),
  );
  assert.equal(r.total, 2250000);
  assert.equal(r.budgetDifference.status, 'over');
  assert.equal(r.budgetDifference.difference, 250000);
});

test('under budget reports the remaining amount', () => {
  const r = calculateWeddingBudget(base({ targetBudget: 1000000 }));
  assert.equal(r.budgetDifference.status, 'under');
  assert.equal(r.budgetDifference.difference, 600000 - 1000000);
});

test('no target budget means no budget comparison', () => {
  const r = calculateWeddingBudget(base());
  assert.equal(r.budgetDifference, null);
});

// ── Excluded expenses ───────────────────────────────────────

test('excluded expenses are left out of the total', () => {
  const r = calculateWeddingBudget(
    base({ expenses: { photography: 100000, decoration: 50000 }, excluded: ['photography'] }),
  );
  assert.equal(r.subtotal, 600000 + 50000);
  assert.ok(!r.categoryBreakdown.some((b) => b.id === 'photography'));
  assert.equal(r.excludedCount, 1);
  assert.ok(r.warnings.some((w) => w.includes('Already arranged')));
});

// ── Edge cases ──────────────────────────────────────────────

test('zero guests: catering is Rs. 0 and cost-per-guest is Rs. 0', () => {
  const r = calculateWeddingBudget(base({ guests: 0 }));
  assert.equal(r.cateringCost, 0);
  assert.equal(r.costPerGuest, 0);
  assert.ok(r.warnings.some((w) => w.includes('No guest count')));
});

test('invalid amounts are treated as not included (never NaN)', () => {
  const r = calculateWeddingBudget(
    base({ cateringPerGuest: 'abc', venue: { mode: 'total', total: 'xyz' }, expenses: { decoration: 'hello' } }),
  );
  assert.equal(r.total, 0);
  assert.deepEqual(r.categoryBreakdown, []);
});

test('negative amounts are never subtracted', () => {
  const r = calculateWeddingBudget(
    base({ cateringPerGuest: -2000, expenses: { decoration: -50000 } }),
  );
  assert.equal(r.cateringCost, 0);
  assert.equal(r.subtotal, 0);
  assert.ok(r.total >= 0);
});

test('very large budgets stay finite', () => {
  const r = calculateWeddingBudget(
    base({ guests: 10000, cateringPerGuest: 5000, expenses: { jewellery: 1e9 }, emergencyBuffer: { enabled: true, percent: 10 }, targetBudget: 5e9 }),
  );
  assert.ok(Number.isFinite(r.total));
  assert.equal(r.total, (10000 * 5000 + 1e9) * 1.1);
});

// ── Budget-first allocation ─────────────────────────────────

test('suggested allocation splits the budget and sums back exactly', () => {
  const rows = suggestBudgetAllocation(1500000);
  const sum = rows.reduce((s, r) => s + r.amount, 0);
  assert.equal(sum, 1500000);
  const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
  assert.equal(byId.catering.amount, 450000);
  assert.equal(byId.venue.amount, 150000);
  assert.equal(byId.jewellery.amount, 255000);
  assert.throws(() => suggestBudgetAllocation(0), /budget/);
  assert.throws(() => suggestBudgetAllocation(''), /budget/);
});

// ── Formatting (Nepal/Indian grouping) ─────────────────────

test('formatNPR groups Indian-style', () => {
  assert.equal(formatNPR(600000), 'Rs. 6,00,000');
  assert.equal(formatNPR(2250000), 'Rs. 22,50,000');
  assert.equal(formatNPR(1500000), 'Rs. 15,00,000');
  assert.equal(formatNPR(7500), 'Rs. 7,500');
  assert.equal(formatNPR(0), 'Rs. 0');
  assert.equal(formatNPR(NaN), 'Rs. 0');
});

test('formatNumberIN groups plain numbers', () => {
  assert.equal(formatNumberIN(1000), '1,000');
  assert.equal(formatNumberIN(100000), '1,00,000');
});

test('parseAmount: empty->null, commas ok, negatives rejected', () => {
  assert.deepEqual(parseAmount(''), { value: null });
  assert.deepEqual(parseAmount('6,00,000'), { value: 600000 });
  assert.ok(parseAmount('-50').error);
  assert.ok(parseAmount('xyz').error);
});

test('sanitize helpers coerce safely', () => {
  assert.equal(sanitizeAmount('2,000'), 2000);
  assert.equal(sanitizeAmount(-5), 0);
  assert.equal(sanitizeAmount('abc'), 0);
  assert.equal(sanitizeGuests('300'), 300);
  assert.equal(sanitizeGuests(0), 0);
  assert.equal(sanitizeGuests(-10), 0);
});

// ── Reset ───────────────────────────────────────────────────

test('defaultWeddingState is a blank, calculable reset state', () => {
  const s = defaultWeddingState();
  const r = calculateWeddingBudget({
    guests: s.guests,
    events: s.events,
    cateringPerGuest: s.cateringPerGuest,
    expenses: s.expenses,
    excluded: s.excluded,
    emergencyBuffer: { enabled: s.bufferEnabled, percent: s.bufferPercent },
  });
  assert.equal(r.total, 0);
  assert.equal(r.costPerGuest, 0);
  assert.deepEqual(r.categoryBreakdown, []);
});
