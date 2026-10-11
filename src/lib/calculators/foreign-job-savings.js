/**
 * Foreign Job Salary & Real Savings — Calculation Engine
 * ======================================================
 * Pure functions. No DOM, no fetch. All amounts coerced safely;
 * empty means zero unless noted. Formulas mirror the spec exactly.
 *
 * @module foreign-job-savings
 */

export const MAX_AMOUNT = 1e10;

export function sanitizeAmount(value) {
  const n = typeof value === 'string' ? Number(String(value).replace(/,/g, '').trim()) : Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, MAX_AMOUNT);
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
 * Core savings calculation.
 * grossIncome = salary + overtime + allowances
 * takeHome   = grossIncome - taxes - deductions
 * totalExpenses = sum of living + hidden recurring (loan etc.)
 * monthlySavings = takeHome - totalExpenses - remittanceFee
 * annualSavings  = monthlySavings * 12
 * nprMonthly/Annual = savings * exchangeRate
 * isOverspending when monthlySavings < 0
 */
export function calculateSavings(input = {}) {
  const salary = sanitizeAmount(input.salary);
  const overtime = sanitizeAmount(input.overtime);
  const allowances = sanitizeAmount(input.allowances);
  const taxes = sanitizeAmount(input.taxes);
  const deductions = sanitizeAmount(input.deductions);

  const housing = sanitizeAmount(input.housing);
  const food = sanitizeAmount(input.food);
  const transportation = sanitizeAmount(input.transportation);
  const phone = sanitizeAmount(input.phone);
  const personal = sanitizeAmount(input.personal);
  const other = sanitizeAmount(input.other);

  const hidden = input.hiddenCosts || {};
  const recruitment = sanitizeAmount(hidden.recruitment);
  const accommodationDeposit = sanitizeAmount(hidden.accommodationDeposit);
  const foodDeposit = sanitizeAmount(hidden.foodDeposit);
  const insurance = sanitizeAmount(hidden.insurance);
  const medical = sanitizeAmount(hidden.medical);
  const loanRepayment = sanitizeAmount(hidden.loanRepayment);
  const localTransport = sanitizeAmount(hidden.localTransport);
  const phoneInternet = sanitizeAmount(hidden.phoneInternet);
  const otherRecurring = sanitizeAmount(hidden.otherRecurring);

  const remittanceFee = sanitizeAmount(input.remittanceFee);
  const exchangeRate = sanitizeAmount(input.exchangeRate);
  // Default to 1 when not provided so foreign amounts still display
  const rate = exchangeRate > 0 ? exchangeRate : 0;

  const grossIncome = salary + overtime + allowances;
  const takeHome = Math.max(0, grossIncome - taxes - deductions);

  const livingExpenses = housing + food + transportation + phone + personal + other;
  const hiddenRecurring = insurance + medical + loanRepayment + localTransport + phoneInternet + otherRecurring;
  const totalExpenses = livingExpenses + hiddenRecurring;

  const oneTimeMigrationCosts = recruitment + accommodationDeposit + foodDeposit;
  const monthlySavings = takeHome - totalExpenses - remittanceFee;
  const annualSavings = monthlySavings * 12;
  const firstYearNetSavings = annualSavings - oneTimeMigrationCosts;
  const afterFirstYearAnnual = annualSavings;

  const nprMonthlySavings = rate ? Math.round(monthlySavings * rate) : 0;
  const nprAnnualSavings = rate ? Math.round(annualSavings * rate) : 0;
  const nprFirstYearNet = rate ? Math.round(firstYearNetSavings * rate) : 0;

  const savingsRate = takeHome > 0 ? (monthlySavings / takeHome) * 100 : 0;
  const isOverspending = monthlySavings < 0;
  const overspendAmount = isOverspending ? Math.abs(monthlySavings) : 0;
  const nprOverspend = rate ? Math.round(overspendAmount * rate) : 0;

  return {
    grossIncome,
    takeHome,
    livingExpenses,
    hiddenRecurring,
    totalExpenses,
    oneTimeMigrationCosts,
    remittanceFee,
    monthlySavings,
    annualSavings,
    firstYearNetSavings,
    afterFirstYearAnnual,
    nprMonthlySavings,
    nprAnnualSavings,
    nprFirstYearNet,
    savingsRate,
    isOverspending,
    overspendAmount,
    nprOverspend,
    exchangeRate: rate,
    breakdown: {
      salary, overtime, allowances, taxes, deductions,
      housing, food, transportation, phone, personal, other,
      insurance, medical, loanRepayment, localTransport, phoneInternet, otherRecurring,
      recruitment, accommodationDeposit, foodDeposit,
    },
  };
}

/**
 * Compare two job offers. Each offer is an input object for calculateSavings.
 * Returns enriched results + winner label.
 */
export function compareOffers(offerA = {}, offerB = {}) {
  const a = calculateSavings(offerA);
  const b = calculateSavings(offerB);
  const diffMonthly = b.nprMonthlySavings - a.nprMonthlySavings;
  let winner = null;
  if (diffMonthly > 0) winner = 'B';
  else if (diffMonthly < 0) winner = 'A';
  return { a, b, diffMonthly, diffMonthlyAbs: Math.abs(diffMonthly), winner };
}

export function savingsBandLabel(rate) {
  const r = Number(rate);
  if (!Number.isFinite(r)) return 'N/A';
  if (r <= 0) return 'Low';
  if (r <= 20) return 'Low';
  if (r <= 40) return 'Moderate';
  if (r <= 60) return 'Good';
  return 'Excellent';
}

export function buildShareText(input = {}, result, countryName, currency) {
  const cur = currency || '';
  const lines = [
    'My Foreign Job Savings Estimate',
    countryName ? `Country: ${countryName}` : null,
    `Salary: ${formatNumber(input.salary || 0)} ${cur}`,
    `Monthly expenses: ${formatNumber(result.totalExpenses)} ${cur}`,
    `Estimated savings: ${formatNumber(result.monthlySavings)} ${cur}`,
    result.exchangeRate ? `Estimated savings in Nepal: Rs. ${formatNumber(result.nprMonthlySavings)}/month` : null,
    result.exchangeRate ? `Estimated annual savings: Rs. ${formatNumber(result.nprAnnualSavings)}` : null,
    '',
    'Calculated on SolutionsNepal - https://solutionsnepal.com/nepal/foreign-job-salary-savings',
  ].filter(Boolean);
  return lines.join('\n');
}
