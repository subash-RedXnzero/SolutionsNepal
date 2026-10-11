/**
 * House Construction Cost — Calculation Engine
 * ============================================
 * Pure functions. No DOM. All rates and percentages come from the data
 * config so estimates can be refreshed without touching the UI.
 *
 * @module house-construction
 */

import {
  LOCATION_OPTIONS,
  QUALITY_OPTIONS,
  ROOF_OPTIONS,
  PARKING_OPTIONS,
  BREAKDOWN,
  COST_RANGE_PCT,
  getLocationMeta,
  getQualityMeta,
  getRoofMeta,
} from '../../data/construction/house-cost.js';

export const MAX_SQFT = 100000;
export const MAX_AMOUNT = 1000000000;

export function sanitizeNumber(value, fallback = 0) {
  const n = typeof value === 'string' ? Number(String(value).replace(/,/g, '').trim()) : Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(n, MAX_SQFT);
}

export function sanitizeAmount(value, fallback = 0) {
  const n = typeof value === 'string' ? Number(String(value).replace(/,/g, '').trim()) : Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(n, MAX_AMOUNT);
}

export function formatNumber(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '0';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(n));
}

export function formatNPR(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return 'Rs. 0';
  return `Rs. ${formatNumber(n)}`;
}

export function calculateTotalBuiltUpArea(perFloor, floors) {
  const pf = sanitizeNumber(perFloor);
  const f = Number(floors);
  if (!Number.isFinite(f) || f <= 0) return 0;
  const effectiveFloors = Math.min(f, 10);
  return Math.round(pf * effectiveFloors);
}

export function getLocationMultiplier(locationId) {
  const meta = getLocationMeta(locationId);
  return meta ? meta.multiplier : 1;
}

export function getRoofMultiplier(roofId) {
  const meta = getRoofMeta(roofId);
  return meta ? meta.multiplier : 1;
}

export function getBaseRateForQuality(qualityId) {
  const meta = getQualityMeta(qualityId);
  if (!meta) return 3625;
  if (meta.baseRate == null) return null;
  return meta.baseRate;
}

export function getParkingFactor(parkingId) {
  const found = PARKING_OPTIONS.find((p) => p.id === parkingId);
  return found ? found.costFactor : 0;
}

/**
 * Effective cost per sq.ft. after location, roof and parking adjustments.
 * Custom quality returns the user rate directly.
 */
export function getCostPerSqFt({ locationId, qualityId, roofId, parkingId, customRate }) {
  const quality = getQualityMeta(qualityId);
  if (quality && quality.id === 'custom') {
    const r = sanitizeNumber(customRate);
    return r > 0 ? r : 0;
  }
  const base = getBaseRateForQuality(qualityId);
  if (base == null || base === 0) return 0;
  const locM = getLocationMultiplier(locationId);
  const roofM = getRoofMultiplier(roofId);
  const parkF = getParkingFactor(parkingId);
  return Math.round(base * locM * roofM * (1 + parkF));
}

export function calculateBaseCost(totalBuiltUpArea, costPerSqFt) {
  const area = sanitizeNumber(totalBuiltUpArea);
  const rate = sanitizeNumber(costPerSqFt);
  return Math.round(area * rate);
}

export function calculateContingency(baseCost, percent) {
  const p = Number(percent);
  if (!Number.isFinite(p) || p < 0) return 0;
  return Math.round(baseCost * (p / 100));
}

export function sumAdditionalCosts(additionalCosts = {}) {
  let sum = 0;
  for (const v of Object.values(additionalCosts)) sum += sanitizeAmount(v);
  return Math.round(sum);
}

export function calculateRecommendedBudget({ baseCost, contingency, additionalCosts }) {
  return Math.round(sanitizeAmount(baseCost) + sanitizeAmount(contingency) + sanitizeAmount(additionalCosts));
}

export function calculateMonthlyBudget(recommendedBudget, months) {
  const m = Number(months);
  if (!Number.isFinite(m) || m <= 0) return 0;
  return Math.round(sanitizeAmount(recommendedBudget) / m);
}

export function calculateCostRange(baseCost, lowPct = COST_RANGE_PCT.low, highPct = COST_RANGE_PCT.high) {
  const base = sanitizeAmount(baseCost);
  return {
    low: Math.round(base * lowPct),
    mid: Math.round(base),
    high: Math.round(base * highPct),
    lowPct,
    highPct,
  };
}

export function calculateBreakdown(baseCost) {
  const base = sanitizeAmount(baseCost);
  return BREAKDOWN.map((item) => ({
    key: item.key,
    label: item.label,
    pct: item.pct,
    amount: Math.round(base * item.pct),
  }));
}

export function calculateAdjustedForMaterialIncrease(baseCost, increasePercent) {
  const p = Number(increasePercent);
  if (!Number.isFinite(p) || p < 0) return sanitizeAmount(baseCost);
  return Math.round(sanitizeAmount(baseCost) * (1 + p / 100));
}

/**
 * Budget planner: what can be built with a given budget.
 * Accounts for contingency and additional costs before dividing by rate.
 */
export function calculateBudgetPlanner({ budget, costPerSqFt, contingencyPercent, additionalCosts }) {
  const b = sanitizeAmount(budget);
  const rate = sanitizeNumber(costPerSqFt);
  if (b <= 0 || rate <= 0) return { area: 0, areaLow: 0, areaHigh: 0, floors: 0, bedrooms: '', bathrooms: '', finish: '' };

  const add = sanitizeAmount(additionalCosts);
  const contP = Number(contingencyPercent);
  // available = (budget - add) / (1 + contP/100)  → base construction budget
  const denom = 1 + (Number.isFinite(contP) && contP > 0 ? contP / 100 : 0);
  const available = Math.max(0, (b - add) / denom);
  const area = available / rate;

  // Suggest finish based on rate tier
  let finish = 'Basic';
  if (rate >= 4500) finish = 'Premium';
  else if (rate >= 3300) finish = 'Standard';

  // Rough room heuristics (kept intentionally vague)
  let bedrooms = '1';
  let bathrooms = '1';
  let floors = 1;
  if (area >= 2200) { bedrooms = '3 to 4+'; bathrooms = '3+'; floors = 2.5; }
  else if (area >= 1300) { bedrooms = '2 to 3'; bathrooms = '2'; floors = 1.5; }
  else if (area >= 800) { bedrooms = '2'; bathrooms = '1 to 2'; floors = 1; }
  else if (area >= 400) { bedrooms = '1'; bathrooms = '1'; floors = 1; }
  else { bedrooms = '—'; bathrooms = '—'; floors = 0; }

  return {
    area: Math.round(area),
    areaLow: Math.round(area * 0.97),
    areaHigh: Math.round(area * 1.02),
    floors,
    bedrooms,
    bathrooms,
    finish,
  };
}

export function estimateBudgetScenarios(costPerSqFt) {
  const rate = sanitizeNumber(costPerSqFt) || 3625;
  const presets = [2000000, 3000000, 4000000, 5000000, 7500000, 10000000];
  return presets.map((budget) => {
    const plan = calculateBudgetPlanner({ budget, costPerSqFt: rate, contingencyPercent: 5, additionalCosts: 0 });
    return { budget, ...plan };
  });
}
