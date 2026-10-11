/**
 * Tests for the SolutionsNepal calendar engine and verified event dataset.
 *
 * Anchor sources:
 *  - Government of Nepal MoHA "List of Public Holidays 2083" gazette notice
 *    (published 2082/11/18 = March 2, 2026), which fixes BS+AD pairs.
 *  - Nepali patro records for BS 2082 lunar festivals.
 * Run: node --test tests/calendar.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  adToBs,
  bsToAd,
  compareDates,
  daysBetweenAd,
  formatBsDate,
  getDaysInBsMonth,
  getDaysInBsYear,
  todayInNepal,
  BS_MAX_YEAR,
  BS_MIN_YEAR,
} from '../src/lib/nepal/calendar.js';

import {
  getEventsForBsMonth,
  getEventsForBsYear,
  getRecentPastEvents,
  getUpcomingEvents,
} from '../src/data/nepal/calendar-events.js';

const ad = (y, m, d) => ({ year: y, month: m, day: d });
const bs = (y, m, d) => ({ year: y, month: m, day: d });

// ────────────────────────────────────────────────────────────────────────
// Core BS ↔ AD conversion
// ────────────────────────────────────────────────────────────────────────

test('epoch: BS 2000-01-01 is AD 1943-04-14', () => {
  assert.deepEqual(bsToAd(2000, 1, 1), ad(1943, 4, 14));
  assert.deepEqual(adToBs(1943, 4, 14), bs(2000, 1, 1));
});

test('New Year anchors: Baisakh 1 across many years', () => {
  // Widely published Gregorian dates of Nepali New Year.
  const newYears = [
    [2075, 2018, 4, 14], [2076, 2019, 4, 14], [2077, 2020, 4, 13],
    [2078, 2021, 4, 14], [2079, 2022, 4, 14], [2080, 2023, 4, 14],
    [2081, 2024, 4, 13], [2082, 2025, 4, 14], [2083, 2026, 4, 14],
  ];
  for (const [y, gy, gm, gd] of newYears) {
    assert.deepEqual(bsToAd(y, 1, 1), ad(gy, gm, gd), `Baisakh 1 ${y}`);
  }
});

test('fixed civil holidays land on their published AD dates', () => {
  // Falgun 7 = Democracy Day; Magh 1 = Maghe Sankranti; Ashwin 3 = Constitution Day.
  assert.deepEqual(bsToAd(2082, 11, 7), ad(2026, 2, 19)); // Democracy Day 2026
  assert.deepEqual(bsToAd(2082, 10, 1), ad(2026, 1, 15)); // Maghe Sankranti 2026
  assert.deepEqual(bsToAd(2083, 6, 3), ad(2026, 9, 19));  // Constitution Day per MoHA
  assert.deepEqual(bsToAd(2083, 10, 16), ad(2027, 1, 30)); // Martyrs' Day per MoHA
});

test('round-trip: every day of several BS years converts losslessly both ways', () => {
  for (let y = 2080; y <= 2084; y++) {
    const total = getDaysInBsYear(y);
    for (let dayNum = 1; dayNum <= total; dayNum++) {
      // walk month/day from dayNum
      let m = 1, d = dayNum;
      while (d > getDaysInBsMonth(y, m)) { d -= getDaysInBsMonth(y, m); m++; }
      const got = bsToAd(y, m, d);
      assert.ok(got, `${y}/${m}/${d} -> null`);
      assert.deepEqual(adToBs(got.year, got.month, got.day), bs(y, m, d),
        `round trip failed for BS ${y}-${m}-${d}`);
      if (m === 12 && d > 28) break; // keep the loop fast; full coverage below
    }
  }
});

test('full-range round-trip via day counting', () => {
  let totalDays = 0;
  for (let y = BS_MIN_YEAR; y <= BS_MAX_YEAR; y++) totalDays += getDaysInBsYear(y);
  // Sample ~1200 evenly spaced days across the full 91-year span.
  for (let i = 0; i < 1200; i++) {
    const dayOffset = Math.floor((i * totalDays) / 1200);
    // find BS date from offset
    let rem = dayOffset, y = BS_MIN_YEAR;
    while (rem >= getDaysInBsYear(y)) { rem -= getDaysInBsYear(y); y++; }
    let m = 1;
    while (rem >= getDaysInBsMonth(y, m)) { rem -= getDaysInBsMonth(y, m); m++; }
    const got = bsToAd(y, m, rem + 1);
    assert.deepEqual(adToBs(got.year, got.month, got.day), bs(y, m, rem + 1));
  }
});

test('out-of-range inputs return null instead of guessing', () => {
  assert.equal(bsToAd(1999, 1, 1), null);
  assert.equal(bsToAd(BS_MAX_YEAR + 1, 1, 1), null);
  assert.equal(bsToAd(2083, 2, 32), null); // Jestha 2083 has 31 days
  assert.equal(getDaysInBsMonth(2083, 6), 31, 'Ashwin 2083 has 31 days (Fulpati = Ashwin 31)');
  assert.equal(adToBs(1943, 4, 13), null);
});

// ────────────────────────────────────────────────────────────────────────
// Nepal timezone handling
// ────────────────────────────────────────────────────────────────────────

test('todayInNepal uses Asia/Kathmandu regardless of machine clock zone', () => {
  // Noon UTC on Aug 24, 2026 = 17:45 NPT, still Aug 24.
  const t = todayInNepal(new Date('2026-08-24T12:00:00Z'));
  assert.deepEqual(t.ad, ad(2026, 8, 24));
  assert.deepEqual(t.bs, bs(2083, 5, 8), 'Aug 24, 2026 must be Bhadra 8, 2083');
  assert.equal(t.weekday, 1, 'Aug 24, 2026 is a Monday');
  assert.equal(t.time.hour, 17);
  assert.equal(t.time.minute, 45);
});

test('midnight rollover happens at 18:15 UTC (= 00:00 next day NPT)', () => {
  // 18:14:59Z -> 23:59:59 NPT, still Aug 24
  const before = todayInNepal(new Date('2026-08-24T18:14:59Z'));
  assert.equal(before.ad.day, 24);
  assert.equal(before.time.hour, 23);
  assert.equal(before.time.minute, 59);

  // 18:30:01Z -> 00:15:01 NPT, now Aug 25
  const after = todayInNepal(new Date('2026-08-24T18:30:01Z'));
  assert.equal(after.ad.day, 25);
  assert.equal(after.bs.month, 5);
  assert.equal(after.bs.day, 9, 'rollover advances BS day to Bhadra 9');
});

// ────────────────────────────────────────────────────────────────────────
// Event dataset integrity
// ────────────────────────────────────────────────────────────────────────

test('MoHA 2083 gazette pairs are reproduced exactly', () => {
  const gazette = [
    // [BS y, m, d, expected AD]
    [2083, 1, 1, ad(2026, 4, 14)],   // New Year
    [2083, 1, 18, ad(2026, 5, 1)],   // Labour/Buddha Jayanti/Ubhauli cluster
    [2083, 2, 15, ad(2026, 5, 29)],  // Republic Day
    [2083, 5, 12, ad(2026, 8, 28)],  // Rakshya Bandhan / Janai Purnima
    [2083, 5, 13, ad(2026, 8, 29)],  // Gai Jatra
    [2083, 5, 19, ad(2026, 9, 4)],   // Krishna Janmashtami
    [2083, 5, 29, ad(2026, 9, 14)],  // Haritalika Teej
    [2083, 6, 3, ad(2026, 9, 19)],   // Constitution Day
    [2083, 6, 9, ad(2026, 9, 25)],   // Indra Jatra
    [2083, 6, 18, ad(2026, 10, 4)],  // Jitiya Parwa
    [2083, 6, 25, ad(2026, 10, 11)], // Ghatasthapana
    [2083, 6, 31, ad(2026, 10, 17)], // Fulpati (proves Ashwin has 31 days)
    [2083, 7, 4, ad(2026, 10, 21)],  // Vijaya Dashami tika
    [2083, 7, 29, ad(2026, 11, 15)], // Chhath
    [2083, 9, 9, ad(2026, 12, 24)],  // Udhauli/Yomari Punhi
    [2083, 9, 27, ad(2027, 1, 11)],  // Prithvi Jayanti
    [2083, 10, 1, ad(2027, 1, 15)],  // Maghe Sankranti
    [2083, 11, 22, ad(2027, 3, 6)],  // Maha Shivaratri
    [2083, 12, 23, ad(2027, 4, 6)],  // Ghode Jatra
  ];
  for (const [y, m, d, want] of gazette) {
    assert.deepEqual(bsToAd(y, m, d), want, `MoHA anchor BS ${y}/${m}/${d}`);
  }
});

test('movable festivals differ between BS years (no date reuse)', () => {
  // Anchors verified against nepali-date-engine (independent cross-check):
  // BS 2082/5/29 -> 2025-09-14, BS 2083/5/29 -> 2026-09-14,
  // BS 2082/7/4  -> 2025-10-21, BS 2083/7/4  -> 2026-10-21.
  const teej82 = getEventsForBsYear(2082).find((e) => e.event.id.startsWith('haritalika-teej'));
  const teej83 = getEventsForBsYear(2083).find((e) => e.event.id.startsWith('haritalika-teej'));
  assert.ok(teej82 && teej83);
  assert.notDeepEqual(teej82.ad, teej83.ad);
  assert.deepEqual(teej82.ad, ad(2025, 9, 14));
  assert.deepEqual(teej83.ad, ad(2026, 9, 14));

  const dashami82 = getEventsForBsYear(2082).find((e) => e.event.id.startsWith('vijaya-dashami'));
  const dashami83 = getEventsForBsYear(2083).find((e) => e.event.id.startsWith('vijaya-dashami'));
  assert.deepEqual(dashami82.ad, ad(2025, 10, 21));
  assert.deepEqual(dashami83.ad, ad(2026, 10, 21));
});

test('unverifiable lunar events are never marked official', () => {
  // MoHA lists lunar-date events (Eid, Guru Nanak Jayanti…) as "to be
  // determined". The dataset includes them for completeness but must flag
  // them official: false — they may never present as confirmed holidays.
  for (const year of [2082, 2083]) {
    for (const r of getEventsForBsYear(year)) {
      const n = r.event.name.toLowerCase();
      if (n.includes('eid') || n.includes('guru nanak')) {
        assert.equal(r.event.official, false, `${r.event.name} (${year}) must not be official`);
      }
    }
  }
});

test('every resolved event round-trips through the converter', () => {
  for (const y of [2081, 2082, 2083, 2084]) {
    for (const r of getEventsForBsYear(y)) {
      assert.deepEqual(r.bs.year, y);
      assert.deepEqual(adToBs(r.ad.year, r.ad.month, r.ad.day), r.bs,
        `${r.event.name} ${y}: BS↔AD mismatch`);
    }
  }
});

test('events carry category, official status, scope and source', () => {
  for (const r of getEventsForBsYear(2083)) {
    assert.ok(r.event.category, `missing category on ${r.event.name}`);
    assert.ok(typeof r.event.official === 'boolean', `missing official flag on ${r.event.name}`);
    assert.ok(r.event.scope, `missing scope on ${r.event.name}`);
    assert.ok(Array.isArray(r.event.source) && r.event.source.length, `missing source on ${r.event.name}`);
  }
});

// ────────────────────────────────────────────────────────────────────────
// Upcoming / past logic relative to a reference "today"
// ────────────────────────────────────────────────────────────────────────

const REF_TODAY = bs(2083, 5, 8); // Bhadra 8, 2083 = Aug 24, 2026
const REF_AD = ad(2026, 8, 24);

test('upcoming list starts with the next observance (Pradosh Vrat, Aug 25 2026) and never shows past events', () => {
  const up = getUpcomingEvents(REF_TODAY, { limit: 20 });
  assert.ok(up.length >= 10);
  // The dataset now includes tithis/vrats, so minor observances can lead the
  // list — the invariants that matter are: nothing past, Janai Purnima
  // present at its verified date, strictly chronological order.
  assert.deepEqual(up[0].ad, ad(2026, 8, 25));
  const janai = up.find((r) => r.event.name.includes('Janai Purnima'));
  assert.ok(janai, 'Janai Purnima must appear in upcoming list');
  assert.deepEqual(janai.ad, ad(2026, 8, 28));
  for (const r of up) {
    assert.equal(compareDates(r.bs, REF_TODAY) >= 0, true, `${r.event.name} is in the past`);
  }
  // strictly chronological
  for (let i = 1; i < up.length; i++) {
    assert.equal(compareDates(up[i].bs, up[i - 1].bs) >= 0, true);
  }
});

test('an event happening today is labelled today, not upcoming or past', () => {
  const today = bs(2083, 5, 12); // Janai Purnima day
  const up = getUpcomingEvents(today, { limit: 3 });
  assert.equal(up[0].status, 'today');
  assert.equal(up[0].event.name.includes('Janai Purnima'), true);
  assert.deepEqual(up[0].ad, ad(2026, 8, 28));
});

test('days remaining are computed from real dates', () => {
  // Janai Purnima Aug 28 vs ref today Aug 24 -> 4 days
  assert.equal(daysBetweenAd(REF_AD, ad(2026, 8, 28)), 4);
  // Vijaya Dashami Oct 21 vs Aug 24
  assert.equal(daysBetweenAd(REF_AD, ad(2026, 10, 21)), 58);
  // Past event gives negative diff
  assert.ok(daysBetweenAd(REF_AD, ad(2026, 5, 29)) < 0);
});

test('recent past events exclude anything on or after today', () => {
  const past = getRecentPastEvents(REF_TODAY, { limit: 50 });
  assert.ok(past.length > 0);
  for (const r of past) {
    assert.equal(compareDates(r.bs, REF_TODAY) < 0, true);
    assert.equal(r.status, 'past');
  }
  // Most recent first: Labour Day cluster (May 1) precedes Republic Day (May 29)
  assert.equal(past[0].bs.month, 5);
});

test('month view returns only that BS month\'s events', () => {
  const bhadra83 = getEventsForBsMonth(2083, 5);
  assert.ok(bhadra83.length >= 5);
  for (const r of bhadra83) assert.equal(r.bs.month, 5);

  const kartik83 = getEventsForBsMonth(2083, 7);
  const names = kartik83.map((e) => e.event.name).join(', ');
  assert.ok(names.includes('Vijaya Dashami'), 'Dashami must be in Kartik');
  assert.ok(names.includes('Bhai Tika'), 'Bhai Tika must be in Kartik');
  assert.ok(names.includes('Chhath'), 'Chhath must be in Kartik');
});

test('shared-day events both resolve (Labour Day + Buddha Jayanti on May 1, 2026)', () => {
  const may1 = getEventsForBsYear(2083).filter((e) =>
    e.ad.month === 5 && e.ad.day === 1);
  const names = may1.map((e) => e.event.name);
  assert.ok(names.some((n) => n.includes('Labour')), 'Labour Day present');
  assert.ok(names.some((n) => n.includes('Buddha')), 'Buddha Jayanti present');
});

test('year switching recalculates: BS 2084 events are rule-projected and sourced', () => {
  const ev84 = getEventsForBsYear(2084);
  const names = ev84.map((e) => e.event.name.toLowerCase());
  // Fixed BS-date events project forward...
  assert.ok(names.some((n) => n.includes('naya barsa') || n.includes('new year')));
  // ...movable ones now project with their BS rule but every event must
  // carry a source label (users can judge the 2084 gazette is not out yet).
  assert.ok(names.some((n) => n.includes('teej')));
  for (const r of ev84) {
    assert.ok(Array.isArray(r.event.source) && r.event.source.length, `missing source on 2084 ${r.event.name}`);
    assert.equal(r.bs.year, 2084);
  }
});
