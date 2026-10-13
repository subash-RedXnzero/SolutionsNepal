/**
 * Fails (exit 1) when any author-written meta description source is outside
 * the 25–160 character window search engines display cleanly.
 *
 * Covers: Blogedit/ + Guideedit/ frontmatter, src/data/seo-database.js
 * meta_description values, and hardcoded `description` consts/props in
 * src/pages + src/layouts (the strings that become <meta name="description">).
 *
 * Runtime output is additionally clamped by clampDescription() in
 * src/data/seo.js + BaseLayout, so this check guards source quality
 * (no mid-sentence truncation) rather than acting as the only defense.
 *
 * Usage: node scripts/check-meta-descriptions.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from './content-format.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIN = 25;
const MAX = 160;
const failures = [];
const checked = { md: 0, db: 0, astro: 0 };

function check(label, value) {
  const len = String(value).length;
  if (len < MIN || len > MAX) failures.push(`${len} chars | ${label}`);
}

// 1. Markdown frontmatter (Blogedit + Guideedit)
for (const dir of ['Blogedit', 'Guideedit']) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) continue;
  for (const f of fs.readdirSync(full).filter((f) => f.endsWith('.md') && !f.startsWith('_') && f.toLowerCase() !== 'readme.md')) {
    const raw = fs.readFileSync(path.join(full, f), 'utf8').replace(/\r\n?/g, '\n');
    const m = raw.match(/^---\n([\s\S]*?)\n---/);
    if (!m) {
      failures.push(`no-frontmatter | ${dir}/${f}`);
      continue;
    }
    const fm = parseFrontmatter(m[1]);
    checked.md++;
    if (!fm.description) failures.push(`missing | ${dir}/${f}`);
    else check(`${dir}/${f}`, fm.description);
  }
}

// 2. seo-database.js meta_description values (single-quoted JS strings with \' escapes)
{
  const src = fs.readFileSync(path.join(ROOT, 'src/data/seo-database.js'), 'utf8');
  const re = /meta_description:\s*'((?:\\.|[^'\\])*)'/g;
  let m;
  while ((m = re.exec(src))) {
    checked.db++;
    const val = m[1].replace(/\\'/g, "'").replace(/\s+/g, ' ').trim();
    check(`seo-database near offset ${m.index}`, val);
  }
}

// 3. Hardcoded page descriptions in Astro pages/layouts.
// Matches: const description = '...' / description="..." (single-line only;
// multi-line template literals in jsonLd are out of scope — not meta tags).
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      walk(p);
    } else if (e.name.endsWith('.astro')) {
      const src = fs.readFileSync(p, 'utf8');
      const rel = path.relative(ROOT, p);
      const re = /(?:const\s+description\s*=\s*|description\s*=\s*)(['"])(.+?)\1/g;
      let m;
      while ((m = re.exec(src))) {
        // Skip lines inside jsonLd blocks (schema descriptions have no length rule).
        const lineStart = src.lastIndexOf('\n', m.index) + 1;
        const context = src.slice(Math.max(0, lineStart - 400), m.index);
        if (/jsonLd\s*[:=]\s*[\[{][\s\S]*$/.test(context) && !/const description/.test(src.slice(lineStart, m.index))) continue;
        checked.astro++;
        check(rel, m[2]);
      }
    }
  }
}
walk(path.join(ROOT, 'src/pages'));
walk(path.join(ROOT, 'src/layouts'));

console.log(`check-meta-descriptions: ${checked.md} md, ${checked.db} db, ${checked.astro} astro consts checked.`);
if (failures.length) {
  console.log(`FAIL — ${failures.length} description(s) outside ${MIN}-${MAX} chars:`);
  for (const f of failures) console.log(`  ${f}`);
  process.exit(1);
}
console.log(`OK — all meta descriptions within ${MIN}-${MAX} chars.`);
