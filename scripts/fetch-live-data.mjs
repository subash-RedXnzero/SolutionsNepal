/**
 * SolutionsNepal — Live data fetcher.
 *
 * Pulls real data from official Nepali sources + Open-Meteo and writes a single
 * snapshot the site's services hydrate from. Run automatically before
 * `npm run dev` and `npm run build` (see package.json predev/prebuild).
 *
 * Sources (all verified working):
 *   Forex   — Nepal Rastra Bank  https://www.nrb.org.np/api/forex/v1/rates
 *   Gold    — FENEGOSIDA         https://api.fenegosida.org/api/website/v1/Dashboard/today
 *   Fuel    — Nepal Oil Corp     https://noc.org.np/ (homepage price ticker)
 *   Weather — Open-Meteo         https://api.open-meteo.com/v1/forecast (+ air-quality-api)
 *
 * The script never fails the build: on network error it keeps the previous
 * snapshot (if any) and stamps fetchedAt with what succeeded.
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src', 'data', 'live-snapshot.json');
const TTL_MS = 30 * 60 * 1000; // refetch if snapshot older than 30 min

// Reuse an existing snapshot if it's fresh enough (so frequent dev restarts
// don't hammer the APIs). Pass --force to refetch regardless.
if (!process.argv.includes('--force') && existsSync(OUT)) {
  try {
    const prev = JSON.parse(readFileSync(OUT, 'utf8'));
    if (prev?.meta?.fetchedAt && Date.now() - new Date(prev.meta.fetchedAt).getTime() < TTL_MS) {
      console.log('[live-data] snapshot is fresh (' + prev.meta.fetchedAt + ') — skipping fetch');
      process.exit(0);
    }
  } catch { /* refetch */ }
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 SolutionsNepal/1.0';
const timeout = ms => AbortSignal.timeout(ms);

async function getJSON(url, headers = {}) {
  const resp = await fetch(url, {
    signal: timeout(15000),
    headers: { Accept: 'application/json', 'User-Agent': UA, ...headers },
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
  return resp.json();
}

async function getText(url, headers = {}) {
  const resp = await fetch(url, {
    signal: timeout(15000),
    headers: { 'User-Agent': UA, ...headers },
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
  return resp.text();
}

const nepalNow = () => new Date(Date.now() + (5 * 60 + 45) * 60000);
// NOTE: nepalNow() pre-shifts the instant by +5:45, so it MUST be formatted
// with timeZone:'UTC' — otherwise a non-UTC server applies its own offset
// a second time (e.g. 08:41 AM NPT displayed as 2:26 PM).
const npTimeStr = () => nepalNow().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' });
const npDateStr = () => nepalNow().toISOString().split('T')[0];

/* ── 1. NRB forex ─────────────────────────────────────────── */
async function fetchForex() {
  const today = npDateStr();
  for (let back = 0; back < 7; back++) {
    const d = new Date(nepalNow());
    d.setUTCDate(d.getUTCDate() - back);
    const dateStr = d.toISOString().split('T')[0];
    try {
      const json = await getJSON(`https://www.nrb.org.np/api/forex/v1/rates?page=1&per_page=100&from=${dateStr}&to=${dateStr}`);
      const record = json?.data?.payload?.[0];
      const raw = record?.rates;
      if (!raw?.length) continue;
      const currencies = raw.map(r => ({
        iso3: r.currency?.iso3,
        name: r.currency?.name || r.currency?.iso3,
        unit: parseFloat(r.currency?.unit) || 1,
        buy: parseFloat(r.buy),
        sell: r.sell != null ? parseFloat(r.sell) : null,
      })).filter(c => c.iso3 && !isNaN(c.buy));
      if (!currencies.length) continue;
      return {
        currencies,
        date: record.date || dateStr,
        publishedOn: record.published_on || '',
        isLive: true,
      };
    } catch { /* try previous day */ }
  }
  return null;
}

/* ── 2. FENEGOSIDA gold + silver ──────────────────────────── */
// Rate labels seen in the API (Nepali):
//   छापावाल सुन (१ तोला)  = fine/champhaval gold per tola
//   असली चाँदी (१ तोला)   = fine silver per tola
const GOLD_RE = /छापावाल\s*सुन.*१\s*तोला/;
const SILVER_RE = /असली\s*चाँदी.*१\s*तोला/;

async function fetchGoldSilver() {
  const rows = await getJSON('https://api.fenegosida.org/api/website/v1/Dashboard/today', {
    Origin: 'https://fenegosida.org',
    Referer: 'https://fenegosida.org/',
  });
  if (!Array.isArray(rows)) throw new Error('FENEGOSIDA: unexpected shape');
  const gold = rows.find(r => GOLD_RE.test(r.rateType));
  const silver = rows.find(r => SILVER_RE.test(r.rateType));
  if (!gold && !silver) throw new Error('FENEGOSIDA: rates not found');
  const stamp = gold?.todayDate || silver?.todayDate;
  const meta = {
    fetchedAtISO: stamp || null,
    isLive: true,
  };
  return {
    gold: gold ? {
      pricePerTola: gold.todayBaseRatePerGram,
      yesterdayPricePerTola: gold.yestardayBaseRatePerGram,
    } : null,
    silver: silver ? {
      pricePerTola: silver.todayBaseRatePerGram,
      yesterdayPricePerTola: silver.yestardayBaseRatePerGram,
    } : null,
    meta,
    isLive: true,
  };
}

/* ── 3. NOC fuel (homepage ticker) ────────────────────────── */
const NOC_REGIONS = [
  { keys: ['Charali', 'Biratnagar', 'Mahendranagar', 'Birgunj', 'Amlekhjung', 'Bhalbari', 'Nepalgung', 'Dhangadi'], cities: ['biratnagar', 'birgunj', 'nepalgunj', 'dhangadhi'] },
  { keys: ['Surkhet', 'Dang'], cities: ['surkhet', 'dang'] },
  { keys: ['Kathmandu', 'Pokhara', 'Dipayal'], cities: ['kathmandu', 'pokhara'] },
];

async function fetchFuel() {
  const html = await getText('https://noc.org.np/');
  const clean = html.replace(/&nbsp;/g, ' ');
  const re = /\(([^)]{5,140})\)\s+Petrol\(MS\):NRs\s*([\d.]+)\/L\s*•\s*Diesel\(HSD\):NRs\s*([\d.]+)\/L\s*•\s*Kerosene\(SKO\):NRs\s*([\d.]+)/g;
  const byCity = {};
  let m;
  while ((m = re.exec(clean)) !== null) {
    const regions = m[1];
    const petrol = parseFloat(m[2]);
    const diesel = parseFloat(m[3]);
    const kerosene = parseFloat(m[4]);
    for (const grp of NOC_REGIONS) {
      if (grp.keys.some(k => regions.includes(k))) {
        for (const city of grp.cities) {
          if (!byCity[city]) byCity[city] = { petrol, diesel, kerosene };
        }
      }
    }
  }
  const lpgMatch = clean.match(/LP Gas:NRs\s*([\d.]+)/);
  if (!byCity.kathmandu) throw new Error('NOC: kathmandu price not found in ticker');
  const cities = Object.entries(byCity).map(([id, p]) => ({ id, ...p }));
  return {
    byCity,
    lpg: lpgMatch ? parseFloat(lpgMatch[1]) : null,
    cities,
    isLive: true,
  };
}

/* ── 4. Open-Meteo weather + air quality ──────────────────── */
const WX_CITIES = [
  { id: 'kathmandu', lat: 27.7172, lon: 85.3240 },
  { id: 'pokhara', lat: 28.2096, lon: 83.9856 },
  { id: 'lalitpur', lat: 27.6588, lon: 85.3247 },
  { id: 'bhaktapur', lat: 27.6710, lon: 85.4298 },
  { id: 'biratnagar', lat: 26.4525, lon: 87.2718 },
  { id: 'bharatpur', lat: 27.6836, lon: 84.4300 },
  { id: 'butwal', lat: 27.7000, lon: 83.4486 },
  { id: 'dharan', lat: 26.8128, lon: 87.2837 },
  { id: 'nepalgunj', lat: 28.0500, lon: 81.6167 },
  { id: 'dhangadhi', lat: 28.6983, lon: 80.5898 },
];

async function fetchWeather() {
  const lats = WX_CITIES.map(c => c.lat).join(',');
  const lons = WX_CITIES.map(c => c.lon).join(',');
  const wxUrl =
    'https://api.open-meteo.com/v1/forecast?latitude=' + lats + '&longitude=' + lons +
    '&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,precipitation' +
    '&hourly=temperature_2m,weather_code,precipitation_probability,visibility,uv_index' +
    '&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,sunrise,sunset,uv_index_max' +
    '&forecast_days=8&timezone=Asia%2FKathmandu';
  const aqiUrl =
    'https://air-quality-api.open-meteo.com/v1/air-quality?latitude=' + lats + '&longitude=' + lons +
    '&current=us_aqi,pm2_5,pm10&timezone=Asia%2FKathmandu';

  const [wx, aqi] = await Promise.all([getJSON(wxUrl), getJSON(aqiUrl).catch(() => null)]);
  const list = Array.isArray(wx) ? wx : [wx];
  const cities = {};
  list.forEach((w, i) => {
    const id = WX_CITIES[i]?.id;
    if (!id || !w?.current) return;
    cities[id] = {
      current: w.current,
      hourly: {
        time: w.hourly?.time?.slice(0, 24) || [],
        temp: w.hourly?.temperature_2m?.slice(0, 24) || [],
        code: w.hourly?.weather_code?.slice(0, 24) || [],
        rainProb: w.hourly?.precipitation_probability?.slice(0, 24) || [],
        visM: w.hourly?.visibility?.slice(0, 24) || [],
        uv: w.hourly?.uv_index?.slice(0, 24) || [],
      },
      daily: w.daily || null,
    };
  });
  const aqiList = aqi ? (Array.isArray(aqi) ? aqi : [aqi]) : [];
  const aqiByCity = {};
  aqiList.forEach((a, i) => {
    const id = WX_CITIES[i]?.id;
    if (id && a?.current) {
      aqiByCity[id] = { value: a.current.us_aqi, pm25: a.current.pm2_5, pm10: a.current.pm10, time: a.current.time };
    }
  });
  return {
    cities,
    aqi: aqiByCity,
    isLive: true,
  };
}

/* ── Run (all sources in parallel — was sequential, ~4x faster) ── */
const results = {};
const jobs = [
  ['forex', fetchForex],
  ['gold', fetchGoldSilver],
  ['fuel', fetchFuel],
  ['weather', fetchWeather],
];

const outcomes = await Promise.all(jobs.map(async ([key, fn]) => {
  try {
    const value = await fn();
    console.log(`[live-data] ${key}: OK`);
    return [key, value];
  } catch (err) {
    console.warn(`[live-data] ${key}: FAILED — ${err?.message || err}`);
    return [key, { isLive: false, error: String(err?.message || err).slice(0, 160) }];
  }
}));
for (const [key, value] of outcomes) results[key] = value;

const prev = existsSync(OUT) ? (() => { try { return JSON.parse(readFileSync(OUT, 'utf8')); } catch { return null; } })() : null;

const snapshot = {
  meta: {
    fetchedAt: new Date().toISOString(),
    fetchedAtNPT: npTimeStr(),
    sources: {
      forex: 'Nepal Rastra Bank (nrb.org.np)',
      gold: 'FENEGOSIDA (fenegosida.org)',
      silver: 'FENEGOSIDA (fenegosida.org)',
      fuel: 'Nepal Oil Corporation (noc.org.np)',
      weather: 'Open-Meteo (open-meteo.com)',
      airQuality: 'Open-Meteo CAMS (open-meteo.com)',
    },
  },
  ...results,
};

// If a source failed but a previous snapshot has data, carry it forward so the
// site keeps working (marked not-live).
for (const key of ['forex', 'gold', 'fuel', 'weather']) {
  if (results[key]?.isLive) continue;
  const prevData = prev?.[key];
  if (prevData && !prevData.error) {
    snapshot[key] = { ...prevData, isLive: false, carriedFrom: prev?.meta?.fetchedAtNPT || null };
    console.log(`[live-data] ${key}: carried forward previous snapshot`);
  }
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(snapshot, null, 2));
console.log(`[live-data] snapshot written → ${OUT.replace(ROOT, '')} at ${snapshot.meta.fetchedAtNPT} NPT`);
