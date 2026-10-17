/**
 * Nepali Holiday Service
 *
 * Provides holiday, tithi, and festival data for the calendar UI.
 * Data sources (in priority order):
 *   1. Cached JSON from the S4NKALP Nepali Calendar API (public/data/nepali-holidays/)
 *   2. Bundled holidays from nepali-date-engine (works fully offline)
 *   3. The existing calendar-events.js data (hardcoded verified events)
 *
 * Usage (client-side):
 *   import { getHolidaysForMonth, getHolidayForDate, isPublicHoliday } from '../../lib/nepal/holiday-service.js';
 *
 *   // Get all holidays/events for a BS month
 *   const events = getHolidaysForMonth(2083, 1); // Baisakh 2083
 *
 *   // Check if a specific date is a public holiday
 *   const isHoliday = isPublicHoliday(2083, 6, 16); // Vijaya Dashami
 */

import {
  getNepaliDate,
  adToBs as engineAdToBs,
  bsToAd as engineBsToAd,
} from 'nepali-date-engine';

// ── Cached API Data ──────────────────────────────────────────────────────
// These imports will be resolved at build time for the specific years we have.
// We try to load them; if they don't exist yet, we gracefully degrade.

let apiDataCache = {};

/**
 * Attempt to load cached API data for a given BS year.
 * The JSON files are in public/data/nepali-holidays/{year}.json
 * and are loaded via fetch at runtime (since they're in public/).
 */
async function loadApiData(bsYear) {
  if (apiDataCache[bsYear]) return apiDataCache[bsYear];

  // 1. Live edge endpoint — kept fresh daily by the worker cron after
  //    deployment. Same yearly shape as the static snapshot, wrapped as
  //    { ok, fetchedAt, data }. Any failure falls through to the snapshot.
  try {
    const opts = typeof AbortSignal !== 'undefined' && AbortSignal.timeout
      ? { signal: AbortSignal.timeout(6000) }
      : {};
    const resp = await fetch(`/api/live/calendar/${bsYear}`, opts);
    if (resp.ok) {
      const json = await resp.json();
      const data = json && json.ok ? json.data : json;
      if (data && Array.isArray(data.months) && data.months.some((m) => m.days && m.days.length)) {
        apiDataCache[bsYear] = data;
        return data;
      }
    }
  } catch {
    /* fall through to the static snapshot below */
  }

  // 2. Build-time snapshot (static JSON shipped with the site).
  try {
    const resp = await fetch(`/data/nepali-holidays/${bsYear}.json`);
    if (!resp.ok) return null;
    const data = await resp.json();
    apiDataCache[bsYear] = data;
    return data;
  } catch {
    return null;
  }
}

/**
 * Synchronous version for build-time or when data is pre-loaded.
 * Checks the in-memory cache only.
 */
function getCachedApiData(bsYear) {
  return apiDataCache[bsYear] || null;
}

/**
 * Pre-load API data for a year (call at page init).
 */
async function preloadYear(bsYear) {
  return loadApiData(bsYear);
}

// ── Holiday Lookups ──────────────────────────────────────────────────────

/**
 * Get all holidays/events for a specific BS month from API data.
 * Returns an array of { day, tithi, festival, isHoliday, holiFest, marriage, bratabandha }
 */
function getHolidaysFromApi(bsYear, bsMonth) {
  const data = getCachedApiData(bsYear);
  if (!data || !data.months) return [];

  const month = data.months[bsMonth - 1];
  if (!month) return [];

  return month.days.filter(d => d.isHoliday || d.festival || d.tithi);
}

/**
 * Check if a specific BS date is a public holiday using API data.
 */
function isPublicHolidayFromApi(bsYear, bsMonth, bsDay) {
  const data = getCachedApiData(bsYear);
  if (!data || !data.months) return null;

  const month = data.months[bsMonth - 1];
  if (!month) return null;

  const day = month.days.find(d => d.day === bsDay);
  return day ? day.isHoliday : null;
}

/**
 * Get tithi for a specific BS date from API data.
 */
function getTithiFromApi(bsYear, bsMonth, bsDay) {
  const data = getCachedApiData(bsYear);
  if (!data || !data.months) return null;

  const month = data.months[bsMonth - 1];
  if (!month) return null;

  const day = month.days.find(d => d.day === bsDay);
  return day ? (day.tithi || null) : null;
}

/**
 * Get festival name for a specific BS date from API data.
 */
function getFestivalFromApi(bsYear, bsMonth, bsDay) {
  const data = getCachedApiData(bsYear);
  if (!data || !data.months) return null;

  const month = data.months[bsMonth - 1];
  if (!month) return null;

  const day = month.days.find(d => d.day === bsDay);
  return day ? (day.festival || null) : null;
}

// ── nepali-date-engine Fallback ──────────────────────────────────────────

/**
 * Get holiday info for a Gregorian date using nepali-date-engine.
 * This works fully offline with bundled data from 1970-2074 BS.
 */
function getHolidayFromEngine(adYear, adMonth, adDay) {
  try {
    const date = new Date(adYear, adMonth - 1, adDay);
    const nepali = getNepaliDate(date);

    if (nepali?.holiday?.isHoliday) {
      return {
        name: nepali.holiday.name?.en || nepali.holiday.name?.np || 'Holiday',
        nameNp: nepali.holiday.name?.np || '',
        isHoliday: true,
        source: 'nepali-date-engine',
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get tithi for a Gregorian date using nepali-date-engine.
 */
function getTithiFromEngine(adYear, adMonth, adDay) {
  try {
    const date = new Date(adYear, adMonth - 1, adDay);
    const nepali = getNepaliDate(date);

    if (nepali?.tithi?.name) {
      return nepali.tithi.name;
    }
    return null;
  } catch {
    return null;
  }
}

// ── Unified API (combines all sources) ───────────────────────────────────

/**
 * Get holidays for a BS month, combining API data with the engine fallback.
 * Returns array of objects compatible with the calendar's event format:
 *   { day, name, nameNp, isHoliday, tithi, source }
 */
export function getHolidaysForMonth(bsYear, bsMonth) {
  const results = [];
  const seen = new Set();

  // 1. API data (highest priority - most up-to-date)
  const apiHolidays = getHolidaysFromApi(bsYear, bsMonth);
  for (const h of apiHolidays) {
    const key = `${bsYear}-${bsMonth}-${h.day}`;
    seen.add(key);

    results.push({
      day: h.day,
      name: h.festival || h.tithi || 'Holiday',
      nameNp: h.tithi || '',
      isHoliday: h.isHoliday,
      tithi: h.tithi || '',
      source: 'api',
    });
  }

  // 2. nepali-date-engine fallback for years not in API cache
  // Convert BS month range to AD dates and check each day
  try {
    const { bsToAd } = require('nepali-date-engine');
    const daysInMonth = getDaysInBsMonth(bsYear, bsMonth);

    if (daysInMonth) {
      for (let d = 1; d <= daysInMonth; d++) {
        const key = `${bsYear}-${bsMonth}-${d}`;
        if (seen.has(key)) continue;

        const ad = bsToAd({ year: bsYear, month: bsMonth, day: d });
        if (!ad) continue;

        const holiday = getHolidayFromEngine(ad.year, ad.month, ad.day);
        if (holiday) {
          results.push({
            day: d,
            name: holiday.name,
            nameNp: holiday.nameNp,
            isHoliday: holiday.isHoliday,
            tithi: '',
            source: 'engine',
          });
        }
      }
    }
  } catch {
    // Engine unavailable, continue with API data only
  }

  return results.sort((a, b) => a.day - b.day);
}

/**
 * Check if a BS date is a public holiday.
 * Checks API data first, then engine fallback.
 */
export function isPublicHoliday(bsYear, bsMonth, bsDay) {
  // 1. Check API data
  const apiResult = isPublicHolidayFromApi(bsYear, bsMonth, bsDay);
  if (apiResult !== null) return apiResult;

  // 2. Fallback to engine
  try {
    const ad = engineBsToAd({ year: bsYear, month: bsMonth, day: bsDay });
    if (ad) {
      const holiday = getHolidayFromEngine(ad.year, ad.month, ad.day);
      return holiday ? holiday.isHoliday : false;
    }
  } catch {
    // Engine unavailable
  }

  return false;
}

/**
 * Get tithi for a BS date.
 * Checks API data first, then engine fallback.
 */
export function getTithiForDate(bsYear, bsMonth, bsDay) {
  // 1. Check API data
  const apiTithi = getTithiFromApi(bsYear, bsMonth, bsDay);
  if (apiTithi) return apiTithi;

  // 2. Fallback to engine
  try {
    const ad = engineBsToAd({ year: bsYear, month: bsMonth, day: bsDay });
    if (ad) {
      return getTithiFromEngine(ad.year, ad.month, ad.day);
    }
  } catch {
    // Engine unavailable
  }

  return null;
}

/**
 * Get festival/event name for a BS date.
 * Only checks API data (engine doesn't have festival names).
 */
export function getFestivalForDate(bsYear, bsMonth, bsDay) {
  return getFestivalFromApi(bsYear, bsMonth, bsDay);
}

/**
 * Get upcoming holidays from all sources.
 * Returns events in the format expected by the calendar's event list.
 */
export function getUpcomingHolidays(todayBs, { limit = 8 } = {}) {
  const results = [];
  let year = todayBs.year;
  let month = todayBs.month;

  while (results.length < limit && year <= 2090) {
    const holidays = getHolidaysForMonth(year, month);

    for (const h of holidays) {
      if (h.day >= todayBs.day || year > todayBs.year) {
        results.push({
          bs: { year, month, day: h.day },
          name: h.name,
          nameNp: h.nameNp,
          isHoliday: h.isHoliday,
          tithi: h.tithi,
          source: h.source,
        });
        if (results.length >= limit) break;
      }
    }

    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }

  return results;
}

/**
 * Get the source of holiday data for a year.
 * Returns 'api', 'engine', or 'none'.
 */
export function getDataSource(bsYear) {
  if (getCachedApiData(bsYear)) return 'api';

  // Check if engine has data for this year
  if (bsYear >= 1970 && bsYear <= 2074) return 'engine';

  return 'none';
}

/**
 * Get sync metadata for the API data.
 */
export function getSyncInfo(bsYear) {
  const data = getCachedApiData(bsYear);
  if (!data) return null;

  return {
    syncedAt: data.syncedAt,
    source: data.source,
    year: data.year,
  };
}

// ── Helper: days in BS month ─────────────────────────────────────────────

/**
 * Get the number of days in a BS month using nepali-date-engine.
 */
function getDaysInBsMonth(bsYear, bsMonth) {
  try {
    // Use known month lengths from the conversion engine
    const BS_MONTH_DAYS = {
      2000: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
      2001: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
      2002: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
      2003: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
      2004: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
      2005: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
      2006: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
      2007: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
      2008: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
      2009: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
      2010: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
      2011: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
      2012: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
      2013: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
      2014: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
      2015: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
      2016: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
      2017: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
      2018: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
      2019: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
      2020: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
      2021: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
      2022: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
      2023: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
      2024: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
      2025: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
      2026: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
      2027: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
      2028: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
      2029: [31, 31, 32, 31, 32, 30, 30, 29, 30, 29, 30, 30],
      2030: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
      2031: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
      2032: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
      2033: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
      2034: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
      2035: [30, 32, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
      2036: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
      2037: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
      2038: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
      2039: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
      2040: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
      2041: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
      2042: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
      2043: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
      2044: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
      2045: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
      2046: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
      2047: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
      2048: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
      2049: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
      2050: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
      2051: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
      2052: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
      2053: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
      2054: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
      2055: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
      2056: [31, 31, 32, 31, 32, 30, 30, 29, 30, 29, 30, 30],
      2057: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
      2058: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
      2059: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
      2060: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
      2061: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
      2062: [30, 32, 31, 32, 31, 31, 29, 30, 29, 30, 29, 31],
      2063: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
      2064: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
      2065: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
      2066: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
      2067: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
      2068: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
      2069: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
      2070: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
      2071: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
      2072: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
      2073: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
      2074: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
      2075: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
      2076: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
      2077: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
      2078: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
      2079: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
      2080: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
      2081: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
      2082: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
      2083: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
      2084: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
      2085: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
      2086: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
      2087: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
      2088: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
      2089: [30, 32, 31, 32, 31, 31, 29, 30, 29, 30, 29, 31],
      2090: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    };

    const yearData = BS_MONTH_DAYS[bsYear];
    if (yearData) return yearData[bsMonth - 1];

    // Fallback: try to derive from engine
    const lastDay = 32; // Max possible days
    for (let d = lastDay; d >= 28; d--) {
      const ad = engineBsToAd({ year: bsYear, month: bsMonth, day: d });
      if (ad) return d;
    }
    return 30; // Default
  } catch {
    return 30;
  }
}

// ── Exports for direct access ────────────────────────────────────────────

export {
  preloadYear,
  getCachedApiData,
  getTithiFromApi,
  getFestivalFromApi,
  getHolidayFromEngine,
  getTithiFromEngine,
};
