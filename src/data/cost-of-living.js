/**
 * Cost of Living — Default Estimates
 * ===================================
 * Centralized, editable configuration for SolutionsNepal's Cost of Living Calculator.
 *
 * IMPORTANT: These are example estimates for UI convenience — NOT official
 * statistics or government data. Every value is user-overwritable.
 * Keep this data separate from UI components — edit here, UI updates.
 *
 * Structure:
 *   CITY_MULTIPLIERS  — overall cost multiplier per city (Kathmandu = 1.0)
 *   BASE_EXPENSES     — monthly NPR for a 1-person household in base city
 *   RENT_TABLE        — monthly rent by property + furnishing (base city)
 *   HOUSEHOLD_SCALE   — multiplier by household size
 */

export const LAST_CHECKED = 'September 2026';

export const CITIES = [
  { id: 'kathmandu', label: 'Kathmandu', multiplier: 1.0 },
  { id: 'lalitpur', label: 'Lalitpur', multiplier: 0.98 },
  { id: 'bhaktapur', label: 'Bhaktapur', multiplier: 0.92 },
  { id: 'pokhara', label: 'Pokhara', multiplier: 0.90 },
  { id: 'chitwan', label: 'Chitwan', multiplier: 0.80 },
  { id: 'biratnagar', label: 'Biratnagar', multiplier: 0.78 },
  { id: 'butwal', label: 'Butwal', multiplier: 0.78 },
  { id: 'dharan', label: 'Dharan', multiplier: 0.75 },
  { id: 'other', label: 'Other Nepal', multiplier: 0.70 },
];

export const CITY_IDS = CITIES.map((c) => c.id);

export const HOUSEHOLD_OPTIONS = [
  { id: '1', label: '1 person', size: 1 },
  { id: '2', label: '2 people', size: 2 },
  { id: '3', label: '3 people', size: 3 },
  { id: '4', label: '4 people', size: 4 },
  { id: '5plus', label: '5+ people', size: 5 },
  { id: 'custom', label: 'Custom', size: null },
];

export const PROPERTY_OPTIONS = [
  { id: 'room', label: 'Room' },
  { id: '1bhk', label: '1 BHK' },
  { id: '2bhk', label: '2 BHK' },
  { id: '3bhk', label: '3 BHK' },
  { id: '4plus', label: '4+ BHK' },
];

export const FURNISHING_OPTIONS = [
  { id: 'unfurnished', label: 'Unfurnished' },
  { id: 'furnished', label: 'Furnished' },
];

// ── Base monthly expenses for 1 person in Kathmandu (Rs.) ───────
// These feed the editable form defaults. All amounts are illustrative.
export const BASE_EXPENSES = {
  housing: 0, // filled from RENT_TABLE when renting, else 0
  foodGroceries: 8000,
  eatingOut: 2500,
  electricity: 1500,
  water: 600,
  internet: 1500,
  mobile: 800,
  transportation: 2500,
  fuel: 1500,
  healthcare: 1500,
  education: 2000,
  shopping: 2000,
  entertainment: 1500,
  savings: 3000,
  other: 1500,
};

// Rent table: Kathmandu baseline (Rs./month) — scaled by city multiplier
export const RENT_TABLE = {
  room: { unfurnished: 8000, furnished: 11000 },
  '1bhk': { unfurnished: 15000, furnished: 20000 },
  '2bhk': { unfurnished: 22000, furnished: 30000 },
  '3bhk': { unfurnished: 35000, furnished: 45000 },
  '4plus': { unfurnished: 50000, furnished: 65000 },
};

// How household size scales non-housing categories
// (housing is handled separately via rent table / own-home)
export const HOUSEHOLD_SCALE = {
  1: 1.0,
  2: 1.65,
  3: 2.15,
  4: 2.55,
  5: 2.90,
  6: 3.20,
  7: 3.45,
  8: 3.70,
};

// Categories shown in the expense form
export const EXPENSE_CATEGORIES = [
  { key: 'housing', label: 'House Rent', group: 'Housing', icon: 'home' },
  { key: 'foodGroceries', label: 'Food & Groceries', group: 'Food', icon: 'shopping-cart' },
  { key: 'eatingOut', label: 'Eating Out', group: 'Food', icon: 'utensils' },
  { key: 'electricity', label: 'Electricity', group: 'Utilities', icon: 'zap' },
  { key: 'water', label: 'Water', group: 'Utilities', icon: 'droplets' },
  { key: 'internet', label: 'Internet', group: 'Utilities', icon: 'wifi' },
  { key: 'mobile', label: 'Mobile', group: 'Utilities', icon: 'smartphone' },
  { key: 'transportation', label: 'Transportation', group: 'Transport', icon: 'bus' },
  { key: 'fuel', label: 'Fuel', group: 'Transport', icon: 'fuel' },
  { key: 'healthcare', label: 'Healthcare', group: 'Health & Education', icon: 'heart-pulse' },
  { key: 'education', label: 'Education', group: 'Health & Education', icon: 'graduation-cap' },
  { key: 'shopping', label: 'Shopping', group: 'Lifestyle', icon: 'shopping-bag' },
  { key: 'entertainment', label: 'Entertainment', group: 'Lifestyle', icon: 'film' },
  { key: 'savings', label: 'Savings', group: 'Lifestyle', icon: 'piggy-bank' },
  { key: 'other', label: 'Other', group: 'Lifestyle', icon: 'wallet' },
];

// Keys that scale with household size (everything except housing)
export const SCALED_KEYS = new Set([
  'foodGroceries', 'eatingOut', 'electricity', 'water', 'internet',
  'mobile', 'transportation', 'fuel', 'healthcare', 'education',
  'shopping', 'entertainment', 'savings', 'other',
]);

// Lifestyle thresholds (monthly total, Rs.) — estimated spending level
export const LIFESTYLE_THRESHOLDS = [
  { max: 35000, label: 'Budget', desc: 'Careful spending, basic housing and essentials.', color: '#16A34A' },
  { max: 65000, label: 'Moderate', desc: 'Comfortable day-to-day living for most households.', color: '#2563EB' },
  { max: 110000, label: 'Comfortable', desc: 'Good housing, regular eating out and savings.', color: '#7C3AED' },
  { max: Infinity, label: 'Premium', desc: 'Spacious housing and higher lifestyle spending.', color: '#E62B1E' },
];

export const STORAGE_KEY = 'nk-cost-of-living-v1';

/** Resolve household multiplier for any size (interpolates beyond table). */
export function householdMultiplier(size) {
  const n = Math.max(1, Math.floor(Number(size) || 1));
  if (HOUSEHOLD_SCALE[n] != null) return HOUSEHOLD_SCALE[n];
  // beyond 8: +0.22 per extra person
  return HOUSEHOLD_SCALE[8] + (n - 8) * 0.22;
}

/** City multiplier lookup. */
export function cityMultiplier(cityId) {
  const c = CITIES.find((x) => x.id === cityId);
  return c ? c.multiplier : 1.0;
}

/** Rent estimate for given city/property/furnishing. */
export function rentEstimate(cityId, property, furnishing) {
  const base = RENT_TABLE[property]?.[furnishing] ?? RENT_TABLE['1bhk'].unfurnished;
  return Math.round(base * cityMultiplier(cityId));
}

/**
 * Build editable default expenses for the calculator form.
 * @param {object} opts { cityId, householdSize, housingStatus, property, furnishing }
 * @returns {Record<string, number>}
 */
export function buildDefaults({ cityId = 'kathmandu', householdSize = 1, housingStatus = 'renting', property = '1bhk', furnishing = 'unfurnished' } = {}) {
  const cm = cityMultiplier(cityId);
  const hm = householdMultiplier(householdSize);
  const rent = housingStatus === 'renting' ? rentEstimate(cityId, property, furnishing) : 0;

  const out = {};
  for (const cat of EXPENSE_CATEGORIES) {
    if (cat.key === 'housing') {
      out.housing = rent;
    } else {
      const base = BASE_EXPENSES[cat.key] ?? 0;
      // apply household scaling + city cost adjustment (city adjusts 40% of non-housing)
      const cityFactor = 0.6 + 0.4 * cm;
      out[cat.key] = Math.round(base * hm * cityFactor);
    }
  }
  return out;
}
