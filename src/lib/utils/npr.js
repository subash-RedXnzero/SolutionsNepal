/**
 * NPR formatting helpers for the UI layer — the SINGLE home for shared
 * number/currency formatting (previously split with lib/utils/format.js).
 *
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
 * Plain number with Indian-style grouping.
 *   formatNumber(12170)        -> "12,170"
 *   formatNumber(1338.7)        -> "1,338.70"   (auto decimals when fractional)
 *   formatNumber(11.6351, 4)    -> "11.6351"    (explicit decimals honored)
 * Non-finite input renders as "0", never "NaN".
 * @param {number} value
 * @param {number} [decimals] explicit fraction digits; omitted = auto (0 or 2)
 */
export function formatNumber(value, decimals) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  const auto = Math.abs(n - Math.round(n)) > 0.004;
  const digits = decimals ?? (auto ? 2 : 0);
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
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

/**
 * Format a number as Nepali Rupees via Intl currency style.
 * (Moved here from lib/utils/format.js so all shared UI formatting
 * lives in one module.)
 * @param {number} amount
 * @returns {string}
 */
export function formatNPR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'NPR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a percentage
 * (Moved here from lib/utils/format.js.)
 * @param {number} value
 * @param {number} decimals
 * @returns {string}
 */
export function formatPercent(value, decimals = 1) {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Parse a number string, removing commas and non-numeric characters.
 * (Moved here from lib/utils/format.js.)
 * @param {string} str
 * @returns {number}
 */
export function parseNumber(str) {
  const cleaned = String(str).replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Copy text to clipboard.
 * (Moved here from lib/utils/format.js.)
 * @param {string} text
 * @returns {Promise<boolean>}
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}