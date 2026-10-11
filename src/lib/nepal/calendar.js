/**
 * Nepal Bikram Sambat (BS) <-> Gregorian (AD) calendar engine.
 *
 * Month-length data for BS 2000-2090 is sourced from the
 * `nepali-date-converter` package (v3.4.0) reference calendar, which was
 * cross-validated against the Government of Nepal Ministry of Home Affairs
 * "List of Public Holidays 2083" gazette (published 2082/11/18) and against
 * fixed BS anchors (Baisakh 1 = New Year, Magh 1 = Maghe Sankranti,
 * Falgun 7 = Democracy Day, Ashwin 3 = Constitution Day) for 2075-2083.
 *
 * All arithmetic is done on UTC day numbers so results never depend on the
 * runtime timezone or DST rules.
 */

// Days in each BS month, indexed [bsYear][month-1].
// Months: Baisakh, Jestha, Ashadh, Shrawan, Bhadra, Ashwin,
//         Kartik, Mangsir, Poush, Magh, Falgun, Chaitra
export const BS_MONTH_DAYS = {
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
  2082: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2083: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2084: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2085: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2086: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2087: [31, 31, 32, 31, 31, 31, 30, 30, 29, 30, 30, 30],
  2088: [30, 31, 32, 32, 30, 31, 30, 30, 29, 30, 30, 30],
  2089: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2090: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
};

const BS_MONTHS = [
  'Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra',
];

const BS_MONTHS_NP = [
  'बैशाख', 'जेठ', 'असार', 'साउन', 'भदौ', 'असोज',
  'कात्तिक', 'मंसिर', 'पुष', 'माघ', 'फाल्गुन', 'चैत',
];

export const BS_MIN_YEAR = 2000;
export const BS_MAX_YEAR = 2090;

// BS 2000-01-01 == AD 1943-04-14 (Wednesday). Stored as a UTC day number so
// every conversion is pure integer math - no local-timezone leakage.
const MS_PER_DAY = 86400000;
const EPOCH_UTC = Date.UTC(1943, 3, 14);

// Cumulative UTC day offset of each BS year start from the epoch.
const YEAR_START_OFFSET = {};
(function precompute() {
  let offset = 0;
  for (let y = BS_MIN_YEAR; y <= BS_MAX_YEAR; y++) {
    YEAR_START_OFFSET[y] = offset;
    const row = BS_MONTH_DAYS[y];
    if (!row) throw new Error(`Missing BS month data for year ${y}`);
    for (let m = 0; m < 12; m++) offset += row[m];
  }
})();

function adToUtcDay(year, month, day) {
  return Math.round(Date.UTC(year, month - 1, day) / MS_PER_DAY);
}

function utcDayToAd(dayNum) {
  const d = new Date(EPOCH_UTC + dayNum * MS_PER_DAY);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

/** Number of days in a BS month (1-indexed month). Returns null outside data range. */
export function getDaysInBsMonth(year, month) {
  const row = BS_MONTH_DAYS[year];
  if (!row || month < 1 || month > 12) return null;
  return row[month - 1];
}

/** Total days in a BS year. Returns null outside data range. */
export function getDaysInBsYear(year) {
  const row = BS_MONTH_DAYS[year];
  if (!row) return null;
  let total = 0;
  for (let m = 0; m < 12; m++) total += row[m];
  return total;
}

/**
 * Convert a BS date to an AD date.
 * @returns {{ year, month, day } | null} null when out of supported range
 */
export function bsToAd(bsYear, bsMonth, bsDay) {
  if (!isValidBsDate(bsYear, bsMonth, bsDay)) return null;
  let offset = YEAR_START_OFFSET[bsYear];
  const row = BS_MONTH_DAYS[bsYear];
  for (let m = 1; m < bsMonth; m++) offset += row[m - 1];
  return utcDayToAd(offset + (bsDay - 1));
}

/**
 * Convert an AD date to a BS date.
 * @returns {{ year, month, day } | null} null when out of supported range
 */
export function adToBs(adYear, adMonth, adDay) {
  const dayNum = adToUtcDay(adYear, adMonth, adDay);
  const epochDay = EPOCH_UTC / MS_PER_DAY;
  const rel = dayNum - epochDay;
  if (rel < 0) return null;

  // Locate the BS year by binary search over precomputed offsets.
  let lo = BS_MIN_YEAR, hi = BS_MAX_YEAR, bsYear = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (YEAR_START_OFFSET[mid] <= rel) { bsYear = mid; lo = mid + 1; }
    else hi = mid - 1;
  }
  if (bsYear === -1) return null;

  let remaining = rel - YEAR_START_OFFSET[bsYear];
  const row = BS_MONTH_DAYS[bsYear];
  for (let m = 0; m < 12; m++) {
    if (remaining < row[m]) return { year: bsYear, month: m + 1, day: remaining + 1 };
    remaining -= row[m];
  }
  return null; // should not happen
}

function isValidBsDate(year, month, day) {
  const days = getDaysInBsMonth(year, month);
  return days !== null && day >= 1 && day <= days;
}

/**
 * "Today" in Nepal (Asia/Kathmandu, UTC+05:45), independent of server or
 * browser timezone. Returns both AD and BS components plus weekday.
 * @param {Date} [now] injectable clock for tests
 */
export function todayInNepal(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(now);
  const p = {};
  for (const part of parts) p[part.type] = part.value;

  const ad = { year: Number(p.year), month: Number(p.month), day: Number(p.day) };
  const bs = adToBs(ad.year, ad.month, ad.day);
  const weekday = new Date(Date.UTC(ad.year, ad.month - 1, ad.day)).getUTCDay();
  return { ad, bs: bs && { ...bs }, weekday, time: { hour: Number(p.hour) % 24, minute: Number(p.minute), second: Number(p.second) } };
}

/** Whole-day difference adB - adA in days (positive when B is later). */
export function daysBetweenAd(a, b) {
  return adToUtcDay(b.year, b.month, b.day) - adToUtcDay(a.year, a.month, a.day);
}

/** Compare two {year,month,day} triples of the same calendar system. */
export function compareDates(a, b) {
  if (a.year !== b.year) return a.year < b.year ? -1 : 1;
  if (a.month !== b.month) return a.month < b.month ? -1 : 1;
  if (a.day !== b.day) return a.day < b.day ? -1 : 1;
  return 0;
}

export function getBsMonthName(month) { return BS_MONTHS[month - 1] || ''; }
export function getBsMonthNameNp(month) { return BS_MONTHS_NP[month - 1] || ''; }
export function formatBsDate(bs) { return `${bs.year}-${String(bs.month).padStart(2, '0')}-${String(bs.day).padStart(2, '0')}`; }
export function formatAdDate(ad) { return `${ad.year}-${String(ad.month).padStart(2, '0')}-${String(ad.day).padStart(2, '0')}`; }

export { BS_MONTHS, BS_MONTHS_NP };
