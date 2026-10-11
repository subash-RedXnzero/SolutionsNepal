/**
 * Land Affordability — Nepal Data
 * =================================
 * Configurable assumptions for the affordability calculator.
 * Nothing here is presented as a fixed bank rule or official fee.
 */

export const LOCATION_OPTIONS = [
  { id: 'kathmandu', label: 'Kathmandu' },
  { id: 'lalitpur', label: 'Lalitpur' },
  { id: 'bhaktapur', label: 'Bhaktapur' },
  { id: 'pokhara', label: 'Pokhara' },
  { id: 'bharatpur', label: 'Bharatpur' },
  { id: 'biratnagar', label: 'Biratnagar' },
  { id: 'butwal', label: 'Butwal' },
  { id: 'dharan', label: 'Dharan' },
  { id: 'nepalgunj', label: 'Nepalgunj' },
  { id: 'other-city', label: 'Other major city' },
  { id: 'terai', label: 'Terai' },
  { id: 'hills', label: 'Hills' },
  { id: 'custom', label: 'Custom' },
];

// Land units converted via square feet as common base.
// Ropani-family: Kathmandu-centric. Bigha-family: Terai.
export const LAND_UNITS = [
  { id: 'aana', label: 'Aana', short: 'Aana', toSqFt: 342.25, family: 'ropani' },
  { id: 'ropani', label: 'Ropani', short: 'Ropani', toSqFt: 5476, family: 'ropani' },
  { id: 'paisa', label: 'Paisa', short: 'Paisa', toSqFt: 85.56, family: 'ropani' },
  { id: 'daam', label: 'Daam', short: 'Daam', toSqFt: 21.39, family: 'ropani' },
  { id: 'dhur', label: 'Dhur', short: 'Dhur', toSqFt: 182.25, family: 'bigha' },
  { id: 'kattha', label: 'Kattha', short: 'Kattha', toSqFt: 3645, family: 'bigha' },
  { id: 'bigha', label: 'Bigha', short: 'Bigha', toSqFt: 72900, family: 'bigha' },
  { id: 'sqft', label: 'Square feet', short: 'sq.ft.', toSqFt: 1, family: 'metric' },
  { id: 'sqm', label: 'Square meter', short: 'sq.m.', toSqFt: 10.7639, family: 'metric' },
];

export const LOAN_TERMS = [
  { value: 5, label: '5 years' },
  { value: 10, label: '10 years' },
  { value: 15, label: '15 years' },
  { value: 20, label: '20 years' },
  { value: 'custom', label: 'Custom' },
];

// Planning assumptions — editable, clearly labeled in the UI.
export const AFFORDABILITY_ASSUMPTIONS = {
  emiToIncomeRatio: 0.35, // 35% of gross monthly income
  emiToIncomeComfortable: 0.3,
  emiToIncomeStretch: 0.4,
  recommendedDownPaymentPct: 0.25, // 25%
  registrationPct: 0.05, // 5% example
  legalPct: 0.01,
  brokeragePct: 0.02,
  contingencyPct: 0.02,
};

export const BUDGET_PRESETS_AANA = [
  { price: 300000, label: 'Rs 3 lakh / Aana' },
  { price: 500000, label: 'Rs 5 lakh / Aana' },
  { price: 700000, label: 'Rs 7 lakh / Aana' },
  { price: 1000000, label: 'Rs 10 lakh / Aana' },
];

export const COMPARISON_CITIES = [
  { id: 'kathmandu', label: 'Kathmandu', examplePrice: 1000000 },
  { id: 'bhaktapur', label: 'Bhaktapur', examplePrice: 600000 },
  { id: 'bharatpur', label: 'Bharatpur', examplePrice: 350000 },
  { id: 'pokhara', label: 'Pokhara', examplePrice: 500000 },
];

export function getUnitMeta(id) {
  return LAND_UNITS.find((u) => u.id === id) || LAND_UNITS[0];
}

export function getLocationMeta(id) {
  return LOCATION_OPTIONS.find((l) => l.id === id) || null;
}
