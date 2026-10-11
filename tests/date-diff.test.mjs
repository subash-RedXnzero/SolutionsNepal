import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { bsToAd, adToBs, getDaysInBsMonth, getDaysInBsYear } from '../src/lib/nepal/calendar.js';

// Replicate the functions from the component
function isValidBsDate(year, month, day) {
  const days = getDaysInBsMonth(year, month);
  return days !== null && day >= 1 && day <= days;
}

function adDiffToTotalDays(startAd, endAd) {
  const msPerDay = 86400000;
  const startUtc = Date.UTC(startAd.year, startAd.month - 1, startAd.day);
  const endUtc = Date.UTC(endAd.year, endAd.month - 1, endAd.day);
  return Math.round((endUtc - startUtc) / msPerDay);
}

function bsCalendarDiff(sy, sm, sd, ey, em, ed) {
  let years = ey - sy;
  let months = em - sm;
  let days = ed - sd;

  if (days < 0) {
    months--;
    const borrowMonth = em - 1;
    const borrowYear = borrowMonth < 1 ? ey - 1 : ey;
    const actualBorrowMonth = borrowMonth < 1 ? 12 : borrowMonth;
    days += getDaysInBsMonth(borrowYear, actualBorrowMonth) || 30;
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  return { years, months, days };
}

describe('Date Difference Calculator', () => {
  it('1 BS year: 2082-01-01 → 2083-01-01', () => {
    const startAd = bsToAd(2082, 1, 1);
    const endAd = bsToAd(2083, 1, 1);
    const total = adDiffToTotalDays(startAd, endAd);
    const cal = bsCalendarDiff(2082, 1, 1, 2083, 1, 1);
    assert.equal(cal.years, 1);
    assert.equal(cal.months, 0);
    assert.equal(cal.days, 0);
    assert.ok(total > 0, `total days should be positive, got ${total}`);
  });

  it('1 month: 2082-01-01 → 2082-02-01', () => {
    const startAd = bsToAd(2082, 1, 1);
    const endAd = bsToAd(2082, 2, 1);
    const total = adDiffToTotalDays(startAd, endAd);
    const cal = bsCalendarDiff(2082, 1, 1, 2082, 2, 1);
    assert.equal(cal.years, 0);
    assert.equal(cal.months, 1);
    assert.equal(cal.days, 0);
    assert.ok(total > 0);
  });

  it('same date: 2082-01-01 → 2082-01-01', () => {
    const startAd = bsToAd(2082, 1, 1);
    const endAd = bsToAd(2082, 1, 1);
    const total = adDiffToTotalDays(startAd, endAd);
    const cal = bsCalendarDiff(2082, 1, 1, 2082, 1, 1);
    assert.equal(total, 0);
    assert.equal(cal.years, 0);
    assert.equal(cal.months, 0);
    assert.equal(cal.days, 0);
  });

  it('complex diff: 2082-03-15 → 2083-06-20', () => {
    const startAd = bsToAd(2082, 3, 15);
    const endAd = bsToAd(2083, 6, 20);
    const total = adDiffToTotalDays(startAd, endAd);
    const cal = bsCalendarDiff(2082, 3, 15, 2083, 6, 20);
    assert.equal(cal.years, 1);
    assert.equal(cal.months, 3);
    assert.equal(cal.days, 5);
    assert.ok(total > 0);
  });

  it('reversed dates yield negative total', () => {
    const startAd = bsToAd(2083, 1, 1);
    const endAd = bsToAd(2082, 1, 1);
    const total = adDiffToTotalDays(startAd, endAd);
    assert.ok(total < 0);
  });

  it('isValidBsDate validates correctly', () => {
    assert.equal(isValidBsDate(2082, 1, 1), true);
    assert.equal(isValidBsDate(2082, 1, 32), false); // Baisakh has 30 or 31 days
    assert.equal(isValidBsDate(2082, 13, 1), false); // no month 13
    assert.equal(isValidBsDate(2082, 0, 1), false);  // no month 0
  });

  it('AD mode: 2025-04-14 → 2026-04-14', () => {
    const startAd = { year: 2025, month: 4, day: 14 };
    const endAd = { year: 2026, month: 4, day: 14 };
    const total = adDiffToTotalDays(startAd, endAd);
    assert.equal(total, 365);
  });
});
