/**
 * SolutionsNepal — shared live-price upstream fetchers.
 *
 * Runtime-agnostic on purpose: imported by scripts/fetch-live-data.mjs (Node,
 * build/dev time) AND by src/worker.js (Cloudflare Workers, post-hosting
 * runtime). No `node:` imports here — pass a fetch implementation in.
 *
 * Sources (all free, no keys):
 *   Metals — FENEGOSIDA  https://api.fenegosida.org/api/website/v1/Dashboard/today
 *   Fuel   — Nepal Oil Corp homepage price ticker https://noc.org.np/
 */

export const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 SolutionsNepal/1.0';

export const FENEGOSIDA_URL = 'https://api.fenegosida.org/api/website/v1/Dashboard/today';
// NRB daily reference rates (free, no key). The API serves one day per
// request, so callers walk back up to 7 days to skip weekends/holidays.
export const NRB_API_URL = 'https://www.nrb.org.np/api/forex/v1/rates';
// NOC's public JSON API (free, no key; ~300 req rate limit). The old homepage
// price ticker was removed in their 2026 redesign, so the API is now the
// only machine-readable source. Paginated — follow next_page_url (≤3 pages).
export const NOC_API_URL = 'https://beta.noc.org.np/api/fuel-prices?per_page=100';
const NOC_MAX_PAGES = 3;

// Nepal calendar day (YYYY-MM-DD) for an offset from today. Pure Date math
// (mirrors the provider's toNepalDate): shift to +5:45, then take the date.
export function toNepalDate(date = new Date()) {
  const nepalOffsetMin = 5 * 60 + 45;
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  return new Date(utc + nepalOffsetMin * 60000).toISOString().split('T')[0];
}
export function nepalDateMinus(daysBack) {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  return toNepalDate(d);
}

// Rate labels seen in the FENEGOSIDA API (Nepali):
//   छापावाल सुन (१ तोला)  = fine gold per tola
//   असली चाँदी (१ तोला)   = fine silver per tola
export const GOLD_RE = /छापावाल\s*सुन.*१\s*तोला/;
export const SILVER_RE = /असली\s*चाँदी.*१\s*तोला/;

// NOC ticker region groups → site city ids (kept identical to the build
// script so snapshot and live API agree on coverage).
export const NOC_REGIONS = [
  { keys: ['Charali', 'Biratnagar', 'Mahendranagar', 'Birgunj', 'Amlekhjung', 'Bhalbari', 'Nepalgung', 'Dhangadi'], cities: ['biratnagar', 'birgunj', 'nepalgunj', 'dhangadhi'] },
  { keys: ['Surkhet', 'Dang'], cities: ['surkhet', 'dang'] },
  { keys: ['Kathmandu', 'Pokhara', 'Dipayal'], cities: ['kathmandu', 'pokhara'] },
];

// Site city ids served by the fuel pages (must match FUEL_MOCK ids).
export const FUEL_SITE_CITIES = [
  'biratnagar', 'birgunj', 'nepalgunj', 'dhangadhi',
  'surkhet', 'dang', 'kathmandu', 'pokhara',
];

// API location-name quirks → site city id.
const FUEL_LOCATION_ALIASES = { nepalgung: 'nepalgunj' };

// API fuel slugs we display (aviation + cross-border rows excluded).
const FUEL_SLUGS = { petrol: 'petrol', diesel: 'diesel', kerosene: 'kerosene', 'lp-gas': 'lpg' };

function normalizeLocationName(name) {
  const base = String(name || '').toLowerCase().replace(/\s*\(.*\)\s*/, '').trim();
  return FUEL_LOCATION_ALIASES[base] || base;
}

function num(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Normalize raw NRB rate records to {iso3, name, unit, buy, sell}.
 * Shared by the build snapshot, the edge worker and browser clients so
 * every surface agrees on one shape.
 */
export function normalizeForexRates(rawRates) {
  const rows = Array.isArray(rawRates) ? rawRates : [];
  return rows.map((r) => ({
    iso3: r?.currency?.iso3,
    name: r?.currency?.name || r?.currency?.iso3,
    unit: parseFloat(r?.currency?.unit) || 1,
    buy: parseFloat(r?.buy),
    sell: r?.sell != null ? parseFloat(r.sell) : null,
  })).filter((c) => c.iso3 && !isNaN(c.buy));
}

/**
 * Parse FENEGOSIDA dashboard rows into { gold, silver, date }.
 * NOTE: the API's `todayBaseRatePerGram` field carries the PER-TOLA rate
 * (despite its name) — preserved as-is from the long-standing build parser.
 * @throws on unexpected shape or when neither metal is found.
 */
export function parseMetalsRows(rows) {
  if (!Array.isArray(rows)) throw new Error('FENEGOSIDA: unexpected shape');
  const gold = rows.find((r) => r && GOLD_RE.test(r.rateType || ''));
  const silver = rows.find((r) => r && SILVER_RE.test(r.rateType || ''));
  if (!gold && !silver) throw new Error('FENEGOSIDA: rates not found');
  const norm = (r) => r ? {
    pricePerTola: num(r.todayBaseRatePerGram),
    yesterdayPricePerTola: num(r.yestardayBaseRatePerGram),
  } : null;
  return {
    gold: norm(gold),
    silver: norm(silver),
    date: (gold || silver)?.todayDate || null,
  };
}

/**
 * Reduce raw NOC API fuel-price records into site data.
 * Keeps the LATEST record per city+fuel by price_date (the API returns full
 * history), plus Kathmandu petrol history for the price-history section.
 * @throws when the Kathmandu anchor city has no usable row.
 */
export function parseFuelRecords(records) {
  const rows = Array.isArray(records) ? records : [];
  const latest = {}; // city -> fuel -> { price, date }
  const lpgRows = [];
  const ktmPetrol = [];
  for (const r of rows) {
    const city = normalizeLocationName(r?.location?.name);
    const fuel = FUEL_SLUGS[r?.fuel_type?.slug];
    const price = num(r?.price);
    const date = String(r?.price_date || '');
    if (!FUEL_SITE_CITIES.includes(city) || !fuel || price == null || !date) continue;
    const cur = latest[city]?.[fuel];
    if (!cur || date > cur.date) {
      latest[city] = latest[city] || {};
      latest[city][fuel] = { price, date };
    }
    if (fuel === 'lpg') lpgRows.push({ price, date });
    if (city === 'kathmandu' && fuel === 'petrol') ktmPetrol.push({ price, date });
  }
  if (!latest.kathmandu) throw new Error('NOC: kathmandu price not found in API response');
  const byCity = {};
  for (const city of FUEL_SITE_CITIES) {
    const c = latest[city] || {};
    const k = latest.kathmandu;
    byCity[city] = {
      petrol: c.petrol?.price ?? k.petrol?.price ?? null,
      diesel: c.diesel?.price ?? k.diesel?.price ?? null,
      kerosene: c.kerosene?.price ?? k.kerosene?.price ?? null,
    };
  }
  lpgRows.sort((a, b) => (a.date < b.date ? 1 : -1));
  ktmPetrol.sort((a, b) => (a.date < b.date ? 1 : -1));
  // Distinct-date Kathmandu petrol history, newest first (cap 10),
  // with change vs the older entry (0 for the oldest → renders '—').
  // priceDate = newest price_date seen across all records (the NOC publish
  // date — shown as the effective date so pages never imply prices are
  // fresher than the upstream publish).
  const history = [];
  const seenDates = new Set();
  for (const h of ktmPetrol) {
    const day = h.date.slice(0, 10);
    if (seenDates.has(day)) continue;
    seenDates.add(day);
    history.push({ date: day, petrol: h.price });
    if (history.length >= 10) break;
  }
  for (let i = 0; i < history.length; i++) {
    history[i].change = i + 1 < history.length
      ? Math.round((history[i].petrol - history[i + 1].petrol) * 100) / 100
      : 0;
  }
  // Newest price_date across every city+fuel actually displayed.
  let priceDate = null;
  for (const c of Object.values(latest)) {
    for (const f of Object.values(c)) {
      if (f?.date && (!priceDate || f.date > priceDate)) priceDate = f.date;
    }
  }
  return {
    byCity,
    lpg: lpgRows.length ? lpgRows[0].price : null,
    cities: Object.entries(byCity).map(([id, p]) => ({ id, ...p })),
    history,
    priceDate: priceDate ? priceDate.slice(0, 10) : null,
  };
}

/**
 * Parse the NOC homepage price ticker into { byCity, lpg }.
 * @throws when the Kathmandu row (required anchor city) is missing.
 * NOTE: NOC removed this ticker in their 2026 redesign — kept as a
 * documented fallback only; the JSON API above is the primary source.
 */
export function parseFuelHtml(html) {
  const clean = String(html || '').replace(/&nbsp;/g, ' ');
  const re = /\(([^)]{5,140})\)\s+Petrol\(MS\):NRs\s*([\d.]+)\/L\s*•\s*Diesel\(HSD\):NRs\s*([\d.]+)\/L\s*•\s*Kerosene\(SKO\):NRs\s*([\d.]+)/g;
  const byCity = {};
  let m;
  while ((m = re.exec(clean)) !== null) {
    const regions = m[1];
    const petrol = parseFloat(m[2]);
    const diesel = parseFloat(m[3]);
    const kerosene = parseFloat(m[4]);
    if (![petrol, diesel, kerosene].every(Number.isFinite)) continue;
    for (const grp of NOC_REGIONS) {
      if (grp.keys.some((k) => regions.includes(k))) {
        for (const city of grp.cities) {
          if (!byCity[city]) byCity[city] = { petrol, diesel, kerosene };
        }
      }
    }
  }
  const lpgMatch = clean.match(/LP Gas:NRs\s*([\d.]+)/);
  if (!byCity.kathmandu) throw new Error('NOC: kathmandu price not found in ticker');
  return {
    byCity,
    lpg: lpgMatch ? parseFloat(lpgMatch[1]) : null,
  };
}

async function fetchWithTimeout(fetchImpl, url, opts = {}, timeoutMs = 12000) {
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
  try {
    return await fetchImpl(url, { ...opts, ...(ctrl ? { signal: ctrl.signal } : {}) });
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Fetch + parse FENEGOSIDA metals. @throws on network or parse failure. */
export async function fetchMetalsUpstream(fetchImpl = fetch, timeoutMs = 12000) {
  const resp = await fetchWithTimeout(fetchImpl, FENEGOSIDA_URL, {
    headers: {
      Accept: 'application/json',
      'User-Agent': UA,
      Origin: 'https://fenegosida.org',
      Referer: 'https://fenegosida.org/',
    },
  }, timeoutMs);
  if (!resp.ok) throw new Error(`FENEGOSIDA: HTTP ${resp.status}`);
  return parseMetalsRows(await resp.json());
}

/** Fetch + parse NOC fuel prices via their public JSON API (paginated). @throws on network or parse failure. */
export async function fetchFuelUpstream(fetchImpl = fetch, timeoutMs = 15000) {
  const records = [];
  let url = NOC_API_URL;
  for (let page = 0; page < NOC_MAX_PAGES && url; page++) {
    const resp = await fetchWithTimeout(fetchImpl, url, {
      headers: { Accept: 'application/json', 'User-Agent': UA },
    }, timeoutMs);
    if (!resp.ok) throw new Error(`NOC: HTTP ${resp.status}`);
    const json = await resp.json();
    if (Array.isArray(json?.data)) records.push(...json.data);
    url = json?.pagination?.has_more_pages ? json.pagination.next_page_url : null;
  }
  if (!records.length) throw new Error('NOC: empty fuel-price response');
  const out = parseFuelRecords(records);
  return {
    ...out,
    cities: Object.entries(out.byCity).map(([id, p]) => ({ id, ...p })),
  };
}

/**
 * Fetch NRB daily reference rates, walking back up to 7 Nepal-calendar days
 * to skip weekends/holidays with no publication.
 * Returns raw NRB rate records { date, publishedOn, rates } — callers map to
 * their own shape. @throws when no day yields rates.
 */
export async function fetchForexUpstream(fetchImpl = fetch, timeoutMs = 12000) {
  for (let back = 0; back < 7; back++) {
    const dateStr = nepalDateMinus(back);
    try {
      const resp = await fetchWithTimeout(
        fetchImpl,
        `${NRB_API_URL}?from=${dateStr}&to=${dateStr}&page=1&per_page=100`,
        { headers: { Accept: 'application/json', 'User-Agent': UA } },
        timeoutMs,
      );
      if (!resp.ok) continue;
      const json = await resp.json();
      const record = json?.data?.payload?.[0];
      const rawRates = record?.rates;
      if (!rawRates?.length) continue;
      return { rates: rawRates, date: record.date || dateStr, publishedOn: record.published_on || '' };
    } catch {
      /* try previous day */
    }
  }
  throw new Error('NRB: no rates found in last 7 days');
}
