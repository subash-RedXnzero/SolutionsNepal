/**
 * Tests for the Nepal salary calculation engine.
 * Run: node --test tests/
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { calculateNepalSalary } from '../src/lib/calculators/nepal-salary.js';
import { getCurrentFiscalYear, getFiscalYearRules, calculateIncomeTaxForFiscalYear } from '../src/data/nepal/tax/index.js';
import { SSF_CURRENT, resolveSSFBase, calculateSSFContributions } from '../src/data/nepal/ssf/current.js';
import { withinTolerance, getDeductionMethod } from '../src/data/nepal/payroll/rules.js';

const assertMoney = (a, b, msg) =>
  assert.ok(Math.abs(Number(a) - Number(b)) < 0.001, `${msg || 'money mismatch'}: ${a} != ${b}`);

const base = (overrides = {}) => ({
  fiscalYear: '2083/84',
  income: {
    basicSalary: 12170,
    dearnessAllowance: 7380,
    otherAllowances: 2016,
    otherIncome: 2839.67,
    overtimeAmount: 0,
    bonus: 0,
    commission: 0,
  },
  ssfEnabled: true,
  ssfBaseMode: 'basic',
  ssfCeiling: { enabled: false, amount: 50000 },
  insurance: { life: 0, health: 0 },
  otherRetirementAnnual: 0,
  female: false,
  filingStatus: 'individual',
  attendance: {
    calendarDays: 30,
    workingDays: 22,
    presentDays: 22,
    paidLeave: 0,
    unpaidLeave: 0,
    absentDays: 0,
    publicHolidays: 0,
    restDays: 8,
  },
  attendanceOptions: { deductionMethod: 'not-specified', includeAbsentAsUnpaid: false },
  deductions: { loan: 0, advance: 0, otherEmployee: 0 },
  ...overrides,
});

test('brief test case: SSF on basic only, combined shown on payslip', () => {
  const r = calculateNepalSalary(base());

  // Gross = 12170 + 7380 + 2016 + 2839.67
  assert.equal(r.income.contractualGross, 24405.67);
  // SSF base = basic salary only
  assert.equal(r.ssf.base, 12170);
  assert.equal(r.ssf.employee.total, 1338.70);
  assert.equal(r.ssf.employer.total, 2434.00);
  assert.equal(r.ssf.combined, 3772.70);
  // Tax = 0 (annual income well under 1M + SSF waiver on first slab)
  assert.equal(r.tax.annual, 0);
  // Expected net = gross - employee SSF only
  assertMoney(r.net, 23066.97);
  // Employer SSF is NEVER subtracted from net
  assertMoney(r.net, r.adjustedGross - r.employeeDeductions.total);
  assert.equal(r.employeeDeductions.total, r.ssf.employee.total + r.tds.monthly);
});

test('payslip test case: 12,170 + 7,380 + 1,016 -> net 19,227.30', () => {
  const r = calculateNepalSalary(base({
    income: { basicSalary: 12170, dearnessAllowance: 7380, otherAllowances: 1016, otherIncome: 0, overtimeAmount: 0, bonus: 0, commission: 0 },
  }));
  assert.equal(r.income.contractualGross, 20566.00);
  assert.equal(r.ssf.employee.total, 1338.70);
  assert.equal(r.ssf.employer.total, 2434.00);
  assert.equal(r.ssf.combined, 3772.70);
  assert.equal(r.tax.monthly, 0);
  assertMoney(r.net, 19227.30);
  assertMoney(r.net, r.income.contractualGross - r.ssf.employee.total - r.tds.monthly);
  assert.notEqual(r.net, r.income.contractualGross - r.ssf.combined, 'employer SSF must never be deducted from net');
});

test('manual SSF override: entered amounts win, employer never deducted', () => {
  const r = calculateNepalSalary(base({ ssfManual: { employee: 1500, employer: 4000 } }));
  assert.equal(r.ssf.manual, true);
  assert.equal(r.ssf.employee.total, 1500);
  assert.equal(r.ssf.employer.total, 4000);
  assert.equal(r.ssf.combined, 5500);
  assertMoney(r.net, r.income.contractualGross - 1500 - r.tds.monthly);
  assert.notEqual(r.net, r.income.contractualGross - 5500, 'employer SSF must never be deducted');
});

test('manual SSF override: only employee entered, employer stays auto', () => {
  const r = calculateNepalSalary(base({ ssfManual: { employee: 1500 } }));
  assert.equal(r.ssf.employee.total, 1500);
  assert.equal(r.ssf.employer.total, 2434.00);
});

test('employer SSF is an employer cost, never an employee deduction', () => {
  const r = calculateNepalSalary(base());
  assert.equal(r.employerSide.employerSSF, 2434.00);
  assert.equal(r.employerSide.totalEmployerCost, r.adjustedGross + 2434.00);
  // Net must equal adjustedGross minus employee-side items only
  const empSide = r.employeeDeductions.total;
  assertMoney(r.net, r.adjustedGross - empSide);
  assert.notEqual(r.net, r.adjustedGross - r.ssf.combined, 'combined SSF must not be subtracted');
});

test('TDS is the monthly withholding of annual tax — never double counted', () => {
  const r = calculateNepalSalary(base({ income: { basicSalary: 120000, dearnessAllowance: 0, otherAllowances: 0, otherIncome: 0, overtimeAmount: 0, bonus: 0, commission: 0 } }));
  assert.equal(r.tds.monthly, r.tax.monthly);
  assert.equal(r.tds.monthly, Math.round((r.tax.annual / 12) * 100) / 100);
  // total deductions includes tax once
  assert.equal(r.employeeDeductions.total, r.ssf.employee.total + r.tax.monthly);
});

test('FY 2083/84 slabs: SSF waiver zeros the first 1M', () => {
  // 1,200,000 annual with SSF: first 1M at 0%, next 200k at 10% = 20,000
  const tax = calculateIncomeTaxForFiscalYear('2083/84', 1200000, { ssfEnrolled: true, female: false });
  assert.equal(tax.totalTax, 20000);
  assert.equal(tax.sstWaiver, 10000);

  // without SSF: first 1M at 1% + 200k at 10% = 10,000 + 20,000 = 30,000
  const taxNoSsf = calculateIncomeTaxForFiscalYear('2083/84', 1200000, { ssfEnrolled: false, female: false });
  assert.equal(taxNoSsf.totalTax, 30000);
});

test('FY 2082/83 slab boundaries (single schedule)', () => {
  // 500,000 at 1% = 5,000 (waived if SSF)
  const a = calculateIncomeTaxForFiscalYear('2082/83', 500000, { filingStatus: 'single', ssfEnrolled: true });
  assert.equal(a.totalTax, 0);
  // 700,000 single, no SSF: 500k@1% + 200k@10% = 5,000 + 20,000 = 25,000
  const b = calculateIncomeTaxForFiscalYear('2082/83', 700000, { filingStatus: 'single', ssfEnrolled: false });
  assert.equal(b.totalTax, 25000);
});

test('fiscal-year registry: current year, future-year structure, unknown guard', () => {
  assert.equal(getCurrentFiscalYear().id, '2083/84');
  assert.equal(getFiscalYearRules('2084/85'), null, 'future FY returns null gracefully');
  assert.throws(() => calculateIncomeTaxForFiscalYear('2084/85', 100000, {}), /Unknown fiscal year/);
});

test('female rebate: 10% off computed tax', () => {
  const tax = calculateIncomeTaxForFiscalYear('2083/84', 1500000, { ssfEnrolled: true, female: false });
  // 1M at 0% + 500k at 10% = 50,000
  assert.equal(tax.totalTax, 50000);
  const rebate = calculateIncomeTaxForFiscalYear('2083/84', 1500000, { ssfEnrolled: true, female: true });
  assert.equal(rebate.rebate, 5000);
  assert.equal(rebate.totalTax, 45000);
});

test('SSF disabled: no SSF deduction and 1% SST applies', () => {
  const r = calculateNepalSalary(base({ ssfEnabled: false, income: { basicSalary: 80000, dearnessAllowance: 0, otherAllowances: 0, otherIncome: 0, overtimeAmount: 0, bonus: 0, commission: 0 } }));
  assert.equal(r.ssf.employee.total, 0);
  assert.equal(r.ssf.employer.total, 0);
  // 960,000 annual, no waiver -> 1% of 960k = 9,600
  assert.equal(r.tax.annual, 9600);
  assert.equal(r.tax.monthly, 800);
  assert.equal(r.net, 80000 - 800);
});

test('attendance: 30-day method unpaid leave deduction', () => {
  const r = calculateNepalSalary(base({
    income: { basicSalary: 30000, dearnessAllowance: 0, otherAllowances: 0, otherIncome: 0, overtimeAmount: 0, bonus: 0, commission: 0 },
    attendance: { calendarDays: 30, workingDays: 22, presentDays: 21, paidLeave: 0, unpaidLeave: 1, absentDays: 0, publicHolidays: 0, restDays: 8 },
    attendanceOptions: { deductionMethod: '30-day', includeAbsentAsUnpaid: false },
  }));
  assert.equal(r.attendance.deduction.amount, 1000); // 30000 / 30 * 1
  assert.equal(r.adjustedGross, 29000);
  assert.equal(r.attendance.reconciles, true); // 21+0+1+0+0+8 = 30
});

test('attendance: paid leave and rest days never cause a deduction', () => {
  const r = calculateNepalSalary(base({
    income: { basicSalary: 30000, dearnessAllowance: 0, otherAllowances: 0, otherIncome: 0, overtimeAmount: 0, bonus: 0, commission: 0 },
    attendance: { calendarDays: 30, workingDays: 22, presentDays: 12, paidLeave: 10, unpaidLeave: 0, absentDays: 0, publicHolidays: 0, restDays: 8 },
    attendanceOptions: { deductionMethod: '30-day', includeAbsentAsUnpaid: false },
  }));
  assert.equal(r.attendance.deduction.amount, 0);
  assert.equal(r.attendance.reconciles, true); // 12+10+0+0+0+8 = 30
});

test('attendance: unaccounted days are flagged, not auto-converted to absence', () => {
  const r = calculateNepalSalary(base({
    attendance: { calendarDays: 30, workingDays: 22, presentDays: 15, paidLeave: 0, unpaidLeave: 0, absentDays: 0, publicHolidays: 0, restDays: 8 },
  }));
  assert.equal(r.attendance.reconciles, false);
  assert.equal(r.attendance.unaccounted, 7);
  assert.equal(r.attendance.deduction.amount, 0, 'no deduction invented');
  assert.ok(r.warnings.some(w => /reconcile/i.test(w.message)));
});

test('attendance: absent days are NOT unpaid unless opted in', () => {
  const withOut = calculateNepalSalary(base({
    attendance: { calendarDays: 30, workingDays: 22, presentDays: 20, paidLeave: 0, unpaidLeave: 0, absentDays: 2, publicHolidays: 0, restDays: 8 },
    attendanceOptions: { deductionMethod: '30-day', includeAbsentAsUnpaid: false },
  }));
  assert.equal(withOut.attendance.deduction.amount, 0);

  const withIn = calculateNepalSalary(base({
    income: { basicSalary: 30000, dearnessAllowance: 0, otherAllowances: 0, otherIncome: 0, overtimeAmount: 0, bonus: 0, commission: 0 },
    attendance: { calendarDays: 30, workingDays: 22, presentDays: 20, paidLeave: 0, unpaidLeave: 0, absentDays: 2, publicHolidays: 0, restDays: 8 },
    attendanceOptions: { deductionMethod: '30-day', includeAbsentAsUnpaid: true },
  }));
  assert.equal(withIn.attendance.deduction.amount, 2000); // 30000/30*2
});

test('calendar-day and working-day methods use their own denominators', () => {
  const cal = calculateNepalSalary(base({
    income: { basicSalary: 30000, dearnessAllowance: 0, otherAllowances: 0, otherIncome: 0, overtimeAmount: 0, bonus: 0, commission: 0 },
    attendance: { calendarDays: 31, workingDays: 22, presentDays: 30, paidLeave: 0, unpaidLeave: 1, absentDays: 0, publicHolidays: 0, restDays: 8 },
    attendanceOptions: { deductionMethod: 'calendar', includeAbsentAsUnpaid: false },
  }));
  assert.equal(cal.attendance.deduction.amount, Math.round((30000 / 31) * 100) / 100);

  const wd = calculateNepalSalary(base({
    income: { basicSalary: 30000, dearnessAllowance: 0, otherAllowances: 0, otherIncome: 0, overtimeAmount: 0, bonus: 0, commission: 0 },
    attendance: { calendarDays: 31, workingDays: 22, presentDays: 21, paidLeave: 0, unpaidLeave: 1, absentDays: 0, publicHolidays: 0, restDays: 8 },
    attendanceOptions: { deductionMethod: 'working-day', includeAbsentAsUnpaid: false },
  }));
  assert.equal(wd.attendance.deduction.amount, Math.round((30000 / 22) * 100) / 100);
});

test('overtime: entered amount wins; hours+rate computes with formula; hours-only is never assumed', () => {
  const byAmount = calculateNepalSalary(base({ income: { basicSalary: 10000, dearnessAllowance: 0, otherAllowances: 0, otherIncome: 0, overtimeAmount: 0, bonus: 0, commission: 0 }, overtime: { amount: 2500 } }));
  assert.equal(byAmount.overtime.amount, 2500);
  assert.equal(byAmount.overtime.computed, false);
  assert.equal(byAmount.income.contractualGross, 12500);

  const byHours = calculateNepalSalary(base({ income: { basicSalary: 10000, dearnessAllowance: 0, otherAllowances: 0, otherIncome: 0, overtimeAmount: 0, bonus: 0, commission: 0 }, overtime: { hours: 5, rate: 400 } }));
  assert.equal(byHours.overtime.amount, 2000);
  assert.equal(byHours.overtime.computed, true);
  assert.ok(byHours.overtime.formula.includes('5 hrs'));

  const hoursOnly = calculateNepalSalary(base({ income: { basicSalary: 10000, dearnessAllowance: 0, otherAllowances: 0, otherIncome: 0, overtimeAmount: 0, bonus: 0, commission: 0 }, overtime: { hours: 5 } }));
  assert.equal(hoursOnly.overtime.amount, 0, 'no OT rate assumed');
  assert.equal(hoursOnly.overtime.needsVerification, true);
});

test('zero allowance / zero overtime produce clean zeros', () => {
  const r = calculateNepalSalary(base({
    income: { basicSalary: 50000, dearnessAllowance: 0, otherAllowances: 0, otherIncome: 0, overtimeAmount: 0, bonus: 0, commission: 0 },
  }));
  assert.equal(r.income.contractualGross, 50000);
  assert.equal(r.overtime.amount, 0);
});

test('negative inputs are clamped to zero', () => {
  const r = calculateNepalSalary(base({
    income: { basicSalary: -5000, dearnessAllowance: -100, otherAllowances: -200, otherIncome: -50, overtimeAmount: -10, bonus: -1, commission: -2 },
    deductions: { loan: -100, advance: -50, otherEmployee: -20 },
    attendance: { calendarDays: -30, workingDays: -22, presentDays: -20, paidLeave: -1, unpaidLeave: -1, absentDays: -1, publicHolidays: 0, restDays: -8 },
  }));
  assert.equal(r.income.contractualGross, 0);
  assert.equal(r.employeeDeductions.total, 0);
  assert.equal(r.net, 0);
});

test('SSF ceiling caps the contribution base when enabled', () => {
  const r = calculateNepalSalary(base({
    income: { basicSalary: 80000, dearnessAllowance: 0, otherAllowances: 0, otherIncome: 0, overtimeAmount: 0, bonus: 0, commission: 0 },
    ssfCeiling: { enabled: true, amount: 50000 },
  }));
  assert.equal(r.ssf.base, 50000);
  assert.equal(r.ssf.capped, true);
  assert.equal(r.ssf.employee.total, 5500);
  assert.equal(r.ssf.employer.total, 10000);

  const uncapped = calculateNepalSalary(base({
    income: { basicSalary: 80000, dearnessAllowance: 0, otherAllowances: 0, otherIncome: 0, overtimeAmount: 0, bonus: 0, commission: 0 },
    ssfCeiling: { enabled: false, amount: 50000 },
  }));
  assert.equal(uncapped.ssf.base, 80000);
});

test('insurance deductions are capped at 40k life / 20k health', () => {
  const r = calculateNepalSalary(base({
    income: { basicSalary: 200000, dearnessAllowance: 0, otherAllowances: 0, otherIncome: 0, overtimeAmount: 0, bonus: 0, commission: 0 },
    insurance: { life: 60000, health: 30000 },
  }));
  assert.equal(r.tax.lifeInsurance, 40000);
  assert.equal(r.tax.healthInsurance, 20000);
});

test('retirement deduction pool is capped at min(actual, 500k, 1/3 income)', () => {
  // annual income 600,000; pool 1,000,000 -> cap = 1/3 = 200,000
  const r = calculateNepalSalary(base({
    income: { basicSalary: 50000, dearnessAllowance: 0, otherAllowances: 0, otherIncome: 0, overtimeAmount: 0, bonus: 0, commission: 0 },
    otherRetirementAnnual: 1000000,
  }));
  assert.equal(r.tax.assessableAnnual, 600000);
  assert.equal(r.tax.retirementDeduction, 200000);
  // taxable = 600000 - 200000 = 400000, SSF waived -> 0 tax
  assert.equal(r.tax.taxableAnnual, 400000);
});

test('SSF helper: base resolution and contribution math', () => {
  const income = { basicSalary: 12170, dearnessAllowance: 7380, otherAllowances: 2016 };
  assert.equal(resolveSSFBase(income, 'basic').amount, 12170);
  assert.equal(resolveSSFBase(income, 'basic+da').amount, 19550);
  assert.equal(resolveSSFBase(income, 'gross').amount, 21566);
  assert.equal(resolveSSFBase(income, 'custom', 5000).amount, 5000);

  const ssf = calculateSSFContributions(12170, SSF_CURRENT);
  assert.equal(ssf.employee.total, 1338.70);
  assert.equal(ssf.employer.total, 2434.00);
  assert.equal(ssf.combined, 3772.70);
});

test('rounding tolerance: small differences match, large do not', () => {
  assert.equal(withinTolerance(1338.70, 1338.60).matches, true, '0.10 diff matches (abs <= 1.00)');
  assert.equal(withinTolerance(1338.70, 1338.90).matches, true);
  assert.equal(withinTolerance(24000, 24000.10).matches, true);
  assert.equal(withinTolerance(100000, 100500).matches, false, '0.5% diff does not match (relative > 0.1%)');
});

test('engine honors the selected fiscal year and falls back to current', () => {
  // FY 2082/83, no SSF: 700,000 annual -> 500k@1% + 200k@10% = 25,000
  const r = calculateNepalSalary(base({
    fiscalYear: '2082/83',
    income: { basicSalary: 58333.33, dearnessAllowance: 0, otherAllowances: 0, otherIncome: 0, overtimeAmount: 0, bonus: 0, commission: 0 },
    ssfEnabled: false,
  }));
  assert.equal(r.fiscalYear.id, '2082/83');
  assertMoney(r.tax.assessableAnnual, 699999.96);
  assertMoney(r.tax.annual, 25000);
  assertMoney(r.tax.monthly, 2083.33);

  // Unknown fiscal year falls back to the current default
  const fallback = calculateNepalSalary(base({ fiscalYear: '2084/85' }));
  assert.equal(fallback.fiscalYear.id, '2083/84');
});

test('deduction method registry defaults to Not specified', () => {
  assert.equal(getDeductionMethod('anything-unknown').id, 'not-specified');
  assert.equal(getDeductionMethod('30-day').formula.includes('÷ 30'), true);
});

test('per-component SSF: ssfApplicable selects the base (default basic only)', () => {
  const r = calculateNepalSalary(base());
  // Defaults: SSF base = basic salary only, everything taxable
  assert.equal(r.ssf.base, 12170);
  assert.deepEqual(r.income.ssfKeys, ['basicSalary']);
  assert.equal(r.income.components.find(c => c.key === 'basicSalary').ssfApplicable, true);
  assert.equal(r.income.components.find(c => c.key === 'dearnessAllowance').ssfApplicable, false);
});

test('per-component SSF: custom ssfApplicable includes DA + other allowances', () => {
  const r = calculateNepalSalary(base({
    ssfBaseMode: 'components',
    income: {
      ...base().income,
      ssfApplicable: ['basicSalary', 'dearnessAllowance', 'otherAllowances'],
    },
  }));
  assert.equal(r.ssf.base, 12170 + 7380 + 2016);
  assertMoney(r.ssf.employee.total, 21566 * 0.11);
  assertMoney(r.ssf.employer.total, 21566 * 0.20);
});

test('per-component taxable: excluding bonus/other income removes them from the tax base', () => {
  const r = calculateNepalSalary(base({
    income: {
      ...base().income,
      bonus: 5000,
      taxable: ['basicSalary', 'dearnessAllowance', 'otherAllowances'],
    },
  }));
  // Bonus is in gross but NOT in the taxable monthly base
  assert.equal(r.income.contractualGross, 24405.67 + 5000);
  assertMoney(r.income.taxableMonthly, 12170 + 7380 + 2016);
  assert.equal(r.tax.assessableAnnual, (12170 + 7380 + 2016) * 12);
  assert.ok(r.assumptions.some(a => /Taxable income base/.test(a.label)));
});

test('per-component taxable: attendance deduction scales with taxable share', () => {
  // Gross 30000 all taxable; 1 unpaid day via 30-day method -> 1000 deduction
  const r = calculateNepalSalary(base({
    income: { basicSalary: 30000, dearnessAllowance: 0, otherAllowances: 0, otherIncome: 0, overtimeAmount: 0, bonus: 0, commission: 0 },
    attendance: { calendarDays: 30, workingDays: 22, presentDays: 21, paidLeave: 0, unpaidLeave: 1, absentDays: 0, publicHolidays: 0, restDays: 8 },
    attendanceOptions: { deductionMethod: '30-day', includeAbsentAsUnpaid: false },
  }));
  // all taxable -> taxable base reduced 1:1
  assert.equal(r.attendance.deduction.amount, 1000);
  assert.equal(r.tax.assessableAnnual, 29000 * 12);
});

test('per-component taxable: non-taxable bonus keeps tax base high relative to gross', () => {
  // Basic 12170 all taxable; DA+other+otherIncome excluded from tax -> smaller base
  const r = calculateNepalSalary(base({
    income: {
      ...base().income,
      taxable: ['basicSalary'],
    },
  }));
  assert.equal(r.income.contractualGross, 24405.67);
  assertMoney(r.income.taxableMonthly, 12170);
  assert.equal(r.tax.assessableAnnual, 12170 * 12);
});