/**
 * Nepal Today responsive verifier — checks the CSS actually shipped to
 * dist/index.html for the carousel (mobile), 3+2 grid (tablet) and 5-up grid
 * (desktop) rules. Static by design: it proves the shipped stylesheet carries
 * every tier the live audit needs. Handles Vite's minified output: range
 * media queries (`width<=767px`) and Astro scope attributes.
 */
import { readFileSync } from 'node:fs';

const html = readFileSync('dist/index.html', 'utf8');
const cssLinks = [...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)].map(m => m[1]);
let css = '';
for (const href of cssLinks) css += readFileSync('dist' + new URL(href, 'http://x/').pathname, 'utf8') + '\n';

const failures = [];
const check = (name, cond, detail) => { if (!cond) failures.push(`${name} — ${detail}`); };

// Grab the declarations of every rule whose selector contains the given class.
const rulesFor = (cls) => [...css.matchAll(new RegExp(`[^{}]*\\.${cls}(?:\\[[^\\]]*\\])?[^{]*\\{([^}]*)\\}`, 'g'))].map(m => m[1].replace(/\s/g, ''));
// Slice the CSS between two media query markers (inclusive of the first).
const tier = (fromW, toW) => {
  const from = css.indexOf(`@media (width<=${fromW}px)`);
  if (from === -1) return null;
  if (toW == null) return css.slice(from);
  const to = css.indexOf(`@media (width<=${toW}px)`, from);
  return to === -1 ? css.slice(from) : css.slice(from, to);
};

// ── Desktop (base layer): 5-up grid, dots hidden ──
const base = rulesFor('npb-main');
check('desktop .npb-main rule', base.length > 0, 'not found');
check('desktop grid', base.some(r => r.includes('display:grid') && r.includes('repeat(5,1fr)')), JSON.stringify(base));
check('dots hidden on desktop', /\.npb-dots(?:\[[^\]]*\])?\{display:none\}/.test(css.replace(/\s/g, '')), 'no display:none rule');

// ── Tablet (≤1023px): 3+2 grid, no carousel ──
const tCss = tier(1023, 767) ?? '';
check('tablet tier exists', tCss.length > 0, 'media block missing');
const tMain = [...tCss.matchAll(/[^{}]*\.npb-main(?:\[[^\]]*\])?[^{]*\{([^}]*)\}/g)].map(m => m[1].replace(/\s/g, ''));
check('tablet grid 3 cols', tMain.some(r => r.includes('display:grid') && r.includes('repeat(3,1fr)')), JSON.stringify(tMain));
check('tablet no carousel', !tMain.some(r => r.includes('scroll-snap-type')), 'tablet should not snap');
check('tablet row2 left border off', tCss.replace(/\s/g, '').includes('3n+1)'), 'nth-child(3n+1) missing');

// ── Mobile (<768px): mandatory-snap carousel, 240px cards, dots, wrapping strip ──
const mCss = tier(767, 479) ?? '';
check('mobile tier exists', mCss.length > 0, 'media block missing');
const mMain = [...mCss.matchAll(/[^{}]*\.npb-main(?:\[[^\]]*\])?[^{]*\{([^}]*)\}/g)].map(m => m[1].replace(/\s/g, ''));
check('mobile flex carousel', mMain.some(r => r.includes('display:flex') && r.includes('overflow-x:auto')), JSON.stringify(mMain));
check('mobile mandatory snap', mMain.some(r => r.includes('scroll-snap-type:xmandatory')), 'snap not mandatory');
const mCol = [...mCss.matchAll(/[^{}]*\.npb-col(?:\[[^\]]*\])?[^{]*\{([^}]*)\}/g)].map(m => m[1].replace(/\s/g, ''));
check('mobile 240px cards', mCol.some(r => r.includes('flex:00240px') && r.includes('min-width:240px')), JSON.stringify(mCol));
check('mobile snap align', mCol.some(r => r.includes('scroll-snap-align:start')), 'no snap-align');
check('mobile scrollbar hidden', mMain.some(r => r.includes('scrollbar-width:none')), 'scrollbar visible');
const mDots = [...mCss.matchAll(/[^{}]*\.npb-dots(?:\[[^\]]*\])?[^{]*\{([^}]*)\}/g)].map(m => m[1].replace(/\s/g, ''));
check('mobile dots shown', mDots.some(r => r.includes('display:flex')), JSON.stringify(mDots));
check('mobile value prominent', /\.npb-value(?:\[[^\]]*\])?\{[^}]*--fs-value/.test(mCss), 'value not using --fs-value');
const mStrip = [...mCss.matchAll(/[^{}]*\.npb-strip(?:\[[^\]]*\])?[^{]*\{([^}]*)\}/g)].map(m => m[1].replace(/\s/g, ''));
check('mobile strip wraps', mStrip.some(r => r.includes('flex-wrap:wrap')), JSON.stringify(mStrip));
const mHead = [...mCss.matchAll(/[^{}]*\.npb-head(?:\[[^\]]*\])?[^{]*\{([^}]*)\}/g)].map(m => m[1].replace(/\s/g, ''));
check('mobile head wraps', mHead.some(r => r.includes('flex-wrap:wrap')), JSON.stringify(mHead));

// ── Small tiers keep ≥196px cards and readable values ──
for (const [tierName, fromW, toW] of [['<480px', 479, 375], ['≤375px', 375, 330], ['≤330px', 330, null]]) {
  const seg = tier(fromW, toW) ?? '';
  const colRule = [...seg.matchAll(/[^{}]*\.npb-col(?:\[[^\]]*\])?[^{]*\{([^}]*)\}/g)].map(m => m[1].replace(/\s/g, ''));
  const w = colRule.map(r => r.match(/flex:00(\d+)px/)?.[1]).find(Boolean);
  check(`${tierName} card ≥196px`, w && +w >= 196, `got ${w ?? 'none'}`);
  check(`${tierName} value readable`, /\.npb-value(?:\[[^\]]*\])?\{[^}]*--fs-(lg|value)/.test(seg), 'value shrunk too far');
}

// ── Dots markup + script shipped ──
check('dots markup shipped', (html.match(/npb-dot-i/g) || []).length >= 5, 'missing from HTML');
check('dots script shipped', html.includes('dotsBound'), 'init script missing');

console.log(failures.length ? `FAIL (${failures.length}):\n- ${failures.join('\n- ')}` : 'PASS — all Nepal Today responsive tiers verified in shipped CSS');
process.exit(failures.length ? 1 : 0);
