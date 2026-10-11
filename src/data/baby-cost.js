/**
 * New Baby Cost — Centralized options & assumptions (Nepal)
 * =========================================================
 * No hospital prices or official costs are hardcoded here — every
 * amount is user-entered. Planning tool only, not medical advice.
 */

export const LAST_CHECKED = 'September 2026';

export const BABY_OPTIONS = [
  { id: 1, label: '1' },
  { id: 2, label: '2' },
  { id: 3, label: '3' },
  { id: 4, label: '4' },
];

export const FEEDING_PLANS = [
  { id: 'breastfeeding', label: 'Breastfeeding' },
  { id: 'formula', label: 'Formula feeding' },
  { id: 'combination', label: 'Combination' },
];

export const LOCATIONS = [
  { id: 'ktm', label: 'Kathmandu Valley' },
  { id: 'city', label: 'Other Major City' },
  { id: 'other', label: 'Other Area' },
];

export const CONTINGENCY_OPTIONS = [0, 5, 10, 15];

export const MONTH_FREQS = [
  { id: 'monthly', label: 'Monthly' },
  { id: 'annual', label: 'Annual' },
];

export const DEFAULTS = {
  babies: 1,
  feedingPlan: 'breastfeeding',
  location: 'ktm',
  diapersPerDay: 6,
  childcareMonths: 12,
  babyFoodStartMonth: 6,
  contingencyPct: 10,
};

export const LIMITS = {
  maxAmount: 1e10,
  maxCount: 100,
};

export function clampInt(v, min, max, fallback) {
  const n = Math.floor(Number(String(v ?? '').replace(/,/g, '')));
  if (!Number.isFinite(n) || n < min || n > max) return fallback;
  return n;
}
