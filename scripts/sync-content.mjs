/**
 * Syncs the easy-edit folders back into the files the site reads.
 *   Guideedit/*.md + Blogedit/*.md  →  src/data/blog/<slug>.js
 *   Blogedit membership             →  JOURNAL_SLUGS in src/data/guides.js
 *   Guideedit/images/*, Blogedit/images/* → public/blog/ (new/changed only)
 *   New/deleted .md files           →  registry updated in src/data/blog-posts.js
 *
 * Auto-runs on `npm run dev` and `npm run build` (see package.json
 * predev/prebuild), so you only ever edit the .md files and rebuild.
 * Safe to run any time: `node scripts/sync-content.mjs`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { unquote, splitFlow, parseFrontmatter, unescapeHtml, jsStr, bodyToSections, toExportName, headingsFromBody } from './content-format.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const GUIDE_DIR = path.join(ROOT, 'Guideedit');
const BLOG_DIR = path.join(ROOT, 'Blogedit');
const OUT_DIR = path.join(ROOT, 'src/data/blog');
const PUB_IMG = path.join(ROOT, 'public/blog');
const HEADER = '// AUTO-GENERATED from Guideedit/ + Blogedit/ — edit the .md files, not this file.\n// Fields: id (= slug), slug, title, description, image, category, date, author, readTime, tags, headings, sections (= content).\n';
const OLD_HEADER = '// AUTO-GENERATED from Guideedit/ + Blogedit/ — edit the .md files, not this file.\n';

function readPosts(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.md') && !f.startsWith('_') && f.toLowerCase() !== 'readme.md').sort();
}

const guideFiles = readPosts(GUIDE_DIR);
const blogFiles = readPosts(BLOG_DIR);
if (!guideFiles.length && !blogFiles.length) {
  console.log('sync-content: Guideedit/ + Blogedit/ empty or missing — nothing to do.');
  process.exit(0);
}

function parsePost(dir, file) {
  const slug = file.replace(/\.md$/, '');
  const raw = fs.readFileSync(path.join(dir, file), 'utf8');
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!fmMatch) throw new Error(`Bad frontmatter: ${file}`);
  const fm = parseFrontmatter(fmMatch[1]);
  if (!fm.title) throw new Error(`Missing title: ${file}`);
  const body = fmMatch[2] || '';
  // Side-menu TOC: explicit frontmatter list wins (all existing files have
  // one); files created in Decap CMS omit it and get it derived from the
  // <h2 id>/ <h3 id> lines in the body instead.
  const headings = fm.headings?.length ? fm.headings : headingsFromBody(body);
  return { slug, fm, headings, sections: bodyToSections(body) };
}

const posts = [
  ...guideFiles.map((f) => parsePost(GUIDE_DIR, f)),
  ...blogFiles.map((f) => parsePost(BLOG_DIR, f)),
];

// 1. Generate src/data/blog/<slug>.js
fs.mkdirSync(OUT_DIR, { recursive: true });
const seen = new Set();
for (const { slug, fm, headings, sections } of posts) {
  if (seen.has(slug)) throw new Error(`Duplicate slug in edit folders: ${slug}`);
  seen.add(slug);
  const L = [HEADER + `export const ${toExportName(slug)} = {`];
  L.push(`  id: ${jsStr(slug)},`);
  L.push(`  slug: ${jsStr(slug)},`);
  L.push(`  category: ${jsStr(fm.category || 'General')},`);
  L.push(`  title: ${jsStr(fm.title)},`);
  L.push(`  description: ${jsStr(fm.description)},`);
  L.push(`  author: ${jsStr(fm.author || 'SolutionsNepal Team')},`);
  if (fm.authorCredential) L.push(`  authorCredential: ${jsStr(fm.authorCredential)},`);
  L.push(`  date: ${jsStr(fm.date)},`);
  if (fm.readTime) L.push(`  readTime: ${jsStr(fm.readTime)},`);
  if (fm.image) L.push(`  image: ${jsStr(fm.image)},`);
  L.push(`  tags: [${(fm.tags || []).map(jsStr).join(', ')}],`);
  if (fm.relatedTools?.length) L.push(`  relatedTools: [${fm.relatedTools.map(jsStr).join(', ')}],`);
  if (fm.faqs?.length) {
    L.push('  faqs: [');
    for (const f of fm.faqs) L.push(`    { q: ${jsStr(f.q)}, a: ${jsStr(f.a)} },`);
    L.push('  ],');
  }
  if (headings?.length) {
    L.push('  headings: [');
    for (const h of headings) L.push(`    { id: ${jsStr(h.id)}, text: ${jsStr(h.text)}, level: ${h.level} },`);
    L.push('  ],');
  }
  L.push('  sections: [', ...sections, '  ],', '};', '');
  fs.writeFileSync(path.join(OUT_DIR, `${slug}.js`), L.join('\n'));
}
// Remove orphaned generated files (never touches hand-written files).
for (const f of fs.readdirSync(OUT_DIR).filter((f) => f.endsWith('.js'))) {
  const full = path.join(OUT_DIR, f);
  const head = fs.readFileSync(full, 'utf8');
  const isGenerated = head.startsWith('// AUTO-GENERATED from Guideedit/');
  if (isGenerated && !seen.has(f.replace(/\.js$/, ''))) {
    fs.unlinkSync(full);
    console.log(`sync-content: removed deleted post ${f}`);
  }
}

// 2. Rewrite src/data/blog-posts.js (keeps existing order, appends new).
const REG = path.join(ROOT, 'src/data/blog-posts.js');
const oldReg = fs.readFileSync(REG, 'utf8');
const order = [...oldReg.matchAll(/^import \{ (\w+) \} from '\.\/blog\/(.+)\.js';$/gm)].map((m) => ({ name: m[1], slug: m[2] }));
const nameFor = Object.fromEntries(order.map((o) => [o.slug, o.name]));
for (const s of seen) if (!nameFor[s]) nameFor[s] = toExportName(s);
const kept = order.filter((o) => seen.has(o.slug));
const added = [...seen].filter((s) => !order.some((o) => o.slug === s)).sort().map((s) => ({ name: nameFor[s], slug: s }));
for (const a of added) console.log(`sync-content: new post registered ${a.slug}`);
const B = [
  '// AUTO-GENERATED registry — do not hand-edit.',
  '// To add a post: copy Guideedit/_TEMPLATE.md (or Blogedit/_TEMPLATE.md) to a new',
  '// slug-name.md, fill it in, rebuild. This file updates itself.',
  '// Content shape per post: id (= slug), slug, title, description, image, category,',
  '// date, author, readTime, tags, headings, sections (= article content).',
  '',
];
for (const e of [...kept, ...added]) B.push(`import { ${e.name} } from './blog/${e.slug}.js';`);
B.push('', 'export const blogPosts = [', ...[...kept, ...added].map((e) => `  ${e.name},`), '];', '',
  'export function getPostBySlug(slug) {', '  return blogPosts.find(p => p.slug === slug);', '}', '',
  'export function getRelatedPosts(currentSlug, category, limit = 3) {', '  return blogPosts',
  '    .filter(p => p.slug !== currentSlug && p.category === category)', '    .slice(0, limit);', '}', '');
fs.writeFileSync(REG, B.join('\n'));

// 3. Sync JOURNAL_SLUGS from Blogedit/ membership.
const GUIDES = path.join(ROOT, 'src/data/guides.js');
const gsrc = fs.readFileSync(GUIDES, 'utf8');
const journal = blogFiles.map((f) => f.replace(/\.md$/, '')).sort();
const setBlock = `// AUTO-SYNCED from Blogedit/ — move .md files between Blogedit/ and Guideedit/\n// to move posts between Blog and Guides. Do not hand-edit this list.\nconst JOURNAL_SLUGS = new Set([\n${journal.map((s) => `  '${s}',`).join('\n')}\n]);`;
const slugSetPattern = /(?:\/\/ AUTO-SYNCED[^\n]*\n|\/\/ to move posts[^\n]*\n)*const JOURNAL_SLUGS = new Set\(\[[\s\S]*?\]\);/;
if (!slugSetPattern.test(gsrc)) throw new Error('sync-content: could not find JOURNAL_SLUGS in guides.js');
const gnew = gsrc.replace(slugSetPattern, setBlock);
if (gnew !== gsrc) fs.writeFileSync(GUIDES, gnew);

// 4. Copy images → public/blog/ (new/changed only).
fs.mkdirSync(PUB_IMG, { recursive: true });
let copied = 0;
for (const dir of [GUIDE_DIR, BLOG_DIR]) {
  const imgDir = path.join(dir, 'images');
  if (!fs.existsSync(imgDir)) continue;
  for (const f of fs.readdirSync(imgDir)) {
    if (f.startsWith('.')) continue;
    const src = path.join(imgDir, f);
    if (!fs.statSync(src).isFile()) continue;
    const dst = path.join(PUB_IMG, f);
    if (!fs.existsSync(dst) || fs.statSync(dst).size !== fs.statSync(src).size) {
      fs.copyFileSync(src, dst);
      copied++;
    }
  }
}

console.log(`sync-content: ${posts.length} posts (${guideFiles.length} guides, ${blogFiles.length} blog), ${added.length} new, ${copied} images copied.`);
