/**
 * SolutionsNepal — edge worker (Cloudflare Workers Static Assets + API).
 *
 * Static pages are pre-rendered at build time, so price data would freeze
 * until the next deploy. These same-origin JSON routes re-fetch the free
 * upstream sources at the edge, so gold/silver/fuel stay live after hosting:
 *
 *   GET /api/live/metals  → FENEGOSIDA gold + silver (edge-cached 6h)
 *   GET /api/live/fuel    → NOC ticker petrol/diesel/kerosene + LPG (cached 6h)
 *   GET /api/live/forex   → NRB daily reference rates, 7-day lookback (cached 6h)
 *
 * Everything else falls through to the static-asset pipeline (redirects,
 * 404 page and all pre-rendered routes keep working untouched).
 *
 * No keys, no paid services. On any upstream failure the route answers
 * 502 `{ok:false}` (never cached) and pages keep their baked snapshot.
 */

import { fetchMetalsUpstream, fetchFuelUpstream, fetchForexUpstream, normalizeForexRates } from './lib/nepal/live-upstream.js';

const TTL_SECONDS = 6 * 3600; // upstream publishes daily / rarely — 6h is plenty
const SWR_SECONDS = 24 * 3600;

function jsonResponse(payload, status, ttl) {
  const headers = { 'Content-Type': 'application/json; charset=utf-8' };
  if (status === 200) {
    headers['Cache-Control'] = `public, max-age=${ttl}, stale-while-revalidate=${SWR_SECONDS}`;
  } else {
    headers['Cache-Control'] = 'no-store';
  }
  return new Response(JSON.stringify(payload), { status, headers });
}

async function serveLive(request, env, ctx, source, loader, ttl) {
  // Edge cache first: thousands of page views share one upstream fetch.
  try {
    const cache = caches.default;
    const hit = await cache.match(request);
    if (hit) return hit;
    const data = await loader();
    const res = jsonResponse(
      { ok: true, source, fetchedAt: new Date().toISOString(), data },
      200,
      ttl,
    );
    // Cache in the background; serve this response immediately.
    ctx.waitUntil(cache.put(request, res.clone()));
    return res;
  } catch (err) {
    // No caches API (e.g. `wrangler dev --local` quirks) → still try direct.
    if (String(err?.message || '').includes('caches')) {
      try {
        const data = await loader();
        return jsonResponse(
          { ok: true, source, fetchedAt: new Date().toISOString(), data },
          200,
          ttl,
        );
      } catch (err2) {
        return jsonResponse(
          { ok: false, source, error: String(err2?.message || err2).slice(0, 160) },
          502,
        );
      }
    }
    return jsonResponse(
      { ok: false, source, error: String(err?.message || err).slice(0, 160) },
      502,
    );
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/api/live/metals') {
      return serveLive(request, env, ctx, 'FENEGOSIDA', () => fetchMetalsUpstream(), TTL_SECONDS);
    }
    if (request.method === 'GET' && url.pathname === '/api/live/fuel') {
      return serveLive(request, env, ctx, 'NOC', () => fetchFuelUpstream(), TTL_SECONDS);
    }
    if (request.method === 'GET' && url.pathname === '/api/live/forex') {
      return serveLive(request, env, ctx, 'NRB', async () => {
        const { rates, date, publishedOn } = await fetchForexUpstream();
        const currencies = normalizeForexRates(rates);
        if (!currencies.length) throw new Error('NRB: empty rates');
        return { currencies, date, publishedOn };
      }, TTL_SECONDS);
    }
    return env.ASSETS.fetch(request);
  },
};
