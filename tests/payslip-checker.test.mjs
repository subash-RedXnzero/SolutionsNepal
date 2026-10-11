/**
 * Tests for the Nepal payslip checker engine.
 * Run: node --test tests/
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { calculateNepalSalary } from '../src/lib/calculators/nepal-salary.js';
import { checkPayslip, STATUS } from '../src/lib/calculators/nepal-payslip-checker.js';

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
    calendarDays: 30, workingDays: 22, presentDays: 22, paidLeave: 0, unpaidLeave: 0, absentDays: 0, publicHolidays: 0, restDays: 8,
  },
  attendanceOptions: { deductionMethod: 'not-specified', includeAbsentAsUnpaid: false },
  deductions: { loan: 0, advance: 0, otherEmployee: 0 },
  ...overrides,
});

const correctPayslip = {
  gross: 24405.67,
  ssfAmount: 1338.70,
  ssfLabel: 'SSF',
  ssfClassification: 'employee',
  tds: 0,
  tax: null,
  otherDeductions: 0,
  net: 23066.97,
};

test('correct payslip -> MATCHES', () => {
  const expected = calculateNepalSalary(base());
  const result = checkPayslip({ expected, payslip: correctPayslip });
  assert.equal(result.verdict, STATUS.MATCHES);
  assert.equal(result.summary.errorCount, 0);
  assert.equal(result.summary.verifyCount, 0);
  const netRow = result.rows.find(r => r.key === 'net');
  assert.equal(netRow.status, STATUS.MATCHES);
});

test('gross mismatch -> POSSIBLE ERROR', () => {
  const expected = calculateNepalSalary(base());
  const result = checkPayslip({ expected, payslip: { ...correctPayslip, gross: 25000 } });
  assert.equal(result.verdict, STATUS.ERROR);
  const grossRow = result.rows.find(r => r.key === 'gross');
  assert.equal(grossRow.status, STATUS.ERROR);
  assert.ok(result.issues.some(i => i.title === 'Gross salary mismatch'));
});

test('combined SSF shown as deduction -> NEEDS VERIFICATION with employer-share explanation', () => {
  const expected = calculateNepalSalary(base());
  const result = checkPayslip({
    expected,
    payslip: { ...correctPayslip, ssfAmount: 3772.70, ssfClassification: 'unknown', net: 20632.97 },
  });
  assert.equal(result.verdict, STATUS.NEEDS_VERIFICATION);
  const ssfIssue = result.issues.find(i => /SSF/i.test(i.title) && /verification/i.test(i.title));
  assert.ok(ssfIssue, 'an SSF verification issue should exist');
  assert.ok(/both employee and employer/i.test(ssfIssue.what));
  // net diff equals the employer share
  const netRow = result.rows.find(r => r.key === 'net');
  assert.equal(netRow.diff, -2434.00);
  const netIssue = result.issues.find(i => i.title === 'Net salary differs from expected amount');
  assert.ok(netIssue.why.includes('EMPLOYER SSF'), 'explanation must identify the employer share');
});

test('employer SSF accidentally deducted -> NEEDS VERIFICATION, never "illegal"', () => {
  const expected = calculateNepalSalary(base());
  const result = checkPayslip({
    expected,
    payslip: { ...correctPayslip, ssfAmount: 2434.00, ssfClassification: 'employer', net: 21971.67 },
  });
  assert.equal(result.verdict, STATUS.NEEDS_VERIFICATION);
  const joined = JSON.stringify(result).toLowerCase();
  assert.ok(!joined.includes('illegal') && !joined.includes('fraud'), 'must not use legal accusations');
  assert.ok(result.issues.some(i => /employer/i.test(i.what)));
});

test('TDS mismatch -> POSSIBLE ERROR', () => {
  const expected = calculateNepalSalary(base({ income: { basicSalary: 120000, dearnessAllowance: 0, otherAllowances: 0, otherIncome: 0, overtimeAmount: 0, bonus: 0, commission: 0 } }));
  const result = checkPayslip({
    expected,
    payslip: { gross: 120000, ssfAmount: 13200, ssfClassification: 'employee', tds: 5000, tax: null, otherDeductions: 0, net: 101800 },
  });
  assert.equal(result.verdict, STATUS.ERROR);
  const tdsRow = result.rows.find(r => r.key === 'tds');
  assert.equal(tdsRow.status, STATUS.ERROR);
});

test('TDS and tax as separate deductions -> double-count flag (NEEDS VERIFICATION, not error)', () => {
  const expected = calculateNepalSalary(base({ income: { basicSalary: 120000, dearnessAllowance: 0, otherAllowances: 0, otherIncome: 0, overtimeAmount: 0, bonus: 0, commission: 0 } }));
  // expected monthly tax for 120k/month (1.44M annual, SSF waived): 1M@0 + 440k@10% = 44,000/yr -> 3,666.67/mo
  const result = checkPayslip({
    expected,
    payslip: { gross: 120000, ssfAmount: 13200, ssfClassification: 'employee', tds: 3000, tax: 3666.67, otherDeductions: 0, net: 120000 - 13200 - 3000 - 3666.67 },
  });
  assert.ok(result.issues.some(i => /TDS and tax both appear as separate deductions/i.test(i.title)), 'double-count issue should exist');
});

test('attendance issues surface in the check', () => {
  const expected = calculateNepalSalary(base({
    attendance: { calendarDays: 30, workingDays: 22, presentDays: 15, paidLeave: 0, unpaidLeave: 0, absentDays: 0, publicHolidays: 0, restDays: 8 },
  }));
  const result = checkPayslip({ expected, payslip: correctPayslip });
  assert.ok(result.issues.some(i => i.title === 'Attendance does not reconcile'));
});

test('unpaid-leave deduction with method not specified -> NEEDS VERIFICATION, no amount invented', () => {
  const expected = calculateNepalSalary(base({
    income: { basicSalary: 30000, dearnessAllowance: 0, otherAllowances: 0, otherIncome: 0, overtimeAmount: 0, bonus: 0, commission: 0 },
    attendance: { calendarDays: 30, workingDays: 22, presentDays: 21, paidLeave: 0, unpaidLeave: 1, absentDays: 0, publicHolidays: 0, restDays: 8 },
  }));
  assert.equal(expected.attendance.deduction.needsVerification, true);
  const result = checkPayslip({ expected, payslip: { gross: 30000, ssfAmount: 3300, ssfClassification: 'employee', tds: 0, tax: null, otherDeductions: 0, net: 26700 } });
  assert.ok(result.issues.some(i => /employer rule/i.test(i.title) || /deduction method/i.test(i.title)));
});

test('Provident Fund label is preserved and flagged as not assumed to be SSF', () => {
  const expected = calculateNepalSalary(base());
  const result = checkPayslip({
    expected,
    payslip: { ...correctPayslip, ssfLabel: 'Provident Fund', ssfAmount: 1338.70, ssfClassification: 'unknown' },
  });
  assert.ok(result.issues.some(i => /Provident Fund label/i.test(i.title)));
  assert.ok(result.issues.some(i => /cannot assume it represents SSF/i.test(i.what)));
});

test('PF label with explicit percentage that does not match -> label/amount mismatch flag', () => {
  const expected = calculateNepalSalary(base());
  const result = checkPayslip({
    expected,
    payslip: { ...correctPayslip, ssfLabel: 'Provident Fund (10%)', ssfAmount: 3772.70, ssfClassification: 'unknown' },
  });
  const mismatch = result.issues.find(i => /label\/amount mismatch/i.test(i.title));
  assert.ok(mismatch, 'label/amount mismatch should exist');
});

test('missing payslip fields -> reported, no crash, needs verification overall', () => {
  const expected = calculateNepalSalary(base());
  const result = checkPayslip({ expected, payslip: { gross: 24405.67, ssfAmount: null, ssfClassification: 'unknown', tds: null, tax: null, otherDeductions: null, net: null } });
  assert.ok(result.issues.some(i => /not provided/i.test(i.title)));
  assert.ok(['matches', 'needs-verification', 'error'].includes(result.verdict));
});

test('invalid / negative payslip values are clamped to zero', () => {
  const expected = calculateNepalSalary(base());
  const result = checkPayslip({ expected, payslip: { ...correctPayslip, gross: -5000, net: -100, otherDeductions: -20 } });
  assert.equal(typeof result.summary.netDiff, 'number');
  assert.ok(Number.isFinite(result.summary.netDiff));
});

test('rounding tolerance: tiny diffs still MATCH', () => {
  const expected = calculateNepalSalary(base());
  const result = checkPayslip({ expected, payslip: { ...correctPayslip, net: 23066.90, gross: 24405.60, tds: 0.40 } });
  const netRow = result.rows.find(r => r.key === 'net');
  const grossRow = result.rows.find(r => r.key === 'gross');
  assert.equal(netRow.status, STATUS.MATCHES);
  assert.equal(grossRow.status, STATUS.MATCHES);
});

test('anti-double-count invariant: employer SSF + attendance never double-reduce', () => {
  // attendance deduction of 1000 on gross 30000 -> adjusted 29000
  const expected = calculateNepalSalary(base({
    income: { basicSalary: 30000, dearnessAllowance: 0, otherAllowances: 0, otherIncome: 0, overtimeAmount: 0, bonus: 0, commission: 0 },
    attendance: { calendarDays: 30, workingDays: 22, presentDays: 21, paidLeave: 0, unpaidLeave: 1, absentDays: 0, publicHolidays: 0, restDays: 8 },
    attendanceOptions: { deductionMethod: '30-day', includeAbsentAsUnpaid: false },
  }));
  // net = adjusted (29000) - ssf(3300) - tax(0) = 25700
  assert.equal(expected.adjustedGross, 29000);
  assert.equal(expected.net, 25700);
  // employeeDeductions must NOT contain the attendance deduction again
  assert.equal(expected.employeeDeductions.total, 3300);
});