/**
 * Tests for the wttr.in backup-provider adapter (pure functions).
 * These run without a browser or network, using a small wttr.in-shaped fixture.
 *
 * Run: node --test tests/weather-live.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { wwoToWmo, wttrToRow, weatherFromLive } from '../src/lib/nepal/weather.js';

// ── wwoToWmo ────────────────────────────────────────────────────────

test('wwoToWmo: maps common codes to WMO equivalents', () => {
  assert.equal(wwoToWmo(113), 0); // clear
  assert.equal(wwoToWmo(116), 2); // partly cloudy
  assert.equal(wwoToWmo(119), 3); // cloudy
  assert.equal(wwoToWmo(143), 45); // fog
  assert.equal(wwoToWmo(176), 80); // patchy rain
  assert.equal(wwoToWmo(299), 61); // moderate rain
  assert.equal(wwoToWmo(200), 95); // thunder
  assert.equal(wwoToWmo(179), 71); // snow
});

test('wwoToWmo: accepts string codes, defaults unknown to cloudy', () => {
  assert.equal(wwoToWmo('113'), 0);
  assert.equal(wwoToWmo(9999), 3);
  assert.equal(wwoToWmo(undefined), 3);
});

// ── wttrToRow ───────────────────────────────────────────────────────

const FIXTURE = {
  current_condition: [{
    temp_C: '23', FeelsLikeC: '25', humidity: '54', weatherCode: '116',
    cloudcover: '36', windspeedKmph: '9', winddirDegree: '305',
    precipMM: '0.0', visibility: '10', uvIndex: '8',
  }],
  weather: [{
    date: '2026-10-11',
    maxtempC: '23', mintempC: '11', uvIndex: '8',
    astronomy: [{ sunrise: '06:01 AM', sunset: '05:39 PM' }],
    hourly: [
      { time: '1200', tempC: '23', weatherCode: '116', chanceofrain: '5', visibility: '10', uvIndex: '8' },
      { time: '1500', tempC: '21', weatherCode: '299', chanceofrain: '40', visibility: '10', uvIndex: '2' },
    ],
  }],
};

test('wttrToRow: maps current conditions to Open-Meteo row shape', () => {
  const row = wttrToRow(FIXTURE);
  assert.ok(row);
  assert.equal(row.current.temperature_2m, 23);
  assert.equal(row.current.apparent_temperature, 25);
  assert.equal(row.current.relative_humidity_2m, 54);
  assert.equal(row.current.weather_code, 2);
  assert.equal(row.current.wind_speed_10m, 9);
  assert.equal(row.current.precipitation, 0);
});

test('wttrToRow: builds hourly ISO times and converts visibility to meters', () => {
  const row = wttrToRow(FIXTURE);
  assert.deepEqual(row.hourly.time, ['2026-10-11T12:00', '2026-10-11T15:00']);
  assert.deepEqual(row.hourly.temp, [23, 21]);
  assert.deepEqual(row.hourly.code, [2, 61]);
  assert.deepEqual(row.hourly.visM, [10000, 10000]);
});

test('wttrToRow: builds daily rows with ISO sunrise/sunset', () => {
  const row = wttrToRow(FIXTURE);
  assert.deepEqual(row.daily.time, ['2026-10-11']);
  assert.deepEqual(row.daily.temperature_2m_max, [23]);
  assert.deepEqual(row.daily.temperature_2m_min, [11]);
  assert.deepEqual(row.daily.weather_code, [2]); // midday entry
  assert.deepEqual(row.daily.precipitation_probability_max, [40]);
  assert.deepEqual(row.daily.sunrise, ['2026-10-11T06:01']);
  assert.deepEqual(row.daily.sunset, ['2026-10-11T17:39']);
});

test('wttrToRow: returns null on garbage input', () => {
  assert.equal(wttrToRow(null), null);
  assert.equal(wttrToRow({}), null);
  assert.equal(wttrToRow({ current_condition: [], weather: [] }), null);
});

test('weatherFromLive: accepts an adapted wttr.in row', () => {
  const bundle = weatherFromLive('kathmandu', wttrToRow(FIXTURE), undefined);
  assert.ok(bundle);
  assert.equal(bundle.today.temp, 23);
  assert.equal(bundle.today.cond.k, 'partly');
  assert.ok(bundle.hourly.length >= 1);
  assert.equal(bundle.daily.length, 1);
  assert.equal(bundle.daily[0].hi, 23);
  assert.equal(bundle.updated.live, true);
});
