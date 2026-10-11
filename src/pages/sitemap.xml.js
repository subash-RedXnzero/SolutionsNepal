import { tools } from '../data/tools.js';
import { categories } from '../data/categories.js';
import { blogPosts } from '../data/blog-posts.js';
import { getJournalPosts, postUrl } from '../data/guides.js';
import { SERVICES as GOV_SERVICES } from '../data/government-services.js';
import { JOBS } from '../data/jobs.js';
import { ALL_ALPHABET } from '../data/nepali-names.js';

export const prerender = true;

const BASE_URL = 'https://solutionsnepal.com';

// Canonical static pages (expanded to cover every category + major hubs)
// NOTE: /silver-price-nepal is intentionally EXCLUDED — legacy duplicate that
// canonicals to /nepal/silver-price-nepal (see silver-price-nepal.astro).
// Noindex/redirect pages (/nepal/finance/salary-tax, /nepal/electricity/bill-calculator)
// are also excluded — never emit noindex, redirect or param URLs.
const staticPages = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/nepal', priority: '0.9', changefreq: 'weekly' },
  { path: '/blog', priority: '0.8', changefreq: 'weekly' },
  { path: '/guides', priority: '0.8', changefreq: 'weekly' },
  { path: '/about', priority: '0.6', changefreq: 'monthly' },
  { path: '/contact', priority: '0.6', changefreq: 'monthly' },
  { path: '/weather', priority: '0.9', changefreq: 'hourly' },
  { path: '/foreign-exchange-nepal', priority: '0.8', changefreq: 'daily' },
  { path: '/nepal/gold-price-nepal', priority: '0.8', changefreq: 'daily' },
  { path: '/nepal/silver-price-nepal', priority: '0.8', changefreq: 'daily' },
  { path: '/nepal/fuel-price-nepal', priority: '0.8', changefreq: 'daily' },
  { path: '/nepal/calendar', priority: '0.8', changefreq: 'weekly' },
  { path: '/nepal/age-calculator', priority: '0.8', changefreq: 'monthly' },
  // Indexable sub-tool pages not in the tools registry (each has unique SEO entry)
  { path: '/tools/wifi-qr-code-generator', priority: '0.6', changefreq: 'monthly' },
  { path: '/tools/url-qr-code-generator', priority: '0.6', changefreq: 'monthly' },
  { path: '/tools/whatsapp-qr-code-generator', priority: '0.6', changefreq: 'monthly' },
  { path: '/tools/vcard-qr-code-generator', priority: '0.6', changefreq: 'monthly' },
  { path: '/tools/email-qr-code-generator', priority: '0.6', changefreq: 'monthly' },
  { path: '/tools/compress-passport-photo-to-200kb', priority: '0.6', changefreq: 'monthly' },
  { path: '/tools/compress-photo-to-100kb', priority: '0.6', changefreq: 'monthly' },
  { path: '/tools/compress-photo-to-50kb', priority: '0.6', changefreq: 'monthly' },
  { path: '/nepal/tools/rupees-to-words', priority: '0.7', changefreq: 'monthly' },
  { path: '/nepal/tools/number-to-words-nepali', priority: '0.7', changefreq: 'monthly' },
  { path: '/nepal/tools/cheque-amount-in-words', priority: '0.7', changefreq: 'monthly' },
  { path: '/nepal/tools/nepali-number-converter', priority: '0.7', changefreq: 'monthly' },
  ...categories.map(c => ({ path: c.href, priority: '0.8', changefreq: 'weekly' })),
];

export function GET() {
  const allUrls = [];

  // Add static pages
  staticPages.forEach(p => {
    allUrls.push({
      loc: `${BASE_URL}${p.path}`,
      changefreq: p.changefreq,
      priority: p.priority,
    });
  });

  // Add tool pages
  tools.forEach(tool => {
    const existing = allUrls.find(u => u.loc === `${BASE_URL}${tool.href}`);
    if (!existing) {
      allUrls.push({
        loc: `${BASE_URL}${tool.href}`,
        changefreq: 'weekly',
        priority: tool.popular ? '0.8' : '0.7',
      });
    }
  });

  // Add government service detail pages
  GOV_SERVICES.forEach(s => {
    allUrls.push({
      loc: `${BASE_URL}/nepal/government-service-cost/${s.slug}`,
      changefreq: 'monthly',
      priority: '0.7',
    });
  });

  // Add jobs detail pages (31 curated career pages)
  JOBS.forEach(j => {
    if (j.id) {
      allUrls.push({
        loc: `${BASE_URL}/nepal/utilities/jobs/${j.id}`,
        changefreq: 'monthly',
        priority: '0.6',
      });
    }
  });

  // Add name letter hubs (A–Z). Individual name pages (~900 thin pages)
  // are intentionally excluded to keep the sitemap focused on indexable hubs.
  ALL_ALPHABET.forEach(letter => {
    allUrls.push({
      loc: `${BASE_URL}/nepal/names/letter/${letter.toLowerCase()}`,
      changefreq: 'monthly',
      priority: '0.5',
    });
  });

  // Add posts: guides under /guides/, journal under /blog/
  blogPosts.forEach(post => {
    allUrls.push({
      loc: `${BASE_URL}${postUrl(post)}`,
      changefreq: 'monthly',
      priority: '0.7',
      lastmod: post.date,
    });
  });

  // Add blog pagination pages (/blog/2, /blog/3, ...)
  // NOTE: /blog paginates journal posts only (see [...page].astro + guides.js),
  // not the full blogPosts list (guides live on /guides). Use journal count
  // so we never emit /blog/2+ URLs that have no static path (404s).
  const POSTS_PER_PAGE = 12;
  const totalPages = Math.ceil(getJournalPosts().length / POSTS_PER_PAGE);
  for (let p = 2; p <= totalPages; p++) {
    allUrls.push({
      loc: `${BASE_URL}/blog/${p}`,
      changefreq: 'weekly',
      priority: '0.6',
    });
  }

  const urls = allUrls
    .map(u => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
    ${u.lastmod ? `<lastmod>${new Date(u.lastmod).toISOString().split('T')[0]}</lastmod>` : ''}
  </url>`)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
