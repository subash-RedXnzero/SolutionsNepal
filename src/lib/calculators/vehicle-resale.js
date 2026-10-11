/**
 * Vehicle Resale — Pure estimation engine (Nepal)
 * ===============================================
 * Deterministic, no DOM. Model-based estimate (not live market data).
 * All constants imported from src/data/vehicle-resale.js
 *
 * @module vehicle-resale
 */

import {
  DEPRECIATION,
  EXPECTED_KM_PER_YEAR,
  MILEAGE_EFFECT,
  CONDITION_FACTOR,
  ACCIDENT_FACTOR,
  SERVICE_FACTOR,
  OWNERSHIP_FACTOR,
  FUEL_FACTOR,
  RANGE,
  LISTING,
} from '../../data/vehicle-resale.js';

// ── Helpers ────────────────────────────────────────────────────────

export function sanitizeAmount(v) {
  if (v == null || v === '') return 0;
  const n = Number(String(v).replace(/,/g, '').replace(/^Rs\.?\s*/i, '').trim());
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

export function sanitizeKm(v) {
  if (v == null || v === '') return 0;
  const n = Number(String(v).replace(/,/g, '').replace(/km/i, '').trim());
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n);
}

export function formatNPR(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 'Rs 0';
  return `Rs ${new Intl.NumberFormat('en-IN').format(Math.round(Math.abs(v)))}`;
}

export function formatKm(n) {
  return `${new Intl.NumberFormat('en-IN').format(Math.round(Number(n) || 0))} km`;
}

/** 2450000 -> "Rs 24.5L", 2600000 -> "Rs 26L" */
export function formatLakh(n) {
  const v = Number(n) || 0;
  const l = v / 100000;
  const s = l >= 100 ? Math.round(l).toString() : (Math.round(l * 10) / 10).toString();
  return `Rs ${s}L`;
}

export function currentYear() {
  return new Date().getFullYear();
}

/** Base-curve retention for a given age (0 = new). */
export function curveRetention(age) {
  const a = Math.max(0, Math.min(DEPRECIATION.MAX_AGE, Math.floor(Number(age) || 0)));
  if (a <= 0) return 1;
  const r = DEPRECIATION.FIRST_YEAR_RETAIN * Math.pow(DEPRECIATION.ANNUAL_RETAIN, a - 1);
  return Math.max(DEPRECIATION.MIN_RETAIN, r);
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/** Mileage adjustment factor (+/−) from odometer vs expected usage. */
export function mileageFactor(odometerKm, ageYears, vehicleType) {
  const expected = (EXPECTED_KM_PER_YEAR[vehicleType] ?? 8000) * Math.max(1, ageYears);
  if (expected <= 0) return { factor: 1, deviation: 0, expected };
  const deviation = (odometerKm - expected) / expected; // +overused / −underused
  const adj = clamp(-deviation * MILEAGE_EFFECT.SENSITIVITY, MILEAGE_EFFECT.MIN, MILEAGE_EFFECT.MAX);
  return { factor: 1 + adj, deviation, expected };
}

// ── Main estimation ────────────────────────────────────────────────

/**
 * @param {object} p
 * @param {number} p.originalPrice
 * @param {number} p.purchaseYear
 * @param {number} p.odometerKm
 * @param {number|null} p.annualKmOverride
 * @param {string} p.vehicleType, p.condition, p.accident, p.service, p.ownership, p.fuel, p.demandId
 * @param {number} p.demandFactor
 */
export function calcResale({
  originalPrice = 0,
  purchaseYear = 0,
  odometerKm = 0,
  annualKmOverride = null,
  vehicleType = 'car',
  condition = 'good',
  accident = 'none',
  service = 'complete',
  ownership = 'first',
  fuel = 'petrol',
  demandFactor = 1,
} = {}) {
  const price = sanitizeAmount(originalPrice);
  const year = Math.floor(Number(purchaseYear) || 0);
  const odo = sanitizeKm(odometerKm);
  const now = currentYear();
  const age = year > 0 ? now - year : 0;

  const warnings = [];
  if (price <= 0) warnings.push('Enter the original purchase price to estimate resale value.');
  if (year > now) warnings.push('Purchase year cannot be in the future.');
  if (year > 0 && age < 0) warnings.push('Purchase year cannot be in the future.');

  if (price <= 0 || year <= 0 || year > now) {
    return {
      valid: false, price, year, now, age: Math.max(0, age), odo,
      annualKm: 0, annualKmAuto: true, expectedAnnualKm: EXPECTED_KM_PER_YEAR[vehicleType] ?? 8000,
      likely: 0, low: 0, high: 0, depreciation: 0, retainedPct: 0,
      factors: [], history: [], listing: null, warnings,
    };
  }

  const base = price * curveRetention(age);
  const condF = CONDITION_FACTOR[condition] ?? 1;
  const accF = ACCIDENT_FACTOR[accident] ?? 1;
  const servF = SERVICE_FACTOR[service] ?? 1;
  const ownF = OWNERSHIP_FACTOR[ownership] ?? 1;
  const fuelF = FUEL_FACTOR[fuel] ?? 1;
  const demF = Number(demandFactor) || 1;

  // Annual usage: override wins, else odometer ÷ age (min 1 to avoid div-by-zero).
  const expectedAnnual = EXPECTED_KM_PER_YEAR[vehicleType] ?? 8000;
  const autoAnnual = age > 0 ? odo / age : odo;
  const hasOverride = annualKmOverride != null && String(annualKmOverride).trim() !== '';
  const annualKm = hasOverride ? sanitizeKm(annualKmOverride) : Math.round(autoAnnual);
  // Mileage factor uses effective total implied by the annual figure.
  const effectiveTotal = annualKm * Math.max(1, age);
  const mile = mileageFactor(effectiveTotal, age, vehicleType);

  const likely = Math.round(base * condF * accF * servF * ownF * fuelF * demF * mile.factor);
  const low = Math.round(likely * RANGE.LOW);
  const high = Math.round(likely * RANGE.HIGH);
  const depreciation = Math.max(0, price - likely);
  const retainedPct = price > 0 ? (likely / price) * 100 : 0;

  // Factor impacts for the breakdown (signed % contributions).
  const pct = (f) => Math.round((f - 1) * 100);
  const impactOf = (p) => {
    const a = Math.abs(p);
    if (a < 1) return 'No impact';
    if (a < 3) return 'Low impact';
    if (a < 7) return 'Moderate impact';
    return 'High impact';
  };
  const ageLossPct = Math.round((1 - curveRetention(age)) * 100);
  const factors = [
    { label: 'Vehicle age', delta: -ageLossPct, text: `− ${impactOf(ageLossPct)}` },
    { label: 'Mileage', delta: pct(mile.factor), text: `${mile.factor >= 1 ? '+' : '−'} ${impactOf(pct(mile.factor))}`.replace('+ No impact', 'No impact') },
    { label: 'Condition', delta: pct(condF), text: condF >= 1 ? '+ Positive' : '− Negative' },
    { label: 'Service history', delta: pct(servF), text: servF >= 1 ? '+ Positive' : '− Negative' },
    { label: 'Accident history', delta: pct(accF), text: accF >= 1 ? 'No impact' : '− Negative' },
  ];

  // Value history from the base curve; Current = final likely value.
  const history = [{ label: 'Purchase', value: price }];
  for (let y = 1; y <= age; y += 1) {
    history.push({ label: `Year ${y}`, value: Math.round(price * curveRetention(y)) });
  }
  history.push({ label: 'Current', value: likely, current: true });

  // Listing suggestion.
  const roundTo = LISTING.ROUND_TO;
  const round = (v) => Math.round(v / roundTo) * roundTo;
  const listing = {
    suggested: round(likely * LISTING.FACTOR),
    negLow: round(likely * LISTING.NEG_LOW),
    negHigh: round(likely * LISTING.NEG_HIGH),
  };

  return {
    valid: true, price, year, now, age, odo,
    annualKm, annualKmAuto: !hasOverride, expectedAnnualKm: expectedAnnual,
    likely, low, high, depreciation, retainedPct,
    curveRetention: curveRetention(age),
    factors, history, listing, warnings,
  };
}
