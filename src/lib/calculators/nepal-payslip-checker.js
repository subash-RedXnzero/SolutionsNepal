/**
 * Nepal Payslip Checker Engine
 * ============================
 * Compares an expected calculation (from nepal-salary.js) against actual
 * payslip values and produces:
 *   - per-component comparison rows (expected / payslip / diff / status)
 *   - a three-level overall verdict (matches / needs-verification / error)
 *   - an issues list, each explaining WHAT differs, BY HOW MUCH, WHY,
 *     WHICH assumption caused it, and WHAT to verify.
 *
 * STATUS LANGUAGE (never "illegal" or "fraud"):
 *   🟢 MATCHES              — within rounding tolerance, no assumption issue
 *   🟡 NEEDS VERIFICATION   — depends on employer-specific rule / unclear
 *                            payslip labeling / an assumption
 *   🔴 POSSIBLE ERROR       — numeric mismatch unexplained by the selected
 *                            assumptions
 *
 * KEY GUARDS:
 *   - Employer SSF is never subtracted from employee net salary.
 *   - TDS is the monthly withholding of annual tax — never double counted.
 *   - SSF shown as "combined" in a deduction line is flagged, not declared
 *     illegal.
 *   - "Provident Fund" label is preserved; it is not auto-renamed to SSF.
 */

import { withinTolerance } from '../../data/nepal/payroll/rules.js';

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

export const STATUS = {
  MATCHES: 'matches',
  NEEDS_VERIFICATION: 'needs-verification',
  ERROR: 'error',
};

/**
 * Classify a raw SSF amount on the payslip.
 * @param {number|null} payslipAmount
 * @param {string} classification - 'employee' | 'employer' | 'combined' | 'unknown'
 * @param {object} expectedSSF - { employee:{total}, employer:{total}, combined }
 * @returns {object} { status, detail, employerShareIncluded }
 */
function classifySSF(payslipAmount, classification, expectedSSF) {
  const emp = expectedSSF.employee.total;
  const emr = expectedSSF.employer.total;
  const combined = expectedSSF.combined;

  if (payslipAmount == null) {
    return { status: 'not-provided', detail: 'No SSF amount on the payslip.', employerShareIncluded: null };
  }

  const matchEmp = withinTolerance(emp, payslipAmount).matches;
  const matchEmr = withinTolerance(emr, payslipAmount).matches;
  const matchCombined = withinTolerance(combined, payslipAmount).matches;

  switch (classification) {
    case 'employee':
      if (matchEmp) {
        return { status: STATUS.MATCHES, detail: 'Matches the expected employee SSF contribution.', employerShareIncluded: false };
      }
      if (matchCombined) {
        return {
          status: STATUS.NEEDS_VERIFICATION,
          detail:
            'The amount matches the COMBINED employee + employer contribution. The employer share should not normally be deducted from your salary.',
          employerShareIncluded: true,
        };
      }
      return { status: STATUS.ERROR, detail: 'Does not match the expected employee SSF contribution.', employerShareIncluded: null };

    case 'employer':
      if (matchEmr) {
        return {
          status: STATUS.NEEDS_VERIFICATION,
          detail: 'This matches the EMPLOYER SSF contribution. If it was deducted from your salary, that is an issue to verify — the employer share is normally paid by the employer on top of salary.',
          employerShareIncluded: true,
        };
      }
      return { status: STATUS.NEEDS_VERIFICATION, detail: 'Does not match the expected employer SSF contribution.', employerShareIncluded: null };

    case 'combined':
      if (matchCombined) {
        return {
          status: STATUS.NEEDS_VERIFICATION,
          detail: 'The amount matches the combined employee + employer contribution. Employer share should not normally be treated as an employee deduction.',
          employerShareIncluded: true,
        };
      }
      return { status: STATUS.NEEDS_VERIFICATION, detail: 'Does not match the combined expected contribution.', employerShareIncluded: null };

    case 'unknown':
    default:
      if (matchEmp) {
        return {
          status: STATUS.MATCHES,
          detail: 'Assumed to be the EMPLOYEE SSF contribution (matches). Confirm the payslip actually labels this as the employee share.',
          employerShareIncluded: false,
        };
      }
      if (matchEmr) {
        return {
          status: STATUS.NEEDS_VERIFICATION,
          detail: 'The amount matches the EMPLOYER SSF contribution. If shown under employee deductions, verify — the employer share should not reduce your pay.',
          employerShareIncluded: true,
        };
      }
      if (matchCombined) {
        return {
          status: STATUS.NEEDS_VERIFICATION,
          detail:
            '⚠️ Possible SSF deduction issue: the amount shown may include both employee and employer contributions. The employer contribution should not normally be treated as an employee salary deduction. Please verify how your employer has presented this amount.',
          employerShareIncluded: true,
        };
      }
      return { status: STATUS.NEEDS_VERIFICATION, detail: 'Cannot match this amount to the expected employee, employer, or combined SSF contribution.', employerShareIncluded: null };
  }
}

/**
 * Detect a contribution label/amount mismatch (e.g. "Provident Fund (10%)").
 * @param {string} label
 * @param {number|null} amount
 * @param {object} expectedSSF
 * @returns {object|null}
 */
function detectLabelMismatch(label, amount, expectedSSF) {
  if (!label || amount == null) return null;
  const pctMatch = label.match(/(\d+(?:\.\d+)?)\s*%/);
  if (!pctMatch) return null;
  const pct = parseFloat(pctMatch[1]) / 100;
  const expectedForPct = round2(expectedSSF.base * pct);
  if (!withinTolerance(expectedForPct, amount).matches) {
    return {
      status: STATUS.NEEDS_VERIFICATION,
      title: 'Contribution label/amount mismatch',
      what: `The payslip labels this as "${label}" (${pctMatch[1]}%), but the amount does not equal ${pctMatch[1]}% of the SSF base.`,
      expected: expectedForPct,
      actual: amount,
      diff: round2(amount - expectedForPct),
      why: 'The label and the amount do not reconcile mathematically.',
      verify: 'Check how the contribution is recorded and what base/percentage was actually used.',
    };
  }
  return null;
}

/**
 * Check a payslip against an expected calculation.
 * @param {object} params
 * @param {object} params.expected - output of calculateNepalSalary
 * @param {object} params.payslip - actual payslip values
 * @param {boolean} params.ssfIsADeduction - is the SSF line listed under deductions
 * @returns {object} { rows, verdict, issues, summary }
 */
export function checkPayslip({ expected, payslip = {}, ssfIsADeduction = true }) {
  const p = payslip;
  const rows = [];
  const issues = [];

  const makeIssue = ({ title, what, expected, actual, diff, why, verify, status = STATUS.NEEDS_VERIFICATION }) => {
    issues.push({
      status,
      title,
      what,
      expected: expected == null ? null : round2(expected),
      actual: actual == null ? null : round2(actual),
      diff: diff == null ? null : round2(diff),
      why,
      verify,
    });
  };

  // ---- Gross ----
  {
    const exp = expected.income.contractualGross;
    const act = p.gross;
    if (act == null) {
      rows.push({ key: 'gross', label: 'Gross Salary', expected: exp, actual: null, diff: null, status: 'not-provided' });
      makeIssue({
        title: 'Payslip gross salary not provided',
        what: 'No gross salary found on the payslip to compare against the expected gross.',
        expected: exp, actual: null, diff: null,
        why: 'The payslip may not show a separate gross line.',
        verify: 'Find the gross earnings line on the payslip and enter it.',
      });
    } else {
      const { diff, matches } = withinTolerance(exp, act);
      const status = matches ? STATUS.MATCHES : STATUS.ERROR;
      rows.push({ key: 'gross', label: 'Gross Salary', expected: exp, actual: act, diff, status });
      if (!matches) {
        makeIssue({
          title: 'Gross salary mismatch',
          what: 'The gross salary on the payslip differs from the expected gross earnings.',
          expected: exp, actual: act, diff,
          why: 'A component may differ from what you entered, or the payslip gross may already include an attendance adjustment.',
          verify: 'Compare each income component (basic, allowances, OT, bonus) on the payslip against the expected values.',
          status: STATUS.ERROR,
        });
      }
    }
  }

  // ---- SSF ----
  const ssfRaw = p.ssfAmount;
  const ssfClassification = p.ssfClassification || 'unknown';
  const ssfLabel = (p.ssfLabel || 'SSF').trim();
  const isPF = /provident\s*fund/i.test(ssfLabel) && !/ssf/i.test(ssfLabel);

  const ssfResult = classifySSF(ssfRaw, ssfClassification, expected.ssf);

  // Compare the payslip SSF line against the EMPLOYEE share (the deduction side)
  const ssfEmployeeExpected = expected.ssf.employee.total;
  const ssfCompare = ssfRaw == null ? { diff: null, matches: false } : withinTolerance(ssfEmployeeExpected, ssfRaw);
  const ssfDeductionRow = {
    key: 'ssf',
    label: `${ssfLabel} shown on payslip`,
    expected: ssfClassification === 'employee' || ssfClassification === 'unknown'
      ? ssfEmployeeExpected
      : ssfClassification === 'combined' ? expected.ssf.combined : expected.ssf.employer.total,
    actual: ssfRaw,
    diff: ssfRaw == null ? null : ssfCompare.diff,
    status: ssfResult.status,
  };
  rows.push(ssfDeductionRow);

  if (isPF) {
    rows.push({
      key: 'pf-note',
      label: 'Provident Fund label note',
      expected: null, actual: null, diff: null,
      status: STATUS.NEEDS_VERIFICATION,
      note: `The payslip uses the label "${ssfLabel}". This calculator cannot assume it represents SSF. Verify the actual contribution type. If you confirm it is SSF, re-run with the SSF classification set to your choice.`,
    });
    issues.push({
      status: STATUS.NEEDS_VERIFICATION,
      title: 'Provident Fund label cannot be assumed to be SSF',
      what: `The payslip uses the label "${ssfLabel}". This calculator cannot assume it represents SSF. Please verify the actual contribution type. If you confirm it is SSF, set the SSF classification to your choice and re-run the check.`,
      expected: null, actual: ssfRaw, diff: null,
      why: 'This calculator preserves the original payslip label and does not auto-rename Provident Fund to SSF.',
      verify: 'Confirm whether the contribution is actually SSF, an old-style PF, or another fund, then set the SSF classification accordingly.',
    });
  } else if (ssfResult.status !== STATUS.MATCHES || ssfResult.employerShareIncluded) {
    makeIssue({
      title: ssfResult.employerShareIncluded ? 'SSF contribution needs verification' : 'SSF contribution needs verification',
      what: ssfResult.detail,
      expected: ssfEmployeeExpected,
      actual: ssfRaw,
      diff: ssfRaw == null ? null : ssfCompare.diff,
      why: ssfResult.employerShareIncluded
        ? 'The amount appears to include both employee and employer contributions.'
        : 'The SSF amount does not reconcile with the expected employee contribution.',
      verify: 'Check how your employer presents the SSF line: employee share, employer share, or combined. Use the SSF classification control to tell the checker what the line means.',
    });
  }

  // Label/amount mismatch for PF-style labels
  const labelMismatch = detectLabelMismatch(ssfLabel, ssfRaw, expected.ssf);
  if (labelMismatch) {
    issues.push(labelMismatch);
    rows.push({ key: 'label-mismatch', label: `Label/amount check (${ssfLabel})`, expected: labelMismatch.expected, actual: labelMismatch.actual, diff: labelMismatch.diff, status: STATUS.NEEDS_VERIFICATION });
  }

  // ---- TDS / Tax ----
  // TDS is the monthly withholding of the annual income tax — NOT an extra charge.
  const expMonthlyTax = expected.tds.monthly;
  const payslipTds = p.tds;
  const payslipTax = p.tax;

  if (payslipTds != null) {
    const { diff, matches } = withinTolerance(expMonthlyTax, payslipTds);
    const status = matches ? STATUS.MATCHES : STATUS.ERROR;
    rows.push({ key: 'tds', label: 'TDS', expected: expMonthlyTax, actual: payslipTds, diff, status });
    if (!matches) {
      makeIssue({
        title: 'TDS differs from expected monthly withholding',
        what: 'The TDS deducted on the payslip differs from the expected monthly withholding.',
        expected: expMonthlyTax, actual: payslipTds, diff,
        why: 'TDS is the annual income tax divided by 12. A difference may come from a different filing status, missing deductions, the female rebate, or a different fiscal year\u2019s slabs.',
        verify: 'Confirm your filing status, SSF enrolment, deductions (insurance/retirement), and the fiscal year used by payroll.',
        status: STATUS.ERROR,
      });
    }
  } else {
    rows.push({ key: 'tds', label: 'TDS', expected: expMonthlyTax, actual: null, diff: null, status: 'not-provided' });
  }

  if (payslipTax != null && Math.abs(payslipTax - (payslipTds ?? 0)) > 1) {
    const { matches } = withinTolerance(expMonthlyTax, payslipTax);
    rows.push({ key: 'tax', label: 'Income Tax (separate line)', expected: expMonthlyTax, actual: payslipTax, diff: round2(payslipTax - expMonthlyTax), status: matches ? STATUS.MATCHES : STATUS.NEEDS_VERIFICATION });
    makeIssue({
      title: 'TDS and tax both appear as separate deductions',
      what: 'The payslip lists both TDS and a separate Income Tax amount.',
      expected: expMonthlyTax, actual: payslipTax, diff: round2(payslipTax - expMonthlyTax),
      why: 'For salaried employees TDS IS the income tax withheld monthly. If both lines are deducted, the same liability may be counted twice.',
      verify: 'Check whether the "Income Tax" line is a separate charge or the same liability re-labelled.',
    });
  } else if (payslipTax != null) {
    rows.push({ key: 'tax', label: 'Income Tax (separate line)', expected: expMonthlyTax, actual: payslipTax, diff: round2(payslipTax - expMonthlyTax), status: STATUS.MATCHES });
  }

  // ---- Other employee deductions ----
  const otherDed = clampN(p.otherDeductions);
  rows.push({ key: 'other-deductions', label: 'Other Employee Deductions', expected: expected.employeeDeductions.loan + expected.employeeDeductions.advance + expected.employeeDeductions.otherEmployee, actual: otherDed == null ? null : otherDed, diff: otherDed == null ? null : round2(otherDed - (expected.employeeDeductions.loan + expected.employeeDeductions.advance + expected.employeeDeductions.otherEmployee)), status: otherDed == null ? 'not-provided' : STATUS.MATCHES });

  // ---- Net ----
  const expNet = expected.net;
  const actNet = p.net;
  if (actNet == null) {
    rows.push({ key: 'net', label: 'Net Salary', expected: expNet, actual: null, diff: null, status: 'not-provided' });
    makeIssue({
      title: 'Payslip net salary not provided',
      what: 'No net salary on the payslip to compare against the expected net.',
      expected: expNet, actual: null, diff: null,
      why: 'The payslip may not show a net line.',
      verify: 'Enter the net salary shown on the payslip.',
    });
  } else {
    const { diff, matches } = withinTolerance(expNet, actNet);
    const employerSSF = expected.ssf.employer.total;
    const employerShareSubtracted = Math.abs(diff + employerSSF) <= 1.01;
    const status = matches ? STATUS.MATCHES : (employerShareSubtracted || ssfResult.employerShareIncluded ? STATUS.NEEDS_VERIFICATION : STATUS.ERROR);
    rows.push({ key: 'net', label: 'Net Salary', expected: expNet, actual: actNet, diff, status });

    if (!matches) {
      makeIssue({
        title: 'Net salary differs from expected amount',
        what: 'The net salary on the payslip differs from the expected net salary.',
        expected: expNet, actual: actNet, diff,
        why: employerShareSubtracted
          ? `The difference (Rs. ${round2(diff)}) equals the EMPLOYER SSF contribution (Rs. ${employerSSF}). The payslip appears to have deducted the combined SSF amount from your salary.`
          : 'The difference may come from SSF, TDS/tax, attendance, or other deductions above.',
        verify: employerShareSubtracted
          ? 'Confirm with your employer whether the SSF line deducted the combined (employee + employer) amount. The employer share should not normally reduce your net pay.'
          : 'Review each deduction line against the comparison above.',
        status,
      });
    }
  }

  // ---- Attendance reconciliation ----
  if (expected.attendance && expected.attendance.days && expected.attendance.days.calendarDays > 0) {
    if (!expected.attendance.reconciles) {
      issues.push({
        status: STATUS.NEEDS_VERIFICATION,
        title: 'Attendance does not reconcile',
        what: 'Attendance days do not fully reconcile with the calendar period.',
        expected: expected.attendance.days.calendarDays,
        actual: expected.attendance.accounted,
        diff: expected.attendance.unaccounted,
        why: 'The sum of present + paid leave + unpaid leave + absent + public holidays + rest days is less than the calendar days.',
        verify: 'Review the attendance entries. Unaccounted days are not automatically absence.',
      });
    }
    if (expected.attendance.days.absentDays > 0 && !expected.attendance.includeAbsent) {
      issues.push({
        status: STATUS.NEEDS_VERIFICATION,
        title: 'Absent days not treated as unpaid',
        what: `${expected.attendance.days.absentDays} absent day(s) were entered but not included as unpaid days.`,
        expected: null, actual: null, diff: null,
        why: 'The calculator does not assume every absence is an unpaid day.',
        verify: 'If the employer deducted for absences, enable "include absent days as unpaid" or enter the deduction amount manually.',
      });
    }
    if (expected.attendance.deduction && expected.attendance.deduction.needsVerification) {
      issues.push({
        status: STATUS.NEEDS_VERIFICATION,
        title: 'Attendance deduction depends on employer rule',
        what: expected.attendance.deduction.assumption,
        expected: null, actual: null, diff: null,
        why: 'The salary deduction method was not specified (or uses the employer/contract method), so the unpaid-leave deduction could not be verified.',
        verify: 'Select the deduction method your employer uses, or enter the actual unpaid-leave deduction from the payslip.',
      });
    }
  }

  // ---- Overall verdict ----
  let verdict = STATUS.MATCHES;
  for (const i of issues) {
    if (i.status === STATUS.ERROR) { verdict = STATUS.ERROR; break; }
    if (i.status === STATUS.NEEDS_VERIFICATION) verdict = STATUS.NEEDS_VERIFICATION;
  }
  for (const r of rows) {
    if (r.status === STATUS.ERROR) { verdict = STATUS.ERROR; break; }
    if (r.status === STATUS.NEEDS_VERIFICATION && verdict !== STATUS.ERROR) verdict = STATUS.NEEDS_VERIFICATION;
  }

  const errorCount = issues.filter(i => i.status === STATUS.ERROR).length;
  const verifyCount = issues.filter(i => i.status === STATUS.NEEDS_VERIFICATION).length;

  const summary = {
    expectedNet: expNet,
    payslipNet: actNet,
    netDiff: expNet != null && actNet != null ? round2(actNet - expNet) : null,
    verdict,
    errorCount,
    verifyCount,
  };

  return { rows, verdict, issues, summary };
}

function clampN(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, n) : null;
}