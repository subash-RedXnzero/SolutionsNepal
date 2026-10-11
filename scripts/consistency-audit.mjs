/**
 * Consistency audit — counts distinct font-size / text-color / border-radius
 * values in the CSS actually shipped to the homepage (dist/index.html).
 *
 * Static upper bound: it includes selectors that may not match the rendered
 * page, so a passing count here guarantees the live page passes too.
 *
 * Usage: node scripts/consistency-audit.mjs [path/to/index.html]
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url)) + '/..';
const htmlPath = process.argv[2] ?? 'dist/index.html';
const html = readFileSync(join(root, htmlPath), 'utf8');

/* ── 1. Gather the CSS files the page loads ─────────────────────────────── */
const cssHrefs = [...html.matchAll(/href="(\/?_astro\/[^"']+\.css)"/g)].map(m => m[1]);
const css = cssHrefs.map(h => readFileSync(join(root, 'dist', h.replace(/^\//, '')), 'utf8')).join('\n');

/* ── 2. Page class tokens (to skip rules that can never match) ──────────── */
const pageClasses = new Set();
for (const m of html.matchAll(/class="([^"]*)"/g)) m[1].split(/\s+/).forEach(c => c && pageClasses.add(c));

/* Element census: a bare-element rule (e.g. `h3 { … }`) can only decide the
   computed value if some instance of that element has NO class (a classed
   instance is overridden by its class rules). Track both. */
const elTotal = new Map(), elBare = new Map();
for (const m of html.matchAll(/<([a-z][a-z0-9]*)((?:\s[^>]*)?)>/gi)) {
  const tag = m[1].toLowerCase(), attrs = m[2] || '';
  elTotal.set(tag, (elTotal.get(tag) || 0) + 1);
  if (!/\bclass\s*=/.test(attrs)) elBare.set(tag, (elBare.get(tag) || 0) + 1);
}

/* ── 3. Mini CSS block parser: (mediaStack, selector, body) leaves ─────── */
const leaves = [];
function parse(cssText, mediaStack) {
  let i = 0, depth = 0, sel = '', buf = '';
  const flush = (selector, body) => { if (body.trim()) leaves.push({ media: mediaStack.join(' && '), selector: selector.trim(), body }); };
  while (i < cssText.length) {
    const ch = cssText[i];
    if (ch === '/' && cssText[i + 1] === '*') { const e = cssText.indexOf('*/', i); i = e === -1 ? cssText.length : e + 2; continue; }
    if (depth === 0) {
      if (ch === '{') {
        const head = buf.trim(); buf = '';
        if (/^@(media|supports|layer|container)/.test(head)) {
          let d = 1, j = i + 1;
          while (j < cssText.length && d > 0) { if (cssText[j] === '{') d++; else if (cssText[j] === '}') d--; j++; }
          parse(cssText.slice(i + 1, j - 1), [...mediaStack, head]);
          i = j; continue;
        }
        sel = head; depth = 1;
      } else buf += ch;
    } else {
      if (ch === '{') depth++;
      else if (ch === '}') { depth--; if (depth === 0) { flush(sel, buf); buf = ''; sel = ''; } else buf += ch; }
      else buf += ch;
    }
    i++;
  }
}
parse(css, []);

/* ── 4. Token maps (light/dark) from custom-property declarations ───────── */
const lightTokens = {}, darkTokens = {};
const isDarkSel = s => /data-theme\s*=\s*["']?dark/i.test(s);
for (const { selector, body } of leaves) {
  const target = isDarkSel(selector) ? darkTokens : lightTokens;
  for (const m of body.matchAll(/(--[a-zA-Z0-9-]+)\s*:\s*([^;{}]+)/g)) target[m[1]] = m[2].trim();
}

function resolveVars(value, tokens) {
  let v = value, pass = 0;
  while (pass++ < 12) {
    const next = v.replace(/var\(\s*(--[a-zA-Z0-9-]+)\s*(?:,\s*([^()]+?(?:\([^()]*\)[^()]*?)?))?\)/g,
      (_, name, fb) => tokens[name] ?? (fb ? fb.trim() : name));
    if (next === v) break;
    v = next;
  }
  return v.trim();
}

/* ── 5. Collect declarations, resolve, bucket by tier ───────────────────── */
const isMobileMedia = m => /max-width|<=/.test(m);
const buckets = {
  desktop: { 'font-size': new Map(), 'color': new Map(), 'border-radius': new Map() },
  mobile:  { 'font-size': new Map(), 'color': new Map(), 'border-radius': new Map() },
};
const addVal = (map, key, sel) => {
  if (!map.has(key)) map.set(key, new Set());
  const s = map.get(key);
  if (s.size < 4) s.add(sel.slice(0, 90));
};
const KEEP = /(^|[^a-z-])(font-size|color|border-radius|border-top-left-radius|border-top-right-radius|border-bottom-left-radius|border-bottom-right-radius)(\s*:)/;

for (const { media, selector, body } of leaves) {
  const parts = selector.split(',').map(s => s.trim()).filter(Boolean);
  const canMatch = parts.some(part => {
    // Escaped arbitrary-utility selectors (e.g. .\!text-\[20px\]) must appear verbatim in the HTML
    if (/\\!/.test(part)) {
      const literal = part.replace(/^\./, '').replace(/\\/g, '');
      return pageClasses.has(literal);
    }
    // Bare-element selectors: skip when no class-less instance exists on the page
    if (!/[.#:\[]/.test(part)) {
      return part.split(/\s+/).some(t => (elBare.get(t.toLowerCase()) || 0) > 0);
    }
    const cls = [...part.matchAll(/\.([a-zA-Z0-9_-]+)/g)].map(m => m[1]);
    return cls.length === 0 || cls.every(c => pageClasses.has(c));
  });
  if (!canMatch) continue;

  const tier = media && isMobileMedia(media) ? 'mobile' : 'desktop';
  const tokens = { ...lightTokens };
  for (const m of body.matchAll(/(--[a-zA-Z0-9-]+)\s*:\s*([^;{}]+)/g)) tokens[m[1]] = m[2].trim();

  for (const m of body.matchAll(/(?:^|;)\s*([a-z-]+)\s*:\s*([^;]+)/g)) {
    const prop = m[1], raw = m[2].trim();
    if (!KEEP.test(prop + ':')) continue;
    if (prop.startsWith('border-') && !prop.startsWith('border-radius') && !/left-radius|right-radius/.test(prop)) continue;
    if (raw === '0' || raw === '0px') continue; // audits ignore square corners
    const resolved = resolveVars(raw, tokens);
    // Inherited/currentColor values resolve to a parent's colour — not independent palette entries
    if (prop === 'color' && (/currentcolor/i.test(resolved) || /^inherit$/i.test(resolved))) continue;
    const key = prop.startsWith('border') ? 'border-radius' : prop;
    addVal(buckets[tier][key], resolved.replace(/\s+/g, ' '), selector);
  }
}

/* ── 6. Report ──────────────────────────────────────────────────────────── */
const fmt = map => [...map.entries()].sort().map(([v, sels]) => `${v}\n      ← ${[...sels].join('\n      ← ')}`).join('\n    ');
for (const tier of ['desktop', 'mobile']) {
  const fs = buckets[tier]['font-size'], co = buckets[tier]['color'], ra = buckets[tier]['border-radius'];
  console.log(`\n═══ ${tier.toUpperCase()} (static upper bound) ═══`);
  console.log(`font-size: ${fs.size} distinct${fs.size > 10 ? '  ✗ (>10)' : '  ✓ (≤10)'}`);
  console.log(`    ${fmt(fs)}`);
  console.log(`color: ${co.size} distinct${co.size > 12 ? '  ✗ (>12)' : '  ✓ (≤12)'}`);
  console.log(`    ${fmt(co)}`);
  console.log(`border-radius: ${ra.size} distinct${ra.size > 6 ? '  ✗ (>6)' : '  ✓ (≤6)'}`);
  console.log(`    ${fmt(ra)}`);
}
