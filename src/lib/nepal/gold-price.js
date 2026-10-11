/**
 * Nepal Gold Price Service
 *
 * Architecture:
 *   1. Try live FENEGOSIDA provider (when available)
 *   2. Fall back to mock data if API unavailable
 *   3. Always disclose whether data is live or mock via meta.isLive
 *
 * Data source: Federation of Nepal Gold and Silver Dealers Association (FENEGOSIDA)
 * Rate type: Daily Nepal gold rate (Fine Gold 99.99%)
 *
 * 1 Tola = 11.6638125 grams (official Nepal standard)
 * 1 Aana = 1/12 Tola
 * 1 Lal  = 1/96 Tola
 */

import { GOLD_MOCK } from './providers/mock-data.js';
import { roundTo } from './providers/data-fetch.js';
import { snapshotMetals, freshness } from './providers/live-snapshot.js';

// ─── CONVERSION CONSTANTS ───────────────────────────────────
export const GRAMS_PER_TOLA = 11.6638125;
export const AANA_PER_TOLA = 12;
export const LAL_PER_TOLA = 96;
export const GRAMS_PER_AANA = GRAMS_PER_TOLA / AANA_PER_TOLA;
export const GRAMS_PER_LAL = GRAMS_PER_TOLA / LAL_PER_TOLA;

// ─── Internal state ─────────────────────────────────────────

let _liveData = null;
let _liveMeta = null;
let _liveError = null;
let _fetchAttempted = false;

/**
 * Live FENEGOSIDA data via the pre-fetched snapshot.
 * (The association's API only allows same-origin browser calls, so the
 * fetcher script pulls it at build/dev time and we hydrate from disk.)
 */
async function ensureLiveData() {
  if (_fetchAttempted) return;
  _fetchAttempted = true;
  try {
    const snap = snapshotMetals();
    if (snap?.gold) {
      _liveData = {
        source: 'Federation of Nepal Gold and Silver Dealers Association (FENEGOSIDA)',
        sourceShort: 'FENEGOSIDA',
        rateType: 'Daily Nepal gold rate (Fine Gold 99.99%)',
        lastUpdatedTime: snap.fetchedAtNPT || '',
        fineGold: {
          pricePerTola: snap.gold.pricePerTola,
          yesterdayPricePerTola: snap.gold.yesterdayPricePerTola,
        },
      };
      _liveMeta = { isLive: snap.isLive && freshness('gold') === 'live', freshness: freshness('gold') };
    }
  } catch (err) {
    _liveError = err?.message || 'Failed to load gold snapshot';
  }
}

function getDataSource() {
  return _liveData || GOLD_MOCK;
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

// ─── PUBLIC API ─────────────────────────────────────────────

/**
 * Get current fine gold price data.
 * Tries live FENEGOSIDA data first, falls back to mock.
 */
export async function getGoldPriceAsync() {
  await ensureLiveData();
  return buildGoldPrice();
}

/**
 * Synchronous version — returns mock data immediately.
 */
export function getGoldPrice() {
  return buildGoldPrice();
}

function buildGoldPrice() {
  const src = getDataSource();
  const price = src.fineGold.pricePerTola;
  const yesterday = src.fineGold.yesterdayPricePerTola;
  const change = price - yesterday;

  return {
    source: src.source,
    sourceShort: src.sourceShort,
    rateType: src.rateType,
    lastUpdated: getTodayStr(),
    lastUpdatedTime: src.lastUpdatedTime,
    isLive: _liveMeta?.isLive || false,
    error: _liveError,
    fineGold: {
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
      percent: roundTo((Math.abs(change) / yesterday) * 100, 2),
    },
  };
}

/**
 * Get price history for a given period.
 * @param {'7d'|'30d'|'3m'|'1y'} period
 */
export function getGoldPriceHistory(period = '7d') {
  // History is only available from mock data (generated client-side).
  // When a real provider supports historical data, integrate here.
  return generatePriceHistory(GOLD_MOCK.fineGold.pricePerTola, periodToDays(period), getVolatility(period));
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
    case '7d': return 800;
    case '30d': return 1200;
    case '3m': return 2000;
    case '1y': return 3000;
    default: return 800;
  }
}

function generatePriceHistory(basePrice, days, volatility) {
  const history = [];
  let price = basePrice - (volatility * days * 0.3);
  for (let i = days; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const change = (Math.random() - 0.45) * volatility;
    price = Math.max(price + change, basePrice * 0.85);
    history.push({
      date: d.toISOString().split('T')[0],
      price: Math.round(price),
    });
  }
  history[history.length - 1].price = basePrice;
  return history;
}

/**
 * Calculate estimated gold value.
 * @param {number} weight - Weight value
 * @param {string} unit - 'tola', 'gram', '10gram', 'aana', 'lal'
 * @param {string} purity - 'fine', '22k', '24k'
 */
export function calculateGoldValue(weight, unit = 'tola', purity = 'fine') {
  const priceData = getGoldPrice();
  let pricePerTola = priceData.fineGold.pricePerTola;

  // Adjust for purity
  if (purity === '22k') {
    pricePerTola = roundTo(pricePerTola * (22 / 24), 0);
  }
  // 24K is same as fine gold (99.99%)

  // Convert weight to tola
  let weightInTola;
  switch (unit) {
    case 'gram': weightInTola = weight / GRAMS_PER_TOLA; break;
    case '10gram': weightInTola = (weight * 10) / GRAMS_PER_TOLA; break;
    case 'aana': weightInTola = weight / AANA_PER_TOLA; break;
    case 'lal': weightInTola = weight / LAL_PER_TOLA; break;
    case 'tola':
    default: weightInTola = weight; break;
  }

  return Math.round(weightInTola * pricePerTola);
}

/**
 * Format price in NPR with comma separators.
 */
export function formatNPR(amount) {
  if (amount == null || isNaN(amount)) return '—';
  return 'Rs. ' + amount.toLocaleString('en-IN');
}

/**
 * Format price without Rs. prefix.
 */
export function formatPrice(amount) {
  if (amount == null || isNaN(amount)) return '—';
  return amount.toLocaleString('en-IN');
}
