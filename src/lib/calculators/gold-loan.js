/**
 * Gold Loan — Pure calculation engine (Nepal)
 * ===========================================
 * Deterministic, no DOM. Constants from src/data/gold-loan.js
 *
 *   Gold Value   = weight(tola) × price/tola × purity factor
 *   Maximum Loan = gold value × LTV / 100
 *   EMI          = P·r·(1+r)^n / ((1+r)^n − 1), r = monthly rate
 *
 * @module gold-loan
 */

import { GRAMS_PER_TOLA, LIMITS, purityFactor } from '../../data/gold-loan.js';

export { GRAMS_PER_TOLA };

export function sanitizeAmount(v, max = LIMITS.maxAmount) {
  if (v == null || String(v).trim() === '') return 0;
  const n = Number(String(v).replace(/,/g, '').replace(/^Rs\.?\s*/i, '').trim());
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, max);
}

export function formatNPR(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 'Rs 0';
  const sign = v < 0 ? '-' : '';
  return `${sign}Rs ${new Intl.NumberFormat('en-IN').format(Math.abs(Math.round(v)))}`;
}

export function tolaToGrams(tola) {
  return (Number(tola) || 0) * GRAMS_PER_TOLA;
}

export function gramsToTola(grams) {
  return (Number(grams) || 0) / GRAMS_PER_TOLA;
}

/** Monthly EMI; 0% interest handled without division by zero. */
export function emiForPrincipal(principal, annualRatePct, nMonths) {
  const P = sanitizeAmount(principal);
  const n = Math.max(0, Math.floor(Number(nMonths) || 0));
  if (P <= 0 || n <= 0) return 0;
  const r = Number(annualRatePct) / 100 / 12;
  if (!(r > 0)) return P / n;
  const f = Math.pow(1 + r, n);
  return (P * r * f) / (f - 1);
}

/**
 * @param {object} p
 * @param {number} p.weightTola
 * @param {number} p.pricePerTola
 * @param {string} p.purity  24K | 22K | 18K
 * @param {number} p.ltvPct
 * @param {number} p.loanAmount  requested principal
 * @param {number} p.annualRatePct
 * @param {number} p.tenureMonths
 * @param {string} p.feeMode  none | pct | fixed
 * @param {number} p.feeValue
 */
export function calcGoldLoan({
  weightTola = 0,
  pricePerTola = 0,
  purity = '22K',
  ltvPct = 75,
  loanAmount = 0,
  annualRatePct = 12.5,
  tenureMonths = 12,
  feeMode = 'none',
  feeValue = 0,
} = {}) {
  const warnings = [];
  const weight = sanitizeAmount(weightTola, LIMITS.maxWeightTola);
  const price = sanitizeAmount(pricePerTola, LIMITS.maxPrice);
  const ltv = Math.max(0, Math.min(100, Number(ltvPct) || 0));
  const rate = Math.max(0, Math.min(LIMITS.maxRatePct, Number(annualRatePct) || 0));
  const n = Math.max(0, Math.min(LIMITS.maxTenureMonths, Math.floor(Number(tenureMonths) || 0)));
  const factor = purityFactor(purity);

  if (weight <= 0) warnings.push('Enter a gold weight greater than 0.');
  if (price <= 0) warnings.push('Enter a valid gold price per tola.');
  if (n <= 0) warnings.push('Enter a valid loan tenure.');

  const goldValue = weight * price * factor;
  const maxLoan = (goldValue * ltv) / 100;
  const principal = sanitizeAmount(loanAmount);
  const exceedsMax = principal > maxLoan;

  const emi = emiForPrincipal(principal, rate, n);
  const totalRepayment = emi * n;
  const totalInterest = Math.max(0, totalRepayment - principal);

  let fee = 0;
  if (feeMode === 'pct') fee = (principal * Math.max(0, Number(feeValue) || 0)) / 100;
  else if (feeMode === 'fixed') fee = sanitizeAmount(feeValue);

  return {
    inputs: { weight, price, purity, factor, ltv, rate, months: n },
    goldGrams: tolaToGrams(weight),
    goldValue,
    maxLoan,
    principal,
    exceedsMax,
    emi,
    totalInterest,
    totalRepayment,
    fee,
    totalCost: totalRepayment + fee,
    warnings,
  };
}
