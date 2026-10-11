/**
 * Freelancer / Remote Worker Take-home — Data
 * ============================================
 * Income sources, platforms, currencies and reusable expense definitions.
 *
 * No rates are hardcoded as live. Platform and tax percentages are
 * illustrative defaults the user can override.
 */

export const INCOME_SOURCES = [
  { id: 'freelancing', label: 'Freelancing', desc: 'Project based client work' },
  { id: 'remote-job', label: 'Remote Job', desc: 'Full time remote employment' },
  { id: 'contract', label: 'Contract Work', desc: 'Fixed term contracts' },
  { id: 'online-business', label: 'Online Business', desc: 'Store, course, SaaS' },
  { id: 'consulting', label: 'Consulting', desc: 'Expert advice and services' },
  { id: 'other', label: 'Other', desc: 'Other income type' },
];

export const PLATFORMS = [
  { id: 'upwork', label: 'Upwork', defaultFee: 10 },
  { id: 'fiverr', label: 'Fiverr', defaultFee: 20 },
  { id: 'toptal', label: 'Toptal', defaultFee: 0 },
  { id: 'freelancer', label: 'Freelancer', defaultFee: 10 },
  { id: 'direct', label: 'Direct Client', defaultFee: 0 },
  { id: 'remote-company', label: 'Remote Company', defaultFee: 0 },
  { id: 'other', label: 'Other', defaultFee: 10 },
];

export const CURRENCIES = [
  { iso3: 'USD', name: 'US Dollar', flag: '🇺🇸' },
  { iso3: 'EUR', name: 'Euro', flag: '🇪🇺' },
  { iso3: 'GBP', name: 'British Pound', flag: '🇬🇧' },
  { iso3: 'AUD', name: 'Australian Dollar', flag: '🇦🇺' },
  { iso3: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦' },
  { iso3: 'SGD', name: 'Singapore Dollar', flag: '🇸🇬' },
  { iso3: 'AED', name: 'UAE Dirham', flag: '🇦🇪' },
  { iso3: 'QAR', name: 'Qatari Riyal', flag: '🇶🇦' },
];

export const PAYMENT_METHODS = [
  { id: 'payoneer', label: 'Payoneer' },
  { id: 'wise', label: 'Wise' },
  { id: 'bank', label: 'Bank Transfer' },
  { id: 'paypal', label: 'PayPal' },
  { id: 'direct-bank', label: 'Direct Bank Payment' },
  { id: 'other', label: 'Other' },
];

export const BUSINESS_EXPENSE_DEFS = [
  { key: 'internet', label: 'Internet', example: 2000 },
  { key: 'electricity', label: 'Electricity', example: 1500 },
  { key: 'software', label: 'Software / Subscriptions', example: 3000 },
  { key: 'equipment', label: 'Equipment', example: 2000 },
  { key: 'workspace', label: 'Workspace / Office', example: 0 },
  { key: 'other', label: 'Other', example: 1000 },
];

export const ONE_TIME_EXPENSE_DEFS = [
  { key: 'laptop', label: 'Laptop', kind: 'oneTime' },
  { key: 'monitor', label: 'Monitor', kind: 'oneTime' },
  { key: 'phone', label: 'Phone', kind: 'oneTime' },
  { key: 'camera', label: 'Camera', kind: 'oneTime' },
  { key: 'softwareLicense', label: 'Software license', kind: 'oneTime' },
  { key: 'course', label: 'Professional course', kind: 'oneTime' },
  { key: 'businessRegistration', label: 'Business registration', kind: 'oneTime' },
  { key: 'otherOneTime', label: 'Other', kind: 'oneTime' },
];

export function getPlatformById(id) {
  return PLATFORMS.find((p) => p.id === id) || null;
}

export function getCurrencyMeta(iso3) {
  return CURRENCIES.find((c) => c.iso3 === iso3) || null;
}
