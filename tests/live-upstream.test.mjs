/**
 * Tests for the shared live-price upstream parsers.
 * Run: node --test tests/live-upstream.test.mjs
 *
 * These parsers feed BOTH scripts/fetch-live-data.mjs (build time) and
 * src/worker.js (/api/live/* at the edge), so regressions here break
 * post-hosting freshness on every price page.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  parseMetalsRows,
  parseFuelHtml,
  parseFuelRecords,
  normalizeForexRates,
  fetchMetalsUpstream,
  fetchFuelUpstream,
  fetchForexUpstream,
  toNepalDate,
} from '../src/lib/nepal/live-upstream.js';

// ── FENEGOSIDA fixtures (field names mirror the real API, typos included) ──
const FENE_ROWS = [
  { rateType: 'छापावाल सुन (१ तोला)', todayBaseRatePerGram: 245000, yestardayBaseRatePerGram: 244200, todayDate: '2026-10-14' },
  { rateType: 'असली चाँदी (१ तोला)', todayBaseRatePerGram: 3120, yestardayBaseRatePerGram: 3100, todayDate: '2026-10-14' },
  { rateType: 'तेजावी सुन (१ तोला)', todayBaseRatePerGram: 243000, yestardayBaseRatePerGram: 242500, todayDate: '2026-10-14' },
];

test('parseMetalsRows picks fine gold + silver per tola', () => {
  const out = parseMetalsRows(FENE_ROWS);
  assert.equal(out.gold.pricePerTola, 245000);
  assert.equal(out.gold.yesterdayPricePerTola, 244200);
  assert.equal(out.silver.pricePerTola, 3120);
  assert.equal(out.silver.yesterdayPricePerTola, 3100);
  assert.equal(out.date, '2026-10-14');
});

test('parseMetalsRows tolerates a missing metal', () => {
  const out = parseMetalsRows([FENE_ROWS[0]]);
  assert.equal(out.gold.pricePerTola, 245000);
  assert.equal(out.silver, null);
});

test('parseMetalsRows throws on garbage', () => {
  assert.throws(() => parseMetalsRows(null), /unexpected shape/);
  assert.throws(() => parseMetalsRows([]), /not found/);
  assert.throws(() => parseMetalsRows([{ rateType: 'nope' }]), /not found/);
});

// ── NOC ticker fixture ──
const NOC_HTML = `
  <div class="ticker">&nbsp;(Charali, Biratnagar, Birgunj) Petrol(MS):NRs&nbsp;182.50/L • Diesel(HSD):NRs&nbsp;175.50/L • Kerosene(SKO):NRs&nbsp;175.50/L</div>
  <div class="ticker">(Kathmandu, Pokhara) Petrol(MS):NRs 184/L • Diesel(HSD):NRs 177/L • Kerosene(SKO):NRs 177/L</div>
  <div>LP Gas:NRs 1910</div>
`;

test('parseFuelHtml maps regions to cities + LPG', () => {
  const out = parseFuelHtml(NOC_HTML);
  assert.equal(out.byCity.kathmandu.petrol, 184);
  assert.equal(out.byCity.kathmandu.diesel, 177);
  assert.equal(out.byCity.kathmandu.kerosene, 177);
  assert.equal(out.byCity.pokhara.petrol, 184);
  assert.equal(out.byCity.biratnagar.petrol, 182.5);
  assert.equal(out.byCity.biratnagar.diesel, 175.5);
  assert.equal(out.lpg, 1910);
});

test('parseFuelHtml throws without the kathmandu anchor', () => {
  assert.throws(() => parseFuelHtml('<div>nothing here</div>'), /kathmandu/);
});

// ── fetch wrappers (stubbed transport) ──
function stubFetch(handler) {
  return (_url, _opts) => Promise.resolve(handler());
}
const okJson = (payload) => ({ ok: true, status: 200, json: () => Promise.resolve(payload) });

test('fetchMetalsUpstream returns parsed metals', async () => {
  const out = await fetchMetalsUpstream(stubFetch(() => okJson(FENE_ROWS)), 1000);
  assert.equal(out.gold.pricePerTola, 245000);
  assert.equal(out.silver.pricePerTola, 3120);
});

test('fetchMetalsUpstream throws on HTTP error', async () => {
  await assert.rejects(
    fetchMetalsUpstream(stubFetch(() => ({ ok: false, status: 503 })), 1000),
    /HTTP 503/,
  );
});

// ── NOC JSON API fixtures (shape mirrors beta.noc.org.np/api/fuel-prices) ──
const NOC_API_PAGE_1 = {
  data: [
    { location: { name: 'Kathmandu' }, fuel_type: { slug: 'petrol' }, price: '200.00', price_date: '2026-10-01 09:39:00' },
    { location: { name: 'Kathmandu' }, fuel_type: { slug: 'diesel' }, price: '193.00', price_date: '2026-10-01 09:39:00' },
    { location: { name: 'Kathmandu' }, fuel_type: { slug: 'kerosene' }, price: '193.00', price_date: '2026-10-01 09:39:00' },
    { location: { name: 'Kathmandu' }, fuel_type: { slug: 'petrol' }, price: '197.00', price_date: '2026-07-17 14:07:00' },
    { location: { name: 'Surkhet' }, fuel_type: { slug: 'petrol' }, price: '199.00', price_date: '2026-10-01 09:41:00' },
    { location: { name: 'Surkhet' }, fuel_type: { slug: 'lp-gas' }, price: '2060.00', price_date: '2026-10-01 09:41:00' },
    { location: { name: 'Nepalgung' }, fuel_type: { slug: 'diesel' }, price: '192.00', price_date: '2026-10-01 09:40:00' },
    { location: { name: 'Raxaul' }, fuel_type: { slug: 'petrol' }, price: '150.00', price_date: '2026-10-01 09:40:00' },
    { location: { name: 'Kathmandu' }, fuel_type: { slug: 'aviation-fuel-jet' }, price: '249.00', price_date: '2026-10-01 09:40:00' },
  ],
  pagination: { has_more_pages: false, next_page_url: null },
};

test('parseFuelRecords keeps latest per city+fuel, maps aliases, skips border/aviation rows', () => {
  const out = parseFuelRecords(NOC_API_PAGE_1.data);
  assert.equal(out.byCity.kathmandu.petrol, 200);
  assert.equal(out.byCity.kathmandu.diesel, 193);
  assert.equal(out.byCity.surkhet.petrol, 199);
  assert.equal(out.byCity.nepalgunj.diesel, 192); // Nepalgung alias
  assert.equal(out.lpg, 2060);
  assert.ok(out.byCity.biratnagar); // backfilled from kathmandu anchor
  assert.ok(out.history.length >= 1 && out.history[0].date === '2026-10-01');
  assert.equal(typeof out.history[0].change, 'number');
});

test('parseFuelRecords throws without the kathmandu anchor', () => {
  assert.throws(() => parseFuelRecords([{ location: { name: 'Dang' }, fuel_type: { slug: 'petrol' }, price: '1', price_date: '2026-10-01' }]), /kathmandu/);
  assert.throws(() => parseFuelRecords([]), /kathmandu/);
});

test('fetchFuelUpstream follows the JSON API (not the removed ticker)', async () => {
  const out = await fetchFuelUpstream(stubFetch(() => okJson(NOC_API_PAGE_1)), 1000);
  assert.equal(out.byCity.kathmandu.petrol, 200);
  assert.equal(out.lpg, 2060);
  assert.ok(Array.isArray(out.cities) && out.cities.length > 0);
});

test('fetchFuelUpstream follows pagination', async () => {
  const page2 = { data: [{ location: { name: 'Dang' }, fuel_type: { slug: 'petrol' }, price: '199.00', price_date: '2026-10-01 09:41:00' }], pagination: { has_more_pages: false, next_page_url: null } };
  const p1 = { ...NOC_API_PAGE_1, pagination: { has_more_pages: true, next_page_url: 'https://x/page2' } };
  let calls = 0;
  const out = await fetchFuelUpstream((_url) => Promise.resolve(okJson(calls++ === 0 ? p1 : page2)), 1000);
  assert.equal(calls, 2);
  assert.equal(out.byCity.dang.petrol, 199);
});

test('fetchFuelUpstream throws on HTTP error', async () => {
  await assert.rejects(
    fetchFuelUpstream(stubFetch(() => ({ ok: false, status: 500 })), 1000),
    /HTTP 500/,
  );
});

// ── NRB forex ──
const NRB_DAY_EMPTY = { data: { payload: [] } };
const NRB_DAY_OK = {
  data: { payload: [{ date: '2026-10-13', published_on: '2026-10-13 11:00', rates: [
    { currency: { iso3: 'USD', name: 'US Dollar', unit: 1 }, buy: '152.10', sell: '152.70' },
    { currency: { iso3: 'INR', name: 'Indian Rupee', unit: 100 }, buy: '160.00', sell: '160.15' },
    { currency: { iso3: 'XXX' }, buy: 'nope', sell: null },
  ] }] },
};

test('normalizeForexRates maps raw NRB rows, drops bad ones', () => {
  const out = normalizeForexRates(NRB_DAY_OK.data.payload[0].rates);
  assert.equal(out.length, 2);
  assert.deepEqual(out[0], { iso3: 'USD', name: 'US Dollar', unit: 1, buy: 152.1, sell: 152.7 });
  assert.deepEqual(out[1], { iso3: 'INR', name: 'Indian Rupee', unit: 100, buy: 160, sell: 160.15 });
});

test('toNepalDate returns a YYYY-MM-DD string', () => {
  assert.match(toNepalDate(new Date('2026-10-14T00:00:00Z')), /^\d{4}-\d{2}-\d{2}$/);
});

test('fetchForexUpstream walks back past empty days', async () => {
  let calls = 0;
  const out = await fetchForexUpstream((_url) => {
    calls++;
    return Promise.resolve(okJson(calls === 1 ? NRB_DAY_EMPTY : NRB_DAY_OK));
  }, 1000);
  assert.equal(calls, 2);
  assert.equal(out.date, '2026-10-13');
  assert.equal(out.rates.length, 3);
});

test('fetchForexUpstream throws when all 7 days are empty', async () => {
  await assert.rejects(
    fetchForexUpstream(stubFetch(() => okJson(NRB_DAY_EMPTY)), 1000),
    /no rates found/,
  );
});
