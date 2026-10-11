// @ts-check
import { readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { getSeo } from './src/data/seo.js';

// https://astro.build/config
const redirects = {
  '/robots': '/robots.txt',
  '/llms': '/llms.txt',
  '/sitemap': '/sitemap-index.xml',
  '/sitemap.xml': '/sitemap-index.xml',
  '/tools': '/nepal',
  '/best-remittance-exchange-rate-nepal-guide': '/blog/best-remittance-exchange-rate-nepal-guide',
  '/nepal/foreign-job-salary-savings': '/nepal/finance/foreign-job-salary-savings',
  '/nepal/freelancer-take-home-calculator': '/nepal/finance/freelancer-take-home-calculator',
  '/nepal/jobs': '/nepal/utilities/jobs',
  '/nepal/pdf-editor': '/tools/merge-pdf',
  '/tools/nepal-passport-photo': '/tools/passport-photo-resizer',
  '/tools/visa-photo-resizer': '/tools/passport-photo-resizer',
  '/tools/dv-lottery-photo': '/tools/passport-photo-resizer',
  '/tools/citizenship-photo': '/tools/passport-photo-resizer',
  '/tools/convert': '/tools/image-compressor',
  '/nepal/tools/dashain-bonus-calculator': '/nepal/finance/dashain-bonus-calculator',
};
const cloudflareRedirectPaths = readFileSync(new URL('./public/_redirects', import.meta.url), 'utf8')
  .split(/\r?\n/)
  .map(line => line.trim().split(/\s+/, 1)[0])
  .filter(path => path.startsWith('/') && !path.includes('*'));
const redirectedPaths = new Set([...Object.keys(redirects), ...cloudflareRedirectPaths]);
const nonIndexablePaths = new Set([
  '/404',
  '/nepal/electricity',
  '/nepal/electricity/bill-calculator',
  '/silver-price-nepal',
]);

export default defineConfig({
  site: 'https://solutionsnepal.com',

  image: {
    // sharp enables responsive/WebP via astro:assets
    service: { entrypoint: 'astro/assets/services/sharp' },
    domains: ['images.unsplash.com'],
  },

  redirects,

  build: {
    // Inline all CSS into <style> tags: removes the 1–2 render-blocking
    // stylesheet requests PageSpeed flags on every page (~440ms est. savings
    // on the homepage). Trade-off is larger HTML, but HTML is edge-cached
    // (CF-Cache-Status: HIT) so first-visit LCP wins with no visual change.
    inlineStylesheets: 'always',
  },

  integrations: [
    sitemap({
      entryLimit: 45_000,
      filter(page) {
        const pathname = new URL(page).pathname.replace(/\/+$/, '') || '/';
        return !redirectedPaths.has(pathname)
          && !nonIndexablePaths.has(pathname)
          && !getSeo(pathname).noindex;
      },
      serialize(item) {
        const url = new URL(item.url);
        if (url.pathname !== '/') url.pathname = url.pathname.replace(/\/+$/, '');
        return { ...item, url: url.href };
      },
    }),
  ],

  // Viewport prefetch is cheaper than hover+All for 1000+ pages.
  // Previously prefetchAll:true + hover generated huge speculation-rules.
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'viewport',
  },

  vite: {
    plugins: [tailwindcss()],
    // pdf.js / pdf-lib are huge single-file ESM bundles: the dev optimizer
    // chokes optimizing them on demand (stale dep URLs, timeouts), so serve
    // them raw in dev. Production bundling (manualChunks below) is unaffected.
    optimizeDeps: {
      exclude: ['pdfjs-dist', 'pdf-lib'],
    },
    build: {
      cssMinify: 'lightningcss',
      minify: 'esbuild',
      reportCompressedSize: false,
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('pdf-lib')) return 'pdf-lib';
            if (id.includes('pdfjs-dist')) return 'pdfjs';
            if (id.includes('jszip')) return 'vendor';
            if (id.includes('docx')) return 'docx';
            if (id.includes('upng-js') || id.includes('pako')) return 'image';
            if (id.includes('qrcode')) return 'qr';
          },
        },
      },
    },
  },
});