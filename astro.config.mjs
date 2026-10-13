// @ts-check
import { readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { getSeo } from './src/data/seo.js';

// https://astro.build/config
// Single source of truth for redirects: public/_redirects (honored by
// Cloudflare Workers Static Assets in production). astro.config derives the
// same table so `astro dev`/`preview` behave identically.
function loadRedirects() {
  const lines = readFileSync(new URL('./public/_redirects', import.meta.url), 'utf8').split(/\r?\n/);
  const table = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [from, to, status] = trimmed.split(/\s+/);
    if (!from || !from.startsWith('/') || !to || from.includes('*')) continue;
    table[from] = { status: Number(status) === 308 ? 308 : 301, destination: to };
  }
  return table;
}
const redirects = loadRedirects();
const redirectedPaths = new Set(Object.keys(redirects));
const nonIndexablePaths = new Set([
  '/404',
  '/nepal/electricity',
  '/nepal/electricity/bill-calculator',
  '/silver-price-nepal',
  '/data/tools.json',
]);

export default defineConfig({
  site: 'https://solutionsnepal.com',

  image: {
    // sharp enables responsive/WebP via astro:assets
    service: { entrypoint: 'astro/assets/services/sharp' },
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
        // Paginated archives are thin duplicates of page 1 (noindexed, follow).
        if (/^\/blog\/\d+$/.test(pathname)) return false;
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
      // qrcode is lazy-loaded on first Generate click: pre-bundle it at dev
      // startup so the on-demand request never serves a stale 504 chunk.
      include: ['qrcode'],
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