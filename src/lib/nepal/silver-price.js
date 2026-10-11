/**
 * Nepal Silver Price Service
 *
 * Architecture:
 *   1. Try live FENEGOSIDA provider (when available)
 *   2. Fall back to mock data if API unavailable
 *   3. Always disclose whether data is live or mock via meta.isLive
 *
 * Data source: Federation of Nepal Gold and Silver Dealers Association (FENEGOSIDA)
 * Rate type: Daily Nepal silver rate
 *
 * 1 Tola = 11.6638125 grams (official Nepal standard)
 * 1 Aana = 1/12 Tola
 * 1 Lal  = 1/96 Tola
 */

import { SILVER_MOCK } from './providers/mock-data.js';
import { roundTo } from './providers/data-fetch.js';
import { snapshotMetals, freshness } from './providers/live-snapshot.js';

// ─── CONVERSION CONSTANTS ───────────────────────────────────
export const GRAMS_PER_TOLA = 11.6638125;
export const AANA_PER_TOLA = 12;
export const LAL_PER_TOLA = 96;

// ─── Internal state ─────────────────────────────────────────

let _liveData = null;
let _liveMeta = null;
let _liveError = null;
let _fetchAttempted = false;

/**
 * Live FENEGOSIDA data via the pre-fetched snapshot.
 * (Same-origin restriction — fetched at build time by the fetcher script.)
 */
async function ensureLiveData() {
  if (_fetchAttempted) return;
  _fetchAttempted = true;
  try {
    const snap = snapshotMetals();
    if (snap?.silver) {
      _liveData = {
        source: 'Federation of Nepal Gold and Silver Dealers Association (FENEGOSIDA)',
        sourceShort: 'FENEGOSIDA',
        rateType: 'Daily Nepal silver rate',
        lastUpdatedTime: snap.fetchedAtNPT || '',
        silver: {
          pricePerTola: snap.silver.pricePerTola,
          yesterdayPricePerTola: snap.silver.yesterdayPricePerTola,
        },
      };
      _liveMeta = { isLive: snap.isLive && freshness('gold') === 'live', freshness: freshness('gold') };
    }
  } catch (err) {
    _liveError = err?.message || 'Failed to load silver snapshot';
  }
}

function getDataSource() {
  return _liveData || SILVER_MOCK;
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

// ─── PUBLIC API ─────────────────────────────────────────────

/**
 * Get current silver price data.
 * Tries live FENEGOSIDA data first, falls back to mock.
 */
export async function getSilverPriceAsync() {
  await ensureLiveData();
  return buildSilverPrice();
}

/**
 * Synchronous version — returns mock data immediately.
 */
export function getSilverPrice() {
  return buildSilverPrice();
}

function buildSilverPrice() {
  const src = getDataSource();
  const price = src.silver.pricePerTola;
  const yesterday = src.silver.yesterdayPricePerTola;
  const change = price - yesterday;

  return {
    source: src.source,
    sourceShort: src.sourceShort,
    rateType: src.rateType,
    lastUpdated: getTodayStr(),
    lastUpdatedTime: src.lastUpdatedTime,
    isLive: _liveMeta?.isLive || false,
    error: _liveError,
    silver: {
      pricePerTola: price,
      pricePerGram: roundTo(price / GRAMS_PER_TOLA, 0),
      pricePer10Gram: roundTo((price / GRAMS_PER_TOLA) * 10, 0),
      pricePerAana: roundTo(price / AANA_PER_TOLA, 0),
      pricePerLal: roundTo(price / LAL_PER_TOLA, 0),
    },
    yesterday: {
      pricePerTola: yesterday,
      pricePerGram: roundTo(yesterday / GRAMS_PER_TOLA, 0),
    },
    change: {
      amount: change,
      direction: change >= 0 ? 'up' : 'down',
      percent: Math.round((Math.abs(change) / yesterday) * 10000) / 100,
    },
  };
}

/**
 * Get price history for a given period.
 * @param {'7d'|'30d'|'3m'|'1y'} period
 */
export function getSilverPriceHistory(period = '7d') {
  return generatePriceHistory(SILVER_MOCK.silver.pricePerTola, periodToDays(period), getVolatility(period));
}

function periodToDays(period) {
  switch (period) {
    case '7d': return 7;
    case '30d': return 30;
    case '3m': return 90;
    case '1y': return 365;
    default: return 7;
  }
}

function getVolatility(period) {
  switch (period) {
    case '7d': return 40;
    case '30d': return 60;
    case '3m': return 100;
    case '1y': return 150;
    default: return 40;
  }
}

function generatePriceHistory(basePrice, days, volatility) {
  const history = [];
  let price = basePrice - (volatility * days * 0.3);
  for (let i = days; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const change = (Math.random() - 0.45) * volatility;
    price = Math.max(price + change, basePrice * 0.88);
    history.push({
      date: d.toISOString().split('T')[0],
      price: Math.round(price),
    });
  }
  history[history.length - 1].price = basePrice;
  return history;
}

/**
 * Format price in NPR.
 */
export function formatNPR(amount) {
  if (amount == null || isNaN(amount)) return '—';
  return 'Rs. ' + amount.toLocaleString('en-IN');
}
