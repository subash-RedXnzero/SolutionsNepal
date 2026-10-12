/**
 * SolutionsNepal — production/dev smoke check.
 *
 * Guards the regressions that unit tests can't see (e.g. the homepage 500
 * from a deleted weather module, re-embedded search index, re-hotlinked
 * third-party hosts).
 *
 * Usage:
 *   node scripts/smoke-check.mjs [baseUrl]   (default http://localhost:4321)
 *   npm run smoke                             (against dev server)
 *
 * Exit code is non-zero when any check fails (CI-friendly).
 */

const base = (process.argv[2] || 'http://localhost:4321').replace(/\/+$/, '');
let failures = 0;

function check(name, ok, extra = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ` — ${extra}` : ''}`);
  if (!ok) failures++;
}

async function get(path) {
  const res = await fetch(base + path);
  return { status: res.status, text: await res.text() };
}

// ── 1. Key routes return 200 ─────────────────────────────
const ROUTES_200 = [
  '/',
  '/nepal',
  '/weather',
  '/blog',
  '/guides/how-to-calculate-emi-nepal',
  '/privacy',
  '/terms',
  '/nepal/finance/emi-calculator',
  '/data/tools.json',
];
for (const path of ROUTES_200) {
  try {
    const { status } = await get(path);
    check(`GET ${path} → 200`, status === 200, `got ${status}`);
  } catch (err) {
    check(`GET ${path}`, false, err.message);
  }
}

// ── 2. Unknown route returns 404 ─────────────────────────
try {
  const { status } = await get('/this-page-does-not-exist-xyz');
  check('GET /this-page-does-not-exist-xyz → 404', status === 404, `got ${status}`);
} catch (err) {
  check('GET /this-page-does-not-exist-xyz', false, err.message);
}

// ── 3. Search-index endpoint is valid ────────────────────
try {
  const { status, text } = await get('/data/tools.json');
  let list = null;
  try { list = JSON.parse(text); } catch { /* not JSON */ }
  const nonEmpty = Array.isArray(list) && list.length > 0;
  check('/data/tools.json is a non-empty JSON array', status === 200 && nonEmpty, `got ${status}, ${list?.length ?? 0} tools`);
  if (nonEmpty) {
    check(
      'tools have required fields',
      list.every((t) => t.title && t.href && t.description && t.category !== undefined),
    );
  }
} catch (err) {
  check('/data/tools.json', false, err.message);
}

// ── 4. No third-party / embedded-index regressions ───────
for (const path of ['/', '/blog']) {
  try {
    const { text } = await get(path);
    check(`${path} has no unsplash refs`, !text.includes('images.unsplash.com'));
    check(`${path} has no google-fonts refs`, !/gstatic|fonts\.googleapis/.test(text));
    check(`${path} has no embedded search index`, !text.includes('data-tools='));
    check(`${path} contains search modal`, text.includes('id="search-modal"'));
  } catch (err) {
    check(`${path} content checks`, false, err.message);
  }
}

console.log(failures === 0 ? `\nsmoke: all checks passed (${base})` : `\nsmoke: ${failures} check(s) FAILED (${base})`);
process.exit(failures === 0 ? 0 : 1);
