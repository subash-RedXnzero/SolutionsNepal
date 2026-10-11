/**
 * Gold Loan — Centralized assumptions & options (Nepal)
 * =====================================================
 * Purity factors are standard ratios (22/24, 18/24) — not lender data.
 * LTV default is an editable planning assumption, NOT a universal
 * Nepali bank requirement. Lenders set their own LTV limits.
 */

export const LAST_CHECKED = 'September 2026';

/** Approximate Nepal standard (also see lib/nepal/gold-price.js). */
export const GRAMS_PER_TOLA = 11.6638;

export const PURITIES = [
  { id: '24K', label: '24K', factor: 1.0, desc: 'Fine gold · full value' },
  { id: '22K', label: '22K', factor: 22 / 24, desc: 'Standard jewellery gold' },
  { id: '18K', label: '18K', factor: 18 / 24, desc: 'Lower gold content' },
];

export const TENURE_QUICK = [
  { label: '6 months', months: 6 },
  { label: '12 months', months: 12 },
  { label: '24 months', months: 24 },
  { label: '36 months', months: 36 },
];

export const DEFAULTS = {
  purity: '22K',
  ltvPct: 75,
  loanMode: 'max',
  ratePct: 12.5,
  tenureValue: 12,
  tenureUnit: 'months',
  feeMode: 'none', // none | pct | fixed
};

export const LIMITS = {
  maxWeightTola: 10000,
  maxPrice: 1e9,
  maxRatePct: 60,
  maxTenureMonths: 360,
  maxAmount: 1e12,
};

export function purityFactor(id) {
  return (PURITIES.find((p) => p.id === id) || PURITIES[1]).factor;
}
