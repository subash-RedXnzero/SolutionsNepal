/**
 * Fixed Deposit (FD) Calculator Engine (Nepal)
 * ===========================================
 * Pure functions for lump-sum fixed-deposit maturity estimates.
 * Nepali banks commonly compound FD interest quarterly — the caller
 * chooses the frequency; no rates are hard-coded here.
 *
 *   A = P × (1 + r/n)^(n×t)
 *
 * where P = principal, r = annual rate (decimal), n = compounding
 * periods per year, t = years. Interest tax (TDS) is applied
 * separately as a flat % of the interest when requested.
 *
 * @module fd
 */

export const FD_FREQUENCIES = {
  annually: 1,
  'half-yearly': 2,
  quarterly: 4,
  monthly: 12,
};

export const LIMITS = { maxPrincipal: 1e10, maxYears: 60, maxRate: 100, maxTds: 100 };

/**
 * Maturity value of a fixed deposit.
 * @param {number} principal  deposit amount (Rs.)
 * @param {number} annualRatePct  nominal annual rate, e.g. 8 for 8%
 * @param {number} years  tenure in years (may be fractional, e.g. 1.5)
 * @param {keyof typeof FD_FREQUENCIES} frequency  compounding frequency
 * @returns {{maturity: number, interest: number, effectiveYieldPct: number}}
 */
export function calcFd(principal, annualRatePct, years, frequency = 'quarterly') {
  const n = FD_FREQUENCIES[frequency] ?? FD_FREQUENCIES.quarterly;
  const r = annualRatePct / 100;
  const periods = n * years;
  const maturity = annualRatePct === 0 ? principal : principal * Math.pow(1 + r / n, periods);
  const interest = maturity - principal;
  const effectiveYieldPct = annualRatePct === 0 ? 0 : (Math.pow(1 + r / n, n) - 1) * 100;
  return { maturity, interest, effectiveYieldPct };
}

/**
 * Apply interest tax (TDS) to FD interest.
 * @param {number} interest  gross interest
 * @param {number} tdsPct  tax % on interest, e.g. 5
 * @returns {{tax: number, netInterest: number}}
 */
export function applyTds(interest, tdsPct) {
  const tax = interest * (tdsPct / 100);
  return { tax, netInterest: interest - tax };
}

/**
 * Year-by-year growth series (value at each year-end).
 * Fractional final year (e.g. 1.5 yrs) appends one final row.
 * @returns {{year: number, value: number, interest: number}[]}
 */
export function fdSeries(principal, annualRatePct, years, frequency = 'quarterly') {
  const n = FD_FREQUENCIES[frequency] ?? FD_FREQUENCIES.quarterly;
  const r = annualRatePct / 100;
  const rows = [];
  const wholeYears = Math.floor(years);
  for (let y = 1; y <= wholeYears; y++) {
    const value = annualRatePct === 0 ? principal : principal * Math.pow(1 + r / n, n * y);
    rows.push({ year: y, value, interest: value - principal });
  }
  const frac = years - wholeYears;
  if (frac > 1e-9) {
    const value =
      annualRatePct === 0 ? principal : principal * Math.pow(1 + r / n, n * years);
    rows.push({ year: years, value, interest: value - principal });
  }
  return rows;
}

/**
 * Format an amount as Nepali currency with Indian/Nepali digit grouping:
 *   108243 → "Rs. 1,08,243"
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
  if (num <= (min ?? 0)) {
    return { ok: false, error: `Enter ${label} greater than Rs. 0.` };
  }
  if (max !== undefined && num > max) {
    return { ok: false, error: `${label} is too large.` };
  }
  return { ok: true, value: num };
}
