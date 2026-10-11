/**
 * Foreign Employment Cost — Calculation Engine
 * ============================================
 * Pure functions (no DOM). Sums user-entered migration expenses, splits
 * out employer-covered costs, and estimates savings recovery.
 *
 * Trust rule: empty fields are "not included", never zero-filled guesses.
 * Salary is NEVER part of the migration cost — only of the recovery math.
 *
 * @module foreign-employment-cost
 */

import { EXPENSE_FIELDS, EXPENSE_KEYS } from '../../data/foreign-employment.js';

export const MAX_AMOUNT = 1e10; // Rs. 1,000 crore safety ceiling

// ── Formatting (Nepal/Indian grouping) ──────────────────────────

/** 125000 -> "Rs. 1,25,000" (decimals only when actually fractional). */
export function formatNPR(amount) {
  if (!Number.isFinite(amount)) return 'Rs. 0';
  const negative = amount < 0;
  const abs = Math.abs(amount);
  const hasFraction = Math.round(abs * 100) % 100 !== 0;
  const grouped = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(abs);
  return (negative ? '-Rs. ' : 'Rs. ') + grouped;
}

/** Plain grouped number: 125000 -> "1,25,000". */
export function formatNumberIN(num) {
  const n = Number(num);
  if (!Number.isFinite(n)) return '0';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(n));
}

// ── Parsing / validation ────────────────────────────────────────

/**
 * Parse one expense input. '' -> { value: null } (not included).
 * Returns { value } or { error } — never throws, never guesses.
 */
export function parseAmount(raw) {
  const s = String(raw ?? '').trim().replace(/,/g, '');
  if (s === '') return { value: null };
  if (!/^-?\d+(\.\d+)?$/.test(s)) return { error: 'Enter a valid number.' };
  const v = Number(s);
  if (v < 0) return { error: 'Amount cannot be negative.' };
  if (v > MAX_AMOUNT) return { error: 'That amount is too large to estimate.' };
  return { value: v };
}

/**
 * Convert a foreign-currency salary to NPR. Throws on invalid input —
 * the caller turns this into an inline message (never alert()).
 */
export function convertSalaryToNPR(amount, rate) {
  const a = Number(amount);
  const r = Number(rate);
  if (!Number.isFinite(a) || a < 0) throw new Error('Enter a valid salary amount.');
  if (!Number.isFinite(r) || r <= 0) throw new Error('Enter a valid exchange rate.');
  return Math.round(a * r);
}

/**
 * Budget plan: compare known budget against out-of-pocket cost.
 * Returns { budget, cost, remaining, over } — remaining is negative when over.
 */
export function computeBudgetPlan(outOfPocketCost, budget) {
  const cost = Number(outOfPocketCost);
  const b = Number(budget);
  if (!Number.isFinite(cost) || cost < 0) throw new Error('Invalid cost.');
  if (!Number.isFinite(b) || b <= 0) throw new Error('Enter your budget — a number above zero.');
  const remaining = Math.round((b - cost) * 100) / 100;
  return { budget: b, cost, remaining, over: remaining < 0 };
}

// ── Main calculation ────────────────────────────────────────────

/**
 * calculateForeignEmploymentCost({
 *   destination, jobCategory,
 *   visa, medical, insurance, orientation, recruitment, airTicket, documentation, other,  // raw inputs
 *   payers: { visa: 'self'|'employer'|'unknown', ... },   // default 'self'
 *   countedKeys?: string[],        // visible fields only (hidden-by-method excluded)
 *   monthlySalary?: number|string|null,    // NPR (recovery input)
 *   monthlyExpenses?: number|string|null,  // NPR living costs abroad (recovery input)
 * })
 * Returns { valid, errors, totalCost, employerCovered, outOfPocketCost,
 *           monthlySavings, recoveryMonths, recoveryNote, breakdown, warnings,
 *           emptyCount, unknownCount }.
 */
export function calculateForeignEmploymentCost(input = {}) {
  const {
    destination,
    jobCategory,
    payers = {},
    countedKeys = EXPENSE_KEYS,
    monthlySalary = null,
    monthlyExpenses = null,
  } = input;

  const errors = {};
  if (!destination) errors.destination = 'Please choose a destination country.';
  if (!jobCategory) errors.jobCategory = 'Please choose a job category.';

  // Parse the 8 expense fields.
  const amounts = {};
  const expErrors = {};
  for (const key of EXPENSE_KEYS) {
    const { value, error } = parseAmount(input[key]);
    if (error) expErrors[key] = error;
    amounts[key] = value;
  }
  if (Object.keys(expErrors).length > 0) errors.expenses = expErrors;

  // Salary / living costs (optional; null when untouched).
  const salary = monthlySalary === null || monthlySalary === '' ? null : parseAmount(monthlySalary);
  const living = monthlyExpenses === null || monthlyExpenses === '' ? null : parseAmount(monthlyExpenses);
  if (salary && salary.error) errors.salary = salary.error;
  if (living && living.error) errors.living = living.error;
  const salaryVal = salary && !salary.error ? salary.value : null;
  const livingVal = living && !living.error ? living.value : null;

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  const counted = new Set(countedKeys);
  const breakdown = EXPENSE_FIELDS.filter((f) => counted.has(f.key)).map((f) => {
    const amount = amounts[f.key];
    const payer = payers[f.key] || 'self';
    return {
      key: f.key,
      label: f.label,
      amount, // null = not included
      payer,
      employerCovered: amount != null && payer === 'employer',
      included: amount != null,
    };
  });

  const round2 = (n) => Math.round(n * 100) / 100;
  const totalCost = round2(breakdown.reduce((s, r) => s + (r.included ? r.amount : 0), 0));
  const employerCoveredAmt = round2(
    breakdown.reduce((s, r) => s + (r.employerCovered ? r.amount : 0), 0),
  );
  const outOfPocketCost = round2(totalCost - employerCoveredAmt);
  const emptyCount = breakdown.filter((r) => !r.included).length;
  // Unknown payer = counted in your cost (conservative) + flagged.
  const unknownCount = breakdown.filter((r) => r.included && r.payer === 'unknown').length;

  const warnings = [];
  if (emptyCount > 0) {
    warnings.push(
      `${emptyCount} of ${breakdown.length} expense fields are empty — the total covers entered amounts only.`,
    );
  }
  if (unknownCount > 0) {
    warnings.push(
      `${unknownCount} expense${unknownCount === 1 ? ' is' : 's are'} marked “Unknown” and counted in your out-of-pocket cost — confirm who pays before you rely on this.`,
    );
  }

  // ── Recovery (salary is only used here, never in the migration cost) ──
  let monthlySavings = null;
  let recoveryMonths = null;
  let recoveryNote = null;
  if (salaryVal != null) {
    const live = livingVal != null ? livingVal : 0;
    if (livingVal == null) {
      warnings.push('Monthly expenses abroad were not entered — counted as Rs. 0 in the recovery math.');
    }
    monthlySavings = round2(salaryVal - live);
    if (outOfPocketCost <= 0) {
      recoveryNote = 'No migration cost to recover — your entered expenses total Rs. 0.';
    } else if (monthlySavings <= 0) {
      recoveryNote =
        'Your estimated monthly expenses are equal to or higher than your salary, so the recovery period cannot be calculated.';
    } else {
      recoveryMonths = Math.round((outOfPocketCost / monthlySavings) * 10) / 10;
      if (monthlySavings * 12 < outOfPocketCost) {
        warnings.push('At this savings rate the cost takes over a year to recover — double-check the salary and expense figures.');
      }
    }
  }

  return {
    valid: true,
    errors: {},
    totalCost,
    employerCovered: employerCoveredAmt,
    outOfPocketCost,
    monthlySavings,
    recoveryMonths,
    recoveryNote,
    breakdown,
    warnings,
    emptyCount,
    unknownCount,
  };
}
