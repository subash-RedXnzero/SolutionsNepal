/**
 * Business Break-Even — Pure calculation engine
 * SolutionsNepal 2026. Deterministic, no DOM, testable.
 */

export function sanitizeAmount(v) {
  if (v == null || v === '') return 0;
  const n = Number(String(v).replace(/,/g, '').replace(/^Rs\.?\s*/i, '').trim());
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}
export function clamp(v, min, max) { return Math.max(min, Math.min(max, Number(v) || 0)); }

export function formatNPR(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 'Rs 0';
  const sign = v < 0 ? '-' : '';
  const a = Math.abs(Math.round(v));
  return `${sign}Rs ${new Intl.NumberFormat('en-IN').format(a)}`;
}
export function formatInt(n) {
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('en-IN').format(Math.round(n));
}
export function formatPercent(ratio) {
  if (!Number.isFinite(ratio)) return '—';
  return (ratio * 100).toFixed(ratio * 100 % 1 === 0 ? 0 : 1) + '%';
}

/**
 * Core break-even.
 * @param {object} p
 * @param {number} p.sellingPrice
 * @param {number} p.variableCost
 * @param {number} p.fixedCosts
 * @param {number} p.expectedSales
 * @param {number} p.targetProfit
 * @param {boolean} p.vatEnabled
 * @param {number} p.vatRate  // 13 = 13%
 */
export function calcBreakEven({
  sellingPrice = 0,
  variableCost = 0,
  fixedCosts = 0,
  expectedSales = 0,
  targetProfit = 0,
  vatEnabled = false,
  vatRate = 13,
} = {}) {
  const sp = sanitizeAmount(sellingPrice);
  const vc = sanitizeAmount(variableCost);
  const fc = sanitizeAmount(fixedCosts);
  const exp = Math.max(0, Math.floor(sanitizeAmount(expectedSales)));
  const tp = sanitizeAmount(targetProfit);
  const vr = clamp(vatRate, 0, 50);

  const contribution = sp - vc;
  const contributionRatio = sp > 0 ? contribution / sp : 0;

  const hasValidMargin = contribution > 0;
  const breakEvenUnits = hasValidMargin && fc > 0 ? fc / contribution : hasValidMargin && fc === 0 ? 0 : Infinity;
  const breakEvenUnitsCeiled = Number.isFinite(breakEvenUnits) ? Math.ceil(breakEvenUnits) : Infinity;
  const breakEvenRevenue = Number.isFinite(breakEvenUnits) ? breakEvenUnits * sp : Infinity;
  const breakEvenRevenueCeiled = Number.isFinite(breakEvenUnitsCeiled) ? breakEvenUnitsCeiled * sp : Infinity;

  // VAT — assumption: selling price entered is VAT-inclusive. Net = gross / (1+rate)
  let vat = null;
  if (vatEnabled) {
    const divisor = 1 + vr / 100;
    const netRevenueAtBe = Number.isFinite(breakEvenRevenueCeiled) ? breakEvenRevenueCeiled / divisor : 0;
    const vatAtBe = Number.isFinite(breakEvenRevenueCeiled) ? breakEvenRevenueCeiled - netRevenueAtBe : 0;
    const netPrice = divisor > 0 ? sp / divisor : sp;
    const netContribution = netPrice - vc;
    const netRatio = netPrice > 0 ? netContribution / netPrice : 0;
    vat = { rate: vr, netPrice, netContribution, netRatio, netRevenueAtBe, vatAtBe };
  }

  // Expected profit/loss
  const revenueExpected = exp * sp;
  const variableExpected = exp * vc;
  const profit = revenueExpected - variableExpected - fc;

  // Margin of safety
  const mosUnits = Number.isFinite(breakEvenUnitsCeiled) ? exp - breakEvenUnitsCeiled : 0;
  const mosPercent = exp > 0 && Number.isFinite(breakEvenUnitsCeiled) ? (mosUnits / exp) * 100 : 0;

  // Target profit
  let requiredUnits = null, requiredRevenue = null;
  if (tp > 0 && hasValidMargin) {
    requiredUnits = (fc + tp) / contribution;
    requiredRevenue = requiredUnits * sp;
  }

  // Validation messages
  const warnings = [];
  if (sp <= 0) warnings.push('Enter a selling price greater than Rs 0.');
  else if (!hasValidMargin) warnings.push('Your selling price must be higher than your variable cost per unit to calculate a meaningful break-even point.');
  if (fc === 0) warnings.push('You have no fixed costs entered — break-even is 0 units. Add rent, salaries and other monthly fixed costs for a realistic estimate.');
  if (hasValidMargin && Number.isFinite(breakEvenUnitsCeiled) && exp > 0 && exp < breakEvenUnitsCeiled) warnings.push('Your current sales target is below break-even.');
  if (exp === 0) warnings.push('Enter your expected monthly sales to see profit, loss and margin of safety.');

  return {
    inputs: { sellingPrice: sp, variableCost: vc, fixedCosts: fc, expectedSales: exp, targetProfit: tp, vatEnabled, vatRate: vr },
    contribution,
    contributionRatio,
    breakEvenUnits,
    breakEvenUnitsCeiled,
    breakEvenRevenue,
    breakEvenRevenueCeiled,
    vat,
    revenueExpected,
    variableExpected,
    profit,
    mosUnits,
    mosPercent,
    requiredUnits,
    requiredUnitsCeiled: requiredUnits != null ? Math.ceil(requiredUnits) : null,
    requiredRevenue,
    warnings,
    hasValidMargin,
  };
}

export function sumFixedCosts(obj = {}) {
  let s = 0;
  for (const v of Object.values(obj)) s += sanitizeAmount(v);
  return s;
}
