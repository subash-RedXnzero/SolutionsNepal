/**
 * Tests for the Nepal vehicle tax & renewal engine.
 * Run: node --test tests/
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { calculateVehicleRenewal, LATE_STATUS_OPTIONS } from '../src/lib/calculators/vehicle-tax.js';
import { validateVehicleTaxData, resolveSlabTable } from '../src/data/nepal/vehicle/vehicle-tax-data.js';
import { getProvinceTaxData, findSlab, CURRENT_FY, CURRENT_FISCAL_YEAR } from '../src/data/nepal/vehicle/vehicle-tax-data.js';

const base = (overrides = {}) => ({
  provinceId: 'bagmati',
  category: 'motorcycle',
  fuelType: 'petrol',
  value: 125,
  lastPaidFY: 2082,
  currentFY: 2083,
  lateStatus: 'ontime',
  includeInsurance: false,
  ...overrides,
});

const taxOf = (o) => calculateVehicleRenewal(base(o)).annualTax;

// ============================================================
// DATA VALIDATION
// ============================================================
test('vehicle tax data validates with no overlaps/gaps/problems', () => {
  const problems = validateVehicleTaxData();
  assert.deepEqual(problems, [], `validation problems: ${problems.join(' | ')}`);
});

test('all seven provinces expose the current fiscal year record', () => {
  const provinces = ['bagmati', 'koshi', 'madhesh', 'gandaki', 'lumbini', 'karnali', 'sudurpashchim'];
  for (const p of provinces) {
    assert.ok(getProvinceTaxData(p, CURRENT_FISCAL_YEAR), `${p} missing FY ${CURRENT_FISCAL_YEAR}`);
  }
});

// ============================================================
// MOTORCYCLE SLAB BOUNDARIES (Bagmati FY 2083/84)
// ============================================================
test('motorcycle boundaries: 125/126/150/151/225/226/400/401/650/651 cc', () => {
  const expected = {
    125: 3000, 126: 5000, 150: 5000, 151: 6500, 225: 6500,
    226: 12000, 400: 12000, 401: 25000, 650: 25000, 651: 35000,
  };
  for (const [cc, tax] of Object.entries(expected)) {
    assert.equal(taxOf({ value: Number(cc) }), tax, `${cc}cc should be Rs ${tax}`);
  }
});

// ============================================================
// CAR SLAB BOUNDARIES
// ============================================================
test('car boundaries: 1000..3501 cc', () => {
  const expected = {
    1000: 22000, 1001: 25000, 1500: 25000, 1501: 27000, 2000: 27000,
    2001: 37000, 2500: 37000, 2501: 50000, 3000: 50000, 3001: 65000,
    3500: 65000, 3501: 70000,
  };
  for (const [cc, tax] of Object.entries(expected)) {
    assert.equal(taxOf({ category: 'car', fuelType: 'petrol', value: Number(cc) }), tax, `${cc}cc should be Rs ${tax}`);
  }
});

test('diesel cars use the same slabs as petrol (single verified table)', () => {
  assert.equal(taxOf({ category: 'car', fuelType: 'diesel', value: 1500 }), 25000);
});

// ============================================================
// EV TWO-WHEELER (WATTS)
// ============================================================
test('EV two-wheeler boundaries (watts): 50/51/350/351/1000/1001/1500/1501', () => {
  const expected = {
    50: 1000, 51: 1500, 350: 1500, 351: 2000, 1000: 2000,
    1001: 2500, 1500: 2500, 1501: 3000,
  };
  for (const [w, tax] of Object.entries(expected)) {
    const r = calculateVehicleRenewal(base({ category: 'motorcycle', fuelType: 'electric', value: Number(w) }));
    assert.equal(r.annualTax, tax, `${w}W should be Rs ${tax}`);
    assert.equal(r.input.unit, 'W');
  }
});

// ============================================================
// EV CAR (KW)
// ============================================================
test('EV car boundaries (kW): 50/51/125/126/200/201', () => {
  const expected = { 50: 5000, 51: 15000, 125: 15000, 126: 20000, 200: 20000, 201: 30000 };
  for (const [kw, tax] of Object.entries(expected)) {
    const r = calculateVehicleRenewal(base({ category: 'car', fuelType: 'electric', value: Number(kw) }));
    assert.equal(r.annualTax, tax, `${kw}kW should be Rs ${tax}`);
    assert.equal(r.input.unit, 'kW');
  }
});

// ============================================================
// CURRENT-FY LATE STATUS FINES (Act 2075 §176)
// ============================================================
test('current year on time → zero fine', () => {
  const r = calculateVehicleRenewal(base());
  assert.equal(r.totalPenalty, 0);
  assert.equal(r.totalTax, 3000);
});

test('current year 1 month late (1–30 days) → 5% fine', () => {
  const r = calculateVehicleRenewal(base({ lateStatus: '1-30' }));
  assert.equal(r.totalPenalty, Math.round(3000 * 0.05)); // 150
  assert.equal(r.yearBreakdown[0].penaltyPercent, 5);
});

test('current year multi-month late (31–75 days) → 10% fine', () => {
  const r = calculateVehicleRenewal(base({ lateStatus: '31-45' }));
  assert.equal(r.totalPenalty, Math.round(3000 * 0.1)); // 300
});

test('current year 76+ days late → 20% fine', () => {
  const r = calculateVehicleRenewal(base({ lateStatus: '46-plus' }));
  assert.equal(r.totalPenalty, Math.round(3000 * 0.2)); // 600
});

// ============================================================
// MULTI-YEAR ARREARS (per-year calculation, NOT rate × years)
// ============================================================
test('1-year overdue (last paid FY 2082/83) → only FY 2083/84 due', () => {
  const r = calculateVehicleRenewal(base({ lastPaidFY: 2082 }));
  assert.equal(r.input.yearsDue, 1);
  assert.equal(r.yearBreakdown.length, 1);
  assert.equal(r.yearBreakdown[0].fiscalYear, 2083);
  assert.equal(r.yearBreakdown[0].isCurrentYear, true);
  assert.equal(r.totalTax, 3000);
  assert.equal(r.totalPenalty, 0);
});

test('2-year overdue (last paid FY 2081/82) → elapsed FY 2082/83 fined 32%, current FY fine per status', () => {
  const r = calculateVehicleRenewal(base({ lastPaidFY: 2081, lateStatus: '1-30' }));
  assert.equal(r.input.yearsDue, 2);
  assert.equal(r.totalTax, 6000);
  // elapsed FY 2082/83: 32% of 3000 = 960; current FY 2083/84: 5% of 3000 = 150
  assert.equal(r.totalPenalty, Math.round(3000 * 0.32) + Math.round(3000 * 0.05));
  assert.equal(r.yearBreakdown[0].fiscalYear, 2082);
  assert.equal(r.yearBreakdown[0].penaltyPercent, 32);
});

test('multi-year overdue applies 32% per elapsed year, not current rate × years', () => {
  // last paid FY 2079 → outstanding FYs 2080,2081,2082,2083 (4 years)
  const r = calculateVehicleRenewal(base({ lastPaidFY: 2079 }));
  assert.equal(r.input.yearsDue, 4);
  assert.equal(r.totalTax, 3000 * 4);
  // elapsed (non-current) FYs: 2080, 2081, 2082 = 3 years × 32%
  assert.equal(r.totalPenalty, Math.round(3000 * 0.32) * 3);
});

test('very old arrears cap the 32% fine at maxFineYears (5) but keep all years of tax', () => {
  // last paid FY 2076 → outstanding FYs 2077..2083 = 7 years; 6 elapsed
  const r = calculateVehicleRenewal(base({ lastPaidFY: 2076 }));
  assert.equal(r.input.yearsDue, 7);
  assert.equal(r.totalTax, 3000 * 7);
  assert.equal(r.totalPenalty, Math.round(3000 * 0.32) * 5);
  assert.equal(r.meta.capApplied, true);
});

test('up to date (last paid current FY) → zero tax, zero fine, fees still apply', () => {
  const r = calculateVehicleRenewal(base({ lastPaidFY: 2083 }));
  assert.equal(r.input.yearsDue, 0);
  assert.equal(r.yearBreakdown.length, 0);
  assert.equal(r.totalTax, 0);
  assert.equal(r.totalPenalty, 0);
  assert.equal(r.fees.renewalFee, 300);
  assert.ok(r.fees.otherChargesTotal >= 0);
});

// ============================================================
// RENEWAL FEE BY WHEELBASE
// ============================================================
test('renewal fee: Rs 300 for two-wheelers, Rs 500 for four-wheelers', () => {
  assert.equal(calculateVehicleRenewal(base({ category: 'motorcycle' })).fees.renewalFee, 300);
  assert.equal(calculateVehicleRenewal(base({ category: 'motorcycle', fuelType: 'electric', value: 500 })).fees.renewalFee, 300);
  assert.equal(calculateVehicleRenewal(base({ category: 'car', value: 1500 })).fees.renewalFee, 500);
  assert.equal(calculateVehicleRenewal(base({ category: 'car', fuelType: 'electric', value: 105 })).fees.renewalFee, 500);
});

// ============================================================
// INSURANCE — separate, never fined
// ============================================================
test('insurance is a separate line item and is not fined', () => {
  const late = calculateVehicleRenewal(base({ lateStatus: '1-30', includeInsurance: true }));
  const ontime = calculateVehicleRenewal(base({ lateStatus: 'ontime', includeInsurance: true }));
  // The fine delta must be 5% of tax (150), NOT affected by insurance.
  assert.equal(late.totalWithInsurance - ontime.totalWithInsurance, 150);
  assert.equal(late.subtotal + late.insurance.thirdPartyEstimate, late.totalWithInsurance);
});

test('manual insurance amount overrides the estimate', () => {
  const r = calculateVehicleRenewal(base({ includeInsurance: true, insuranceAmount: 1715 }));
  assert.equal(r.insurance.thirdPartyEstimate, 1715);
  assert.equal(r.insurance.manual, true);
});

// ============================================================
// PROVINCE / HYBRID / FY SUPPORT
// ============================================================
test('non-Bagmati provinces are flagged as estimates, not presented as verified', () => {
  const r = calculateVehicleRenewal(base({ provinceId: 'koshi' }));
  assert.equal(r.input.provinceDataStatus, 'estimate');
  assert.equal(r.meta.dataStatus, 'estimate');
  assert.equal(r.meta.verified, false);
  assert.equal(r.input.estimate, true);
});

test('hybrid cars resolve to petrol slabs and are flagged as an estimate', () => {
  const r = calculateVehicleRenewal(base({ category: 'car', fuelType: 'hybrid', value: 1500 }));
  assert.equal(r.annualTax, 25000);
  assert.equal(r.input.estimate, true);
});

test('fiscal-year-specific data: FY 2082/83 EV car up-to-50kW is Rs 3,500 (before the 2083/84 +1,500 increase)', () => {
  const r = calculateVehicleRenewal(base({ category: 'car', fuelType: 'electric', value: 50, currentFY: 2082 }));
  assert.equal(r.annualTax, 3500);
  assert.equal(r.input.fiscalYear, '2082/83');
});

// ============================================================
// ERROR HANDLING
// ============================================================
test('invalid (negative) engine value throws', () => {
  assert.throws(() => calculateVehicleRenewal(base({ value: -5 })));
});

test('non-numeric engine value throws', () => {
  assert.throws(() => calculateVehicleRenewal(base({ value: NaN })));
});

test('unsupported category throws', () => {
  assert.throws(() => calculateVehicleRenewal(base({ category: 'taxi' })));
});

test('unsupported fuel for category throws (hybrid motorcycle)', () => {
  assert.throws(() => calculateVehicleRenewal(base({ fuelType: 'hybrid' })));
});

test('lastPaidFY in the future throws', () => {
  assert.throws(() => calculateVehicleRenewal(base({ lastPaidFY: 2085 })));
});

// ============================================================
// MISC
// ============================================================
test('LATE_STATUS_OPTIONS exposes §176 current-FY bands plus multi-year options', () => {
  const keys = Object.keys(LATE_STATUS_OPTIONS);
  assert.ok(keys.includes('ontime'), 'should include ontime');
  assert.ok(keys.includes('1-30'), 'should include 1-30');
  assert.ok(keys.includes('31-45'), 'should include 31-45');
  assert.ok(keys.includes('46-plus'), 'should include 46-plus');
  assert.ok(keys.includes('1-year-late'), 'should include 1-year-late');
  assert.ok(keys.includes('2-years-late'), 'should include 2-years-late');
  assert.ok(keys.includes('3-years-late'), 'should include 3-years-late');
  assert.equal(LATE_STATUS_OPTIONS['ontime'].percent, 0);
  assert.equal(LATE_STATUS_OPTIONS['1-30'].percent, 0.05);
  assert.equal(LATE_STATUS_OPTIONS['31-45'].percent, 0.1);
  assert.equal(LATE_STATUS_OPTIONS['46-plus'].percent, 0.2);
  assert.equal(LATE_STATUS_OPTIONS['1-year-late'].percent, 0.32);
  assert.equal(LATE_STATUS_OPTIONS['2-years-late'].percent, 0.64);
  assert.equal(LATE_STATUS_OPTIONS['3-years-late'].percent, 0.96);
});

test('resolveSlabTable maps category+fuel to the right table', () => {
  const rec = getProvinceTaxData('bagmati', CURRENT_FISCAL_YEAR);
  assert.equal(resolveSlabTable('motorcycle', 'petrol', rec).key, 'motorcycle');
  assert.equal(resolveSlabTable('motorcycle', 'electric', rec).key, 'evBike');
  assert.equal(resolveSlabTable('car', 'electric', rec).key, 'evCar');
  assert.equal(resolveSlabTable('car', 'hybrid', rec).estimate, true);
  assert.equal(resolveSlabTable('motorcycle', 'hybrid', rec), null);
});

test('findSlab resolves values above the top slab to the top slab', () => {
  const rec = getProvinceTaxData('bagmati', CURRENT_FISCAL_YEAR);
  const top = findSlab(5000, rec.categories.motorcycle.slabs);
  assert.equal(top.annualTax, 35000);
});