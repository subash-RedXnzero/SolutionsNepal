/**
 * Regenerates src/data/seo-new-meta.js from solutionsnepal_new_meta.csv.
 * The CSV is the source of truth for approved meta titles/descriptions.
 * Usage: node scripts/sync-seo-meta.mjs
 */
import fs from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c !== '\r') field += c;
    }
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.length > 1 || (r.length === 1 && r[0].trim() !== ''));
}

const text = fs.readFileSync(join(ROOT, 'solutionsnepal_new_meta.csv'), 'utf8').replace(/^\uFEFF/, '');
const rows = parseCsv(text);
const header = rows[0].map(h => h.replace(/^\uFEFF/, '').trim());
const iu = header.indexOf('URL'), it = header.indexOf('New Title'),
  id = header.indexOf('New Description'), ino = header.indexOf('Notes');
if (iu < 0 || it < 0 || id < 0) throw new Error('CSV missing required columns (URL, New Title, New Description)');
const out = {};
for (const r of rows.slice(1)) {
  const url = (r[iu] || '').trim();
  const title = (r[it] || '').trim();
  const desc = (r[id] || '').trim();
  const notes = ino >= 0 ? (r[ino] || '').trim() : '';
  if (!url || !title) continue;
  let p = url.replace('https://solutionsnepal.com', '') || '/';
  p = p.replace(/\/+$/, '') || '/';
  out[p] = { title, description: desc, ...(/noindex/i.test(notes) ? { noindex: true } : {}) };
}
const js = `// AUTO-GENERATED from solutionsnepal_new_meta.csv — do not hand-edit.\n// ${Object.keys(out).length} URL overrides: New Title + New Description.\n// Regenerate: node scripts/sync-seo-meta.mjs\n\nexport const SEO_NEW_META = ${JSON.stringify(out, null, 2)};\n`;
fs.writeFileSync(join(ROOT, 'src', 'data', 'seo-new-meta.js'), js);
console.log(`sync-seo-meta: ${Object.keys(out).length} overrides written`);
