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
 *   GET /api/live/calendar/{bsYear} → S4NKALP tithi/festival year (cached 12h)
 *
 * Refresh model — three layers so data never goes stale after hosting:
 *   1. On demand: expired cache → fresh upstream fetch (first visitor pays).
 *   2. Cron Triggers (wrangler.jsonc): twice daily the scheduled handler
 *      re-fetches every endpoint and re-warms the edge cache proactively —
 *      09:30 Nepal time catches FENEGOSIDA/NOC day-open updates, 17:00
 *      Nepal time catches NRB's late-afternoon forex bulletin.
 *   3. stale-while-revalidate (24h): a missed cron still serves yesterday's
 *      payload while the next request revalidates upstream.
 *
 * Everything else falls through to the static-asset pipeline (redirects,
 * 404 page and all pre-rendered routes keep working untouched).
 *
 * No keys, no paid services. On any upstream failure the route answers
 * 502 `{ok:false}` (never cached) and pages keep their baked snapshot.
 */

import { fetchMetalsUpstream, fetchFuelUpstream, fetchForexUpstream, normalizeForexRates, toNepalDate } from './lib/nepal/live-upstream.js';
import { fetchCalendarYear } from './lib/nepal/calendar-upstream.js';

const TTL_SECONDS = 6 * 3600; // upstream publishes daily / rarely — 6h is plenty
const CAL_TTL_SECONDS = 12 * 3600; // tithi/festival year data is stable — double TTL
const SWR_SECONDS = 24 * 3600;

// Route table shared by fetch (runtime) and scheduled (cron) so both always
// load and cache identical payloads. Keep in sync with the pages that call
// them (client fetches carry no query string; cache keys include the host).
const LIVE_ROUTES = [
  { path: '/api/live/metals', source: 'FENEGOSIDA', load: () => fetchMetalsUpstream() },
  { path: '/api/live/fuel', source: 'NOC', load: () => fetchFuelUpstream() },
  {
    path: '/api/live/forex',
    source: 'NRB',
    load: async () => {
      const { rates, date, publishedOn } = await fetchForexUpstream();
      const currencies = normalizeForexRates(rates);
      if (!currencies.length) throw new Error('NRB: empty rates');
      return { currencies, date, publishedOn };
    },
  },
];

// Apex and www are separate custom domains; www never reaches the runtime
// (fetch() 301s it to the apex below), so the cron only warms apex keys.
const APEX_HOST = 'solutionsnepal.com';
const LIVE_HOSTS = [
  `https://${APEX_HOST}`,
];

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

    // Host canonicalization: *.solutionsnepal.com subdomains (www today)
    // 301 to the apex. Both hosts are attached as custom domains and both
    // served full 200 duplicates — splitting crawl signals so search engines
    // settled on weaker or inconsistent indexes. One canonical host now.
    // (Guards on the site's own domain suffix so `wrangler dev` on
    // localhost/preview hosts is never redirected.)
    if (url.hostname !== APEX_HOST && url.hostname.endsWith('.solutionsnepal.com')) {
      return new Response(null, {
        status: 301,
        headers: {
          Location: `https://${APEX_HOST}${url.pathname}${url.search}`,
          'Cache-Control': 'public, max-age=31536000',
        },
      });
    }

    if (request.method === 'GET') {
      const route = LIVE_ROUTES.find((r) => r.path === url.pathname);
      if (route) return serveLive(request, env, ctx, route.source, route.load, TTL_SECONDS);
      // Calendar-by-year: /api/live/calendar/{bsYear} (path, not query — stable
      // cache keys; static snapshots act as the client fallback).
      const calMatch = url.pathname.match(/^\/api\/live\/calendar\/(\d{1,4})$/);
      if (calMatch) {
        const year = Number(calMatch[1]);
        if (year >= 1992 && year <= 2090) {
          return serveLive(request, env, ctx, 'S4NKALP', () => fetchCalendarYear(year), CAL_TTL_SECONDS);
        }
      }
    }
    return serveAssets(env, request);
  },

  /**
   * Cron Triggers (see wrangler.jsonc "triggers"). Proactively re-fetches all
   * live endpoints and overwrites the edge cache with a fresh payload, so
   * every visitor of the day reads today's data without waiting for an
   * upstream fetch. Each route is loaded ONCE and cached under both host
   * variants (halves subrequests); calendar warms the current + next BS year.
   * Failures are logged and swallowed — the previously cached entry (or the
   * on-demand path with SWR) still covers requests.
   */
  async scheduled(event, env, ctx) {
    for (const route of LIVE_ROUTES) {
      ctx.waitUntil(warmRoute(route, TTL_SECONDS));
    }
    // Current + next BS year (matches the static snapshot years and the
    // calendar UI's default browsing range).
    const currentBs = Number(toNepalDate().split('-')[0]);
    for (const year of [currentBs, currentBs + 1]) {
      ctx.waitUntil(warmCalendarYear(year));
    }
  },
};

/** Fetch upstream once; overwrite the edge cache entry for every live host. */
async function warmRoute(route, ttl) {
  try {
    const data = await route.load();
    const res = jsonResponse(
      { ok: true, source: route.source, fetchedAt: new Date().toISOString(), data },
      200,
      ttl,
    );
    for (const host of LIVE_HOSTS) {
      // Each put() consumes the response body — clone for every host.
      await caches.default.put(new Request(host + route.path), res.clone());
    }
  } catch (err) {
    // Upstream hiccup (or rate limit): keep the existing cache entry. The
    // on-demand path plus 24h stale-while-revalidate still serves visitors.
    console.error(`[cron] ${route.path}: ${String(err?.message || err).slice(0, 160)}`);
  }
}

/** Fetch a full BS calendar year (12 upstream months) once; cache under both hosts. */
async function warmCalendarYear(year) {
  try {
    const data = await fetchCalendarYear(year);
    const res = jsonResponse(
      { ok: true, source: data.source, fetchedAt: new Date().toISOString(), data },
      200,
      CAL_TTL_SECONDS,
    );
    for (const host of LIVE_HOSTS) {
      await caches.default.put(new Request(`${host}/api/live/calendar/${year}`), res.clone());
    }
  } catch (err) {
    console.error(`[cron] /api/live/calendar/${year}: ${String(err?.message || err).slice(0, 160)}`);
  }
}

/**
 * Static-asset fallback for missing paths (URLs deployed after the last push,
 * stray bot probes). The assets binding throws for unknown paths on the
 * current deployment — without this guard every miss surfaced as a Cloudflare
 * "Worker threw exception" 500 to crawlers. Never 5xx: worst case a minimal
 * inline 404.
 */
async function serveAssets(env, request) {
  try {
    return await env.ASSETS.fetch(request);
  } catch {
    try {
      // Serve the site's own baked 404 page if the binding allows it.
      const url = new URL(request.url);
      return await env.ASSETS.fetch(new Request(`https://solutionsnepal.com/404.html`, { method: 'GET' }));
    } catch {
      return new Response(
        '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>404 — Not Found | SolutionsNepal</title></head>'
        + '<body style="font-family:system-ui;max-width:40rem;margin:12vh auto;padding:0 24px;text-align:center;">'
        + '<h1>404 — page not found</h1>'
        + '<p><a href="/">← Back to SolutionsNepal</a></p></body></html>',
        { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } },
      );
    }
  }
}
