/**
 * Loan Eligibility & Affordability — Pure calculation engine (Nepal)
 * ==================================================================
 * Deterministic, no DOM. All ratios/defaults come from
 * src/data/loan-eligibility.js
 *
 * Core formulas:
 *   EMI  P,r,n  = P·r·(1+r)^n / ((1+r)^n − 1),  r = monthly rate
 *   P from EMI  = EMI·((1+r)^n − 1) / (r·(1+r)^n)
 * Zero interest handled separately (no division by zero).
 *
 * @module loan-eligibility
 */

import { COMFORT_FACTOR, LIMITS } from '../../data/loan-eligibility.js';

// ── Sanitising / formatting ─────────────────────────────────────────

export function sanitizeAmount(v) {
  if (v == null || v === '') return 0;
  const n = Number(String(v).replace(/,/g, '').replace(/^Rs\.?\s*/i, '').trim());
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, LIMITS.maxAmount);
}

export function formatNPR(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 'Rs 0';
  const sign = v < 0 ? '-' : '';
  return `${sign}Rs ${new Intl.NumberFormat('en-IN').format(Math.abs(Math.round(v)))}`;
}

export function formatInt(n) {
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('en-IN').format(Math.round(n));
}

// ── Amortisation ─────────────────────────────────────────────────────

/** Monthly EMI for principal P at annualRatePct over nMonths. */
export function emiForPrincipal(principal, annualRatePct, nMonths) {
  const P = sanitizeAmount(principal);
  const n = Math.max(0, Math.floor(Number(nMonths) || 0));
  if (P <= 0 || n <= 0) return 0;
  const r = Number(annualRatePct) / 100 / 12;
  if (!(r > 0)) return P / n; // 0% interest
  const f = Math.pow(1 + r, n);
  return (P * r * f) / (f - 1);
}

/** Principal supported by a monthly EMI at annualRatePct over nMonths. */
export function principalForEmi(emi, annualRatePct, nMonths) {
  const E = sanitizeAmount(emi);
  const n = Math.max(0, Math.floor(Number(nMonths) || 0));
  if (E <= 0 || n <= 0) return 0;
  const r = Number(annualRatePct) / 100 / 12;
  if (!(r > 0)) return E * n; // 0% interest
  const f = Math.pow(1 + r, n);
  return (E * (f - 1)) / (r * f);
}

// ── Main calculation ─────────────────────────────────────────────────

/**
 * @param {object} p
 * @param {number} p.monthlyIncome, p.otherIncome, p.coborrowerIncome
 * @param {number} p.existingEmi, p.otherDebt, p.livingExpenses
 * @param {number} p.foir  repayment-capacity ratio, e.g. 0.5
 * @param {number} p.annualRatePct
 * @param {number} p.tenureYears
 * @param {number} p.desiredAmount  optional
 * @param {number} p.downPayment
 */
export function calcEligibility({
  monthlyIncome = 0,
  otherIncome = 0,
  coborrowerIncome = 0,
  existingEmi = 0,
  otherDebt = 0,
  livingExpenses = 0,
  foir = 0.5,
  annualRatePct = 9.5,
  tenureYears = 20,
  desiredAmount = 0,
  downPayment = 0,
} = {}) {
  const income = sanitizeAmount(monthlyIncome);
  const other = sanitizeAmount(otherIncome);
  const co = sanitizeAmount(coborrowerIncome);
  const existEmi = sanitizeAmount(existingEmi);
  const otherD = sanitizeAmount(otherDebt);
  const living = sanitizeAmount(livingExpenses);
  const desired = sanitizeAmount(desiredAmount);
  const down = sanitizeAmount(downPayment);
  const rate = Math.max(0, Math.min(LIMITS.maxRatePct, Number(annualRatePct) || 0));
  const years = Math.max(0, Math.min(LIMITS.maxTenureYears, Number(tenureYears) || 0));
  const n = Math.round(years * 12);
  const ratio = foir > 0 && foir <= 1 ? foir : 0.5;

  const totalIncome = income + other + co;

  // Maximum total monthly debt the income can support (FOIR rule).
  const maxTotalEmi = totalIncome * ratio;

  // Cash left after living costs and current debt (budget context only —
  // FOIR already accounts for living costs, so this never caps eligibility).
  const cashSurplus = totalIncome - living - existEmi - otherD;

  // Affordable NEW emi: FOIR capacity minus current debt, never negative.
  const affordableNewEmi = Math.max(0, maxTotalEmi - existEmi - otherD);
  const budgetTight = affordableNewEmi > 0 && cashSurplus < affordableNewEmi;

  const affordablePrincipal = principalForEmi(affordableNewEmi, rate, n);
  const comfortablePrincipal = affordablePrincipal * COMFORT_FACTOR;
  const comfortableEmi = affordableNewEmi * COMFORT_FACTOR;

  const totalEmiAfter = existEmi + otherD + affordableNewEmi;
  const dti = totalIncome > 0 ? (totalEmiAfter / totalIncome) * 100 : 0;

  // Desired-loan comparison (down payment reduces the financed amount).
  const financed = Math.max(0, desired - down);
  const desiredEmi = desired > 0 && n > 0 ? emiForPrincipal(financed, rate, n) : 0;
  const desiredStatus =
    desired <= 0 ? null : financed <= affordablePrincipal ? 'within' : 'above';

  const warnings = [];
  if (totalIncome <= 0) warnings.push('Enter your total monthly income to estimate eligibility.');
  if (n <= 0) warnings.push('Select a valid loan tenure.');
  if (affordableNewEmi <= 0 && totalIncome > 0)
    warnings.push('Your current obligations leave no room for a new EMI. Reduce existing debt or expenses to improve eligibility.');
  if (totalIncome > 0 && living >= totalIncome)
    warnings.push('Your living expenses meet or exceed your income — review your monthly budget alongside this estimate.');
  else if (budgetTight)
    warnings.push('After living expenses and current debt, your cash left each month is less than the affordable EMI — keep a buffer for safety.');

  return {
    inputs: { totalIncome, existEmi, otherD, living, rate, years, months: n, ratio, desired, down, financed },
    totalIncome,
    maxTotalEmi,
    cashSurplus,
    affordableNewEmi,
    budgetTight,
    affordablePrincipal,
    comfortablePrincipal,
    comfortableEmi,
    totalEmiAfter,
    dti,
    desiredEmi,
    desiredStatus,
    warnings,
  };
}
