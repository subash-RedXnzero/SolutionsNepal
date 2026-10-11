/**
 * LPG Gas — Centralized assumptions & options (Nepal)
 * ====================================================
 * All editable assumptions live here. LPG prices change — update
 * DEFAULT_PRICE here, never inside components. No live price feed
 * is connected (HAS_LIVE_PRICE = false).
 */

export const LAST_CHECKED = 'September 2026';

/** Set true only when a verified live LPG price source is connected. */
export const HAS_LIVE_PRICE = false;

/** Standard Nepal household cylinder size (kg). */
export const STANDARD_CYLINDER_KG = 14.2;

/** Default cylinder price assumption (NPR) — planning default, not live. */
export const DEFAULT_PRICE = 2060;

export const MEAL_OPTIONS = [1, 2, 3, 4];

export const COOKING_STYLES = [
  { id: 'light', label: 'Light' },
  { id: 'moderate', label: 'Moderate' },
  { id: 'heavy', label: 'Heavy' },
];

/**
 * kg LPG per person per meal, by cooking style.
 * Calibrated so 4 people × 3 meals × moderate ≈ 0.45 kg/day.
 */
export const KG_PER_PERSON_MEAL = { light: 0.025, moderate: 0.0375, heavy: 0.055 };

/** Price scenario table deltas around the user's price. */
export const SCENARIO_OFFSETS = [-160, 0, 140, 440]; // e.g. 1900 / 2060 / 2200 / 2500

/** Household-size comparison rows. */
export const HOUSEHOLD_ROWS = [2, 3, 4, 5, 6];

export const DEFAULTS = {
  cylinderKg: STANDARD_CYLINDER_KG,
  price: DEFAULT_PRICE,
  people: 4,
  meals: 3,
  style: 'moderate',
};

export const LIMITS = {
  maxAmount: 1e9,
  maxPeople: 20,
  maxKg: 100,
  maxMeals: 10,
};
