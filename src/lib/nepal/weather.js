/**
 * SolutionsNepal — Weather data layer.
 *
 * Primary source: the pre-fetched snapshot (real Open-Meteo observations,
 * refreshed by scripts/fetch-live-data.mjs on dev/build). When the snapshot is
 * missing or has no row for a city, falls back to the deterministic climate
 * model below — never an empty page.
 *
 * Isomorphic: the /weather page imports this both server- and client-side, so
 * the snapshot comes in as a baked JSON import (Vite handles it in the browser).
 */

import snapshotJson from '../../data/live-snapshot.json' with { type: 'json' };

const SNAPSHOT = snapshotJson?.weather || null;

// ── City gazette ─────────────────────────────────────────────
export const CITIES = [
  { id: 'kathmandu', name: 'Kathmandu', np: 'काठमाडौं',    elev: '1,400 m', lat: 27.7172, lon: 85.3240,  temp: 24, spread: 5,  humidity: 68, cloud: 52, rain: 40, wind: 12, windDir: 265, vis: 9,  uv: 7, pop: 1.0 },
  { id: 'pokhara',   name: 'Pokhara',   np: 'पोखरा',      elev: '822 m',   lat: 28.2096, lon: 83.9856,  temp: 23, spread: 5,  humidity: 78, cloud: 64, rain: 55, wind: 8,  windDir: 250, vis: 7,  uv: 6, pop: 0.9 },
  { id: 'lalitpur',  name: 'Lalitpur',  np: 'ललितपुर',    elev: '1,400 m', lat: 27.6588, lon: 85.3247,  temp: 24, spread: 5,  humidity: 67, cloud: 50, rain: 38, wind: 11, windDir: 265, vis: 9,  uv: 7, pop: 0.7 },
  { id: 'bhaktapur', name: 'Bhaktapur', np: 'भक्तपुर',    elev: '1,401 m', lat: 27.6710, lon: 85.4298,  temp: 24, spread: 5,  humidity: 66, cloud: 48, rain: 36, wind: 12, windDir: 270, vis: 9,  uv: 7, pop: 0.6 },
  { id: 'biratnagar',name: 'Biratnagar',np: 'विराटनगर',   elev: '72 m',    lat: 26.4525, lon: 87.2718,  temp: 29, spread: 6,  humidity: 76, cloud: 58, rain: 45, wind: 14, windDir: 120, vis: 8,  uv: 8, pop: 0.6 },
  { id: 'bharatpur', name: 'Bharatpur', np: 'भरतपुर',     elev: '208 m',   lat: 27.6836, lon: 84.4300,  temp: 27, spread: 6,  humidity: 74, cloud: 56, rain: 48, wind: 10, windDir: 200, vis: 8,  uv: 7, pop: 0.6 },
  { id: 'butwal',    name: 'Butwal',    np: 'बुटवल',      elev: '470 m',   lat: 27.7000, lon: 83.4486,  temp: 28, spread: 6,  humidity: 72, cloud: 54, rain: 42, wind: 11, windDir: 230, vis: 8,  uv: 8, pop: 0.5 },
  { id: 'dharan',    name: 'Dharan',    np: 'धरान',       elev: '349 m',   lat: 26.8128, lon: 87.2837,  temp: 26, spread: 6,  humidity: 75, cloud: 60, rain: 50, wind: 9,  windDir: 110, vis: 8,  uv: 7, pop: 0.5 },
  { id: 'nepalgunj', name: 'Nepalgunj', np: 'नेपालगन्ज',  elev: '150 m',   lat: 28.0500, lon: 81.6167,  temp: 30, spread: 7,  humidity: 70, cloud: 46, rain: 30, wind: 15, windDir: 280, vis: 9,  uv: 9, pop: 0.5 },
  { id: 'dhangadhi', name: 'Dhangadhi', np: 'धनगढी',      elev: '175 m',   lat: 28.6983, lon: 80.5898,  temp: 29, spread: 7,  humidity: 69, cloud: 44, rain: 28, wind: 13, windDir: 285, vis: 10, uv: 9, pop: 0.4 },
];

export function getCity(id) {
  return CITIES.find(c => c.id === id) || CITIES[0];
}

// ── Condition model (fallback path) ─────────────────────────
function conditionFrom(cloud, rain, uv) {
  if (rain >= 60) return { k: 'storm',   label: 'Thunderstorms', np: 'चट्टानी वर्षा' };
  if (rain >= 45) return { k: 'rain',    label: 'Rain',          np: 'वर्षा' };
  if (rain >= 30) return { k: 'drizzle', label: 'Light Rain',    np: 'हल्का वर्षा' };
  if (cloud >= 55) return { k: 'cloudy', label: 'Cloudy',        np: 'बदली' };
  if (cloud >= 30) return { k: 'partly', label: 'Partly Cloudy', np: 'आंशिक बदली' };
  return { k: 'clear', label: uv >= 8 ? 'Sunny' : 'Clear', np: uv >= 8 ? 'घाम लागेको' : 'सफा' };
}

/** WMO weather-code → condition {k, label} (Open-Meteo codes). */
export function wmoToCond(code) {
  if (code == null) return { k: 'cloudy', label: 'Cloudy' };
  if (code === 0) return { k: 'clear', label: 'Clear' };
  if (code === 1) return { k: 'partly', label: 'Mostly Clear' };
  if (code === 2) return { k: 'partly', label: 'Partly Cloudy' };
  if (code === 3) return { k: 'cloudy', label: 'Cloudy' };
  if (code === 45 || code === 48) return { k: 'cloudy', label: 'Fog' };
  if (code >= 51 && code <= 57) return { k: 'drizzle', label: 'Drizzle' };
  if (code >= 61 && code <= 65) return { k: 'rain', label: ['Light Rain', 'Rain', 'Heavy Rain'][code - 61] };
  if (code === 66 || code === 67) return { k: 'rain', label: 'Freezing Rain' };
  if (code >= 71 && code <= 77) return { k: 'cloudy', label: 'Snow' };
  if (code >= 80 && code <= 82) return { k: 'rain', label: ['Light Showers', 'Showers', 'Heavy Showers'][code - 80] };
  if (code === 85 || code === 86) return { k: 'cloudy', label: 'Snow Showers' };
  if (code === 95) return { k: 'storm', label: 'Thunderstorm' };
  if (code === 96 || code === 99) return { k: 'storm', label: 'Thunderstorm · Hail' };
  return { k: 'cloudy', label: 'Cloudy' };
}

// ── Shared helpers ───────────────────────────────────────────
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

const DAY_MS = 86400000;
const WEATHER_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const WEATHER_MONTHS = ['Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin', 'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'];

const fmt12HM = ({ h, m }) => `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;

const AD_MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Nepal wall-clock parts for an instant. Same Intl technique as
 * nepal-time.js getNepalNow() (kept local so this module stays light for
 * the browser bundle). Never compare server-local getHours()/getDate()
 * against Kathmandu wall-clock API strings — on UTC servers that skews
 * every "current hour" lookup by 5:45.
 */
function nepalParts(at = new Date()) {
  const parts = {};
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', hour12: false,
  });
  for (const { type, value } of f.formatToParts(at)) parts[type] = parseInt(value, 10);
  if (parts.hour === 24) parts.hour = 0;
  return { year: parts.year, month: parts.month, day: parts.day, hour: parts.hour, minute: parts.minute };
}

/** Split "YYYY-MM-DD[THH:MM]" wall time into numbers (timezone-independent). */
function partsOf(ts) {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(ts || '');
  if (!m) return null;
  return { y: +m[1], mo: +m[2], da: +m[3], h: m[4] != null ? +m[4] : 0, m: m[5] != null ? +m[5] : 0 };
}

/** Weekday index (0 = Sunday) for a wall-calendar date — no timezone involved. */
function weekdayIdx(y, mo, da) {
  return new Date(Date.UTC(y, mo - 1, da)).getUTCDay();
}

/**
 * Honest fetch stamp for baked snapshot data: time-only when fetched today
 * (NPT), dated otherwise — so a 3-day-old fetch never reads as this morning.
 */
function fetchStamp() {
  const iso = snapshotJson?.meta?.fetchedAt;
  const npt = snapshotJson?.meta?.fetchedAtNPT;
  if (!iso || !npt) return null;
  const f = nepalParts(new Date(iso));
  const n = nepalParts();
  const sameDay = f.year === n.year && f.month === n.month && f.day === n.day;
  return {
    time: sameDay ? `${npt} NPT` : `${AD_MONTHS_SHORT[f.month - 1]} ${f.day} · ${npt} NPT`,
    fetchedAt: iso,
  };
}

/** Compass point for a bearing. */
export function windCompass(deg) {
  const pts = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return pts[Math.round(deg / 22.5) % 16];
}

function aqiBandFor(aqi) {
  return !aqi      ? { label: '—', tone: 'moderate', advice: 'Air quality data unavailable.' } :
    aqi <= 50  ? { label: 'Good',            tone: 'good',    advice: 'Air quality is satisfactory.' } :
    aqi <= 100 ? { label: 'Moderate',        tone: 'moderate',advice: 'Unusually sensitive people should limit long outdoor exertion.' } :
    aqi <= 150 ? { label: 'Unhealthy for Sensitive Groups', tone: 'usg', advice: 'Sensitive groups should reduce prolonged outdoor activity.' } :
                 { label: 'Unhealthy',       tone: 'bad',     advice: 'Everyone should limit prolonged outdoor exertion.' };
}

// ── Main entry ───────────────────────────────────────────────
/**
 * Full weather bundle for a city. Real Open-Meteo data from the snapshot when
 * available; deterministic climate model otherwise.
 */
export function getWeather(cityId) {
  const city = getCity(cityId);
  const snapCity = SNAPSHOT?.cities?.[cityId];
  const npt = nepalParts();
  if (snapCity?.current) return fromSnapshot(city, snapCity, npt);
  return fromModel(city, npt);
}

/** Real observation path — everything from the Open-Meteo snapshot. */
function fromSnapshot(city, snap, npt, aqiOverride) {
  const cur = snap.current;
  const cond = wmoToCond(cur.weather_code);
  const temp = Math.round(cur.temperature_2m);
  const feels = Math.round(cur.apparent_temperature ?? temp);
  const humidity = Math.round(cur.relative_humidity_2m ?? 0);
  const cloud = Math.round(cur.cloud_cover ?? 0);
  const wind = Math.round(cur.wind_speed_10m ?? 0);
  const windDir = Math.round(cur.wind_direction_10m ?? 0);
  const rainMm = Math.round((cur.precipitation ?? 0) * 10) / 10;

  // Find the hour index containing "now" — compare Kathmandu wall-clock
  // strings directly so the server timezone can never shift the match.
  const hourTimes = snap.hourly?.time || [];
  const hourTemps = snap.hourly?.temp || [];
  const hourCodes = snap.hourly?.code || [];
  const hourRain = snap.hourly?.rainProb || [];
  const hourVis = snap.hourly?.visM || [];
  const hourUv = snap.hourly?.uv || [];
  const pad2 = (v) => String(v).padStart(2, '0');
  const nowKey = `${npt.year}-${pad2(npt.month)}-${pad2(npt.day)}T${pad2(npt.hour)}`;
  let hourIdx = hourTimes.findIndex((ts) => (ts || '').slice(0, 13) === nowKey);
  if (hourIdx < 0) hourIdx = 0;

  const rain = Math.round(hourRain[hourIdx] ?? 0);
  const visM = hourVis[hourIdx];
  const vis = visM != null ? Math.round((visM / 1000) * 10) / 10 : null;
  const uvRaw = hourUv[hourIdx];
  const uvToday = Math.round(snap.daily?.uv_index_max?.[0] ?? 0);
  const uv = Math.round((uvRaw != null && uvRaw > 0 ? uvRaw : uvToday) || 0);

  // ── Hourly: next 10 hours starting at the current hour ──
  const hourly = [];
  for (let i = 0; i < 10; i++) {
    const idx = hourIdx + i;
    if (idx >= hourTimes.length) break;
    const h = partsOf(hourTimes[idx])?.h ?? 0;
    hourly.push({
      h,
      label: `${((h + 11) % 12) + 1} ${h < 12 ? 'AM' : 'PM'}`,
      now: i === 0,
      temp: Math.round(hourTemps[idx]),
      cond: wmoToCond(hourCodes[idx]),
      rainPct: Math.round(hourRain[idx] ?? 0),
    });
  }

  // ── 7-day from Open-Meteo daily ──
  const daily = [];
  const dTimes = snap.daily?.time || [];
  for (let i = 0; i < Math.min(7, dTimes.length); i++) {
    const p = partsOf(dTimes[i]);
    const wd = p ? weekdayIdx(p.y, p.mo, p.da) : null;
    daily.push({
      date: p ? new Date(Date.UTC(p.y, p.mo - 1, p.da)) : new Date(Date.UTC(npt.year, npt.month - 1, npt.day)),
      dayName: i === 0 ? 'Today' : WEATHER_DAYS[wd ?? weekdayIdx(npt.year, npt.month, npt.day)],
      hi: Math.round(snap.daily.temperature_2m_max[i]),
      lo: Math.round(snap.daily.temperature_2m_min[i]),
      cond: wmoToCond(snap.daily.weather_code?.[i]),
      rainPct: Math.round(snap.daily.precipitation_probability_max?.[i] ?? 0),
    });
  }

  // ── Sunrise/sunset from Open-Meteo (wall-clock numbers, tz-independent) ──
  const rise = partsOf(snap.daily?.sunrise?.[0]);
  const set = partsOf(snap.daily?.sunset?.[0]);
  const nowMin = npt.hour * 60 + npt.minute;
  const riseMin = rise ? rise.h * 60 + rise.m : 342;
  const setMin = set ? set.h * 60 + set.m : 1098;
  const dayFrac = Math.max(0, Math.min(1, (nowMin - riseMin) / (setMin - riseMin)));
  const isDay = nowMin >= riseMin && nowMin <= setMin;

  const aqiRow = aqiOverride ?? SNAPSHOT?.aqi?.[city.id];
  const aqiVal = Math.round(aqiRow?.value ?? 0);

  const stamp = fetchStamp();
  return {
    city,
    source: 'Open-Meteo',
    today: {
      temp, feels, humidity, cloud, rain, wind, windDir, vis, uv, rainMm,
      cond,
      sunrise: rise || { h: 5, m: 42 },
      sunset: set || { h: 18, m: 18 },
      sunriseLabel: rise ? fmt12HM(rise) : '5:42 AM',
      sunsetLabel: set ? fmt12HM(set) : '6:18 PM',
      dayFrac, isDay,
    },
    hourly, daily,
    aqi: { value: aqiVal, pm25: aqiRow?.pm25 ?? null, pm10: aqiRow?.pm10 ?? null, ...aqiBandFor(aqiVal) },
    updated: { time: stamp?.time || 'Recently', fetchedAt: stamp?.fetchedAt || null, live: false },
  };
}

/** Fallback path — deterministic seasonal climate model (offline-safe). */
function fromModel(city, npt) {
  const todayKey = `${city.id}-${npt.year}-${npt.month}-${npt.day}`;
  const rand = rng(hashStr(todayKey));

  const jitter = (v, amt) => Math.round((v + (rand() - 0.5) * 2 * amt) * 10) / 10;

  const temp = Math.round(jitter(city.temp, 1));
  const feels = Math.round(temp + (city.humidity > 70 ? 2 : 1) + (rand() - 0.4));
  const humidity = Math.round(jitter(city.humidity, 3));
  const cloud = Math.round(jitter(city.cloud, 6));
  const rain = Math.round(jitter(city.rain, 6));
  const wind = Math.round(jitter(city.wind, 2));
  const vis = Math.max(2, Math.round(jitter(city.vis, 1.5)));
  const uv = Math.max(1, Math.min(11, Math.round(jitter(city.uv, 0.8))));
  const rainMm = Math.round(rain * 0.35 * 10) / 10;
  const cond = conditionFrom(cloud, rain, uv);

  const dayShift = Math.round((city.lat - 27.7) * 6);
  const sunrise = { h: 5, m: Math.max(10, Math.min(55, 42 + dayShift)) };
  const sunset = { h: 18, m: Math.max(10, Math.min(55, 18 - dayShift)) };

  const nowMin = npt.hour * 60 + npt.minute;
  const riseMin = sunrise.h * 60 + sunrise.m;
  const setMin = sunset.h * 60 + sunset.m;
  const dayFrac = Math.max(0, Math.min(1, (nowMin - riseMin) / (setMin - riseMin)));
  const isDay = nowMin >= riseMin && nowMin <= setMin;

  const hourly = [];
  for (let i = 0; i < 10; i++) {
    const h = (npt.hour + i) % 24;
    const dayCurve = Math.cos(((h - 14) / 24) * Math.PI * 2);
    const t = Math.round(temp + dayCurve * (city.spread * 0.55) + (rand() - 0.5) * 1.2);
    const c = Math.max(5, Math.min(100, Math.round(cloud + (rand() - 0.5) * 24)));
    const r = Math.max(0, Math.min(95, Math.round(rain + (rand() - 0.5) * 26)));
    hourly.push({
      h,
      label: `${((h + 11) % 12) + 1} ${h < 12 ? 'AM' : 'PM'}`,
      now: i === 0,
      temp: t,
      cond: conditionFrom(c, r, 5),
      rainPct: r,
    });
  }

  const daily = [];
  for (let i = 0; i < 7; i++) {
    const base = Date.UTC(npt.year, npt.month - 1, npt.day) + i * DAY_MS;
    const isoDay = new Date(base).toISOString().slice(0, 10);
    const d = new Date(base);
    const r2 = rng(hashStr(`${city.id}-daily-${isoDay}`));
    const hi = Math.round(city.temp + city.spread * 0.55 + (r2() - 0.5) * 2.4);
    const lo = Math.round(city.temp - city.spread * 0.55 + (r2() - 0.5) * 2.4);
    const c2 = Math.max(8, Math.min(96, Math.round(city.cloud + (r2() - 0.5) * 34)));
    const rr = Math.max(0, Math.min(95, Math.round(city.rain + (r2() - 0.5) * 40)));
    daily.push({
      date: d,
      dayName: i === 0 ? 'Today' : WEATHER_DAYS[d.getUTCDay()],
      hi, lo,
      cond: conditionFrom(c2, rr, 6),
      rainPct: rr,
    });
  }

  const valleyBoost = ['kathmandu', 'lalitpur', 'bhaktapur'].includes(city.id) ? 22 : 0;
  const aqi = Math.round(Math.max(18, Math.min(160, jitter(58 + valleyBoost, 9))));
  const pm25 = Math.round(aqi * 0.62 * 10) / 10;
  const pm10 = Math.round(aqi * 1.18 * 10) / 10;

  return {
    city,
    source: 'climate model',
    today: {
      temp, feels, humidity, cloud, rain, wind, windDir: city.windDir, vis, uv, rainMm,
      cond, sunrise, sunset, sunriseLabel: fmt12HM(sunrise), sunsetLabel: fmt12HM(sunset),
      dayFrac, isDay,
    },
    hourly, daily,
    aqi: { value: aqi, pm25, pm10, ...aqiBandFor(aqi) },
    updated: { time: 'Estimated', fetchedAt: null, live: false },
  };
}

/**
 * Build a weather bundle from a live browser-side Open-Meteo response
 * (same row shape the snapshot stores). Returns null when unusable, so
 * callers fall back to the baked snapshot.
 */
export function weatherFromLive(cityId, wx, aqiCurrent) {
  const city = getCity(cityId);
  const row = Array.isArray(wx) ? wx[0] : wx;
  if (!row?.current) return null;
  const bundle = fromSnapshot(city, {
    current: row.current,
    hourly: {
      time: row.hourly?.time || [],
      temp: row.hourly?.temperature_2m || [],
      code: row.hourly?.weather_code || [],
      rainProb: row.hourly?.precipitation_probability || [],
      visM: row.hourly?.visibility || [],
      uv: row.hourly?.uv_index || [],
    },
    daily: row.daily || null,
  }, nepalParts(), aqiCurrent ? { value: aqiCurrent.us_aqi, pm25: aqiCurrent.pm2_5, pm10: aqiCurrent.pm10 } : undefined);
  bundle.updated = { time: 'Just now', fetchedAt: new Date().toISOString(), live: true };
  return bundle;
}

// ── Backup provider: wttr.in (free, keyless) ─────────────────────
// Used only when Open-Meteo is unreachable. Maps WorldWeatherOnline-style
// codes/payloads onto the same Open-Meteo row shape weatherFromLive takes,
// so the rest of the pipeline is provider-agnostic.

/** WorldWeatherOnline condition code → nearest WMO weather code. */
export function wwoToWmo(code) {
  const c = parseInt(code, 10);
  const map = {
    113: 0,
    116: 2, 119: 3, 122: 3,
    143: 45, 248: 45, 260: 45,
    263: 51, 266: 51, 281: 51, 284: 51, 293: 51, 296: 51,
    176: 80,
    299: 61, 302: 61, 305: 61, 308: 61, 311: 61, 314: 61, 317: 61,
    320: 61, 353: 61, 356: 63, 359: 65, 362: 61, 365: 61,
    185: 66, 350: 66,
    179: 71, 182: 71, 227: 71, 230: 71, 323: 71, 326: 71, 329: 71,
    332: 71, 335: 71, 338: 71, 368: 71, 371: 71, 374: 71, 377: 71,
    200: 95, 386: 95, 389: 95, 392: 95, 395: 95,
  };
  return map[c] ?? 3;
}

/**
 * Adapt a wttr.in `?format=j1` payload to the Open-Meteo row shape.
 * Returns null when unusable. Units: wttr.in already reports metric
 * (°C, km/h, km visibility→converted to m, %) matching Open-Meteo defaults.
 */
export function wttrToRow(j) {
  const cur = j?.current_condition?.[0];
  const days = Array.isArray(j?.weather) ? j.weather : [];
  if (!cur || !days.length) return null;
  const num = (v, d = 0) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : d;
  };
  const row = {
    current: {
      temperature_2m: num(cur.temp_C),
      apparent_temperature: num(cur.FeelsLikeC),
      relative_humidity_2m: num(cur.humidity),
      weather_code: wwoToWmo(cur.weatherCode),
      cloud_cover: num(cur.cloudcover),
      wind_speed_10m: num(cur.windspeedKmph),
      wind_direction_10m: num(cur.winddirDegree),
      precipitation: num(cur.precipMM),
    },
    hourly: { time: [], temp: [], code: [], rainProb: [], visM: [], uv: [] },
    daily: {
      time: [], temperature_2m_max: [], temperature_2m_min: [],
      weather_code: [], precipitation_probability_max: [],
      sunrise: [], sunset: [], uv_index_max: [],
    },
  };
  const toISO = (date, t) => {
    // "06:01 AM" → "YYYY-MM-DDT06:01" (partsOf-compatible)
    const m = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(t || '');
    if (!m) return null;
    let hh = parseInt(m[1], 10) % 12;
    if (/pm/i.test(m[3])) hh += 12;
    return `${date}T${String(hh).padStart(2, '0')}:${m[2]}`;
  };
  for (const d of days) {
    const hours = Array.isArray(d.hourly) ? d.hourly : [];
    for (const h of hours) {
      // wttr.in "time" is HHMM/100 ("0".."2100"); "0" means midnight.
      const hh = String(Math.floor(parseInt(h.time, 10) / 100)).padStart(2, '0');
      row.hourly.time.push(`${d.date}T${hh}:00`);
      row.hourly.temp.push(num(h.tempC));
      row.hourly.code.push(wwoToWmo(h.weatherCode));
      row.hourly.rainProb.push(num(h.chanceofrain));
      row.hourly.visM.push(num(h.visibility) * 1000);
      row.hourly.uv.push(num(h.uvIndex));
    }
    row.daily.time.push(d.date);
    row.daily.temperature_2m_max.push(num(d.maxtempC));
    row.daily.temperature_2m_min.push(num(d.mintempC));
    const noon = hours.find((h) => String(h.time) === '1200') || hours[0];
    row.daily.weather_code.push(wwoToWmo(noon?.weatherCode));
    row.daily.precipitation_probability_max.push(
      Math.max(0, ...hours.map((h) => num(h.chanceofrain))),
    );
    const astro = d.astronomy?.[0];
    row.daily.sunrise.push(toISO(d.date, astro?.sunrise));
    row.daily.sunset.push(toISO(d.date, astro?.sunset));
    row.daily.uv_index_max.push(num(d.uvIndex));
  }
  return row;
}
