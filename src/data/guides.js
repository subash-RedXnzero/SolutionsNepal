/**
 * GUIDES + BLOG — where content lives and how pages read it.
 *
 * EDIT CONTENT HERE (VS Code, manual):
 *   Guideedit/my-guide.md  →  shows on /guides
 *   Blogedit/my-story.md   →  shows on /blog
 *   Filename = URL slug:  my-guide.md → /guides/my-guide
 *   Move a file between the two folders to move it between Guides and Blog.
 *
 * DO NOT EDIT:
 *   src/data/blog/*.js      (auto-generated from the .md files)
 *   src/data/blog-posts.js  (auto-generated registry)
 *   JOURNAL_SLUGS below     (auto-synced from Blogedit/ membership)
 *
 * Every post has the same fields:
 *   id, slug, title, description, image, category, date,
 *   author, readTime, tags, headings, sections (= article content)
 *   (id is always the same as slug — the filename without .md)
 */
import { blogPosts } from './blog-posts.js';

/** Slugs that stay on the Blog journal (everything else is a Guide). */
// AUTO-SYNCED from Blogedit/ — move .md files between Blogedit/ and Guideedit/
// to move posts between Blog and Guides. Do not hand-edit this list.
const JOURNAL_SLUGS = new Set([
  'advance-tax-nepal-installments-due-dates-interest-guide',
  'ansha-banda-property-partition-nepal-process-documents',
  'best-mobile-under-20000-nepal',
  'best-scooters-under-3-lakh-nepal',
  'birth-certificate-registration-nepal-ward-crvrs-guide',
  'bluebook-renewal-nepal-2026-documents-fees-online',
  'can-foreigners-buy-property-nepal-legal-guide',
  'cost-of-living-kathmandu-vs-smaller-cities-nepal',
  'dollar-card-nepal-500-limit-banks-documents-guide',
  'epf-cit-vs-ssf-nepal-which-retirement-scheme-guide',
  'fuel-price-nepal-today-noc-rate-mileage-guide',
  'ghar-naksa-pass-nepal-documents-process-fees-guide',
  'gold-vs-silver-investment-nepal-hallmark-resale-guide',
  'health-insurance-nepal-hib-coverage-enrollment-guide',
  'house-rent-tax-nepal-10-percent-calculation-guide',
  'income-tax-slabs-nepal-fy-2083-84-individual-couple-guide',
  'kukl-water-bill-nepal-tariff-payment-guide',
  'land-registration-cost-nepal-malpot-cgt-calculation',
  'lpg-gas-cost-nepal-cylinder-duration-calculator-guide',
  'marriage-registration-nepal-ward-court-documents-guide',
  'nata-pramanit-relationship-certificate-nepal-ward-guide',
  'nea-electricity-bill-calculator-nepal-tariff-guide',
  'neb-gpa-calculator-nepal-class-11-12-percentage-guide',
  'nepal-traffic-fines-current-rates-and-how-to-pay',
  'nepse-tms-account-open-trading-guide-nepal',
  'ntc-fiber-price-list-2026',
  'rajinama-gift-deed-nepal-land-transfer-process-fees',
  'salary-slip-nepal-components-gross-net-explained',
  'see-gpa-calculator-nepal-grading-percentage-guide',
  'tds-rates-nepal-2026-guide',
  'vat-filing-nepal-monthly-return-25th-guide',
  'vehicle-tax-payment-nepal-province-online-guide',
  'voter-id-registration-nepal-online-guide',
  'what-happens-cheque-bounces-nepal-law-guide',
]);

/** Step-by-step how-to guides, in library order. */
export function getGuides() {
  return blogPosts.filter((p) => !JOURNAL_SLUGS.has(p.slug));
}

/** News-style posts that remain on the Blog journal. */
export function getJournalPosts() {
  return blogPosts.filter((p) => JOURNAL_SLUGS.has(p.slug));
}

/** Distinct guide categories with live counts, for filter chips. */
export function getGuideCategories() {
  const counts = {};
  for (const post of getGuides()) {
    const cat = post.category || 'General';
    counts[cat] = (counts[cat] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** True when a slug belongs to the Guides library. */
export function isGuideSlug(slug) {
  return !JOURNAL_SLUGS.has(slug);
}

/** Canonical detail URL for any post: guides live under /guides/, journal under /blog/. */
export function postUrl(post) {
  const slug = typeof post === 'string' ? post : post.slug;
  return isGuideSlug(slug) ? `/guides/${slug}` : `/blog/${slug}`;
}
