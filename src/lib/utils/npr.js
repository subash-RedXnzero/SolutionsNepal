/**
 * NPR formatting helpers for the UI layer.
 * The calculation engines keep full precision internally and round to 2dp;
 * these helpers only control how amounts are DISPLAYED.
 */

const DEVA_DIGITS = '०१२३४५६७८९';

export function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

/**
 * Format an NPR amount: Indian-style grouping, 2 decimals only when the
 * amount is fractional.
 *   formatRupee(12170)       -> "Rs. 12,170"
 *   formatRupee(1338.70)     -> "Rs. 1,338.70"
 * @param {number} amount
 */
export function formatRupee(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return 'Rs. 0';
  const hasFraction = Math.abs(n - Math.round(n)) > 0.004;
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 0,
  }).format(n);
  return `Rs. ${formatted}`;
}

/**
 * Plain number with Indian-style grouping, decimals only when fractional.
 */
export function formatNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  const hasFraction = Math.abs(n - Math.round(n)) > 0.004;
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 0,
  }).format(n);
}

/**
 * Convert ASCII digits in a string to Devanagari digits.
 */
export function toDevanagari(value) {
  return String(value).replace(/[0-9]/g, (d) => DEVA_DIGITS[Number(d)]);
}

/**
 * Format a rupee amount and return a Devanagari-digit variant for the same
 * amount, e.g. { en: "Rs. 23,066.97", deva: "रु २३,०६६.९७" }.
 */
export function formatRupeeBilingual(amount) {
  const en = formatRupee(amount);
  const digits = en.replace(/^Rs\.\s*/, '');
  return { en, deva: `रु ${toDevanagari(digits)}` };
}