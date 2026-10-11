/**
 * Vehicle Resale — Centralized model assumptions (Nepal)
 * ======================================================
 * Every constant the estimator uses lives here. Tune these as real
 * Nepal market data becomes available — never hardcode them in UI.
 *
 * MODEL: model-based estimate (NOT live market data).
 */

export const LAST_CHECKED = 'September 2026';

/** Set to true only when a verified live market source is connected. */
export const HAS_LIVE_MARKET_DATA = false;

export const VEHICLE_TYPES = [
  { id: 'car', label: 'Car', bike: false },
  { id: 'suv', label: 'SUV', bike: false },
  { id: 'pickup', label: 'Pickup', bike: false },
  { id: 'van', label: 'Van', bike: false },
  { id: 'motorcycle', label: 'Motorcycle', bike: true },
  { id: 'scooter', label: 'Scooter', bike: true },
];

export const CAR_BRANDS = [
  'Toyota', 'Hyundai', 'Kia', 'Suzuki', 'Honda', 'Tata', 'Mahindra',
  'MG', 'BYD', 'Nissan', 'Ford', 'Volkswagen', 'Jeep', 'Skoda', 'Other',
];

export const BIKE_BRANDS = [
  'Honda', 'Yamaha', 'Bajaj', 'TVS', 'Royal Enfield', 'Suzuki',
  'Hero', 'KTM', 'Vespa', 'NIU', 'Other',
];

export const CAR_FUELS = [
  { id: 'petrol', label: 'Petrol' },
  { id: 'diesel', label: 'Diesel' },
  { id: 'hybrid', label: 'Hybrid' },
  { id: 'electric', label: 'Electric' },
  { id: 'other', label: 'Other' },
];

export const BIKE_FUELS = [
  { id: 'petrol', label: 'Petrol' },
  { id: 'electric', label: 'Electric' },
];

export const CONDITIONS = [
  { id: 'excellent', label: 'Excellent', desc: 'Very well maintained · minimal wear · no major accidents' },
  { id: 'good', label: 'Good', desc: 'Normal wear · regular servicing · no major issues' },
  { id: 'average', label: 'Average', desc: 'Noticeable wear · some repairs needed' },
  { id: 'poor', label: 'Poor', desc: 'Significant wear · major repairs needed' },
];

export const ACCIDENTS = [
  { id: 'none', label: 'No major accident' },
  { id: 'minor', label: 'Minor accident' },
  { id: 'major', label: 'Major accident' },
];

export const SERVICES = [
  { id: 'complete', label: 'Complete / documented' },
  { id: 'partial', label: 'Partial' },
  { id: 'little', label: 'Little or no records' },
];

export const OWNERSHIPS = [
  { id: 'first', label: 'First owner' },
  { id: 'second', label: 'Second owner' },
  { id: 'third', label: '3+ owners' },
];

export const DEMANDS = [
  { id: 'low', label: 'Low demand', factor: 0.95 },
  { id: 'normal', label: 'Normal demand', factor: 1.0 },
  { id: 'strong', label: 'Strong demand', factor: 1.05 },
];

// ── Depreciation curve (base, before adjustments) ─────────────────
// retention(age) = FIRST_YEAR_RETAIN × ANNUAL_RETAIN^(age−1), floored.
export const DEPRECIATION = {
  FIRST_YEAR_RETAIN: 0.88,
  ANNUAL_RETAIN: 0.93,
  MIN_RETAIN: 0.15,
  MAX_AGE: 25,
};

// ── Expected annual mileage (km/year) by vehicle type ─────────────
export const EXPECTED_KM_PER_YEAR = {
  car: 10000, suv: 10000, pickup: 12000, van: 12000,
  motorcycle: 6000, scooter: 5000,
};

// Mileage effect: ±10% mileage deviation moves value by MILEAGE_SENSITIVITY,
// clamped to [MILEAGE_MIN, MILEAGE_MAX].
export const MILEAGE_EFFECT = { SENSITIVITY: 0.1, MIN: -0.15, MAX: 0.05 };

// ── Multiplicative adjustments ────────────────────────────────────
export const CONDITION_FACTOR = { excellent: 1.05, good: 1.0, average: 0.93, poor: 0.82 };
export const ACCIDENT_FACTOR = { none: 1.0, minor: 0.95, major: 0.85 };
export const SERVICE_FACTOR = { complete: 1.02, partial: 1.0, little: 0.95 };
export const OWNERSHIP_FACTOR = { first: 1.0, second: 0.97, third: 0.93 };
export const FUEL_FACTOR = { petrol: 1.0, diesel: 1.0, hybrid: 1.02, electric: 0.97, other: 1.0 };

// ── Range & listing ───────────────────────────────────────────────
export const RANGE = { LOW: 0.92, HIGH: 1.06 };
export const LISTING = { FACTOR: 1.04, NEG_LOW: 0.98, NEG_HIGH: 1.02, ROUND_TO: 5000 };

export const DEFAULTS = {
  vehicleType: 'car',
  condition: 'good',
  accident: 'none',
  service: 'complete',
  ownership: 'first',
  fuel: 'petrol',
  demand: 'normal',
};

export function getType(id) {
  return VEHICLE_TYPES.find((t) => t.id === id) || VEHICLE_TYPES[0];
}

export function getDemand(id) {
  return DEMANDS.find((d) => d.id === id) || DEMANDS[1];
}
