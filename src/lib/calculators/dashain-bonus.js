/**
 * Dashain Bonus Calculator Engine (Nepal)
 * ======================================
 * Implements Labour Act, 2074 Section 37 (festival expense) exactly:
 *
 *   s.37(1) — each labour gets one month's BASIC REMUNERATION each
 *             year as festival expense, for the festival celebrated
 *             according to his/her religion, culture and tradition.
 *   s.37(2) — on written request for the main festival, it is paid
 *             at Dashain every year.
 *   s.37(3) — under one year of service on payment day → proportional
 *             to the service period completed.
 *
 * Hence the single formula:
 *
 *   festival expense = monthly basic remuneration × months served / 12
 *
 * No invented rates, no tax math, no adjustments outside the Act.
 * The statutory profit bonus (Bonus Act, 2030: pool = 10% of net
 * profit, share B = X×100/Y applied to each employee's FY salary,
 * capped at 8/6 months' salary, cash within 8 months of FY end)
 * needs company profit data, so it stays as information on the page.
 *
 * SOURCE: Labour Act, 2074 s.37 text via nepallaws.com;
 * Bonus Act figures via Startup Law Advisor explainer (Jul 2023).
 * LAST VERIFIED: 2026-10-11.
 *
 * Pure functions — no DOM, no framework.
 * Run: node --test tests/dashain-bonus.test.mjs
 *
 * @module dashain-bonus
 */

export const LABOUR_ACT_REF = 'Labour Act, 2074, Section 37';

export const LIMITS = {
  maxSalary: 999999999,
};

/**
 * Validate one numeric field.
 * @returns {{ok: boolean, value?: number, error?: string}}
 */
export function validateField(raw, { label, min, max, integer = false }) {
  const v = typeof raw === 'string' ? raw.trim() : raw;
  if (v === '' || v === null || v === undefined) {
    return { ok: false, error: `Enter ${label}.` };
  }
  const num = Number(v);
  if (!Number.isFinite(num)) {
    return { ok: false, error: `${label} must be a valid number.` };
  }
  if (integer && !Number.isInteger(num)) {
    return { ok: false, error: `${label} must be a whole number.` };
  }
  if (num <= min) {
    return { ok: false, error: `Enter ${label}.` };
  }
  if (max !== undefined && num > max) {
    return { ok: false, error: `${label} is too large.` };
  }
  return { ok: true, value: num };
}

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/**
 * Festival expense under Labour Act, 2074 s.37.
 *
 * @param {Object} input
 * @param {number|string} input.monthlyBasicSalary - monthly BASIC REMUNERATION (NPR)
 * @param {number|string} input.monthsWorked - whole months of service completed, 1–12
 * @returns {Object} result with `valid` flag
 */
export function calculateDashainBonus({ monthlyBasicSalary, monthsWorked }) {
  const salary = validateField(monthlyBasicSalary, {
    label: 'a monthly basic remuneration greater than Rs. 0',
    min: 0,
    max: LIMITS.maxSalary,
  });
  if (!salary.ok) return { valid: false, error: salary.error };

  // NOTE: min is an exclusive lower bound in validateField, so months
  // uses min: 0 (1 must pass, 0 must fail); messages are mapped below.
  const months = validateField(monthsWorked, {
    label: 'months of service between 1 and 12',
    min: 0,
    max: 12,
    integer: true,
  });
  if (!months.ok) {
    const n = Number(monthsWorked);
    if (monthsWorked === '' || monthsWorked === null || monthsWorked === undefined || !Number.isFinite(n)) {
      return { valid: false, error: 'Enter months of service between 1 and 12.' };
    }
    if (!Number.isInteger(n)) return { valid: false, error: 'Months of service must be a whole number.' };
    return { valid: false, error: 'Months of service must be between 1 and 12.' };
  }

  // s.37(3): proportional to service completed; 12 months = full one month's basic.
  const proportion = months.value / 12;
  const festivalExpense = round2(salary.value * proportion);
  return {
    valid: true,
    monthlyBasicSalary: salary.value,
    monthsWorked: months.value,
    proportion,
    festivalExpense,
    formula: `Rs. ${salary.value} × ${months.value}/12 (Labour Act, 2074 s.37)`,
  };
}

/**
 * Format an amount as Nepali currency with Indian/Nepali digit grouping:
 *   30000 → "Rs. 30,000"
 */
export function formatNPR(amount) {
  if (!Number.isFinite(Number(amount))) return 'Rs. 0';
  const negative = Number(amount) < 0;
  const rounded = Math.round(Math.abs(Number(amount)));
  const grouped = new Intl.NumberFormat('en-IN').format(rounded);
  return (negative ? '-Rs. ' : 'Rs. ') + grouped;
}

/**
 * One-line readable summary for the Copy Result button.
 */
export function summarizeDashainBonus(result) {
  if (!result || !result.valid) return '';
  return [
    'Dashain Bonus (Festival Expense, Labour Act 2074 s.37)',
    `Monthly basic remuneration: ${formatNPR(result.monthlyBasicSalary)}`,
    `Service completed: ${result.monthsWorked} of 12 months`,
    `Festival expense: ${formatNPR(result.festivalExpense)}`,
    `Formula: ${result.formula}`,
    'Actual payout follows employer policy and the Act — confirm with your employer or the labour office.',
  ].join('\n');
}
