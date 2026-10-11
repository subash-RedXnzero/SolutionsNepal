/**
 * Land Affordability — Calculation Engine
 * ========================================
 * Pure functions. No DOM. Keeps unit conversion, loan math and
 * affordability logic separate and testable.
 *
 * @module land-affordability
 */

import { LAND_UNITS, AFFORDABILITY_ASSUMPTIONS } from '../../data/land/land-affordability.js';

export const MAX_AMOUNT = 10000000000;
export const MAX_AREA = 1000000;

export function sanitizeAmount(value, fallback = 0) {
  const n = typeof value === 'string' ? Number(String(value).replace(/,/g, '').trim()) : Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(n, MAX_AMOUNT);
}

export function sanitizeArea(value, fallback = 0) {
  const n = typeof value === 'string' ? Number(String(value).replace(/,/g, '').trim()) : Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(n, MAX_AREA);
}

export function formatNumber(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '0';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(n));
}

export function formatNPR(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return 'Rs. 0';
  return `Rs. ${formatNumber(n)}`;
}

export function getUnitById(id) {
  return LAND_UNITS.find((u) => u.id === id) || LAND_UNITS[0];
}

// Land-unit conversion via sq ft
export function convertLandUnits(value, fromUnitId, toUnitId) {
  const from = getUnitById(fromUnitId);
  const to = getUnitById(toUnitId);
  const v = sanitizeArea(value);
  if (v === 0) return 0;
  const sqft = v * from.toSqFt;
  return sqft / to.toSqFt;
}

export function calculateTotalLandPrice(area, pricePerUnit) {
  return Math.round(sanitizeArea(area) * sanitizeAmount(pricePerUnit));
}

export function calculateAffordableArea(budget, pricePerUnit) {
  const p = sanitizeAmount(pricePerUnit);
  if (p <= 0) return 0;
  return sanitizeAmount(budget) / p;
}

// EMI: P * r * (1+r)^n / ((1+r)^n - 1)
export function calculateEMI(principal, annualRatePct, years) {
  const P = sanitizeAmount(principal);
  const r = Number(annualRatePct) / 100 / 12;
  const n = Math.round(Number(years) * 12);
  if (P <= 0 || n <= 0) return { emi: 0, totalPayment: 0, totalInterest: 0, months: n };
  if (!Number.isFinite(r) || r <= 0) {
    const emi = Math.round(P / n);
    return { emi, totalPayment: P, totalInterest: 0, months: n };
  }
  const pow = Math.pow(1 + r, n);
  const emi = Math.round((P * r * pow) / (pow - 1));
  const totalPayment = emi * n;
  return { emi, totalPayment, totalInterest: totalPayment - P, months: n };
}

// Inverse: max loan from affordable EMI
export function calculateMaxLoanFromEMI(emi, annualRatePct, years) {
  const E = sanitizeAmount(emi);
  const r = Number(annualRatePct) / 100 / 12;
  const n = Math.round(Number(years) * 12);
  if (E <= 0 || n <= 0) return 0;
  if (!Number.isFinite(r) || r <= 0) return E * n;
  const pow = Math.pow(1 + r, n);
  return Math.round((E * (pow - 1)) / (r * pow));
}

export function calculateEmiToIncomeRatio(emi, totalMonthlyIncome) {
  const income = sanitizeAmount(totalMonthlyIncome);
  if (income <= 0) return 0;
  return sanitizeAmount(emi) / income;
}

export function calculateRemainingIncome(totalIncome, expenses, existingEMI, newEMI) {
  return sanitizeAmount(totalIncome) - sanitizeAmount(expenses) - sanitizeAmount(existingEMI) - sanitizeAmount(newEMI);
}

export function calculateAdditionalCosts(landPrice, opts = {}) {
  const price = sanitizeAmount(landPrice);
  const regPct = Number(opts.registrationPct) || AFFORDABILITY_ASSUMPTIONS.registrationPct;
  const legalPct = Number(opts.legalPct) || AFFORDABILITY_ASSUMPTIONS.legalPct;
  const brokeragePct = Number(opts.brokeragePct) || AFFORDABILITY_ASSUMPTIONS.brokeragePct;
  const contingencyPct = Number(opts.contingencyPct) || AFFORDABILITY_ASSUMPTIONS.contingencyPct;
  const other = sanitizeAmount(opts.other);
  const registration = Math.round(price * regPct);
  const legal = Math.round(price * legalPct);
  const brokerage = Math.round(price * brokeragePct);
  const contingency = Math.round(price * contingencyPct);
  const total = registration + legal + brokerage + contingency + other;
  return { registration, legal, brokerage, contingency, other, total };
}

export function calculateMaxAffordableBudget({
  totalMonthlyIncome,
  monthlyExpenses,
  existingEMI,
  savingsAvailable,
  annualRatePct,
  loanYears,
  emiToIncomeRatio,
  additionalCosts,
}) {
  const income = sanitizeAmount(totalMonthlyIncome);
  const expenses = sanitizeAmount(monthlyExpenses);
  const existing = sanitizeAmount(existingEMI);
  const savings = sanitizeAmount(savingsAvailable);
  const ratio = Number(emiToIncomeRatio) || AFFORDABILITY_ASSUMPTIONS.emiToIncomeRatio;
  const add = sanitizeAmount(additionalCosts);

  const monthlyCashFlow = Math.max(0, income - expenses - existing);
  const emiByRatio = Math.max(0, income * ratio - existing);
  const affordableEMI = Math.min(monthlyCashFlow, emiByRatio);
  const maxLoan = calculateMaxLoanFromEMI(affordableEMI, annualRatePct, loanYears);
  const maxBudget = Math.max(0, savings + maxLoan - add);
  const recommendedDownPayment = Math.round(savings > 0 ? savings : maxBudget * AFFORDABILITY_ASSUMPTIONS.recommendedDownPaymentPct);
  return {
    monthlyCashFlow,
    affordableEMI,
    maxLoan,
    maxBudget,
    recommendedDownPayment: Math.min(recommendedDownPayment, maxBudget),
    remainingIncome: calculateRemainingIncome(income, expenses, existing, affordableEMI),
    emiToIncomeRatio: calculateEmiToIncomeRatio(affordableEMI, income),
  };
}

export function getAffordabilityStatus(emiToIncomeRatio) {
  const r = Number(emiToIncomeRatio);
  if (!Number.isFinite(r)) return { level: 'unknown', label: '—', desc: '' };
  if (r <= AFFORDABILITY_ASSUMPTIONS.emiToIncomeComfortable) {
    return { level: 'comfortable', label: 'Comfortable', desc: 'This purchase appears to fit within your estimated monthly budget.' };
  }
  if (r <= AFFORDABILITY_ASSUMPTIONS.emiToIncomeStretch) {
    return { level: 'stretching', label: 'Stretching your budget', desc: 'This purchase may leave you with limited monthly cash flow.' };
  }
  return { level: 'expensive', label: 'Likely too expensive', desc: 'The estimated EMI and upfront costs are high relative to your current finances.' };
}

// What land can I afford at various prices
export function calculateAffordableScenarios(budget, pricePoints = [], unitId = 'aana') {
  const b = sanitizeAmount(budget);
  return pricePoints.map((price) => ({
    pricePerUnit: price,
    affordableArea: calculateAffordableArea(b, price),
    unitId,
  }));
}

export function calculateSavingsTimeline(requiredDownPayment, currentSavings, monthlySavings) {
  const required = sanitizeAmount(requiredDownPayment);
  const current = sanitizeAmount(currentSavings);
  const monthly = sanitizeAmount(monthlySavings);
  const gap = Math.max(0, required - current);
  if (gap <= 0) return { months: 0, gap: 0, percent: 100 };
  if (monthly <= 0) return { months: Infinity, gap, percent: Math.min(100, (current / required) * 100) };
  return {
    months: Math.ceil(gap / monthly),
    gap,
    percent: Math.min(100, (current / required) * 100),
  };
}

export function calculateRequiredIncome({ targetLandPrice, downPayment, annualRatePct, loanYears, existingEMI, emiToIncomeRatio, additionalCosts }) {
  const price = sanitizeAmount(targetLandPrice);
  const down = sanitizeAmount(downPayment);
  const add = sanitizeAmount(additionalCosts);
  const loan = Math.max(0, price + add - down);
  const emiInfo = calculateEMI(loan, annualRatePct, loanYears);
  const ratio = Number(emiToIncomeRatio) || AFFORDABILITY_ASSUMPTIONS.emiToIncomeRatio;
  if (ratio <= 0) return { requiredIncome: 0, emi: emiInfo.emi };
  const requiredIncome = (emiInfo.emi + sanitizeAmount(existingEMI)) / ratio;
  return { requiredIncome: Math.round(requiredIncome), emi: emiInfo.emi, loan };
}

export function compareScenarios(a, b) {
  // a, b are objects with landPrice, emi, remainingIncome, totalCashRequired
  const keys = ['landPrice', 'emi', 'remainingIncome', 'totalCashRequired', 'affordableArea'];
  const result = {};
  for (const k of keys) {
    const av = Number(a[k]) || 0;
    const bv = Number(b[k]) || 0;
    let winner = null;
    if (k === 'emi' || k === 'totalCashRequired') winner = av < bv ? 'A' : bv < av ? 'B' : null;
    else if (k === 'remainingIncome' || k === 'affordableArea') winner = av > bv ? 'A' : bv > av ? 'B' : null;
    else winner = null;
    result[k] = { a: av, b: bv, winner };
  }
  return result;
}
