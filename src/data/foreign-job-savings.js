/**
 * Foreign Job Salary & Real Savings — Data
 * ========================================
 * Country and currency config + reusable expense definitions.
 * Mirrors the shape of government-services / foreign-employment data
 * so the same helpers can feed both the salary tool and future detail
 * routes (qatar, uae, saudi-arabia, etc.).
 *
 * Trust rules:
 * - Exchange rates are NEVER hardcoded here as live data.
 * - Salary, tax and living-cost figures are illustrative only.
 */

export const COUNTRIES = [
  { id: 'qatar', name: 'Qatar', currency: 'QAR', currencyName: 'Qatari Riyal', iso3: 'QAR', flag: '🇶🇦', popular: true },
  { id: 'uae', name: 'UAE', currency: 'AED', currencyName: 'UAE Dirham', iso3: 'AED', flag: '🇦🇪', popular: true },
  { id: 'saudi-arabia', name: 'Saudi Arabia', currency: 'SAR', currencyName: 'Saudi Riyal', iso3: 'SAR', flag: '🇸🇦', popular: true },
  { id: 'malaysia', name: 'Malaysia', currency: 'MYR', currencyName: 'Malaysian Ringgit', iso3: 'MYR', flag: '🇲🇾', popular: true },
  { id: 'south-korea', name: 'South Korea', currency: 'KRW', currencyName: 'South Korean Won', iso3: 'KRW', flag: '🇰🇷', popular: true },
  { id: 'japan', name: 'Japan', currency: 'JPY', currencyName: 'Japanese Yen', iso3: 'JPY', flag: '🇯🇵', popular: true },
  { id: 'australia', name: 'Australia', currency: 'AUD', currencyName: 'Australian Dollar', iso3: 'AUD', flag: '🇦🇺', popular: true },
  { id: 'kuwait', name: 'Kuwait', currency: 'KWD', currencyName: 'Kuwaiti Dinar', iso3: 'KWD', flag: '🇰🇼', popular: true },
  { id: 'bahrain', name: 'Bahrain', currency: 'BHD', currencyName: 'Bahraini Dinar', iso3: 'BHD', flag: '🇧🇭', popular: true },
  { id: 'israel', name: 'Israel', currency: 'ILS', currencyName: 'Israeli New Shekel', iso3: 'ILS', flag: '🇮🇱', popular: true },
  { id: 'romania', name: 'Romania', currency: 'RON', currencyName: 'Romanian Leu', iso3: 'RON', flag: '🇷🇴', popular: true },
  { id: 'poland', name: 'Poland', currency: 'PLN', currencyName: 'Polish Zloty', iso3: 'PLN', flag: '🇵🇱', popular: true },
  { id: 'other', name: 'Other', currency: '', currencyName: '', iso3: '', flag: '', popular: false },
];

export const POPULAR_COUNTRIES = COUNTRIES.filter((c) => c.popular);

export const OTHER_CURRENCIES = [
  { iso3: 'GBP', name: 'British Pound', flag: '🇬🇧' },
  { iso3: 'EUR', name: 'Euro', flag: '🇪🇺' },
  { iso3: 'USD', name: 'US Dollar', flag: '🇺🇸' },
  { iso3: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦' },
  { iso3: 'SGD', name: 'Singapore Dollar', flag: '🇸🇬' },
  { iso3: 'NZD', name: 'New Zealand Dollar', flag: '🇳🇿' },
];

export const EXPENSE_DEFS = [
  { key: 'housing', label: 'Housing', group: 'living' },
  { key: 'food', label: 'Food', group: 'living' },
  { key: 'transportation', label: 'Transportation', group: 'living' },
  { key: 'phone', label: 'Phone / Internet', group: 'living' },
  { key: 'personal', label: 'Personal expenses', group: 'living' },
  { key: 'other', label: 'Other monthly expenses', group: 'living' },
];

export const HIDDEN_COST_KEYS = [
  { key: 'recruitment', label: 'Recruitment / agency cost', kind: 'oneTime' },
  { key: 'accommodationDeposit', label: 'Accommodation deposit', kind: 'oneTime' },
  { key: 'foodDeposit', label: 'Food deposit', kind: 'oneTime' },
  { key: 'insurance', label: 'Insurance', kind: 'recurring' },
  { key: 'medical', label: 'Medical expenses', kind: 'recurring' },
  { key: 'loanRepayment', label: 'Loan repayment', kind: 'recurring' },
  { key: 'localTransport', label: 'Local transportation', kind: 'recurring' },
  { key: 'phoneInternet', label: 'Phone / internet', kind: 'recurring' },
  { key: 'otherRecurring', label: 'Other recurring costs', kind: 'recurring' },
];

/** Savings rate bands — display label only, never financial advice. */
export const SAVINGS_BANDS = [
  { max: 20, label: 'Low', color: '#dc2626' },
  { max: 40, label: 'Moderate', color: '#d97706' },
  { max: 60, label: 'Good', color: '#2563eb' },
  { max: 100, label: 'Excellent', color: '#16a34a' },
];

export function getCountryById(id) {
  return COUNTRIES.find((c) => c.id === id) || null;
}

export function getCurrencyForCountry(countryId) {
  const c = getCountryById(countryId);
  return c ? { iso3: c.iso3, currency: c.currency, name: c.currencyName, flag: c.flag } : null;
}

export function savingsBand(rate) {
  const r = Number(rate);
  if (!Number.isFinite(r)) return { label: 'N/A', color: '#6b7280' };
  for (const b of SAVINGS_BANDS) {
    if (r <= b.max) return b;
  }
  return SAVINGS_BANDS[SAVINGS_BANDS.length - 1];
}
