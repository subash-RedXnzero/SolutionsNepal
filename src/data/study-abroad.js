/**
 * Study Abroad — Centralized options & assumptions (Nepal)
 * ========================================================
 * Country-specific fees are intentionally NOT hardcoded here — users
 * enter their own figures. Suggested exchange rates are editable
 * defaults only (rates change over time), not live data.
 */

export const LAST_CHECKED = 'September 2026';

export const HAS_LIVE_RATES = false;

export const COUNTRIES = [
  'Australia', 'Canada', 'UK', 'USA', 'Japan',
  'South Korea', 'Germany', 'New Zealand', 'Other',
];

export const CURRENCIES = [
  { id: 'NPR', label: 'NPR', symbol: 'Rs' },
  { id: 'AUD', label: 'AUD', symbol: 'A$' },
  { id: 'CAD', label: 'CAD', symbol: 'C$' },
  { id: 'GBP', label: 'GBP', symbol: '£' },
  { id: 'USD', label: 'USD', symbol: '$' },
  { id: 'JPY', label: 'JPY', symbol: '¥' },
  { id: 'EUR', label: 'EUR', symbol: '€' },
  { id: 'NZD', label: 'NZD', symbol: 'NZ$' },
  { id: 'KRW', label: 'KRW', symbol: '₩' },
  { id: 'Other', label: 'Other', symbol: '' },
];

/** Suggested (editable) NPR rates per 1 unit of foreign currency. */
export const SUGGESTED_RATES = {
  NPR: 1, AUD: 105, CAD: 102, GBP: 175, USD: 140,
  JPY: 0.95, EUR: 150, NZD: 95, KRW: 0.11, Other: 1,
};

export const COUNTRY_CURRENCY = {
  Australia: 'AUD', Canada: 'CAD', UK: 'GBP', USA: 'USD', Japan: 'JPY',
  'South Korea': 'KRW', Germany: 'EUR', 'New Zealand': 'NZD', Other: 'USD',
};

export const PROGRAM_LEVELS = [
  "Bachelor's", "Master's", 'PhD', 'Diploma', 'Certificate', 'Other',
];

export const DURATION_PRESETS = [1, 2, 3, 4];

export const ENGLISH_TESTS = ['IELTS', 'PTE', 'TOEFL', 'Duolingo', 'Other', 'Already completed'];

export const TUITION_FREQS = [
  { id: 'annual', label: 'Per year' },
  { id: 'semester', label: 'Per semester' },
  { id: 'total', label: 'Total program' },
];

/** Recurring frequencies offered on living / travel / insurance fields. */
export const RECUR_FREQS = [
  { id: 'monthly', label: 'Monthly' },
  { id: 'annual', label: 'Annual' },
];

export const DEFAULTS = {
  country: 'Australia',
  currency: 'AUD',
  rate: 105,
  programLevel: "Bachelor's",
  applications: 3,
  tuitionFreq: 'annual',
};

export const LIMITS = {
  maxAmount: 1e11,
  maxRate: 100000,
  maxYears: 10,
};

export function currencySymbol(id) {
  const c = CURRENCIES.find((x) => x.id === id);
  return c ? c.symbol : '';
}
