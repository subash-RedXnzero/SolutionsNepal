/**
 * Freelancer / Remote Worker Take-home — Calculation Engine
 * =========================================================
 * Pure functions. No DOM, no fetch.
 *
 * Currency handling:
 *  - Foreign amounts: gross, platformFee, paymentFee, taxForeign
 *  - NPR amounts: businessExpensesNpr, oneTime/annual in NPR
 *  finalTakeHomeNpr = (foreignTakeHome * rate) - businessExpensesNpr
 *
 * @module freelancer-take-home
 */

export const MAX_AMOUNT = 1e10;

export function sanitizeAmount(value) {
  const n = typeof value === 'string' ? Number(String(value).replace(/,/g, '').trim()) : Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, MAX_AMOUNT);
}

export function sanitizePercent(value) {
  const n = typeof value === 'string' ? Number(String(value).replace(/,/g, '').trim()) : Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, 100);
}

export function formatNumber(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '0';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(n));
}

export function formatCurrency(amount, currency) {
  const cur = currency ? ` ${currency}` : '';
  return `${formatNumber(amount)}${cur}`;
}

export function formatNPR(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return 'Rs. 0';
  return `Rs. ${formatNumber(n)}`;
}

/**
 * Core take-home calculation.
 * input = {
 *  monthlyForeignIncome, currency, exchangeRate,
 *  platformFeePercent, paymentFeePercent, paymentFixedFee,
 *  taxMode: 'percent'|'fixed', taxPercent, taxFixed,
 *  businessExpenses: { internet, electricity, software, equipment, workspace, other },
 *  oneTimeExpenses: { laptop, monitor, ... } or number total,
 *  annualExpenses: number,
 *  directClient: boolean (if true platformFeePercent forced to 0 externally)
 * }
 */
export function calculateTakeHome(input = {}) {
  const grossIncome = sanitizeAmount(input.monthlyForeignIncome);
  const platformFeePercent = sanitizePercent(input.platformFeePercent);
  const paymentFeePercent = sanitizePercent(input.paymentFeePercent);
  const paymentFixedFee = sanitizeAmount(input.paymentFixedFee);
  const exchangeRate = sanitizeAmount(input.exchangeRate);
  const rate = exchangeRate > 0 ? exchangeRate : 0;

  const platformFee = (grossIncome * platformFeePercent) / 100;
  const paymentFee = (grossIncome * paymentFeePercent) / 100 + paymentFixedFee;
  const afterPaymentIncome = grossIncome - platformFee - paymentFee;

  let tax = 0;
  const taxMode = input.taxMode === 'fixed' ? 'fixed' : 'percent';
  if (taxMode === 'fixed') {
    tax = sanitizeAmount(input.taxFixed);
  } else {
    const taxPercent = sanitizePercent(input.taxPercent);
    tax = (Math.max(0, afterPaymentIncome) * taxPercent) / 100;
  }

  const foreignTakeHome = afterPaymentIncome - tax;

  // Business expenses are in NPR
  const biz = input.businessExpenses || {};
  const businessExpensesNpr =
    sanitizeAmount(biz.internet) +
    sanitizeAmount(biz.electricity) +
    sanitizeAmount(biz.software) +
    sanitizeAmount(biz.equipment) +
    sanitizeAmount(biz.workspace) +
    sanitizeAmount(biz.other);

  const oneTime = input.oneTimeExpenses || {};
  let oneTimeTotal = 0;
  if (typeof oneTime === 'number') oneTimeTotal = sanitizeAmount(oneTime);
  else {
    for (const v of Object.values(oneTime)) oneTimeTotal += sanitizeAmount(v);
  }
  const annualExpensesNpr = sanitizeAmount(input.annualExpenses);

  const nprTakeHome = rate ? foreignTakeHome * rate : 0;
  const finalTakeHomeNpr = nprTakeHome - businessExpensesNpr;
  const isOverspending = grossIncome > 0 && finalTakeHomeNpr < 0;
  const overspendNpr = isOverspending ? Math.abs(finalTakeHomeNpr) : 0;

  const yearlyForeignTakeHome = foreignTakeHome * 12;
  const yearlyNprTakeHome = nprTakeHome * 12;
  const yearlyFinalNpr = finalTakeHomeNpr * 12;
  const yearlyBusinessNpr = businessExpensesNpr * 12;

  // Effective deduction rate: (grossNPR - finalTakeHome) / grossNPR * 100
  const grossNpr = rate ? grossIncome * rate : 0;
  const totalDeductionsNpr = grossNpr > 0 ? Math.max(0, grossNpr - finalTakeHomeNpr) : 0;
  const effectiveDeductionRate = grossNpr > 0 ? (totalDeductionsNpr / grossNpr) * 100 : 0;
  const keepRate = 100 - effectiveDeductionRate;

  // Breakdown percents vs gross
  const platformPct = grossIncome > 0 ? (platformFee / grossIncome) * 100 : 0;
  const paymentPct = grossIncome > 0 ? (paymentFee / grossIncome) * 100 : 0;
  const taxPct = grossIncome > 0 ? (tax / grossIncome) * 100 : 0;
  const bizPct = grossNpr > 0 ? (businessExpensesNpr / grossNpr) * 100 : 0;
  const takeHomePct = grossNpr > 0 && finalTakeHomeNpr > 0 ? (finalTakeHomeNpr / grossNpr) * 100 : 0;

  return {
    grossIncome,
    platformFee,
    paymentFee,
    afterPaymentIncome,
    tax,
    foreignTakeHome,
    businessExpensesNpr,
    oneTimeTotal,
    annualExpensesNpr,
    nprTakeHome,
    finalTakeHomeNpr,
    yearlyForeignTakeHome,
    yearlyNprTakeHome,
    yearlyFinalNpr,
    yearlyBusinessNpr,
    grossNpr,
    totalDeductionsNpr,
    effectiveDeductionRate,
    keepRate,
    platformPct,
    paymentPct,
    taxPct,
    bizPct,
    takeHomePct,
    isOverspending,
    overspendNpr,
    exchangeRate: rate,
    yearly: {
      grossIncome: grossIncome * 12,
      platformFee: platformFee * 12,
      paymentFee: paymentFee * 12,
      tax: tax * 12,
      businessExpensesNpr: yearlyBusinessNpr,
      foreignTakeHome: yearlyForeignTakeHome,
      finalTakeHomeNpr: yearlyFinalNpr,
    },
  };
}

export function calculateRequiredGross(input = {}) {
  const desiredNpr = sanitizeAmount(input.desiredMonthlyTakeHomeNpr);
  const biz = sanitizeAmount(input.businessExpensesNpr);
  const p = sanitizePercent(input.platformFeePercent) / 100;
  const q = sanitizePercent(input.paymentFeePercent) / 100;
  const paymentFixed = sanitizeAmount(input.paymentFixedFee);
  const taxMode = input.taxMode === 'fixed' ? 'fixed' : 'percent';
  const taxPercent = sanitizePercent(input.taxPercent) / 100;
  const taxFixed = sanitizeAmount(input.taxFixed);
  const rate = sanitizeAmount(input.exchangeRate) || 0;
  if (rate <= 0) return { gross: 0, error: 'Enter an exchange rate to calculate required gross.' };

  // Solve for gross: final = ((gross*(1-p-q)-paymentFixed)*(1 - taxPercent) - taxFixed)*rate - biz = desired
  // For percent tax: gross = ((desired+biz)/rate + taxFixed + paymentFixed*(1 - taxPercent)) / ((1-p-q)*(1 - taxPercent))
  // Handle fixed tax case separately
  const a = 1 - p - q;
  if (a <= 0) return { gross: 0, error: 'Fees total 100% or more. Reduce platform or payment fee.' };
  let gross;
  if (taxMode === 'fixed') {
    // final = (gross*a - paymentFixed - taxFixed)*rate - biz = desired
    // gross = ((desired+biz)/rate + taxFixed + paymentFixed) / a
    gross = ((desiredNpr + biz) / rate + taxFixed + paymentFixed) / a;
  } else {
    const b = 1 - taxPercent;
    if (b <= 0) return { gross: 0, error: 'Tax is 100%. Reduce tax rate.' };
    gross = ((desiredNpr + biz) / rate + taxFixed + paymentFixed * b) / (a * b);
    // taxFixed is 0 in percent mode, but keep for completeness
  }
  if (!Number.isFinite(gross) || gross < 0) return { gross: 0, error: 'Could not calculate. Check inputs.' };
  return { gross, error: null };
}

export function calculateHourlyRate(grossMonthly, hours) {
  const g = sanitizeAmount(grossMonthly);
  const h = Number(hours);
  if (!Number.isFinite(h) || h <= 0) return 0;
  return g / h;
}

export function compareTakeHome(offerA = {}, offerB = {}) {
  const a = calculateTakeHome(offerA);
  const b = calculateTakeHome(offerB);
  const diff = b.finalTakeHomeNpr - a.finalTakeHomeNpr;
  let winner = null;
  if (diff > 0) winner = 'B';
  else if (diff < 0) winner = 'A';
  return { a, b, diff, diffAbs: Math.abs(diff), winner };
}

export function buildShareText(input = {}, result, currency) {
  const cur = currency || input.currency || 'USD';
  const lines = [
    'My Freelancer Income Estimate',
    `Gross income: ${formatCurrency(input.monthlyForeignIncome || 0, cur)}/month`,
    `Platform + payment fees: ${formatCurrency((result.platformFee || 0) + (result.paymentFee || 0), cur)}`,
    `Estimated tax: ${formatCurrency(result.tax || 0, cur)}`,
    `Business expenses: ${formatNPR(result.businessExpensesNpr || 0)}`,
    `Estimated take home: ${formatNPR(result.finalTakeHomeNpr || 0)}/month`,
    `Estimated yearly take home: ${formatNPR(result.yearlyFinalNpr || 0)}`,
    '',
    'Calculated on SolutionsNepal - https://solutionsnepal.com/nepal/finance/freelancer-take-home-calculator',
  ];
  return lines.join('\n');
}
