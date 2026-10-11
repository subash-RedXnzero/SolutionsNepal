/**
 * Rent vs Buy Calculator Engine (Nepal)
 * =====================================
 * Apples-to-apples comparison over a fixed horizon (years):
 *
 *   renting net cost = total rent paid (rent grows at rentGrowthPct yearly)
 *   buying net cost  = down + one-time buying costs + EMIs paid
 *                      + maintenance − (home value − remaining loan)
 *
 * Subtracting end equity (home value minus loan balance) makes buying
 * comparable to renting: both sides become "money you never get back".
 * Unrounded EMI math is used internally; display rounding happens in UI.
 *
 * @module rent-vs-buy
 */

/** Monthly EMI, unrounded. Standard amortizing formula. */
export function calcEmi(loan, annualRatePct, tenureMonths) {
  if (tenureMonths <= 0) return 0;
  if (annualRatePct === 0) return loan / tenureMonths;
  const r = annualRatePct / 100 / 12;
  const f = Math.pow(1 + r, tenureMonths);
  return (loan * r * f) / (f - 1);
}

/** Remaining loan balance after k monthly payments (k may exceed tenure → 0). */
export function loanBalance(loan, annualRatePct, tenureMonths, paidMonths) {
  if (paidMonths >= tenureMonths) return 0;
  if (annualRatePct === 0) return Math.max(0, loan - (loan / tenureMonths) * paidMonths);
  const r = annualRatePct / 100 / 12;
  const f = Math.pow(1 + r, paidMonths);
  return Math.max(0, loan * f - calcEmi(loan, annualRatePct, tenureMonths) * ((f - 1) / r));
}

/**
 * Full comparison. All percents are annual (e.g. 10 for 10%).
 * @param {object} p
 * @param {number} p.monthlyRent
 * @param {number} p.rentGrowthPct
 * @param {number} p.homePrice
 * @param {number} p.downPct
 * @param {number} p.ratePct
 * @param {number} p.tenureYears
 * @param {number} p.horizonYears  comparison window (may be fractional)
 * @param {number} p.appreciationPct
 * @param {number} p.maintenancePct  annual maintenance as % of purchase price
 * @param {number} p.buyingCostPct  one-time purchase costs as % of price
 */
export function compareRentVsBuy(p) {
  const horizon = Math.max(0, p.horizonYears);
  const tenureMonths = Math.round(p.tenureYears * 12);
  const paidMonths = Math.min(Math.round(horizon * 12), tenureMonths);

  const down = (p.homePrice * p.downPct) / 100;
  const buyingCosts = (p.homePrice * p.buyingCostPct) / 100;
  const loan = Math.max(0, p.homePrice - down);
  const emi = calcEmi(loan, p.ratePct, tenureMonths);
  const emisPaid = emi * paidMonths;
  const balance = loanBalance(loan, p.ratePct, tenureMonths, paidMonths);
  const maintTotal = ((p.homePrice * p.maintenancePct) / 100) * horizon;

  let rentTotal = 0;
  const wholeYears = Math.floor(horizon);
  for (let y = 0; y < wholeYears; y++) {
    rentTotal += p.monthlyRent * 12 * Math.pow(1 + p.rentGrowthPct / 100, y);
  }
  const frac = horizon - wholeYears;
  if (frac > 1e-9) {
    rentTotal += p.monthlyRent * 12 * Math.pow(1 + p.rentGrowthPct / 100, wholeYears) * frac;
  }

  const homeValue = p.homePrice * Math.pow(1 + p.appreciationPct / 100, horizon);
  const equity = homeValue - balance;
  const buyNet = down + buyingCosts + emisPaid + maintTotal - equity;

  const diff = rentTotal - buyNet;
  const winner = Math.abs(diff) < Math.max(1, rentTotal * 0.001) ? 'tie' : diff > 0 ? 'buy' : 'rent';

  return {
    down,
    buyingCosts,
    loan,
    emi,
    emisPaid,
    paidMonths,
    balance,
    maintTotal,
    rentTotal,
    homeValue,
    equity,
    buyNet,
    winner,
    savings: Math.abs(diff),
  };
}

/**
 * First whole year (1–30) where buying's net cost drops at or below
 * renting's cumulative cost. Returns null when renting wins throughout.
 */
export function breakevenYear(p) {
  for (let y = 1; y <= 30; y++) {
    const r = compareRentVsBuy({ ...p, horizonYears: y });
    if (r.winner === 'buy' || r.winner === 'tie') return y;
  }
  return null;
}

/**
 * Year-by-year rows for chart/table: cumulative rent paid vs buying
 * net cost at each year-end (fractional final year appended as-is).
 */
export function rentVsBuySeries(p) {
  const rows = [];
  const wholeYears = Math.floor(p.horizonYears);
  for (let y = 1; y <= wholeYears; y++) {
    const r = compareRentVsBuy({ ...p, horizonYears: y });
    rows.push({ year: y, rent: r.rentTotal, buy: r.buyNet });
  }
  const frac = p.horizonYears - wholeYears;
  if (frac > 1e-9) {
    const r = compareRentVsBuy(p);
    rows.push({ year: p.horizonYears, rent: r.rentTotal, buy: r.buyNet });
  }
  return rows;
}

/**
 * Format an amount as Nepali currency with Indian/Nepali digit grouping:
 *   1321507 → "Rs. 13,21,507"
 */
export function formatNPR(amount) {
  if (!Number.isFinite(amount)) return 'Rs. 0';
  const negative = amount < 0;
  const rounded = Math.round(Math.abs(amount));
  const grouped = new Intl.NumberFormat('en-IN').format(rounded);
  return (negative ? '-Rs. ' : 'Rs. ') + grouped;
}

/**
 * Validate one numeric field.
 * @returns {{ok: boolean, value?: number, error?: string}}
 */
export function validateField(raw, { label, min, max }) {
  const v = typeof raw === 'string' ? raw.trim() : raw;
  if (v === '' || v === null || v === undefined) {
    return { ok: false, error: `Enter ${label}.` };
  }
  const num = Number(v);
  if (typeof num !== 'number' || !Number.isFinite(num)) {
    return { ok: false, error: `${label} must be a valid number.` };
  }
  if (num < (min ?? 0)) {
    return { ok: false, error: `${label} cannot be negative.` };
  }
  if (max !== undefined && num > max) {
    return { ok: false, error: `${label} is too large.` };
  }
  return { ok: true, value: num };
}
