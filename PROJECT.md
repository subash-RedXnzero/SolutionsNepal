# SolutionsNepal — Complete Project Reference

## Overview

SolutionsNepal is a free, open-source Nepal-focused web platform providing calculators, converters, price checkers, and everyday utility tools. All calculations run client-side in the browser — no data is collected, no accounts required.

**URL:** https://solutionsnepal.com
**Repo:** Git repo (Astro project). Production: Cloudflare Workers static assets (`wrangler.jsonc`, `./dist`).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Astro 7.2.3 |
| Styling | Tailwind CSS v4.3.3 (via Vite plugin) |
| Icons | @lucide/astro 1.32.0 |
| Date Conversion | @sbmdkl/nepali-date-converter 2.0.5 |
| Language | JavaScript (no TypeScript in src, except config) |
| Node | >=22.12.0 |
| TypeScript Config | astro/tsconfigs/strict |

**No React, Vue, Svelte, or other UI frameworks.** Pure Astro components with vanilla JS client scripts.

---

## Commands

```bash
npm run dev          # Start dev server (localhost:4321)
SKIP_LIVE_FETCH=1 npm run dev  # Fast restart: reuse live-data snapshot, no API fetch
npm run build        # Build to dist/
npm run preview      # Preview production build
npm test             # Run 480 tests (node --test)
npm run smoke        # Route/content smoke check (needs dev server or URL arg)
astro dev --background  # Background dev server
astro dev stop       # Stop background server
astro dev status     # Check background server
astro dev logs       # View dev server logs
```

`npm run dev` / `npm run build` auto-run `scripts/sync-content.mjs` (edit-folder → site data)
and `scripts/fetch-live-data.mjs` (NRB/FENEGOSIDA/NOC/Open-Meteo → `src/data/live-snapshot.json`,
skipped when the snapshot is under 30 min old).

---

## Project Structure (133 route files, 85 tools, 16 categories, 79 posts)

```
solutionsnepal/
├── public/                    # Static assets (served as-is, copied to dist/)
│   ├── fonts/                 # Self-hosted woff2 (Inter, Noto Devanagari, JetBrains Mono)
│   ├── blog/                  # Local post covers (synced from edit-folder images/)
│   ├── favicon.ico
│   ├── favicon.svg
│   ├── hero.webp
│   ├── llms.txt               # AI-readable site description
│   ├── robots.txt
│   └── _headers               # Cloudflare cache/security headers
├── config/
│   └── neaRules.ts            # NEA electricity rules (TypeScript)
├── tests/                     # 29 test files, 480 tests (node --test)
│   ├── calendar, nea-bill, payslip-checker, salary-engine, vehicle-tax,
│   ├── age-calculator, date-diff, nepali-numbers, nepali-unicode, likhit,
│   ├── emi/sip/fd/vat/ssf/dashain-bonus/rent-vs-buy/ownership-cost/wedding-budget,
│   ├── foreign-employment-cost, business-registration, government-services,
│   ├── pdf-tools, image-compress, logo-resize, photo-requirements, photo-resize-pipeline,
│   ├── qr-payloads, share-params, weather-live (+ more — see tests/)
├── src/
│   ├── styles/
│   │   └── global.css         # Design tokens, theme, base styles
│   ├── layouts/
│   │   └── BaseLayout.astro   # Root layout (head, nav, footer, dark mode)
│   ├── components/            # 34 reusable components
│   │   ├── blog/
│   │   │   └── BlogPostLayout.astro
│   │   ├── calculator/
│   │   │   ├── CalculatorCard.astro
│   │   │   └── ResultPanel.astro
│   │   ├── cards/
│   │   │   ├── CategoryCard.astro
│   │   │   └── ToolCard.astro
│   │   ├── home/
│   │   │   ├── HeroImage.astro
│   │   │   ├── Homepage.astro    # Main homepage component
│   │   │   └── Icon.astro
│   │   ├── layout/
│   │   │   └── Footer.astro
│   │   ├── navigation/
│   │   │   ├── MobileNav.astro
│   │   │   ├── Navbar.astro
│   │   │   └── Sidebar.astro     # Category sidebar with icons
│   │   ├── search/
│   │   │   └── SearchModal.astro  # Cmd+K search
│   │   └── ui/
│   │       ├── Breadcrumbs.astro
│   │       ├── Image.astro
│   │       └── RelatedTools.astro
│   ├── data/                  # Static data and configuration
│   │   ├── tools.js           # Master tool registry (85 tools)
│   │   ├── categories.js      # 16 categories with icons/colors
│   │   ├── blog-posts.js      # AUTO-GENERATED registry (79 posts: 45 guides + 34 blog)
│   │   ├── blog/              # AUTO-GENERATED per-post data (from Guideedit/ + Blogedit/)
│   │   ├── guides.js          # Guide listing + JOURNAL_SLUGS (auto-synced from Blogedit/)
│   │   ├── live-snapshot.json # Live NRB/FENEGOSIDA/NOC/Open-Meteo data (via fetch-live-data.mjs)
│   │   ├── equivalenceData.js
│   │   └── nepal/
│   │       ├── calendar-events.js
│   │       ├── holidays.js
│   │       ├── foreign-income-tax-data.js
│   │       ├── education/nebGradingData.js
│   │       ├── house-rent/    # fy-2083-84.js, rules.js
│   │       ├── payroll/rules.js
│   │       ├── property/      # fee-rules.js, land-reg-locations.js, locations.js
│   │       ├── rental/tax-rules.js
│   │       ├── ssf/current.js
│   │       ├── tax/           # fy-2082-83.js, fy-2083-84.js, index.js
│   │       ├── vehicle/       # fees.js, provinces.js, tax-rules.js, vehicle-tax-data.js
│   │       └── water/kukl-tariffs.js
│   ├── lib/                   # Calculation engines and services
│   │   ├── calculators/       # 46 calculator modules
│   │   ├── converters/        # gold.js, land.js
│   │   ├── nepal/             # Services: calendar, forex, fuel, gold, silver, nepal-time
│   │   ├── payslip/ocr.js
│   │   └── utils/             # npr.js (canonical), format.js (deprecated shim)
│   └── pages/                 # 133 route files
│       ├── index.astro
│       ├── about.astro
│       ├── contact.astro
│       ├── privacy.astro
│       ├── terms.astro
│       ├── weather.astro
│       ├── 404.astro
│       ├── foreign-exchange-nepal.astro
│       ├── silver-price-nepal.astro
│       ├── data/tools.json.js # Static search-index endpoint (lazy site search)
│       ├── blog/
│       │   ├── [...page].astro
│       │   └── [slug].astro
│       ├── guides/[slug].astro
│       └── nepal/             # All Nepal tools
│           ├── index.astro
│           ├── calendar.astro
│           ├── fuel-price-nepal.astro
│           ├── gold-price-nepal.astro
│           ├── date/          # bs-to-ad, ad-to-bs
│           ├── education/     # see-gpa, neb-gpa, ugc-equivalence
│           ├── electricity/   # bill-calculator
│           ├── finance/       # emi, salary-checker, salary-tax, house-rent-tax, rent-tax, overtime, foreign-income-tax, remittance
│           ├── gold/          # tola-to-gram, gram-to-tola
│           ├── land/          # ropani-to-aana, aana-to-ropani
│           ├── nepse/         # profit-loss
│           ├── property/      # land-registration, property-registration-cost
│           ├── tools/         # nepali-unicode
│           ├── transport/     # vehicle-tax
│           ├── utilities/     # electricity-bill, kukl-water-bill
│           └── vehicle/       # fuel-cost
├── dist/                      # Production build output
├── package.json
├── tsconfig.json
├── astro.config.mjs
├── design.md                  # Design system documentation
├── llms.txt                   # (root copy, superseded by public/llms.txt)
├── AGENTS.md / CLAUDE.md      # Dev agent instructions
├── README.md                  # Project readme (features, commands, sources)
└── skills-lock.json
```

---

## All Routes (core routes verified HTTP 200 — full 85-tool registry in `src/data/tools.js`)

### Top-Level Pages
| Route | File | Description |
|-------|------|-------------|
| `/` | `pages/index.astro` | Homepage with search, today's prices, forex, popular tools |
| `/about` | `pages/about.astro` | About SolutionsNepal |
| `/contact` | `pages/contact.astro` | Contact page |
| `/blog` | `pages/blog/[...page].astro` | Blog listing (paginated) |
| `/blog/[slug]` | `pages/blog/[slug].astro` | Individual blog post |
| `/foreign-exchange-nepal` | `pages/foreign-exchange-nepal.astro` | NRB forex rates, search, converter |
| `/silver-price-nepal` | `pages/silver-price-nepal.astro` | Silver prices, chart, calculator |
| `/sitemap.xml` | `pages/sitemap.xml.js` | XML sitemap |

### Nepal Tools
| Route | Description |
|-------|-------------|
| `/nepal` | All tools listing page with sidebar |
| `/nepal/calendar` | Nepali calendar, Tithi, events, holidays |
| `/nepal/fuel-price-nepal` | Petrol/diesel/kerosene prices by city |
| `/nepal/gold-price-nepal` | Gold prices, chart, calculator |

### Date Converters
| Route | Description |
|-------|-------------|
| `/nepal/date/bs-to-ad` | Bikram Sambat → Gregorian |
| `/nepal/date/ad-to-bs` | Gregorian → Bikram Sambat |

### Finance
| Route | Description |
|-------|-------------|
| `/nepal/finance/salary-checker` | Salary calculator with SSF, tax, TDS |
| `/nepal/finance/salary-tax` | Income tax by fiscal year |
| `/nepal/finance/emi-calculator` | Loan EMI calculator |
| `/nepal/finance/house-rent-tax` | Rental income tax |
| `/nepal/finance/rent-tax` | Rent tax info |
| `/nepal/finance/overtime-calculator` | Overtime pay calculator |
| `/nepal/finance/foreign-income-tax-calculator` | Foreign income tax |
| `/nepal/finance/remittance-calculator` | Currency conversion with NRB rates |

### Education
| Route | Description |
|-------|-------------|
| `/nepal/education/see-gpa` | SEE GPA calculator |
| `/nepal/education/neb-gpa-calculator` | NEB Class 11/12 GPA |
| `/nepal/education/tu-ugc-equivalence-calculator` | UGC equivalence |

### Gold & Land Converters
| Route | Description |
|-------|-------------|
| `/nepal/gold/tola-to-gram` | Tola → Gram |
| `/nepal/gold/gram-to-tola` | Gram → Tola |
| `/nepal/land/ropani-to-aana` | Ropani → Aana |
| `/nepal/land/aana-to-ropani` | Aana → Ropani |

### Property
| Route | Description |
|-------|-------------|
| `/nepal/property/land-registration` | Land registration fees |
| `/nepal/property/property-registration-cost` | Full property cost |

### Vehicles & Transport
| Route | Description |
|-------|-------------|
| `/nepal/transport/vehicle-tax` | Vehicle tax, fines, renewal |
| `/nepal/vehicle/fuel-cost` | Trip fuel cost calculator |

### Electricity & Utilities
| Route | Description |
|-------|-------------|
| `/nepal/electricity/bill-calculator` | NEA bill by ampere |
| `/nepal/utilities/electricity-bill` | NEA bill estimate |
| `/nepal/utilities/kukl-water-bill` | KUKL water bill estimate |

### NEPSE
| Route | Description |
|-------|-------------|
| `/nepal/nepse/profit-loss` | Stock profit/loss calculator |

### Tools
| Route | Description |
|-------|-------------|
| `/nepal/tools/nepali-unicode` | Nepali Unicode typing |

---

## Calculation Engines (src/lib/calculators/)

| File | Purpose |
|------|---------|
| `nepal-salary.js` | Nepal salary engine (SSF, tax slabs, TDS, attendance) |
| `nepal-payslip-checker.js` | Payslip verification engine |
| `emi.js` | EMI formula (reducing balance) |
| `electricity.js` + `electricity-rules.js` | NEA electricity bill |
| `nea-bill.js` | NEA bill by ampere band |
| `vehicle-tax.js` | Vehicle tax + fines per province/FY |
| `house-rent-tax.js` | Rental income tax |
| `rental-tax.js` | Rental tax rules |
| `foreign-income-tax.js` | Foreign income tax |
| `remittance.js` | Remittance conversion |
| `overtime.js` | Overtime pay |
| `gpa.js` | SEE GPA |
| `neb-gpa.js` | NEB Class 11/12 GPA |
| `equivalence.js` | UGC equivalence |
| `fuel-cost.js` | Trip fuel cost |
| `kukl-water.js` | KUKL water bill |
| `land-registration.js` | Land registration fees |
| `property-registration.js` | Property registration cost |
| `nepse.js` | NEPSE profit/loss |
| `nepali-unicode.js` | Romanized → Nepali Unicode |

---

## Data Services (src/lib/nepal/)

| File | Purpose | Source |
|------|---------|--------|
| `calendar.js` | BS ↔ AD conversion, events, holidays | @sbmdkl/nepali-date-converter + local data |
| `nepal-time.js` | Current date/time in Nepal (Asia/Kathmandu) | System clock + timezone |
| `forex.js` | Foreign exchange rates | NRB (mock data, replace with API) |
| `fuel-price.js` | Petrol/diesel prices by city | NOC (mock data, replace with API) |
| `gold-price.js` | Gold prices, history, calculator | FENEGOSIDA (mock data, replace with API) |
| `silver-price.js` | Silver prices, history, calculator | FENEGOSIDA (mock data, replace with API) |

---

## Design System

**File:** `design.md` + `src/styles/global.css`

- **Language:** Tailwind CSS v4 with custom CSS properties (`--nk-*` tokens)
- **Theme:** Light (#FAF9F6 background) + Dark (#1D1D1F) via `[data-theme]` attribute
- **Accent color:** Action Teal #1F5D5B (only interactive color)
- **Typography:** SF Pro system stack, JetBrains Mono for numbers/kbd
- **Shape:** 18px card radius, pill (9999px) for actions, 8px compact
- **Dark mode:** `localStorage` + `prefers-color-scheme`, no FOUC
- **Responsive:** Mobile-first, single column, no horizontal scroll
- **Numbers:** Indian grouping via `en-IN` locale (`Rs. 1,00,000`)

---

## Test Suites (480 tests, 0 failures — `npm test`, 6 suites, 29 files)

| Area | Files | What it covers |
|------|-------|----------------|
| Dates & calendar | `calendar`, `date-diff`, `age-calculator` | BS↔AD conversion, events, holidays, month/day/age math |
| Money | `salary-engine`, `payslip-checker`, `ssf-calculator`, `vat`, `sip`, `fd-calculator`, `dashain-bonus`, `rent-vs-buy`, `ownership-cost`, `wedding-budget`, `foreign-employment-cost`, `business-registration` | SSF/tax slabs, payslip checks, EMI/SIP/FD/VAT math, cost estimators |
| Utilities | `nea-bill`, `vehicle-tax`, `nepali-numbers`, `nepali-unicode`, `likhit` | Tariffs, fines, number words, transliteration |
| Documents & media | `pdf-tools`, `image-compress`, `logo-resize`, `photo-requirements`, `photo-resize-pipeline`, `qr-payloads` | PDF ops, image targets, QR payloads |
| Platform | `government-services`, `share-params`, `weather-live` | Service registry/links, URL params, weather adapter |

---

## Key Data Files

| File | Content |
|------|---------|
| `data/tools.js` | Master registry of 85 tools with id, title, description, category, href, popular flag |
| `data/categories.js` | 16 categories with id, name, icon (lucide), color, href, tools count |
| `data/blog-posts.js` | AUTO-GENERATED registry of 79 posts (45 guides + 34 blog) with sections, headings, tags |
| `data/nepal/tax/fy-2082-83.js` | Tax slabs FY 2082/83 |
| `data/nepal/tax/fy-2083-84.js` | Tax slabs FY 2083/84 (with SSF waiver) |
| `data/nepal/ssf/current.js` | SSF rates and rules |
| `data/nepal/vehicle/vehicle-tax-data.js` | Vehicle tax data for all 7 provinces |
| `data/nepal/vehicle/tax-rules.js` | Vehicle tax computation rules |
| `data/nepal/vehicle/fees.js` | Renewal fees |
| `data/nepal/vehicle/provinces.js` | Province list |
| `data/nepal/house-rent/fy-2083-84.js` | House rent tax rules |
| `data/nepal/property/fee-rules.js` | Land registration fees |
| `data/nepal/rental/tax-rules.js` | Rental tax rules |
| `data/nepal/water/kukl-tariffs.js` | KUKL water tariff slabs |
| `data/nepal/education/nebGradingData.js` | NEB grading system |
| `data/nepal/foreign-income-tax-data.js` | Foreign income tax rules |
| `data/nepal/calendar-events.js` | Nepali calendar events and festivals |
| `data/nepal/holidays.js` | Nepali holidays |
| `data/nepal/payroll/rules.js` | Payroll calculation rules |
| `data/equivalenceData.js` | UGC equivalence data |

---

## Utilities (src/lib/utils/)

| File | Exports |
|------|---------|
| `npr.js` | `formatNumber(value, decimals?)`, `formatNPR()`, `formatRupee()`, `formatRupeeBilingual()`, `round2()`, `toDevanagari()`, `formatPercent()`, `parseNumber()`, `copyToClipboard()` — the single home for shared UI formatting |
| `format.js` | DEPRECATED re-export shim (import from `npr.js` instead) |

**Note:** `formatNumber(value, decimals?)` honors explicit decimals (converters use `4`) and auto-selects 0-or-2 decimals when omitted (salary/homepage); non-finite input renders `"0"`. Engine-local `formatNPR`/`formatNumber` copies inside `lib/calculators/` and `lib/nepal/` are per-engine tested APIs — intentionally untouched.

---

## Configuration Files

| File | Purpose |
|------|---------|
| `astro.config.mjs` | Astro + Tailwind Vite plugin |
| `tsconfig.json` | Strict mode, includes .astro types |
| `config/neaRules.ts` | NEA electricity tariff rules (TypeScript) |
| `AGENTS.md` | Dev agent instructions (astro dev --background) |
| `CLAUDE.md` | Same as AGENTS.md |
| `design.md` | Design system documentation |
| `skills-lock.json` | Freebuff skills lock |

---

## Data Sources (as used by implementation)

| Source | Used For | Status |
|--------|----------|--------|
| Nepal Rastra Bank (NRB) | Foreign exchange rates | LIVE via `live-snapshot.json` (fetch-live-data.mjs) |
| Nepal Oil Corporation (NOC) | Fuel prices | LIVE via `live-snapshot.json` (homepage ticker scrape) |
| FENEGOSIDA | Gold & silver prices | LIVE via `live-snapshot.json` |
| Open-Meteo | Weather + air quality (10 cities) | LIVE via `live-snapshot.json` |
| Nepal Electricity Authority (NEA) | Electricity tariffs | Rule-based in `electricity-rules.js` |
| KUKL | Water tariffs | Rule-based in `kukl-tariffs.js` |
| Inland Revenue Department (IRD) | Tax slabs, SSF | Rule-based in `data/nepal/tax/` |
| NEB / SEE | Education grading | Rule-based in `nebGradingData.js` |
| @sbmdkl/nepali-date-converter | BS↔AD dates | npm package |

**Live data flow:** `scripts/fetch-live-data.mjs` (predev/prebuild, 30-min TTL, `SKIP_LIVE_FETCH=1` to skip)
→ `src/data/live-snapshot.json` → `src/lib/nepal/providers/live-snapshot.js` → `forex.js` / `gold-price.js` /
`silver-price.js` / `fuel-price.js` / `weather.js`. Failed sources fall back to the previous snapshot
(marked stale) or built-in mock values — the UI labels each section live/stale accordingly.

---

## Known Issues / Technical Debt

1. **Contact form needs `WEB3FORMS_ACCESS_KEY`** — without the env var, submissions use a placeholder key and fail (`contact.astro:6`)
3. **Heavy pages by design** — `/` ~283 KB, `/nepal` ~416 KB HTML, mostly inlined scoped CSS (`inlineStylesheets: 'always'`). Validate with PageSpeed before changing the tradeoff
4. **Build scale (measured: fine)** — 1221 pages build in ~13s (name pages render at ~2–3 ms each). No optimization needed; revisit only if this degrades
5. **Last third-party runtime deps** — payslip OCR lazy-loads tesseract/pdf.js from jsDelivr (`ocr.js`); translator calls Google Translate on user action. Candidates for self-hosting later

---

## Quick Reference: Tool → Route Mapping (core tools — complete list in `src/data/tools.js`)

```
nepali-calendar     → /nepal/calendar
bs-to-ad            → /nepal/date/bs-to-ad
ad-to-bs            → /nepal/date/ad-to-bs
gold-price          → /nepal/gold-price-nepal
silver-price        → /silver-price-nepal
fuel-price          → /nepal/fuel-price-nepal
forex               → /foreign-exchange-nepal
salary-checker      → /nepal/finance/salary-checker
salary-tax          → /nepal/finance/salary-tax
emi-calculator      → /nepal/finance/emi-calculator
house-rent-tax      → /nepal/finance/house-rent-tax
rent-tax            → /nepal/finance/rent-tax
overtime            → /nepal/finance/overtime-calculator
foreign-income-tax  → /nepal/finance/foreign-income-tax-calculator
remittance          → /nepal/finance/remittance-calculator
see-gpa             → /nepal/education/see-gpa
neb-gpa             → /nepal/education/neb-gpa-calculator
ugc-equivalence     → /nepal/education/tu-ugc-equivalence-calculator
electricity-bill    → /nepal/electricity/bill-calculator
nea-bill            → /nepal/utilities/electricity-bill
kukl-water          → /nepal/utilities/kukl-water-bill
vehicle-tax         → /nepal/transport/vehicle-tax
fuel-cost           → /nepal/vehicle/fuel-cost
land-registration   → /nepal/property/land-registration
property-reg-cost   → /nepal/property/property-registration-cost
ropani-to-aana      → /nepal/land/ropani-to-aana
aana-to-ropani      → /nepal/land/aana-to-ropani
tola-to-gram        → /nepal/gold/tola-to-gram
gram-to-tola        → /nepal/gold/gram-to-tola
nepse-profit-loss   → /nepal/nepse/profit-loss
nepali-unicode      → /nepal/tools/nepali-unicode
```
