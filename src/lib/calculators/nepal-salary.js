/**
 * Nepal Salary Calculation Engine
 * ================================
 * Computes expected gross, attendance-adjusted gross, SSF, tax/TDS, employee
 * deductions and net salary using the versioned data in src/data/nepal/.
 *
 * ACCURACY PRINCIPLES:
 * - No tax/SSF rate is hard-coded here — everything comes from data modules.
 * - Employer SSF is NEVER subtracted from the employee's net salary.
 * - TDS is treated as the monthly withholding of the annual income tax, not
 *   a separate charge on top of it.
 * - Attendance deductions are assumptions, never invented.
 * - When a rule depends on employer practice, the engine returns it as an
 *   assumption + needs-verification flag instead of guessing.
 */

import { SSF_CURRENT, resolveSSFBase, applySSFCeiling, calculateSSFContributions } from '../../data/nepal/ssf/current.js';
import { getFiscalYearRules, getCurrentFiscalYear, calculateIncomeTaxForFiscalYear } from '../../data/nepal/tax/index.js';
import { getDeductionMethod } from '../../data/nepal/payroll/rules.js';

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const clamp0 = (n) => Math.max(0, Number(n) || 0);

/**
 * Resolve monthly income component amounts.
 * @param {object} income
 * @returns {{ components, resolved, taxableKeys, ssfKeys, taxableMonthly, ssfMonthly }}
 */
function resolveIncome(income = {}) {
  const components = [
    { key: 'basicSalary', label: 'Basic Salary' },
    { key: 'dearnessAllowance', label: 'Dearness Allowance' },
    { key: 'otherAllowances', label: 'Other Allowances' },
    { key: 'overtimeAmount', label: 'Overtime' },
    { key: 'bonus', label: 'Bonus' },
    { key: 'commission', label: 'Commission' },
    { key: 'otherIncome', label: 'Other Income' },
  ];
  const keys = components.map(c => c.key);
  const resolved = {};
  for (const c of components) {
    const value = c.key === 'overtimeAmount' ? (income.overtimeAmount ?? income.overtime) : income[c.key];
    resolved[c.key] = clamp0(value);
  }

  // Per-component tax treatment (default: everything taxable)
  const taxableKeys = Array.isArray(income.taxable) && income.taxable.length > 0
    ? income.taxable
    : keys;
  // Per-component SSF treatment (default: basic salary only — the official rule)
  const ssfKeys = Array.isArray(income.ssfApplicable) && income.ssfApplicable.length > 0
    ? income.ssfApplicable
    : ['basicSalary'];

  const taxableMonthly = keys.reduce((sum, k) => (taxableKeys.includes(k) ? sum + resolved[k] : sum), 0);
  const ssfMonthly = keys.reduce((sum, k) => (ssfKeys.includes(k) ? sum + resolved[k] : sum), 0);

  return { components, resolved, taxableKeys, ssfKeys, taxableMonthly, ssfMonthly };
}

/**
 * Resolve overtime (amount wins over hours × rate; never invents a rate).
 */
function resolveOvertime(input = {}, income = {}) {
  const ot = input.overtime || {};
  const hasOvertimeInput = ot.amount != null && ot.amount !== '' || (ot.hours != null && ot.hours !== '') || (ot.rate != null && ot.rate !== '');
  const explicitAmount = ot.amount != null && ot.amount !== '' ? clamp0(ot.amount) : null;
  const hours = clamp0(ot.hours);
  const rate = clamp0(ot.rate);

  if (explicitAmount !== null) {
    return {
      amount: explicitAmount,
      hours,
      rate,
      computed: false,
      formula: `Overtime amount entered directly: Rs. ${explicitAmount}`,
      assumption: 'Amount entered by user — used as entered.',
    };
  }
  if (hours > 0 && rate > 0) {
    const amount = hours * rate;
    return {
      amount,
      hours,
      rate,
      computed: true,
      formula: `${hours} hrs × Rs. ${rate}/hr = Rs. ${round2(amount)}`,
      assumption: 'Overtime = OT hours × OT rate as entered. The rate itself is an employer/contract assumption.',
    };
  }
  if (hours > 0 && rate <= 0) {
    return {
      amount: 0,
      hours,
      rate: 0,
      computed: false,
      formula: null,
      assumption: 'OT hours entered without a rate — no automatic OT rate is assumed. Enter an OT rate or an OT amount.',
      needsVerification: true,
    };
  }
  // No overtime object input at all: fall back to any raw overtime amount in income
  if (!hasOvertimeInput && income.overtimeAmount > 0) {
    return {
      amount: income.overtimeAmount,
      hours: 0,
      rate: 0,
      computed: false,
      formula: `Overtime amount entered directly: Rs. ${round2(income.overtimeAmount)}`,
      assumption: 'Amount entered by user — used as entered.',
    };
  }
  return { amount: 0, hours: 0, rate: 0, computed: false, formula: null, assumption: null };
}

/**
 * Resolve attendance: reconcile days, never force equality, never assume
 * absence is unpaid.
 */
function resolveAttendance(input = {}, options = {}) {
  const a = input.attendance || {};
  const days = {
    calendarDays: clamp0(a.calendarDays),
    workingDays: clamp0(a.workingDays),
    presentDays: clamp0(a.presentDays),
    paidLeave: clamp0(a.paidLeave),
    unpaidLeave: clamp0(a.unpaidLeave),
    absentDays: clamp0(a.absentDays),
    publicHolidays: clamp0(a.publicHolidays),
    restDays: clamp0(a.restDays),
  };

  const accounted =
    days.presentDays + days.paidLeave + days.unpaidLeave + days.absentDays + days.publicHolidays + days.restDays;
  const hasAnyDay = days.calendarDays > 0 || days.workingDays > 0;
  const unaccounted = hasAnyDay ? days.calendarDays - accounted : 0;
  const reconciles = !hasAnyDay || unaccounted === 0;

  const method = getDeductionMethod(options.deductionMethod || 'not-specified');
  const includeAbsent = Boolean(options.includeAbsentAsUnpaid);
  const unpaidDays = days.unpaidLeave + (includeAbsent ? days.absentDays : 0);

  const warnings = [];
  if (hasAnyDay && !reconciles) {
    warnings.push({
      level: 'warning',
      message: 'Attendance days do not fully reconcile with the calendar period.',
      detail: `Accounted: ${accounted} of ${days.calendarDays} calendar days. ${unaccounted} day(s) unaccounted.`,
      action: 'Review the attendance values. Unaccounted days are NOT automatically treated as absence.',
    });
  }
  if (days.absentDays > 0 && !includeAbsent) {
    warnings.push({
      level: 'info',
      message: 'Absent days are not treated as unpaid unless you choose to include them.',
      detail: 'The calculator does not assume every absence is an unpaid day.',
    });
  }

  return { days, accounted, unaccounted, reconciles, unpaidDays, method, includeAbsent, warnings };
}

/**
 * Compute the attendance/pay deduction from unpaid days.
 */
function computeAttendanceDeduction(grossMonthly, attendance, contractualGross) {
  const { days, unpaidDays, method } = attendance;
  if (unpaidDays <= 0 || grossMonthly <= 0) {
    return {
      amount: 0,
      formula: null,
      assumption: `No unpaid-day deduction. Unpaid leave: ${days.unpaidLeave} day(s)${attendance.includeAbsent ? ` + ${days.absentDays} absent day(s)` : ''}.`,
      methodId: method.id,
    };
  }

  let amount = 0;
  let formula = '';

  switch (method.id) {
    case 'calendar':
      amount = days.calendarDays > 0 ? (grossMonthly / days.calendarDays) * unpaidDays : 0;
      formula = `Rs. ${round2(grossMonthly)} ÷ ${days.calendarDays} calendar days × ${unpaidDays} unpaid days`;
      break;
    case '30-day':
      amount = (grossMonthly / 30) * unpaidDays;
      formula = `Rs. ${round2(grossMonthly)} ÷ 30 (30-day method) × ${unpaidDays} unpaid days`;
      break;
    case 'working-day':
      amount = days.workingDays > 0 ? (grossMonthly / days.workingDays) * unpaidDays : 0;
      formula = `Rs. ${round2(grossMonthly)} ÷ ${days.workingDays} working days × ${unpaidDays} unpaid days`;
      break;
    case 'employer-contract':
      amount = null; // cannot compute without the contract rule
      formula = null;
      return {
        amount: null,
        formula: null,
        methodId: method.id,
        assumption:
          'Employer/Contract method selected — the deduction depends on the employment contract and cannot be computed here. Enter the unpaid-leave deduction amount manually in "Other employee deductions" if known.',
        needsVerification: true,
      };
    case 'not-specified':
    default:
      amount = 0;
      formula = null;
      return {
        amount: 0,
        formula: null,
        methodId: method.id,
        assumption:
          'No salary-deduction method selected. The unpaid leave deduction is NOT computed automatically (no method invented). Enter the deduction amount manually if your employer applied one.',
        needsVerification: unpaidDays > 0,
      };
  }

  return {
    amount: round2(amount),
    formula,
    assumption: `Salary deduction method: ${method.label}. ${formula}. This is a calculation method, not a universal legal rule — verify the employer\u2019s actual practice.`,
    methodId: method.id,
  };
}

/**
 * Reduce taxable earnings by the attendance deduction in proportion to the
 * taxable portion of gross. If taxable earnings are the full gross, the
 * attendance deduction reduces them 1:1.
 */
function adjustForAttendance(taxableMonthly, attendanceAmount, gross) {
  if (!attendanceAmount || taxableMonthly <= 0) return taxableMonthly;
  if (gross <= 0) return Math.max(0, taxableMonthly - (attendanceAmount || 0));
  const ratio = Math.min(1, taxableMonthly / gross);
  return Math.max(0, taxableMonthly - (attendanceAmount || 0) * ratio);
}

/**
 * Main entry: calculate the expected salary breakdown.
 * @param {object} input
 * @returns {object} full expected calculation
 */
export function calculateNepalSalary(input = {}) {
  const fyRules = getFiscalYearRules(input.fiscalYear) || getCurrentFiscalYear();

  // ---- Income ----
  const { components, resolved, taxableKeys, ssfKeys, taxableMonthly: taxableMonthlyRaw, ssfMonthly } = resolveIncome(input.income);

  // Overtime may override the raw income.overtimeAmount when hours/rate are entered
  const overtime = resolveOvertime(input, resolved);
  resolved.overtimeAmount = overtime.amount;

  const contractualGross = round2(
    resolved.basicSalary + resolved.dearnessAllowance + resolved.otherAllowances +
    resolved.overtimeAmount + resolved.bonus + resolved.commission + resolved.otherIncome
  );

  // ---- Attendance ----
  const attendance = resolveAttendance(input, input.attendanceOptions || {});
  const attendanceDeduction = computeAttendanceDeduction(contractualGross, attendance, resolved);
  const adjustedGross =
    attendanceDeduction.amount === null
      ? null
      : round2(contractualGross - (attendanceDeduction.amount || 0));

  const warnings = [...attendance.warnings];
  if (attendanceDeduction.needsVerification) {
    warnings.push({
      level: 'warning',
      message: 'Attendance deduction depends on an employer-specific rule.',
      detail: attendanceDeduction.assumption,
    });
  }

  // ---- SSF ----
  const ssfConfig = {
    enabled: input.ssfEnabled !== false,
    baseMode: input.ssfBaseMode || 'basic',
    customBase: clamp0(input.ssfCustomBase),
    ceiling: input.ssfCeiling || { enabled: false, amount: 50000 },
  };

  let ssf = {
    base: 0,
    baseLabel: 'Disabled',
    capped: false,
    manual: false,
    employee: { total: 0, rate: 0 },
    employer: { total: 0, rate: 0 },
    combined: 0,
  };

  if (ssfConfig.enabled) {
    const baseResolved = resolveSSFBase(resolved, ssfConfig.baseMode, ssfConfig.customBase, ssfKeys);
    const withCeiling = applySSFCeiling(baseResolved.amount, ssfConfig.ceiling);
    ssf = calculateSSFContributions(withCeiling.amount, SSF_CURRENT);
    ssf.baseLabel = baseResolved.label;
    ssf.capped = withCeiling.capped;
    if (withCeiling.capped) {
      warnings.push({
        level: 'info',
        message: 'SSF contribution base capped at the configured ceiling.',
        detail: `Base reduced from Rs. ${round2(baseResolved.amount)} to Rs. ${round2(withCeiling.amount)}. This ceiling is NOT officially confirmed — verify it.`,
      });
    }
  }

  // Manual SSF entry overrides auto-calculated contributions. Real employer
  // practices vary (some use basic+DA or a different base), so letting the
  // user type the exact amounts their payslip shows is the most accurate path.
  const manualSSF = input.ssfManual || {};
  const hasManualEmployee = manualSSF.employee != null && Number.isFinite(Number(manualSSF.employee));
  const hasManualEmployer = manualSSF.employer != null && Number.isFinite(Number(manualSSF.employer));
  if (ssfConfig.enabled && (hasManualEmployee || hasManualEmployer)) {
    const autoEmp = ssf.employee.total;
    const autoEmr = ssf.employer.total;
    const empTotal = hasManualEmployee ? clamp0(manualSSF.employee) : autoEmp;
    const emrTotal = hasManualEmployer ? clamp0(manualSSF.employer) : autoEmr;
    ssf = {
      base: hasManualEmployee ? round2(empTotal / SSF_CURRENT.employee.rate) : ssf.base,
      baseLabel: hasManualEmployee ? 'Entered manually (from your SSF amount)' : ssf.baseLabel,
      capped: false,
      manual: true,
      employee: { total: round2(empTotal), rate: SSF_CURRENT.employee.rate, breakdown: [] },
      employer: { total: round2(emrTotal), rate: SSF_CURRENT.employer.rate, breakdown: [] },
      combined: round2(empTotal + emrTotal),
    };
  }

  // ---- Tax / TDS ----
  // Taxable income is based on the components marked taxable in the Income
  // section (default: all). Attendance adjustments apply to taxable earnings
  // proportionally for the month.
  const taxableMonthly = round2(adjustForAttendance(taxableMonthlyRaw, attendanceDeduction.amount, contractualGross));
  const assessableAnnual = round2(taxableMonthly * 12);

  const employeeSSFAnnual = round2(ssf.employee.total * 12);
  const employerSSFAnnual = round2(ssf.employer.total * 12);
  const otherRetirementAnnual = clamp0(input.otherRetirementAnnual);

  const retirementPool = round2(employeeSSFAnnual + employerSSFAnnual + otherRetirementAnnual);
  const retirementCap = Math.min(retirementPool, fyRules.deductions.retirement.capAbsolute, assessableAnnual / 3);
  const retirementDeduction = round2(Math.max(0, Math.min(retirementPool, retirementCap)));

  const lifeInsurance = Math.min(clamp0(input.insurance?.life), fyRules.deductions.lifeInsurance.max);
  const healthInsurance = Math.min(clamp0(input.insurance?.health), fyRules.deductions.healthInsurance.max);

  const taxableAnnual = round2(Math.max(0, assessableAnnual - retirementDeduction - lifeInsurance - healthInsurance));

  const ssfEnrolled = ssfConfig.enabled && ssf.employee.total > 0;
  const approvedFundContributor = otherRetirementAnnual > 0;
  const sstWaived = ssfEnrolled || approvedFundContributor;

  const tax = calculateIncomeTaxForFiscalYear(fyRules.id, taxableAnnual, {
    filingStatus: input.filingStatus || 'individual',
    ssfEnrolled: sstWaived,
    female: Boolean(input.female),
  });

  const monthlyTax = round2(tax.totalTax / 12);

  // ---- Employee-side deductions ----
  const loan = clamp0(input.deductions?.loan);
  const advance = clamp0(input.deductions?.advance);
  const otherEmployee = clamp0(input.deductions?.otherEmployee);

  const employeeDeductions = {
    employeeSSF: ssf.employee.total,
    tax: monthlyTax,
    tds: monthlyTax, // TDS = monthly withholding of the same annual tax
    loan,
    advance,
    otherEmployee,
    total: round2(ssf.employee.total + monthlyTax + loan + advance + otherEmployee),
  };

  const net =
    adjustedGross === null
      ? null
      : round2(adjustedGross - employeeDeductions.total);

  // ---- Employer side ----
  const employerSide = {
    employerSSF: ssf.employer.total,
    totalEmployerCost: adjustedGross === null ? null : round2(adjustedGross + ssf.employer.total),
  };

  // ---- Assumptions ledger (transparency) ----
  const assumptions = [
    {
      label: 'Fiscal year',
      value: `${fyRules.label} (${fyRules.bs})`,
      note: fyRules.needsVerification ? 'Verify the gazetted rates on ird.gov.np.' : 'Verified.',
    },
    {
      label: 'SSF contribution base',
      value: ssfConfig.enabled ? `${ssf.baseLabel} (Rs. ${round2(ssf.base)})` : 'Not applicable (SSF disabled)',
      note: 'Official SSF rule: basic salary only. Select a different base only if your employer treats other components as basic remuneration.',
    },
    {
      label: 'Employee SSF rate',
      value: `${(ssf.employee.rate * 100).toFixed(0)}%`,
      note: '10% pension fund + 1% social security tax. Source: SSF Nepal (Act 2074).',
    },
    {
      label: 'Employer SSF rate',
      value: `${(ssf.employer.rate * 100).toFixed(0)}%`,
      note: 'Paid by the employer on top of salary — NOT deducted from your net pay.',
    },
    {
      label: 'Salary deduction method',
      value: getDeductionMethod(input.attendanceOptions?.deductionMethod || 'not-specified').label,
      note: 'Calculation assumption — verify the employer\u2019s payroll rule.',
    },
    {
      label: 'Taxpayer category',
      value: input.filingStatus === 'couple' ? 'Couple' : 'Individual',
      note: fyRules.unified ? 'FY 2083/84 uses one unified schedule for all individuals.' : 'FY 2082/83 has separate single/couple schedules.',
    },
    {
      label: 'Social Security Tax waiver',
      value: sstWaived ? 'Applied (0% on first slab)' : 'Not applied (1% on first slab)',
      note: 'The 1% first-slab SST is waived for SSF / approved retirement-fund contributors.',
    },
    {
      label: 'Retirement fund deduction',
      value: `Rs. ${round2(retirementDeduction)} / year`,
      note: `Pool (SSF emp + SSF emp'r + CIT/PF = Rs. ${round2(retirementPool)}) capped at the lower of actual, Rs. 5,00,000, or ⅓ of assessable income (Rs. ${round2(assessableAnnual / 3)}).`,
    },
    {
      label: 'Taxable income base',
      value: `Rs. ${round2(taxableMonthly)} / month (annualised: Rs. ${round2(assessableAnnual)})`,
      note: taxableKeys.length === components.length
        ? 'All income components are treated as taxable.'
        : `Only these components are treated as taxable: ${taxableKeys.map(k => components.find(c => c.key === k)?.label).filter(Boolean).join(', ')}.`,
    },
  ];

  if (input.female) {
    assumptions.push({ label: 'Female rebate', value: '10% of computed tax applied', note: fyRules.rebates?.female?.note || '' });
  }

  // ---- Return ----
  return {
    fiscalYear: {
      id: fyRules.id,
      label: fyRules.label,
      bs: fyRules.bs,
      needsVerification: fyRules.needsVerification,
      verificationNote: fyRules.verificationNote,
      source: fyRules.source,
      lastVerified: fyRules.lastVerified,
    },

    income: {
      components: components.map(c => ({
        key: c.key,
        label: c.label,
        amount: round2(resolved[c.key]),
        taxable: taxableKeys.includes(c.key),
        ssfApplicable: ssfKeys.includes(c.key),
      })),
      contractualGross,
      taxableMonthly: round2(taxableMonthly),
      taxableKeys,
      ssfKeys,
    },

    overtime,

    attendance: {
      days: attendance.days,
      accounted: attendance.accounted,
      unaccounted: attendance.unaccounted,
      reconciles: attendance.reconciles,
      deduction: attendanceDeduction,
    },

    adjustedGross,

    ssf: {
      base: round2(ssf.base),
      baseLabel: ssf.baseLabel,
      capped: ssf.capped,
      manual: Boolean(ssf.manual),
      employee: {
        rate: ssf.employee.rate,
        breakdown: ssf.employee.breakdown || [],
        total: round2(ssf.employee.total),
      },
      employer: {
        rate: ssf.employer.rate,
        breakdown: ssf.employer.breakdown || [],
        total: round2(ssf.employer.total),
      },
      combined: round2(ssf.combined),
      source: SSF_CURRENT.source,
      lastVerified: SSF_CURRENT.lastVerified,
    },

    tax: {
      assessableAnnual,
      retirementDeduction,
      retirementPool,
      lifeInsurance,
      healthInsurance,
      taxableAnnual,
      sstWaived,
      female: Boolean(input.female),
      rebate: tax.rebate,
      sstWaiver: tax.sstWaiver,
      annual: tax.totalTax,
      monthly: monthlyTax,
      slabs: tax.slabs,
      tdsSameAsTax: true,
      tdsNote: fyRules.tds.note,
    },

    tds: {
      monthly: monthlyTax,
      note: fyRules.tds.note,
    },

    employeeDeductions,

    net,

    employerSide,

    assumptions,
    warnings,
  };
}