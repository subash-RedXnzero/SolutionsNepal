/**
 * Tests for the Nepali Age Calculator engine.
 *
 * Reference date: Aug 24, 2026 = BS 2083-05-08 (Monday)
 * This matches the anchor used in calendar.test.mjs.
 *
 * Run: node --test tests/age-calculator.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateAge,
  calculateAgeFromAdDate,
  isValidBsDate,
  isValidAdDate,
  getDayOfWeek,
  getDayOfWeekBs,
} from '../src/lib/calculators/age.js';

// Fixed "now" that maps to Aug 24, 2026 NPT = BS 2083-05-08
const NOW = new Date('2026-08-24T12:00:00Z');

// ────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────

const bs = (y, m, d) => ({ year: y, month: m, day: d });
const ad = (y, m, d) => ({ year: y, month: m, day: d });

// ────────────────────────────────────────────────────────────────────────
// Normal AD birth date
// ────────────────────────────────────────────────────────────────────────

test('normal AD birth date: born Aug 24, 2000 → exactly 26 years, 0 months, 0 days', () => {
  const result = calculateAgeFromAdDate(ad(2000, 8, 24), NOW);
  assert.equal(result.error, undefined);
  assert.equal(result.years, 26);
  assert.equal(result.months, 0);
  assert.equal(result.days, 0);
});

test('AD birth date: born Sep 1, 2000 → 25 years, 11 months, 23 days', () => {
  const result = calculateAgeFromAdDate(ad(2000, 9, 1), NOW);
  assert.equal(result.error, undefined);
  assert.equal(result.years, 25);
  assert.equal(result.months, 11);
  assert.equal(result.days, 23);
});

test('AD birth date: born Jan 15, 1990 → 36 years, 7 months, 9 days', () => {
  const result = calculateAgeFromAdDate(ad(1990, 1, 15), NOW);
  assert.equal(result.error, undefined);
  assert.equal(result.years, 36);
  assert.equal(result.months, 7);
  assert.equal(result.days, 9);
});

// ────────────────────────────────────────────────────────────────────────
// Leap year birth date
// ────────────────────────────────────────────────────────────────────────

test('leap year birth: born Feb 29, 2000 → valid age', () => {
  const result = calculateAgeFromAdDate(ad(2000, 2, 29), NOW);
  assert.equal(result.error, undefined);
  assert.ok(result.years >= 26);
  // Aug 24 is after Feb 29, so years = 26
  assert.equal(result.years, 26);
  assert.equal(result.months, 5);
  assert.equal(result.days, 26);
});

// ────────────────────────────────────────────────────────────────────────
// BS birth date
// ────────────────────────────────────────────────────────────────────────

test('BS birth date: BS 2060-01-01 → valid age with BS components', () => {
  // BS 2060-01-01 ≈ AD 2003-04-14
  const result = calculateAge(bs(2060, 1, 1), NOW);
  assert.equal(result.error, undefined);
  assert.ok(result.years >= 22);
  assert.equal(result.birthBs.year, 2060);
  assert.ok(result.birthAd);
});

test('BS birth date: BS 2055-09-15 → calculates BS age', () => {
  const result = calculateAge(bs(2055, 9, 15), NOW);
  assert.equal(result.error, undefined);
  assert.ok(result.yearsBs !== null, 'should have BS age');
  assert.ok(result.yearsBs >= 27);
});

// ────────────────────────────────────────────────────────────────────────
// Birthday today
// ────────────────────────────────────────────────────────────────────────

test('birthday today: born Aug 24, 2003 AD → exactly 23 years', () => {
  const result = calculateAgeFromAdDate(ad(2003, 8, 24), NOW);
  assert.equal(result.error, undefined);
  assert.equal(result.years, 23);
  assert.equal(result.months, 0);
  assert.equal(result.days, 0);
});

// ────────────────────────────────────────────────────────────────────────
// Birthday tomorrow
// ────────────────────────────────────────────────────────────────────────

test('birthday tomorrow: born Aug 25, 2003 AD → 22 years, 11 months, 30 days', () => {
  const result = calculateAgeFromAdDate(ad(2003, 8, 25), NOW);
  assert.equal(result.error, undefined);
  assert.equal(result.years, 22);
  assert.equal(result.months, 11);
  assert.equal(result.days, 30);
});

// ────────────────────────────────────────────────────────────────────────
// Invalid date
// ────────────────────────────────────────────────────────────────────────

test('invalid AD date returns error', () => {
  const result = calculateAgeFromAdDate(ad(2000, 13, 1), NOW);
  assert.ok(result.error);
});

test('invalid BS date returns error', () => {
  const result = calculateAge(bs(2000, 1, 32), NOW);
  assert.ok(result.error);
});

// ────────────────────────────────────────────────────────────────────────
// Future birth date
// ────────────────────────────────────────────────────────────────────────

test('future AD birth date returns error', () => {
  const result = calculateAgeFromAdDate(ad(2030, 1, 1), NOW);
  assert.equal(result.error, 'Please enter a valid date of birth.');
});

test('future BS birth date returns error', () => {
  const result = calculateAge(bs(2090, 6, 15), NOW);
  assert.equal(result.error, 'Please enter a valid date of birth.');
});

// ────────────────────────────────────────────────────────────────────────
// Month/day boundary
// ────────────────────────────────────────────────────────────────────────

test('born on Jan 31, 2000 → Feb calculation uses correct days', () => {
  const result = calculateAgeFromAdDate(ad(2000, 1, 31), NOW);
  assert.equal(result.error, undefined);
  assert.equal(result.years, 26);
  assert.equal(result.months, 6);
  assert.equal(result.days, 24);
});

test('born on last day of month → age months calculation is correct', () => {
  // Born Aug 31, 2001; today Aug 24, 2026
  // Aug 31 hasn't occurred yet in Aug 2026, so birthday is Aug 31, 2026
  // Age should be 24 years, 11 months, 24 days
  const result = calculateAgeFromAdDate(ad(2001, 8, 31), NOW);
  assert.equal(result.error, undefined);
  assert.equal(result.years, 24);
  assert.equal(result.months, 11);
  assert.equal(result.days, 24);
});

// ────────────────────────────────────────────────────────────────────────
// BS → AD conversion in result
// ────────────────────────────────────────────────────────────────────────

test('result includes correct BS and AD birth dates', () => {
  const result = calculateAge(bs(2055, 5, 10), NOW);
  assert.equal(result.error, undefined);
  assert.deepEqual(result.birthBs, bs(2055, 5, 10));
  assert.ok(result.birthAd);
  assert.ok(result.birthAd.year >= 1998 && result.birthAd.year <= 1999);
});

test('result includes today in both AD and BS', () => {
  const result = calculateAgeFromAdDate(ad(2000, 8, 24), NOW);
  assert.deepEqual(result.todayAd, ad(2026, 8, 24));
  assert.deepEqual(result.todayBs, bs(2083, 5, 8));
});

// ────────────────────────────────────────────────────────────────────────
// Next birthday
// ────────────────────────────────────────────────────────────────────────

test('next birthday tomorrow: 1 day until', () => {
  const result = calculateAgeFromAdDate(ad(2003, 8, 25), NOW);
  assert.equal(result.nextBirthdayDaysUntil, 1);
  assert.deepEqual(result.nextBirthdayAd, ad(2026, 8, 25));
});

test('next birthday today: 365/366 days until next year', () => {
  const result = calculateAgeFromAdDate(ad(2000, 8, 24), NOW);
  // Birthday is today, so next one is in 2027 (next year)
  assert.equal(result.nextBirthdayAd.year, 2027);
  assert.ok(result.nextBirthdayDaysUntil > 360);
});

test('next birthday in a few days', () => {
  const result = calculateAgeFromAdDate(ad(2000, 8, 30), NOW);
  assert.equal(result.nextBirthdayDaysUntil, 6);
  assert.deepEqual(result.nextBirthdayAd, ad(2026, 8, 30));
});

// ────────────────────────────────────────────────────────────────────────
// Total days
// ────────────────────────────────────────────────────────────────────────

test('total days is correct', () => {
  const result = calculateAgeFromAdDate(ad(2000, 8, 24), NOW);
  // Aug 24 2000 → Aug 24 2026 = exactly 26 years
  // 26 * 365 + 6 leap days (2004,2008,2012,2016,2020,2024) = 9496
  assert.equal(result.totalDays, 9496);
});

test('total days for a recent birth', () => {
  const result = calculateAgeFromAdDate(ad(2026, 8, 20), NOW);
  assert.equal(result.totalDays, 4);
});

// ────────────────────────────────────────────────────────────────────────
// Day of week
// ────────────────────────────────────────────────────────────────────────

test('day of birth weekday is correct', () => {
  // Aug 24, 2000 is a Thursday
  const result = calculateAgeFromAdDate(ad(2000, 8, 24), NOW);
  assert.equal(result.dayOfWeekBirth, 'Thursday');
});

// ────────────────────────────────────────────────────────────────────────
// Validation functions
// ────────────────────────────────────────────────────────────────────────

test('isValidBsDate validates correctly', () => {
  assert.equal(isValidBsDate(2080, 5, 15), true);
  assert.equal(isValidBsDate(2080, 1, 32), false); // too many days
  assert.equal(isValidBsDate(2080, 13, 1), false); // invalid month
  assert.equal(isValidBsDate(1999, 1, 1), false);  // year too low
  assert.equal(isValidBsDate(2080, 0, 1), false);  // month 0
});

test('isValidAdDate validates correctly', () => {
  assert.equal(isValidAdDate(2000, 8, 24), true);
  assert.equal(isValidAdDate(2000, 2, 30), false); // Feb 30 invalid
  assert.equal(isValidAdDate(2000, 13, 1), false); // invalid month
  assert.equal(isValidAdDate(1943, 1, 1), false);  // year too low
});

// ────────────────────────────────────────────────────────────────────────
// Weekday helper
// ────────────────────────────────────────────────────────────────────────

test('getDayOfWeek returns correct day', () => {
  // Apr 14, 1943 is a Wednesday (BS 2000-01-01)
  assert.equal(getDayOfWeek(1943, 4, 14), 'Wednesday');
  // Aug 24, 2026 is a Monday
  assert.equal(getDayOfWeek(2026, 8, 24), 'Monday');
});

test('getDayOfWeekBs converts and returns correct day', () => {
  // BS 2083-01-01 = Apr 14, 2026 = Tuesday (New Year)
  const day = getDayOfWeekBs(2083, 1, 1);
  assert.equal(day, 'Tuesday');
});
