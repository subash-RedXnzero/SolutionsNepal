/**
 * Fails (exit 1) when any <img> in src/ lacks descriptive alt text.
 * SEO crawlers and audit tools flag missing, empty, or generic
 * ("image", "photo", "preview"...) alt attributes.
 *
 * Legitimate decorative images should still carry descriptive alt here:
 * AT-hiding is done with aria-hidden on the wrapper instead of alt="".
 *
 * Usage: node scripts/check-img-alt.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GENERIC = /^(image|photo|picture|img|thumbnail|preview|icon|logo|graphic|illustration|image preview|photo preview|processed photo preview|photo thumbnail)[\s\d]*$/i;
const failures = [];
let checked = 0;

function scanFile(file) {
  let src = fs.readFileSync(file, 'utf8');
  // Ignore <img> mentions inside comments — only real tags count.
  src = src.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\n)\s*\/\/[^\n]*/g, '$1');
  const rel = path.relative(ROOT, file);
  const re = /<img\b[^>]*>/gi;
  let m;
  while ((m = re.exec(src))) {
    const tag = m[0];
    if (/\{\.\.\.rest\}/.test(tag) && /alt=\{alt\}/.test(tag)) continue; // central Image.astro passthrough
    checked++;
    const altM = tag.match(/\balt=(?:"([^"]*)"|'([^']*)'|\{([^}]*)\})/i);
    if (!altM) {
      failures.push(`missing alt | ${rel} :: ${tag.slice(0, 120)}`);
    } else if (altM[1] !== undefined || altM[2] !== undefined) {
      const val = (altM[1] ?? altM[2]).trim();
      if (val === '') failures.push(`empty alt | ${rel} :: ${tag.slice(0, 120)}`);
      else if (GENERIC.test(val)) failures.push(`generic alt "${val}" | ${rel}`);
    }
    // alt={expr} is dynamic — assumed descriptive (post.title etc.); not flagged.
  }
}

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.astro')) scanFile(p);
  }
}
walk(path.join(ROOT, 'src'));

console.log(`check-img-alt: ${checked} <img> tags checked.`);
if (failures.length) {
  console.log(`FAIL — ${failures.length} image(s) without descriptive alt:`);
  for (const f of failures) console.log(`  ${f}`);
  process.exit(1);
}
console.log('OK — every <img> has descriptive alt text.');
