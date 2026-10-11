/**
 * Home Loan Down Payment — Pure calculation engine (Nepal)
 * ========================================================
 * Deterministic, no DOM. EMI math reused from loan-eligibility engine.
 *
 * @module home-loan-down-payment
 */

import { emiForPrincipal } from './loan-eligibility.js';
import { LIMITS } from '../../data/home-loan-down-payment.js';

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

/**
 * @param {object} p
 * @param {number} p.propertyPrice
 * @param {number} p.downPaymentPct  0–100
 * @param {number} p.annualRatePct
 * @param {number} p.tenureYears
 * @param {number} p.savings  optional
 * @param {number} p.otherCosts  optional upfront costs
 */
export function calcDownPayment({
  propertyPrice = 0,
  downPaymentPct = 20,
  annualRatePct = 9.5,
  tenureYears = 20,
  savings = 0,
  otherCosts = 0,
} = {}) {
  const price = sanitizeAmount(propertyPrice);
  const pct = Math.max(0, Math.min(100, Number(downPaymentPct) || 0));
  const rate = Math.max(0, Math.min(LIMITS.maxRatePct, Number(annualRatePct) || 0));
  const years = Math.max(0, Math.min(LIMITS.maxTenureYears, Number(tenureYears) || 0));
  const n = Math.round(years * 12);
  const save = sanitizeAmount(savings);
  const other = sanitizeAmount(otherCosts);
  const hasSavings = String(savings ?? '').trim() !== '';

  const downPayment = (price * pct) / 100;
  const loanAmount = Math.max(0, price - downPayment);
  const ltv = price > 0 ? (loanAmount / price) * 100 : 0;
  const upfront = downPayment + other;
  const emi = n > 0 ? emiForPrincipal(loanAmount, rate, n) : 0;

  const diff = save - upfront; // >=0 surplus, <0 shortfall
  const shortfall = hasSavings && diff < 0 ? Math.abs(diff) : 0;
  const surplus = hasSavings && diff >= 0 ? diff : 0;

  const warnings = [];
  if (price <= 0) warnings.push('Enter a property price greater than Rs 0.');
  if (n <= 0 && price > 0) warnings.push('Select a valid loan tenure.');

  return {
    inputs: { price, pct, rate, years, months: n, save, other, hasSavings },
    downPayment,
    loanAmount,
    ltv,
    upfront,
    emi,
    shortfall,
    surplus,
    warnings,
  };
}

/** One scenario row for the comparison table. */
export function calcScenario(price, pct, annualRatePct, tenureYears, otherCosts = 0) {
  const r = calcDownPayment({
    propertyPrice: price,
    downPaymentPct: pct,
    annualRatePct,
    tenureYears,
    otherCosts,
  });
  return { pct, cash: r.upfront, loan: r.loanAmount, emi: r.emi };
}
