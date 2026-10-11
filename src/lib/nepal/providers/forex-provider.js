/**
 * NRB Foreign Exchange Provider
 *
 * Fetches real-time daily reference rates from Nepal Rastra Bank.
 * API: https://www.nrb.org.np/api/forex/v1/rates
 *
 * NRB publishes official daily rates used as benchmarks for banking.
 */

import { fetchJSON, toNepalDate, getCached, setCache } from './data-fetch.js';

const NRB_API = 'https://www.nrb.org.np/api/forex/v1/rates';
const CACHE_KEY = 'nrb-forex';
const CACHE_TTL_MS = 3_600_000; // 1 hour

// Currency metadata — flags, countries, names
const CURRENCY_META = {
  USD: { name: 'US Dollar', country: 'United States', flag: '🇺🇸' },
  EUR: { name: 'Euro', country: 'European Union', flag: '🇪🇺' },
  GBP: { name: 'British Pound', country: 'United Kingdom', flag: '🇬🇧' },
  INR: { name: 'Indian Rupee', country: 'India', flag: '🇮🇳' },
  AUD: { name: 'Australian Dollar', country: 'Australia', flag: '🇦🇺' },
  CAD: { name: 'Canadian Dollar', country: 'Canada', flag: '🇨🇦' },
  CNY: { name: 'Chinese Yuan', country: 'China', flag: '🇨🇳' },
  JPY: { name: 'Japanese Yen', country: 'Japan', flag: '🇯🇵' },
  SAR: { name: 'Saudi Riyal', country: 'Saudi Arabia', flag: '🇸🇦' },
  QAR: { name: 'Qatari Riyal', country: 'Qatar', flag: '🇶🇦' },
  KWD: { name: 'Kuwaiti Dinar', country: 'Kuwait', flag: '🇰🇼' },
  BHD: { name: 'Bahraini Dinar', country: 'Bahrain', flag: '🇧🇭' },
  MYR: { name: 'Malaysian Ringgit', country: 'Malaysia', flag: '🇲🇾' },
  SGD: { name: 'Singapore Dollar', country: 'Singapore', flag: '🇸🇬' },
  AED: { name: 'UAE Dirham', country: 'United Arab Emirates', flag: '🇦🇪' },
  KRW: { name: 'South Korean Won', country: 'South Korea', flag: '🇰🇷' },
};

/**
 * Fetch forex rates from NRB API.
 * Tries today first, then falls back up to 7 days.
 * Returns { rates, date, publishedOn } or null.
 */
async function fetchFromNRB() {
  const cached = getCached(CACHE_KEY);
  if (cached) return cached;

  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = toNepalDate(d);
    const url = `${NRB_API}?from=${dateStr}&to=${dateStr}&page=1&per_page=100`;

    const { ok, json, error } = await fetchJSON(url);
    if (!ok || !json?.data?.payload?.length) continue;

    const record = json.data.payload[0];
    const rawRates = record?.rates;
    if (!rawRates?.length) continue;

    const rates = [];
    for (const r of rawRates) {
      const iso = r.currency?.iso3;
      const name = r.currency?.name;
      const unit = parseFloat(r.currency?.unit) || 1;
      const buy = parseFloat(r.buy);
      const sell = parseFloat(r.sell);
      if (!iso || isNaN(buy)) continue;

      const meta = CURRENCY_META[iso] || { name: name || iso, country: '', flag: '' };
      rates.push({
        iso3: iso,
        name: meta.name,
        country: meta.country,
        unit,
        buy,
        sell: isNaN(sell) ? null : sell,
        flag: meta.flag,
        // Normalised per-unit rates for comparison
        buyPerUnit: roundTo(buy / unit, 4),
        sellPerUnit: sell != null ? roundTo(sell / unit, 4) : null,
      });
    }

    if (rates.length === 0) continue;

    const result = {
      rates,
      date: record.date || dateStr,
      publishedOn: record.published_on || '',
    };

    setCache(CACHE_KEY, result, CACHE_TTL_MS);
    return result;
  }

  return null;
}

function roundTo(num, decimals) {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

// ─── Public Provider Interface ──────────────────────────────

/**
 * Fetch live forex data from NRB.
 * Returns { data, meta, error }
 */
export async function fetchForexData() {
  const result = await fetchFromNRB();

  if (!result) {
    return {
      data: null,
      meta: {
        source: 'Nepal Rastra Bank (NRB)',
        sourceShort: 'NRB',
        rateType: 'Official daily reference rate',
        isLive: false,
        fetchedAt: new Date().toISOString(),
      },
      error: 'NRB API unavailable. Latest data could not be fetched.',
    };
  }

  return {
    data: {
      currencies: result.rates,
      date: result.date,
      publishedOn: result.publishedOn,
    },
    meta: {
      source: 'Nepal Rastra Bank (NRB)',
      sourceShort: 'NRB',
      rateType: 'Official daily reference rate',
      isLive: true,
      fetchedAt: new Date().toISOString(),
      lastUpdated: result.date,
    },
    error: null,
  };
}
