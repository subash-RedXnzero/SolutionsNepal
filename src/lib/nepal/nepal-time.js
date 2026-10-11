/**
 * SolutionsNepal — Centralized Nepal Date/Time Utility
 *
 * All date/time calculations use Asia/Kathmandu (UTC+5:45) as the
 * authoritative timezone. This module is the single source of truth
 * for "what date is it today in Nepal?" across the entire site.
 *
 * The BS↔AD conversion uses verified calendar data for years 2000–2090.
 * The epoch reference is 1 Baisakh 2000 BS = 14 April 1943 AD.
 */

// ─── BS CALENDAR DATA (2000–2090) ──────────────────────────
// Month lengths for each BS year [Baisakh, Jestha, ..., Chaitra]

const BD = {
  2000:[30,32,31,32,31,30,30,30,29,30,29,31],
  2001:[31,31,32,31,31,31,30,29,30,29,30,30],
  2002:[31,31,32,32,31,30,30,29,30,29,30,30],
  2003:[31,32,31,32,31,30,30,30,29,29,30,31],
  2004:[30,32,31,32,31,30,30,30,29,30,29,31],
  2005:[31,31,32,31,31,31,30,29,30,29,30,30],
  2006:[31,31,32,32,31,30,30,29,30,29,30,30],
  2007:[31,32,31,32,31,30,30,30,29,29,30,31],
  2008:[31,31,31,32,31,31,29,30,30,29,29,31],
  2009:[31,31,32,31,31,31,30,29,30,29,30,30],
  2010:[31,31,32,32,31,30,30,29,30,29,30,30],
  2011:[31,32,31,32,31,30,30,30,29,29,30,31],
  2012:[31,31,31,32,31,31,29,30,30,29,30,30],
  2013:[31,31,32,31,31,31,30,29,30,29,30,30],
  2014:[31,31,32,32,31,30,30,29,30,29,30,30],
  2015:[31,32,31,32,31,30,30,30,29,29,30,31],
  2016:[31,31,31,32,31,31,29,30,30,29,30,30],
  2017:[31,31,32,31,31,31,30,29,30,29,30,30],
  2018:[31,32,31,32,31,30,30,29,30,29,30,30],
  2019:[31,32,31,32,31,30,30,30,29,30,29,31],
  2020:[31,31,31,32,31,31,30,29,30,29,30,30],
  2021:[31,31,32,31,31,31,30,29,30,29,30,30],
  2022:[31,32,31,32,31,30,30,30,29,29,30,30],
  2023:[31,32,31,32,31,30,30,30,29,30,29,31],
  2024:[31,31,31,32,31,31,30,29,30,29,30,30],
  2025:[31,31,32,31,31,31,30,29,30,29,30,30],
  2026:[31,32,31,32,31,30,30,30,29,29,30,31],
  2027:[30,32,31,32,31,30,30,30,29,30,29,31],
  2028:[31,31,32,31,31,31,30,29,30,29,30,30],
  2029:[31,31,32,31,32,30,30,29,30,29,30,30],
  2030:[31,32,31,32,31,30,30,30,29,29,30,31],
  2031:[30,32,31,32,31,30,30,30,29,30,29,31],
  2032:[31,31,32,31,31,31,30,29,30,29,30,30],
  2033:[31,31,32,32,31,30,30,29,30,29,30,30],
  2034:[31,32,31,32,31,30,30,30,29,29,30,31],
  2035:[30,32,31,32,31,31,29,30,30,29,29,31],
  2036:[31,31,32,31,31,31,30,29,30,29,30,30],
  2037:[31,31,32,32,31,30,30,29,30,29,30,30],
  2038:[31,32,31,32,31,30,30,30,29,29,30,31],
  2039:[31,31,31,32,31,31,29,30,30,29,30,30],
  2040:[31,31,32,31,31,31,30,29,30,29,30,30],
  2041:[31,31,32,32,31,30,30,29,30,29,30,30],
  2042:[31,32,31,32,31,30,30,30,29,29,30,31],
  2043:[31,31,31,32,31,31,29,30,30,29,30,30],
  2044:[31,31,32,31,31,31,30,29,30,29,30,30],
  2045:[31,32,31,32,31,30,30,29,30,29,30,30],
  2046:[31,32,31,32,31,30,30,30,29,29,30,31],
  2047:[31,31,31,32,31,31,30,29,30,29,30,30],
  2048:[31,31,32,31,31,31,30,29,30,29,30,30],
  2049:[31,32,31,32,31,30,30,30,29,29,30,30],
  2050:[31,32,31,32,31,30,30,30,29,30,29,31],
  2051:[31,31,31,32,31,31,30,29,30,29,30,30],
  2052:[31,31,32,31,31,31,30,29,30,29,30,30],
  2053:[31,32,31,32,31,30,30,30,29,29,30,30],
  2054:[31,32,31,32,31,30,30,30,29,30,29,31],
  2055:[31,31,32,31,31,31,30,29,30,29,30,30],
  2056:[31,31,32,31,32,30,30,29,30,29,30,30],
  2057:[31,32,31,32,31,30,30,30,29,29,30,31],
  2058:[30,32,31,32,31,30,30,30,29,30,29,31],
  2059:[31,31,32,31,31,31,30,29,30,29,30,30],
  2060:[31,31,32,32,31,30,30,29,30,29,30,30],
  2061:[31,32,31,32,31,30,30,30,29,29,30,31],
  2062:[30,32,31,32,31,31,29,30,29,30,29,31],
  2063:[31,31,32,31,31,31,30,29,30,29,30,30],
  2064:[31,31,32,32,31,30,30,29,30,29,30,30],
  2065:[31,32,31,32,31,30,30,30,29,29,30,31],
  2066:[31,31,31,32,31,31,29,30,30,29,29,31],
  2067:[31,31,32,31,31,31,30,29,30,29,30,30],
  2068:[31,31,32,32,31,30,30,29,30,29,30,30],
  2069:[31,32,31,32,31,30,30,30,29,29,30,31],
  2070:[31,31,31,32,31,31,29,30,30,29,30,30],
  2071:[31,31,32,31,31,31,30,29,30,29,30,30],
  2072:[31,32,31,32,31,30,30,29,30,29,30,30],
  2073:[31,32,31,32,31,30,30,30,29,29,30,31],
  2074:[31,31,31,32,31,31,30,29,30,29,30,30],
  2075:[31,31,32,31,31,31,30,29,30,29,30,30],
  2076:[31,32,31,32,31,30,30,30,29,29,30,30],
  2077:[31,32,31,32,31,30,30,30,29,30,29,31],
  2078:[31,31,31,32,31,31,30,29,30,29,30,30],
  2079:[31,31,32,31,31,31,30,29,30,29,30,30],
  2080:[31,32,31,32,31,30,30,30,29,29,30,30],
  2081:[31,32,31,32,31,30,30,30,29,30,29,31],
  2082:[31,31,32,31,31,31,30,29,30,29,30,30],
  2083:[31,31,32,31,31,31,30,29,30,29,30,30],
  2084:[31,31,32,31,31,30,30,30,29,30,30,30],
  2085:[31,32,31,32,30,31,30,30,29,30,30,30],
  2086:[30,32,31,32,31,30,30,30,29,30,30,30],
  2087:[31,31,32,31,31,31,30,30,29,30,30,30],
  2088:[30,31,32,32,30,31,30,30,29,30,30,30],
  2089:[30,32,31,32,31,30,30,30,29,30,30,30],
  2090:[30,32,31,32,31,30,30,30,29,30,30,30]
};

// ─── REFERENCE EPOCH ────────────────────────────────────────
// 1 Baisakh 2000 BS = 14 April 1943 AD
// We use a fixed UTC midnight epoch to avoid DST/timezone issues in conversion
const BS_EPOCH_AD = Date.UTC(1943, 3, 14); // April 14, 1943 UTC

// ─── NAME ARRAYS ────────────────────────────────────────────

export const BS_MONTHS = ['Baisakh','Jestha','Ashadh','Shrawan','Bhadra','Ashwin','Kartik','Mangsir','Poush','Magh','Falgun','Chaitra'];
export const BS_MONTHS_NP = ['बैशाख','जेठ','असार','श्रावण','भाद्र','आश्विन','कार्तिक','मंसिर','पौष','माघ','फाल्गुन','चैत्र'];
export const AD_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export const DAYS_OF_WEEK = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
export const DAYS_OF_WEEK_NP = ['आइतबार','सोमबार','मंगलबार','बुधबार','बिहीबार','शुक्रबार','शनिबार'];

// ─── BS CALENDAR FUNCTIONS ──────────────────────────────────

/**
 * Days in a given BS month
 */
export function daysInBsMonth(year, month) {
  return BD[year] ? BD[year][month - 1] : (month <= 7 ? 31 : 30);
}

// Precompute cumulative days from epoch to start of each BS year
const cumulativeDays = {};
(function buildCumulative() {
  let total = 0;
  for (let y = 2000; y <= 2090; y++) {
    cumulativeDays[y] = total;
    for (let m = 0; m < 12; m++) total += BD[y][m];
  }
})();

/**
 * Convert BS date → AD date
 * Returns { year, month, day } in Gregorian, or null if invalid
 */
export function bsToAd(bsYear, bsMonth, bsDay) {
  if (!BD[bsYear]) return null;
  if (bsDay < 1 || bsDay > daysInBsMonth(bsYear, bsMonth)) return null;

  let totalDays = cumulativeDays[bsYear] || 0;
  for (let m = 1; m < bsMonth; m++) {
    totalDays += daysInBsMonth(bsYear, m);
  }
  totalDays += bsDay - 1;

  // Add days to epoch using UTC to avoid timezone issues
  const adMs = BS_EPOCH_AD + totalDays * 86400000;
  const adDate = new Date(adMs);

  return {
    year: adDate.getUTCFullYear(),
    month: adDate.getUTCMonth() + 1,
    day: adDate.getUTCDate(),
  };
}

/**
 * Convert AD date → BS date
 * Returns { year, month, day } in Bikram Sambat, or null if out of range
 */
export function adToBs(adYear, adMonth, adDay) {
  // Calculate days from epoch using UTC
  const adMs = Date.UTC(adYear, adMonth - 1, adDay);
  const totalDays = Math.round((adMs - BS_EPOCH_AD) / 86400000);

  if (totalDays < 0) return null;

  let remaining = totalDays;
  let bsYear = 2000;
  let bsMonth = 1;
  let bsDay = 1;

  while (remaining > 0) {
    const monthDays = daysInBsMonth(bsYear, bsMonth);
    const daysLeftInMonth = monthDays - bsDay;

    if (remaining <= daysLeftInMonth) {
      bsDay += remaining;
      remaining = 0;
    } else {
      remaining -= (daysLeftInMonth + 1);
      bsMonth++;
      bsDay = 1;
      if (bsMonth > 12) {
        bsMonth = 1;
        bsYear++;
      }
    }
  }

  return { year: bsYear, month: bsMonth, day: bsDay };
}

// ─── NEPAL TIMEZONE FUNCTIONS ───────────────────────────────

/**
 * Get the current date/time in Nepal (Asia/Kathmandu, UTC+5:45)
 *
 * This is the authoritative "what time is it in Nepal?" function.
 * All components are extracted from the Intl formatter to avoid
 * any Date object timezone leakage.
 */
export function getNepalNow() {
  const now = new Date();
  const parts = {};
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
    weekday: 'long',
  });

  for (const { type, value } of formatter.formatToParts(now)) {
    parts[type] = parseInt(value, 10);
    if (type === 'weekday') parts.weekday = value;
  }

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hours: parts.hour === 24 ? 0 : parts.hour,
    minutes: parts.minute,
    seconds: parts.second,
    weekday: parts.weekday,
    timezone: 'Asia/Kathmandu',
    utcOffset: '+05:45',
  };
}

/**
 * Get today's BS date (Bikram Sambat)
 * Uses Nepal timezone as the source of truth.
 */
export function getTodayBs() {
  const nepal = getNepalNow();
  return adToBs(nepal.year, nepal.month, nepal.day);
}

/**
 * Get today's full date info (both AD and BS)
 */
export function getTodayInfo() {
  const nepal = getNepalNow();
  const bs = adToBs(nepal.year, nepal.month, nepal.day);

  return {
    // Gregorian (AD)
    adYear: nepal.year,
    adMonth: nepal.month,
    adDay: nepal.day,
    adMonthName: AD_MONTHS[nepal.month - 1],
    adDate: `${AD_MONTHS[nepal.month - 1]} ${nepal.day}, ${nepal.year}`,

    // Nepali (BS)
    bsYear: bs.year,
    bsMonth: bs.month,
    bsDay: bs.day,
    bsMonthName: BS_MONTHS[bs.month - 1],
    bsDate: `${bs.year} ${BS_MONTHS[bs.month - 1]} ${bs.day}`,

    // Time
    hours: nepal.hours,
    minutes: nepal.minutes,
    seconds: nepal.seconds,
    timeString: `${String(nepal.hours).padStart(2, '0')}:${String(nepal.minutes).padStart(2, '0')}:${String(nepal.seconds).padStart(2, '0')}`,

    // Day of week
    dayOfWeek: nepal.weekday,
    dayOfWeekNp: DAYS_OF_WEEK_NP[DAYS_OF_WEEK.indexOf(nepal.weekday)],

    // Timezone
    timezone: 'Asia/Kathmandu',
    utcOffset: '+05:45',
  };
}

/**
 * Format time as HH:MM:SS in Nepal timezone
 */
export function formatNepalTime() {
  const nepal = getNepalNow();
  return `${String(nepal.hours).padStart(2, '0')}:${String(nepal.minutes).padStart(2, '0')}:${String(nepal.seconds).padStart(2, '0')}`;
}

/**
 * Format date as a readable string
 */
export function formatNepalDate() {
  const info = getTodayInfo();
  return `${info.adDate} · ${info.dayOfWeek}`;
}
