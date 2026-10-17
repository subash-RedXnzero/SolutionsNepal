/**
 * Shared S4NKALP Nepali Calendar upstream fetcher.
 *
 * Runtime-agnostic on purpose: imported by src/worker.js (Cloudflare edge,
 * /api/live/calendar/{year} + daily cron) — pass a fetch implementation in.
 * No `node:` imports here (mirrors live-upstream.js).
 *
 * Upstream: https://api-nepalicalendar.leapcell.app (free, no key)
 *   GET /api/calendar/{bsYear}/{bsMonth}  → one month of tithi/festival rows
 *
 * The aggregation here mirrors scripts/sync-nepali-holidays.js exactly so the
 * runtime payload has the same { year, syncedAt, source, months[] } shape as
 * the static files in public/data/nepali-holidays/ — holiday-service.js
 * consumes both interchangeably.
 */

export const CALENDAR_API_BASE = 'https://api-nepalicalendar.leapcell.app';

const MONTH_NAMES = [
  'Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra',
];

// Sane year guard: the engine/sources cover roughly BS 1992–2090.
function validYear(year) {
  const y = Number(year);
  return Number.isInteger(y) && y >= 1992 && y <= 2090 ? y : null;
}

/** Devanagari digits → ASCII (the API sends day numbers as ०१२…). */
function devanagariToArabic(str) {
  if (!str) return str;
  const map = { '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9' };
  return String(str).replace(/[०-९]/g, (d) => map[d] || d);
}

/**
 * Fetch one month from the S4NKALP API.
 * @throws on HTTP error or timeout.
 */
async function fetchMonth(fetchImpl, bsYear, bsMonth, timeoutMs) {
  const url = `${CALENDAR_API_BASE}/api/calendar/${bsYear}/${bsMonth}`;
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
  try {
    const resp = await fetchImpl(url, {
      headers: { Accept: 'application/json' },
      ...(ctrl ? { signal: ctrl.signal } : {}),
    });
    if (!resp.ok) throw new Error(`S4NKALP: HTTP ${resp.status} for month ${bsMonth}`);
    return await resp.json();
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Fetch all 12 months of a BS year and aggregate into the same yearly shape
 * the static snapshot files use. Failed months become empty placeholders
 * (client falls back to the bundled engine for those) — the function only
 * throws when EVERY month fails, so a partial outage still yields usable data.
 *
 * Requests run in waves of 4 (≈3 upstream hits/s worst case — the upstream is
 * a small free-tier API; full parallelism risks 429s). Typical steady path:
 * three quick waves, well inside the 30s cron window.
 *
 * @returns {{ year, syncedAt, source, months: Array }}
 * @throws when all 12 months fail (never returned as silent empty data).
 */
export async function fetchCalendarYear(fetchImpl = fetch, bsYearArg, timeoutMs = 10000) {
  const bsYear = validYear(bsYearArg);
  if (!bsYear) throw new Error(`S4NKALP: invalid BS year ${bsYearArg}`);

  const monthIndexes = Array.from({ length: 12 }, (_, i) => i + 1);
  const results = [];
  for (let i = 0; i < monthIndexes.length; i += 4) {
    const wave = monthIndexes.slice(i, i + 4);
    const waveResults = await Promise.all(
      wave.map((m) => fetchMonth(fetchImpl, bsYear, m, timeoutMs).catch(() => null)),
    );
    results.push(...waveResults);
  }

  const months = results.map((data, i) => {
    if (!data || !Array.isArray(data.days)) {
      return { month: i + 1, nameEn: MONTH_NAMES[i], nameNp: '', days: [], holiFest: [], marriage: [], bratabandha: [] };
    }
    return {
      month: i + 1,
      nameEn: MONTH_NAMES[i],
      nameNp: (data.metadata && data.metadata.np) || '',
      days: data.days.map((d) => ({
        day: parseInt(devanagariToArabic(d && d.n), 10) || 0,
        weekday: d && d.d, // 0=Sun … 6=Sat (upstream's own encoding)
        ad: (d && d.e) || '',
        tithi: (d && d.t) || '',
        festival: (d && d.f) || '',
        isHoliday: (d && d.h) === true,
        holiFest: [],
        marriage: [],
        bratabandha: [],
      })),
      holiFest: data.holiFest || [],
      marriage: data.marriage || [],
      bratabandha: data.bratabandha || [],
    };
  });

  if (!months.some((m) => m.days.length > 0)) {
    throw new Error(`S4NKALP: all 12 months failed for BS ${bsYear}`);
  }

  return {
    year: bsYear,
    syncedAt: new Date().toISOString(),
    source: 'S4NKALP/nepali-calendar-api',
    months,
  };
}
