/**
 * Nepal Fuel Price Service
 *
 * Architecture:
 *   1. Try live NOC provider (when available)
 *   2. Fall back to mock data if API unavailable
 *   3. Always disclose whether data is live or mock via meta.isLive
 *
 * Data source: Nepal Oil Corporation (NOC)
 * Rate type: Official retail selling price
 *
 * NOC sets prices based on depot/location.
 * Prices can differ between regions.
 */

import { FUEL_MOCK } from './providers/mock-data.js';
import { snapshotFuel, freshness } from './providers/live-snapshot.js';

// ─── Internal state ─────────────────────────────────────────

let _liveData = null;
let _liveMeta = null;
let _liveError = null;
let _fetchAttempted = false;

/**
 * Live NOC data via the pre-fetched snapshot (homepage price ticker).
 * The ticker lists depot-region prices; cities map onto those regions.
 * The ticker carries no previous-day prices, so change direction is 'none'
 * (honest — no fabricated deltas).
 */
const LOCATION_NAMES = {
  kathmandu: 'Kathmandu', pokhara: 'Pokhara', biratnagar: 'Biratnagar', birgunj: 'Birgunj',
  nepalgunj: 'Nepalgunj', dhangadhi: 'Dhangadhi', surkhet: 'Surkhet', dang: 'Dang',
};

async function ensureLiveData() {
  if (_fetchAttempted) return;
  _fetchAttempted = true;
  try {
    const snap = snapshotFuel();
    if (snap) {
      const byCity = snap.byCity;
      _liveData = {
        source: 'Nepal Oil Corporation (NOC)',
        sourceShort: 'NOC',
        rateType: 'Official retail selling price',
        effectiveDate: (snap.fetchedAt || '').slice(0, 10),
        effectiveTime: snap.fetchedAtNPT || '',
        lastUpdatedTime: snap.fetchedAtNPT || '',
        locations: Object.entries(byCity).map(([id, p]) => ({ id, name: LOCATION_NAMES[id] || id, ...p })),
        // Same-day prev = current ⇒ calcChange yields 'none' (no fabricated deltas)
        prevPrices: Object.fromEntries(Object.entries(byCity).map(([id, p]) => [id, p])),
        lpg: { price: snap.lpg ?? 0, prevPrice: snap.lpg ?? 0 },
        history: snap.history || [],
      };
      _liveMeta = { isLive: snap.isLive && freshness('fuel') === 'live', source: 'Nepal Oil Corporation (NOC)', freshness: freshness('fuel') };
    }
  } catch (err) {
    _liveError = err?.message || 'Failed to load fuel snapshot';
  }
}

function getDataSource() {
  return _liveData || FUEL_MOCK;
}

function getMeta() {
  return {
    source: _liveMeta?.source || 'Nepal Oil Corporation (NOC)',
    sourceShort: 'NOC',
    rateType: 'Official retail selling price',
    effectiveDate: getDataSource().effectiveDate,
    effectiveTime: getDataSource().effectiveTime,
    lastUpdated: getDataSource().effectiveDate,
    lastUpdatedTime: getDataSource().lastUpdatedTime,
    isLive: _liveMeta?.isLive || false,
    error: _liveError,
  };
}

function calcChange(current, previous) {
  const diff = current - previous;
  return {
    amount: diff,
    direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'none',
  };
}

// ─── Public API ─────────────────────────────────────────────

/**
 * Get fuel prices for a specific location.
 * Tries live NOC data first, falls back to mock.
 */
export async function getFuelPriceAsync(locationId = 'kathmandu') {
  await ensureLiveData();
  const src = getDataSource();
  return buildFuelPrice(locationId, src);
}

/**
 * Synchronous version — returns mock data immediately.
 */
export function getFuelPrice(locationId = 'kathmandu') {
  return buildFuelPrice(locationId, FUEL_MOCK);
}

function buildFuelPrice(locationId, src) {
  const loc = src.locations.find(l => l.id === locationId) || src.locations[0];
  const prev = src.prevPrices[loc.id] || src.prevPrices.kathmandu;
  const meta = getMeta();

  return {
    source: meta.source,
    sourceShort: meta.sourceShort,
    rateType: meta.rateType,
    effectiveDate: meta.effectiveDate,
    effectiveTime: meta.effectiveTime,
    lastUpdated: meta.lastUpdated,
    lastUpdatedTime: meta.lastUpdatedTime,
    isLive: meta.isLive,
    error: meta.error,
    location: { id: loc.id, name: loc.name },
    petrol: {
      price: loc.petrol,
      change: calcChange(loc.petrol, prev.petrol),
    },
    diesel: {
      price: loc.diesel,
      change: calcChange(loc.diesel, prev.diesel),
    },
    kerosene: {
      price: loc.kerosene,
      change: calcChange(loc.kerosene, prev.kerosene),
    },
    lpg: {
      price: src.lpg.price,
      change: calcChange(src.lpg.price, src.lpg.prevPrice),
    },
    allLocations: src.locations.map(l => ({
      id: l.id,
      name: l.name,
      petrol: l.petrol,
      diesel: l.diesel,
      kerosene: l.kerosene,
    })),
  };
}

/**
 * Get all available locations.
 */
export function getLocations() {
  return FUEL_MOCK.locations.map(l => ({ id: l.id, name: l.name }));
}

/**
 * Get price history.
 * NOC's ticker carries no previous-day data, so live mode has no history —
 * returns an empty array rather than fabricated entries.
 */
export function getFuelPriceHistory() {
  return getDataSource().history ?? [];
}

/**
 * Calculate fuel cost.
 * @param {number} amount - Amount of fuel
 * @param {string} unit - 'litres' or 'kg'
 * @param {string} fuelType - 'petrol', 'diesel', or 'kerosene'
 * @param {string} locationId
 */
export function calculateFuelCost(amount, unit = 'litres', fuelType = 'petrol', locationId = 'kathmandu') {
  const data = getFuelPrice(locationId);
  let pricePerLitre;
  switch (fuelType) {
    case 'diesel': pricePerLitre = data.diesel.price; break;
    case 'kerosene': pricePerLitre = data.kerosene.price; break;
    default: pricePerLitre = data.petrol.price;
  }
  return Math.round(amount * pricePerLitre);
}

/**
 * Calculate trip fuel needed.
 * @param {number} distance - km
 * @param {number} mileage - km/L
 * @param {string} fuelType
 * @param {string} locationId
 */
export function calculateTripFuel(distance, mileage, fuelType = 'petrol', locationId = 'kathmandu') {
  const litres = Math.round((distance / mileage) * 100) / 100;
  const cost = calculateFuelCost(litres, 'litres', fuelType, locationId);
  return { litres, cost };
}

/**
 * Format price in NPR.
 */
export function formatNPR(amount) {
  if (amount == null || isNaN(amount)) return '—';
  return 'Rs. ' + amount.toLocaleString('en-IN');
}
