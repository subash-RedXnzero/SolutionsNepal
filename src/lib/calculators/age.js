/**
 * Nepali Age Calculator engine.
 *
 * Calculates exact age in years, months, and days from a date of birth
 * using proper calendar arithmetic. Supports both BS (Bikram Sambat)
 * and AD (Gregorian) birth dates.
 *
 * All logic runs client-side — no data is sent to any server.
 */

import {
  todayInNepal,
  bsToAd,
  adToBs,
  getDaysInBsMonth,
} from '../nepal/calendar.js';

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Get the weekday name for an AD date.
 */
export function getDayOfWeek(adYear, adMonth, adDay) {
  const d = new Date(Date.UTC(adYear, adMonth - 1, adDay));
  return WEEKDAY_NAMES[d.getUTCDay()];
}

/**
 * Get the weekday name for a BS date (converts to AD first).
 */
export function getDayOfWeekBs(bsYear, bsMonth, bsDay) {
  const ad = bsToAd(bsYear, bsMonth, bsDay);
  if (!ad) return null;
  return getDayOfWeek(ad.year, ad.month, ad.day);
}

/**
 * Days in a given Gregorian month.
 */
function daysInGregorianMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

/**
 * Days in a BS month with fallback.
 */
function daysInBsMonthSafe(bsYear, bsMonth) {
  const d = getDaysInBsMonth(bsYear, bsMonth);
  return d || 30;
}

/**
 * Calculate age given an AD birth date and a reference AD date (today).
 *
 * @param {{ year: number, month: number, day: number }} birth
 * @param {{ year: number, month: number, day: number }} today
 * @returns {{ years: number, months: number, days: number }}
 */
function computeAdAge(birth, today) {
  let years = today.year - birth.year;
  let months = today.month - birth.month;
  let days = today.day - birth.day;

  if (days < 0) {
    months--;
    const prevMonth = today.month === 1 ? 12 : today.month - 1;
    const prevYear = today.month === 1 ? today.year - 1 : today.year;
    days += daysInGregorianMonth(prevYear, prevMonth);
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  return { years, months, days };
}

/**
 * Calculate age given a BS birth date and a reference BS date (today).
 *
 * @param {{ year: number, month: number, day: number }} birthBs
 * @param {{ year: number, month: number, day: number }} todayBs
 * @returns {{ years: number, months: number, days: number }}
 */
function computeBsAge(birthBs, todayBs) {
  let years = todayBs.year - birthBs.year;
  let months = todayBs.month - birthBs.month;
  let days = todayBs.day - birthBs.day;

  if (days < 0) {
    months--;
    const prevMonth = todayBs.month === 1 ? 12 : todayBs.month - 1;
    const prevYear = todayBs.month === 1 ? todayBs.year - 1 : todayBs.year;
    days += daysInBsMonthSafe(prevYear, prevMonth);
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  return { years, months, days };
}

/**
 * Total days between two AD dates.
 */
function totalDaysBetween(a, b) {
  const msPerDay = 86400000;
  const aUtc = Date.UTC(a.year, a.month - 1, a.day);
  const bUtc = Date.UTC(b.year, b.month - 1, b.day);
  return Math.floor((bUtc - aUtc) / msPerDay);
}

/**
 * Calculate next birthday info.
 */
function computeNextBirthday(birthAd, todayAd) {
  const msPerDay = 86400000;
  const todayUtc = Date.UTC(todayAd.year, todayAd.month - 1, todayAd.day);

  let nextBdAd = { year: todayAd.year, month: birthAd.month, day: birthAd.day };
  let nextBdUtc = Date.UTC(nextBdAd.year, nextBdAd.month - 1, nextBdAd.day);

  if (nextBdUtc <= todayUtc) {
    nextBdAd = { year: todayAd.year + 1, month: birthAd.month, day: birthAd.day };
    nextBdUtc = Date.UTC(nextBdAd.year, nextBdAd.month - 1, nextBdAd.day);
  }

  const daysUntil = Math.ceil((nextBdUtc - todayUtc) / msPerDay);
  const nextBirthdayBs = adToBs(nextBdAd.year, nextBdAd.month, nextBdAd.day);

  return { nextBirthdayAd: nextBdAd, nextBirthdayBs, daysUntil };
}

/**
 * Build the full result object from a resolved birthAd and todayInfo.
 */
function buildResult(birthAd, todayInfo, birthBs) {
  const todayAd = todayInfo.ad;
  const todayBs = todayInfo.bs;

  // Age
  const ageAd = computeAdAge(birthAd, todayAd);
  const ageBs = (birthBs && todayBs) ? computeBsAge(birthBs, todayBs) : null;

  // Total days
  const totalDays = totalDaysBetween(birthAd, todayAd);

  // Day of birth
  const dayOfWeekBirth = getDayOfWeek(birthAd.year, birthAd.month, birthAd.day);

  // Next birthday
  const nextBday = computeNextBirthday(birthAd, todayAd);

  return {
    years: ageAd.years,
    months: ageAd.months,
    days: ageAd.days,
    yearsBs: ageBs?.years ?? null,
    monthsBs: ageBs?.months ?? null,
    daysBs: ageBs?.days ?? null,
    birthBs: birthBs || (birthAd ? adToBs(birthAd.year, birthAd.month, birthAd.day) : null),
    birthAd,
    todayAd,
    todayBs,
    totalDays,
    dayOfWeekBirth,
    nextBirthdayAd: nextBday.nextBirthdayAd,
    nextBirthdayBs: nextBday.nextBirthdayBs,
    nextBirthdayDaysUntil: nextBday.daysUntil,
  };
}

/**
 * Main entry: calculate age from a BS birth date.
 *
 * @param {{ year: number, month: number, day: number }} birthBs - BS birth date
 * @param {Date} [now] - injectable clock for tests
 * @returns {object} complete age result or { error: string }
 */
export function calculateAge(birthBs, now) {
  const today = todayInNepal(now);

  // Convert BS birth to AD
  const birthAd = bsToAd(birthBs.year, birthBs.month, birthBs.day);
  if (!birthAd) return { error: 'Invalid birth date.' };

  // Future check
  const birthUtc = Date.UTC(birthAd.year, birthAd.month - 1, birthAd.day);
  const todayUtc = Date.UTC(today.ad.year, today.ad.month - 1, today.ad.day);
  if (birthUtc > todayUtc) return { error: 'Please enter a valid date of birth.' };

  return buildResult(birthAd, today, birthBs);
}

/**
 * Calculate age from an AD birth date.
 *
 * @param {{ year: number, month: number, day: number }} birthAd - AD birth date
 * @param {Date} [now] - injectable clock for tests
 * @returns {object} complete age result or { error: string }
 */
export function calculateAgeFromAdDate(birthAd, now) {
  const today = todayInNepal(now);

  // Validate input
  if (!isValidAdDate(birthAd.year, birthAd.month, birthAd.day)) {
    return { error: 'Invalid birth date.' };
  }

  // Future check
  const birthUtc = Date.UTC(birthAd.year, birthAd.month - 1, birthAd.day);
  const todayUtc = Date.UTC(today.ad.year, today.ad.month - 1, today.ad.day);
  if (birthUtc > todayUtc) return { error: 'Please enter a valid date of birth.' };

  // Convert to BS
  const birthBs = adToBs(birthAd.year, birthAd.month, birthAd.day);

  return buildResult(birthAd, today, birthBs);
}

/**
 * Validate a BS date.
 */
export function isValidBsDate(year, month, day) {
  if (year < 2000 || year > 2090) return false;
  if (month < 1 || month > 12) return false;
  const maxDay = getDaysInBsMonth(year, month);
  return day >= 1 && day <= (maxDay || 0);
}

/**
 * Validate an AD date.
 */
export function isValidAdDate(year, month, day) {
  if (year < 1944 || year > 2030) return false;
  if (month < 1 || month > 12) return false;
  const maxDay = daysInGregorianMonth(year, month);
  return day >= 1 && day <= maxDay;
}

export { WEEKDAY_NAMES };
