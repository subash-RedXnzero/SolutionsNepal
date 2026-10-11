// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://solutionsnepal.com',
  image: {
    // sharp enables responsive/WebP via astro:assets
    service: { entrypoint: 'astro/assets/services/sharp' },
    domains: ['images.unsplash.com'],
  },
  redirects: {
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
  },
  // Single source of truth for sitemap: src/pages/sitemap.xml.js
  // (removed @astrojs/sitemap to avoid duplicate /sitemap.xml output)
  integrations: [],
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
