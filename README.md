# SolutionsNepal — Free Tools for Everyday Nepal

SolutionsNepal is a free, fast, and privacy-focused web platform with 85 calculators, converters, and everyday utilities built specifically for Nepal.

**Live site:** https://solutionsnepal.com

## What’s inside

- **Finance:** Salary & SSF, EMI, VAT 13%, SIP, remittance (NRB rates), house rent tax
- **Date & Calendar:** BS ↔ AD converter, Nepali Calendar 2082–2084, age calculator
- **Land & Property:** Ropani ↔ Aana, land registration cost
- **Gold & Silver:** Live per-tola/gram prices, Tola ↔ Gram converter
- **Education:** SEE GPA, NEB GPA, CGPA, gpa ↔ percentage
- **Utilities:** NEA electricity bill, KUKL water bill, fuel prices, vehicle tax & ownership cost
- **Language & Text:** Nepali Unicode, translator, number-to-words
- **Documents & Photo:** JPG/PNG/WebP converters, PDF tools, passport/visa/DV photo resizer, QR generators

All calculators run entirely in the browser — no signup, no tracking, no data leaves the device.

## Original content

All tool logic, calculations, guides, and UI in this repository are **original work by the SolutionsNepal Team** (© 2025–2026 SolutionsNepal). 

Factual information (tax slabs, fees, exchange rates) is compiled from official public sources — Nepal Rastra Bank (nrb.org.np), Inland Revenue Department (ird.gov.np), Department of Transport Management (dotm.gov.np), Office of the Company Registrar (ocr.gov.np), etc. — and rewritten in original prose with citations. No article text is copy-pasted from third-party sites.

Public assets (all self-hosted — no third-party requests for these):
- **Images:** Blog cover images are Unsplash-sourced (https://unsplash.com/license) and hosted locally in `public/blog/` (synced from `Guideedit/images/` + `Blogedit/images/`).
- **Icons:** Lucide (https://lucide.dev/license — ISC) via `@lucide/astro`
- **Fonts:** Inter, Noto Sans Devanagari & JetBrains Mono (OFL), self-hosted in `public/fonts/`
- **PDF worker:** `pdfjs-dist` (Apache-2.0), bundled from `node_modules` via Vite (no public copy needed)

If you reuse this codebase, keep third-party license notices and replace API keys / live data fetches with your own.

## Project structure

```
/
├── public/             # static assets (favicon, og image, fonts, blog covers)
├── Guideedit/ + Blogedit/  # EDIT HERE: post .md files (auto-synced to src/data/blog/)
├── src/
│   ├── components/     # Astro components
│   ├── data/           # tools registry, categories, calculators, blog posts, live-snapshot.json
│   ├── layouts/        # BaseLayout
│   ├── lib/            # calculators, Nepal date/price/forex libs
│   ├── pages/          # routes — /nepal/*, /tools/*, /blog/*, /guides/*
│   └── styles/         # global.css + design tokens
├── scripts/            # sync-content.mjs, fetch-live-data.mjs
└── tests/              # 496 tests (node --test)
```

To add/edit a post: copy `Guideedit/_TEMPLATE.md` (or `Blogedit/_TEMPLATE.md`) to a new
`slug-name.md`, fill it in, rebuild — `sync-content.mjs` regenerates the registry on
every `npm run dev` / `npm run build`.

## Commands

| Command           | Action                                      |
| :---------------- | :------------------------------------------ |
| `npm install`     | Install dependencies (Node >= 22.12)        |
| `npm run dev`     | Dev server at `localhost:4321`              |
| `SKIP_LIVE_FETCH=1 npm run dev` | Fast restart: skip live-data API fetch |
| `npm run build`   | Production build to `./dist/`               |
| `npm run preview` | Preview build locally                       |
| `npm run deploy`  | Build and deploy to Cloudflare Workers      |
| `npm test`        | Run 496 tests                               |

## Live prices after hosting

Gold/silver (FENEGOSIDA), fuel/LPG (NOC) and currency rates (NRB) stay live
without rebuilds: `src/worker.js` exposes same-origin `GET /api/live/metals`,
`/api/live/fuel` and `/api/live/forex`, proxying the free upstream APIs with
6h edge caching. The gold, silver, fuel and foreign-exchange pages (plus the
remittance calculator's rate fetch) refresh themselves from these routes on
load and silently keep the baked snapshot if the fetch fails. Weather needs
no proxy — `/weather` already re-fetches Open-Meteo directly in the browser
(CORS-open) with a wttr.in backup. Upstream parsers live in
`src/lib/nepal/live-upstream.js` (shared by the build-time fetcher and the
worker) and are covered by `tests/live-upstream.test.mjs`. Deploys with
`npm run deploy` include the worker automatically (`main` in `wrangler.jsonc`).

## License for this codebase

Original code & content © SolutionsNepal. You may not copy-publish SolutionsNepal articles verbatim. Reuse logic with attribution; respect third-party licenses listed above.

## Sources & accuracy

Live prices/rates show source + last-updated time (NRB, FENEGOSIDA, NOC, Open-Meteo). Calculators are estimates — always confirm with the relevant office/bank before acting.

## Contributing

Found a wrong slab or broken tool? Open an issue or PR with the page URL + screenshot.
