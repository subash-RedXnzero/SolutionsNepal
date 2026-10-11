/**
 * Online Selling Profit — Config (Nepal)
 * No hardcoded marketplace fees are assumed — all percentages are
 * user-editable with editable defaults. Used for validation & display.
 */

export const LAST_CHECKED = 'September 2026';

export const DISCOUNT_MODES = [
  { id: 'none', label: 'No discount' },
  { id: 'pct', label: 'Percentage' },
  { id: 'fixed', label: 'Fixed amount' },
];

export const DELIVERY_PAYS = [
  { id: 'customer', label: 'Customer pays' },
  { id: 'seller', label: 'Seller pays' },
  { id: 'split', label: 'Split delivery cost' },
];

export const AD_MODE = [
  { id: 'per-order', label: 'Use per-order advertising cost' },
  { id: 'monthly', label: 'Use monthly advertising budget' },
];

export const DEFAULTS = {
  platformPct: 5,
  paymentPct: 2,
  splitShare: 50,
  returnRate: 5,
};

export const LIMITS = {
  maxAmount: 1e10,
  maxPct: 100,
  maxOrders: 100000,
};
