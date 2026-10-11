/**
 * Nepal Foreign Exchange Service
 *
 * Architecture:
 *   1. Try live NRB provider (forex-provider.js)
 *   2. Fall back to mock data (mock-data.js) if API unavailable
 *   3. Always disclose whether data is live or mock via meta.isLive
 *
 * Data source: Nepal Rastra Bank (NRB)
 * Rate type: Official daily foreign exchange rates
 *
 * NRB publishes daily reference rates for foreign currencies.
 * These are used as the official benchmark for banking transactions.
 */

import { fetchForexData } from './providers/forex-provider.js';
import { FOREX_MOCK } from './providers/mock-data.js';
import { snapshotForex, freshness } from './providers/live-snapshot.js';

// ─── Currency metadata for enrichment ───────────────────────

const CURRENCY_FLAGS = {
  USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', INR: '🇮🇳',
  AUD: '🇦🇺', CAD: '🇨🇦', CNY: '🇨🇳', JPY: '🇯🇵',
  SAR: '🇸🇦', QAR: '🇶🇦', KWD: '🇰🇼', BHD: '🇧🇭',
  MYR: '🇲🇾', SGD: '🇸🇬', AED: '🇦🇪', KRW: '🇰🇷',
};

// ─── Internal helpers ───────────────────────────────────────

function enrichCurrency(curr) {
  return {
    ...curr,
    flag: curr.flag || CURRENCY_FLAGS[curr.iso3] || '',
    buyPerUnit: curr.unit === 1 ? curr.buy : curr.buy / curr.unit,
    sellPerUnit: curr.unit === 1 ? curr.sell : (curr.sell != null ? curr.sell / curr.unit : null),
  };
}

function buildCurrencyList(currencies) {
  return currencies.map(enrichCurrency);
}

// ─── Live data (async) ─────────────────────────────────────

let _liveData = null;
let _liveMeta = null;
let _liveError = null;
let _fetchAttempted = false;

async function ensureLiveData() {
  if (_fetchAttempted) return;
  _fetchAttempted = true;
  // Preferred: pre-fetched snapshot (real NRB data, offline-safe).
  const snap = snapshotForex();
  if (snap) {
    _liveData = { currencies: snap.currencies, date: snap.date, publishedOn: snap.publishedOn };
    _liveMeta = {
      isLive: snap.isLive && freshness('forex') === 'live',
      source: 'Nepal Rastra Bank (NRB)',
      sourceShort: 'NRB',
      rateType: 'Official daily reference rate',
      fetchedAtNPT: snap.fetchedAtNPT,
      freshness: freshness('forex'),
    };
    return;
  }
  // Fallback: fetch directly (dev without predev, or snapshot missing).
  try {
    const result = await fetchForexData();
    _liveData = result.data;
    _liveMeta = result.meta;
    _liveError = result.error;
  } catch (err) {
    _liveData = null;
    _liveError = err?.message || 'Failed to fetch forex data';
  }
}

// ─── Public API ─────────────────────────────────────────────

/**
 * Get all available currencies.
 * Tries live NRB data first, falls back to mock.
 */
export async function getAllCurrenciesAsync() {
  await ensureLiveData();
  if (_liveData?.currencies) {
    return buildCurrencyList(_liveData.currencies);
  }
  return buildCurrencyList(FOREX_MOCK.currencies);
}

/**
 * Synchronous version — returns mock data immediately.
 * Use only where async is not possible.
 */
export function getAllCurrencies() {
  return buildCurrencyList(FOREX_MOCK.currencies);
}

/**
 * Get the primary currencies for homepage display.
 */
export async function getHomepageCurrenciesAsync() {
  await ensureLiveData();
  const source = _liveData?.currencies || FOREX_MOCK.currencies;
  const primary = ['USD', 'EUR', 'GBP', 'INR'];
  return primary
    .map(iso => {
      const curr = source.find(c => c.iso3 === iso);
      if (!curr) return null;
      return enrichCurrency(curr);
    })
    .filter(Boolean);
}

/**
 * Synchronous version — returns mock data immediately.
 */
export function getHomepageCurrencies() {
  const primary = ['USD', 'EUR', 'GBP', 'INR'];
  return primary
    .map(iso => {
      const curr = FOREX_MOCK.currencies.find(c => c.iso3 === iso);
      if (!curr) return null;
      return enrichCurrency(curr);
    })
    .filter(Boolean);
}

/**
 * Get forex metadata (source, update time, live status).
 */
export async function getForexMetaAsync() {
  await ensureLiveData();
  return {
    source: _liveMeta?.source || 'Nepal Rastra Bank (NRB)',
    sourceShort: _liveMeta?.sourceShort || 'NRB',
    rateType: _liveMeta?.rateType || 'Official daily reference rate',
    publishedDate: _liveData?.date || FOREX_MOCK.date,
    publishedTime: _liveData?.publishedOn || '',
    lastUpdated: _liveData?.date || FOREX_MOCK.date,
    isLive: _liveMeta?.isLive || false,
    error: _liveError,
  };
}

/**
 * Synchronous version — returns mock metadata immediately.
 */
export function getForexMeta() {
  return {
    source: 'Nepal Rastra Bank (NRB)',
    sourceShort: 'NRB',
    rateType: 'Official daily reference rate',
    publishedDate: FOREX_MOCK.date,
    publishedTime: FOREX_MOCK.publishedOn,
    lastUpdated: FOREX_MOCK.date,
    isLive: false,
    error: null,
  };
}

/**
 * Format a currency rate.
 */
export function formatRate(amount) {
  if (amount == null || isNaN(amount)) return '—';
  return 'Rs. ' + amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
