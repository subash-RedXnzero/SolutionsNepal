/**
 * Tests for the Bike & Car Ownership Cost engine.
 * Run: npm test  (node --test tests/)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateEMI,
  calculateLoanInterest,
  calculateFuelCost,
  calculateChargingCost,
  calculateDepreciation,
  calculateMonthlyOwnershipCost,
  calculateAnnualOwnershipCost,
  calculateCostPerKm,
  calculateTotalOwnershipCost,
  calculateOwnershipCost,
  summarizeOwnership,
  validateOwnershipInput,
  defaultOwnershipState,
  formatNPR,
} from '../src/lib/calculators/ownership-cost.js';

// Bike: 600 km/mo @45 km/l, Rs.199/L, no loan, tax 3000, ins 8000, maint 12000/yr, parking 1000/mo
const bike = (overrides = {}) => ({
  vehicleType: 'bike',
  fuelType: 'petrol',
  monthlyKm: 600,
  efficiency: 45,
  energyPrice: 199,
  loan: { enabled: false },
  annual: { tax: 3000, insurance: 8000, renewal: 1500, otherAnnual: '' },
  maintenance: { mode: 'simple', simpleAnnual: 12000 },
  recurring: { parking: 1000, tolls: '', washing: 300, accessories: '', otherMonthly: '' },
  depreciation: { enabled: false },
  ...overrides,
});

// ── EMI ─────────────────────────────────────────────────────

test('EMI: Rs.10,00,000 @12% for 60 months', () => {
  const r = calculateEMI(1000000, 12, 60);
  assert.ok(Math.abs(r.emi - 22244.45) < 1, `emi=${r.emi}`);
  assert.equal(r.totalPayment, Math.round(r.emi * 60 * 100) / 100);
  assert.ok(Math.abs(r.totalInterest - (r.totalPayment - 1000000)) < 1);
  assert.equal(r.principal, 1000000);
});

test('EMI with 0% interest is straight principal ÷ months', () => {
  const r = calculateEMI(120000, 0, 12);
  assert.equal(r.emi, 10000);
  assert.equal(r.totalInterest, 0);
  assert.equal(r.totalPayment, 120000);
});

test('calculateLoanInterest matches EMI schedule interest', () => {
  const emi = calculateEMI(500000, 10, 24);
  assert.equal(calculateLoanInterest(500000, 10, 24), emi.totalInterest);
  assert.ok(emi.totalInterest > 0);
});

// ── Fuel / charging ─────────────────────────────────────────

test('fuel cost: 600 km ÷ 45 km/l × Rs.199', () => {
  const cost = calculateFuelCost({ monthlyKm: 600, mileage: 45, fuelPrice: 199 });
  assert.ok(Math.abs(cost - 2653.33) < 0.01, `cost=${cost}`);
});

test('EV charging cost: 800 km ÷ 6 km/kWh × Rs.11', () => {
  const cost = calculateChargingCost({ monthlyKm: 800, kmPerKwh: 6, pricePerKwh: 11 });
  assert.ok(Math.abs(cost - 1466.67) < 0.01, `cost=${cost}`);
});

test('zero mileage or consumption yields Rs.0 energy cost', () => {
  assert.equal(calculateFuelCost({ monthlyKm: 600, mileage: 0, fuelPrice: 199 }), 0);
  assert.equal(calculateChargingCost({ monthlyKm: 600, kmPerKwh: 0, pricePerKwh: 11 }), 0);
});

// ── Bike full calculation ───────────────────────────────────

test('bike monthly cost adds fuel + annual/12 + maintenance/12 + recurring', () => {
  const r = calculateOwnershipCost(bike(), 1);
  assert.equal(r.valid, true);
  const fuel = (600 / 45) * 199;
  const expected = fuel + (3000 + 8000 + 1500) / 12 + 12000 / 12 + (1000 + 300);
  assert.ok(Math.abs(r.monthlyCost - expected) < 0.05, `monthly=${r.monthlyCost} expected=${expected}`);
  assert.ok(Math.abs(r.annualCost - expected * 12) < 0.6);
  assert.equal(r.fuelCost, Math.round(fuel * 100) / 100);
  assert.equal(r.loanCost, 0);
  assert.equal(r.depreciation, 0);
});

test('bike cost per km = annual ÷ (600 × 12)', () => {
  const r = calculateOwnershipCost(bike(), 1);
  assert.ok(Math.abs(r.costPerKm - r.annualCost / 7200) < 0.01);
  assert.ok(Math.abs(r.runningCostPerKm - r.fuelCost / 600) < 0.01);
  assert.ok(r.runningCostPerKm < r.costPerKm, 'running < total ownership per km');
});

// ── Car with loan ───────────────────────────────────────────

const car = (overrides = {}) => ({
  vehicleType: 'car',
  fuelType: 'petrol',
  monthlyKm: 1000,
  efficiency: 14,
  energyPrice: 199,
  loan: { enabled: true, amount: 2000000, annualRatePct: 12, months: 60 },
  annual: { tax: 25000, insurance: 45000, renewal: 2000, otherAnnual: 5000 },
  maintenance: { mode: 'simple', simpleAnnual: 30000 },
  recurring: { parking: 3000, tolls: 500, washing: 800, accessories: '', otherMonthly: '' },
  depreciation: { enabled: false },
  ...overrides,
});

test('car monthly cost includes EMI and all buckets', () => {
  const r = calculateOwnershipCost(car(), 5);
  assert.equal(r.valid, true);
  const emi = calculateEMI(2000000, 12, 60).emi;
  assert.equal(r.loanCost, emi);
  assert.equal(r.emi.totalInterest, r.loan.totalPayment !== undefined ? r.emi.totalInterest : r.emi.totalInterest);
  const fuel = (1000 / 14) * 199;
  const expected = emi + fuel + (25000 + 45000 + 2000 + 5000) / 12 + 30000 / 12 + (3000 + 500 + 800);
  assert.ok(Math.abs(r.monthlyCost - expected) < 0.1, `monthly=${r.monthlyCost}`);
  // Breakdown covers every rupee and pct sums to ~100
  const sum = r.breakdown.reduce((s, b) => s + b.monthly, 0);
  assert.ok(Math.abs(sum - r.monthlyCost) < 0.05);
  const pct = r.breakdown.reduce((s, b) => s + b.pct, 0);
  assert.ok(Math.abs(pct - 100) < 0.6, `pct=${pct}`);
  assert.equal(r.breakdown[0].id, 'loan', 'EMI is the biggest car cost');
});

test('loan detail exposes principal, interest and total payment', () => {
  const r = calculateOwnershipCost(car(), 5);
  assert.equal(r.loan.principal, 2000000);
  assert.ok(r.loan.enabled);
  assert.ok(r.emi.totalInterest > 0);
  assert.equal(r.emi.totalPayment, Math.round((r.emi.emi * 60) * 100) / 100);
});

// ── Depreciation (kept separate) ────────────────────────────

test('depreciation: 35,00,000 − 20,00,000 = 15,00,000, excluded from monthly', () => {
  const withDep = calculateOwnershipCost(car({ depreciation: { enabled: true, purchasePrice: 3500000, resaleValue: 2000000 } }), 5);
  const without = calculateOwnershipCost(car(), 5);
  assert.equal(withDep.depreciation, 1500000);
  assert.equal(withDep.monthlyCost, without.monthlyCost, 'monthly cash unchanged by depreciation');
  assert.equal(withDep.totalCostIncludingDepreciation, withDep.period.totalCost + 1500000);
});

test('calculateDepreciation never goes negative', () => {
  assert.equal(calculateDepreciation(100000, 150000), 0);
  assert.equal(calculateDepreciation(3500000, 2000000), 1500000);
});

// ── Period views + loan cutoff ──────────────────────────────

test('1-year total = 12 months of cash costs (no loan here)', () => {
  const r = calculateOwnershipCost(bike(), 1);
  assert.equal(r.period.years, 1);
  assert.ok(Math.abs(r.period.totalCost - r.monthlyCost * 12) < 0.6);
  assert.equal(r.period.totalDistance, 7200);
});

test('5-year total scales annual + monthly buckets', () => {
  const r = calculateOwnershipCost(bike(), 5);
  assert.equal(r.period.months, 60);
  assert.ok(Math.abs(r.period.totalCost - r.monthlyCost * 60) < 2);
  assert.equal(r.period.totalDistance, 36000);
});

test('3-year and 10-year views work', () => {
  assert.equal(calculateOwnershipCost(bike(), 3).period.years, 3);
  assert.equal(calculateOwnershipCost(bike(), 10).period.totalDistance, 600 * 120);
});

test('loan ends before the ownership period: 2-yr loan in a 5-yr view', () => {
  const r = calculateOwnershipCost(
    car({ loan: { enabled: true, amount: 1200000, annualRatePct: 12, months: 24 } }),
    5,
  );
  assert.equal(r.period.loanMonthsPaid, 24);
  const emi = calculateEMI(1200000, 12, 24).emi;
  assert.ok(Math.abs(r.period.loanPaid - emi * 24) < 1);
  // Monthly headline still shows EMI (current month), but 5-yr average is lower
  assert.ok(r.period.monthlyAvg < r.monthlyCost, 'average drops once loan ends');
});

test('calculateTotalOwnershipCost counts zero loan months when loan-free', () => {
  const p = calculateTotalOwnershipCost(
    { loan: { enabled: false, months: 0 }, emi: 0, fuelMonthly: 2653.33, recurringMonthly: 1300, annualCash: 12500, maintAnnual: 12000, monthlyKm: 600 },
    1,
  );
  assert.equal(p.loanPaid, 0);
  assert.ok(Math.abs(p.totalCost - (2653.33 * 12 + 1300 * 12 + 12500 + 12000)) < 1);
});

// ── Helpers ─────────────────────────────────────────────────

test('monthly / annual / per-km helpers agree with the central result', () => {
  const m = calculateMonthlyOwnershipCost(bike());
  const a = calculateAnnualOwnershipCost(bike());
  const k = calculateCostPerKm(bike(), 5);
  const full = calculateOwnershipCost(bike(), 5);
  assert.equal(m.monthlyCost, full.monthlyCost);
  assert.equal(a.annualCost, full.annualCost);
  assert.equal(k.costPerKm, full.period.costPerKm);
  assert.equal(k.runningCostPerKm, full.runningCostPerKm);
});

// ── Validation ──────────────────────────────────────────────

test('zero distance is rejected with an inline message', () => {
  const r = calculateOwnershipCost(bike({ monthlyKm: 0 }), 1);
  assert.equal(r.valid, false);
  assert.match(r.errors.monthlyKm, /month/);
});

test('zero mileage is rejected with an inline message', () => {
  const r = calculateOwnershipCost(bike({ efficiency: 0 }), 1);
  assert.equal(r.valid, false);
  assert.match(r.errors.efficiency, /mileage greater than 0/);
});

test('EV with zero consumption is rejected', () => {
  const r = calculateOwnershipCost(
    bike({ fuelType: 'electric', efficiency: 0, energyPrice: 11 }), 1,
  );
  assert.equal(r.valid, false);
  assert.ok(r.errors.efficiency);
});

test('invalid loan fields are rejected (amount, rate, duration)', () => {
  const noAmt = calculateOwnershipCost(car({ loan: { enabled: true, amount: '', annualRatePct: 12, months: 60 } }), 1);
  assert.equal(noAmt.valid, false);
  assert.ok(noAmt.errors.loanAmount);
  const badRate = calculateOwnershipCost(car({ loan: { enabled: true, amount: 500000, annualRatePct: 150, months: 60 } }), 1);
  assert.equal(badRate.valid, false);
  assert.match(badRate.errors.loanRate, /0 and 100/);
  const badDur = calculateOwnershipCost(car({ loan: { enabled: true, amount: 500000, annualRatePct: 10, months: 0 } }), 1);
  assert.equal(badDur.valid, false);
  assert.match(badDur.errors.loanMonths, /at least 1 month/);
});

test('negative optional amounts are rejected per field', () => {
  const r = calculateOwnershipCost(bike({ annual: { tax: -500, insurance: '', renewal: '', otherAnnual: '' } }), 1);
  assert.equal(r.valid, false);
  assert.match(r.errors.tax, /negative/);
});

test('invalid resale (above purchase) is rejected', () => {
  const r = calculateOwnershipCost(
    car({ depreciation: { enabled: true, purchasePrice: 1000000, resaleValue: 1500000 } }), 1,
  );
  assert.equal(r.valid, false);
  assert.match(r.errors.resaleValue, /exceed the purchase price/);
});

test('blank optional costs are simply not included', () => {
  const r = calculateOwnershipCost(bike({
    annual: { tax: '', insurance: '', renewal: '', otherAnnual: '' },
    maintenance: { mode: 'simple', simpleAnnual: '' },
    recurring: { parking: '', tolls: '', washing: '', accessories: '', otherMonthly: '' },
  }), 1);
  assert.equal(r.valid, true);
  const fuel = (600 / 45) * 199;
  assert.ok(Math.abs(r.monthlyCost - fuel) < 0.05);
  assert.equal(r.breakdown.length, 1);
});

// ── Maintenance modes ───────────────────────────────────────

test('detailed maintenance sums its parts', () => {
  const r = calculateOwnershipCost(bike({
    maintenance: {
      mode: 'detailed',
      detailed: { servicing: 6000, engineOil: 2500, tyres: 8000, battery: 0, brakes: 1500, repairs: 3000, otherMaint: '' },
    },
  }), 1);
  assert.equal(r.valid, true);
  assert.equal(r.maintenanceCost, 21000 / 12);
});

// ── Comparison ──────────────────────────────────────────────

test('comparison: car costs more than bike across all four figures', () => {
  const b = summarizeOwnership(bike());
  const c = summarizeOwnership(car({ depreciation: { enabled: false } }));
  assert.equal(b.valid, true);
  assert.equal(c.valid, true);
  assert.ok(c.monthly > b.monthly);
  assert.ok(c.annual > b.annual);
  assert.ok(c.perKm > b.perKm);
  assert.ok(c.fiveYear > b.fiveYear);
});

// ── Formatting + defaults ───────────────────────────────────

test('formatNPR groups Indian-style', () => {
  assert.equal(formatNPR(221400), 'Rs. 2,21,400');
  assert.equal(formatNPR(1107000), 'Rs. 11,07,000');
  assert.equal(formatNPR(0), 'Rs. 0');
});

test('defaultOwnershipState is blank and loan-free', () => {
  const s = defaultOwnershipState();
  assert.equal(s.vehicleType, 'bike');
  assert.equal(s.loan.enabled, false);
  assert.equal(s.maintenance.mode, 'simple');
  assert.equal(validateOwnershipInput(s).monthlyKm !== undefined, true);
});
