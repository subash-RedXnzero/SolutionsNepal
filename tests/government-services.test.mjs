/**
 * Tests for the Government Service Cost data + checklist PDF builder.
 * Run: npm test  (node --test tests/)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  SERVICES,
  SERVICE_CATEGORIES,
  POPULAR_SERVICES,
  getServiceBySlug,
  getServicesByCategory,
  getPopularServices,
  getRelatedServices,
  serviceIsVerified,
  serviceFeeFrom,
  formatNPR,
  searchServices,
} from '../src/data/government-services.js';

import {
  sanitizePdfText,
  formatFeePdf,
  buildChecklistPdf,
  escapePdfString,
  wrapPdfText,
  assemblePdf,
} from '../src/lib/pdf/checklist-pdf.js';

// ── Registry integrity ──────────────────────────────────────

test('every service has a unique id and slug', () => {
  const ids = SERVICES.map((s) => s.id);
  const slugs = SERVICES.map((s) => s.slug);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(slugs).size, slugs.length);
  assert.ok(ids.every((id) => /^[a-z0-9-]+$/.test(id)));
  assert.ok(slugs.every((slug) => /^[a-z0-9-]+$/.test(slug)));
});

test('every service has all required non-empty fields', () => {
  for (const s of SERVICES) {
    assert.ok(s.name && s.name.length > 3, `${s.id}: name`);
    assert.ok(s.description && s.description.length > 10, `${s.id}: description`);
    assert.ok(s.office, `${s.id}: office`);
    assert.ok(s.method, `${s.id}: method`);
    assert.ok(s.validity, `${s.id}: validity`);
    assert.ok(s.processingTime, `${s.id}: processingTime`);
    assert.ok(s.eligibility && s.eligibility.length > 5, `${s.id}: eligibility`);
    assert.ok(Array.isArray(s.documents) && s.documents.length >= 2, `${s.id}: documents`);
    assert.ok(Array.isArray(s.steps) && s.steps.length >= 3, `${s.id}: steps`);
    assert.ok(Array.isArray(s.notes) && s.notes.length >= 1, `${s.id}: notes`);
    for (const d of s.documents) assert.ok(d.label, `${s.id}: document label`);
    for (const st of s.steps) {
      assert.ok(st.title && st.text, `${s.id}: step title/text`);
    }
  }
});

test('every service category is registered', () => {
  const ids = new Set(SERVICE_CATEGORIES.map((c) => c.id));
  for (const s of SERVICES) {
    assert.ok(ids.has(s.category), `${s.id}: unknown category ${s.category}`);
  }
});

test('fee rows are well-formed (amount null|>=0, verified is boolean)', () => {
  for (const s of SERVICES) {
    assert.ok(Array.isArray(s.fees), `${s.id}: fees array`);
    for (const f of s.fees) {
      assert.ok(f.label, `${s.id}: fee label`);
      assert.ok(
        f.amount === null || (typeof f.amount === 'number' && f.amount >= 0),
        `${s.id}: bad amount for "${f.label}"`,
      );
      assert.equal(typeof f.verified, 'boolean', `${s.id}: verified flag`);
    }
  }
});

test('official sources are real URLs or null (never invented)', () => {
  for (const s of SERVICES) {
    if (s.officialSource === null) continue;
    assert.ok(s.officialSource.label, `${s.id}: source label`);
    assert.match(s.officialSource.url, /^https:\/\/(www\.|enrollment\.)?(nepalpassport|dotm|moha|ird|ocr|dolma|dofe|donidcr)\.(gov\.np|np)/, `${s.id}: unexpected domain`);
  }
});

test('internal links point at real SolutionsNepal routes', () => {
  for (const s of SERVICES) {
    for (const l of s.links || []) {
      assert.ok(
        l.href === '/business-registration-cost-nepal' || /^\/(nepal|tools)\//.test(l.href),
        `${s.id}: bad href ${l.href}`,
      );
    }
  }
});

test('all 9 categories and all 8 popular shortcuts resolve', () => {
  assert.equal(SERVICE_CATEGORIES.length, 9);
  for (const p of POPULAR_SERVICES) {
    assert.ok(getServiceBySlug(p.slug), `popular slug missing: ${p.slug}`);
    assert.ok(p.label, 'popular label');
  }
  assert.equal(getPopularServices().length, POPULAR_SERVICES.length);
});

// ── Helpers ─────────────────────────────────────────────────

test('getServiceBySlug / getServicesByCategory / getRelatedServices', () => {
  const svc = getServiceBySlug('ordinary-passport');
  assert.equal(svc.name, 'Ordinary Passport (34 pages)');
  assert.equal(getServiceBySlug('nope'), null);
  assert.equal(getServicesByCategory('all').length, SERVICES.length);
  const passports = getServicesByCategory('passport');
  assert.equal(passports.length, 3);
  assert.ok(passports.every((s) => s.category === 'passport'));
  const related = getRelatedServices('ordinary-passport', 4);
  assert.equal(related.length, 4);
  assert.ok(!related.some((s) => s.slug === 'ordinary-passport'));
  assert.ok(related.slice(0, 2).every((s) => s.category === 'passport'));
});

test('serviceIsVerified requires every fee row verified', () => {
  assert.equal(serviceIsVerified(getServiceBySlug('ordinary-passport')), true);
  assert.equal(serviceIsVerified(getServiceBySlug('new-citizenship')), false);
  assert.equal(serviceIsVerified(getServiceBySlug('bluebook-renewal')), false);
});

test('serviceFeeFrom returns the lowest fixed fee or null', () => {
  assert.equal(serviceFeeFrom(getServiceBySlug('ordinary-passport')), 5000);
  assert.equal(serviceFeeFrom(getServiceBySlug('individual-pan')), 0);
  assert.equal(serviceFeeFrom(getServiceBySlug('new-citizenship')), null);
});

test('formatNPR: Free / Varies / Indian grouping', () => {
  assert.equal(formatNPR(0), 'Free');
  assert.equal(formatNPR(null), 'Varies');
  assert.equal(formatNPR(5000), 'Rs. 5,000');
  assert.equal(formatNPR(12000), 'Rs. 12,000');
});

test('searchServices matches name, docs and office; all words required', () => {
  const byName = searchServices('passport');
  assert.ok(byName.length >= 3);
  // all three passport services must be found (other services can match via "passport-size photo")
  for (const slug of ['ordinary-passport', 'passport-renewal', 'urgent-passport']) {
    assert.ok(byName.some((s) => s.slug === slug), `missing ${slug}`);
  }
  const byDoc = searchServices('biometric');
  assert.ok(byDoc.length >= 2);
  assert.deepEqual(searchServices(''), SERVICES);
  assert.deepEqual(searchServices('zzzznothing'), []);
  // multi-word: every word must match
  const both = searchServices('passport renewal');
  assert.ok(both.length >= 1);
  assert.ok(both.every((s) => s.slug.includes('passport')));
});

// ── PDF builder ─────────────────────────────────────────────

test('sanitizePdfText strips non-WinAnsi characters', () => {
  assert.equal(sanitizePdfText('“Hello” — test → ✓'), '"Hello" - test -> x');
  assert.equal(sanitizePdfText('Rs. 5,000'), 'Rs. 5,000');
});

test('formatFeePdf handles free / varies / amounts', () => {
  assert.equal(formatFeePdf({ amount: 0 }), 'Free');
  assert.equal(formatFeePdf({ amount: null }), 'Varies');
  assert.equal(formatFeePdf({ amount: 5000 }), 'Rs. 5,000');
});

test('buildChecklistPdf returns valid PDF bytes', async () => {
  const svc = getServiceBySlug('ordinary-passport');
  const bytes = await buildChecklistPdf(svc, [0, 2]);
  assert.ok(bytes instanceof Uint8Array);
  assert.ok(bytes.length > 1000);
  const header = Buffer.from(bytes.slice(0, 5)).toString('ascii');
  assert.equal(header, '%PDF-');
});

test('buildChecklistPdf works with no checked docs and unverified service', async () => {
  const svc = getServiceBySlug('labor-permit');
  const bytes = await buildChecklistPdf(svc, []);
  assert.ok(bytes.length > 1000);
  assert.equal(Buffer.from(bytes.slice(0, 5)).toString('ascii'), '%PDF-');
});

test('escapePdfString escapes PDF delimiters', () => {
  assert.equal(escapePdfString('a(b)c\\d'), 'a\\(b\\)c\\\\d');
});

test('wrapPdfText keeps every line within content width', () => {
  const long = 'Word '.repeat(60).trim();
  const lines = wrapPdfText(long, 11);
  assert.ok(lines.length > 1);
  // 11pt Helvetica averages ~6pt/char; 495pt content width fits ~80 chars
  assert.ok(lines.every((l) => l.length <= 90), JSON.stringify(lines.map((l) => l.length)));
  // Long unbroken words (URLs) hard-split instead of overflowing
  const urlLines = wrapPdfText('https://nepalpassport.gov.np/process/process-2-extra-long-path', 11);
  assert.ok(urlLines.every((l) => l.length <= 90));
});

test('generated PDF parses back in pdf-lib with correct page count', async () => {
  const { PDFDocument } = await import('pdf-lib');
  const svc = getServiceBySlug('ordinary-passport');
  const bytes = await buildChecklistPdf(svc, [0, 2]);
  const loaded = await PDFDocument.load(bytes);
  assert.ok(loaded.getPageCount() >= 1);
});

test('long services paginate across multiple valid pages', async () => {
  const { PDFDocument } = await import('pdf-lib');
  const big = {
    name: 'Stress Test Service With A Long Name',
    category: 'test',
    lastUpdated: null,
    eligibility: 'Everyone',
    fees: Array.from({ length: 5 }, (_, i) => ({ label: `Fee row number ${i + 1} with extra words`, amount: 1000 * (i + 1), verified: i % 2 === 0 })),
    documents: Array.from({ length: 30 }, (_, i) => ({ label: `Supporting document number ${i + 1} with a fairly long descriptive title` })),
    steps: Array.from({ length: 20 }, (_, i) => ({ title: `Step ${i + 1}`, text: 'Do the thing carefully and completely with all required paperwork attached.' })),
    processingTime: 'Varies',
    office: 'Test Office',
    method: 'In person',
    validity: 'Lifetime',
    notes: ['Note one.', 'Note two.'],
    officialSource: { label: 'Test Dept', url: 'https://example.gov.np' },
  };
  const bytes = await buildChecklistPdf(big, [0, 5, 29]);
  const loaded = await PDFDocument.load(bytes);
  assert.ok(loaded.getPageCount() > 1, `expected multiple pages, got ${loaded.getPageCount()}`);
});

test('assemblePdf produces a parseable single-page document', async () => {
  const { PDFDocument } = await import('pdf-lib');
  const bytes = assemblePdf(['BT /F1 12 Tf 50 700 Td (Hello SolutionsNepal) Tj ET']);
  const loaded = await PDFDocument.load(bytes);
  assert.equal(loaded.getPageCount(), 1);
});
