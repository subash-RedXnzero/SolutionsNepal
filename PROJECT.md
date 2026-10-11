# SolutionsNepal — Complete Project Reference

## Overview

SolutionsNepal is a free, open-source Nepal-focused web platform providing calculators, converters, price checkers, and everyday utility tools. All calculations run client-side in the browser — no data is collected, no accounts required.

**URL:** https://solutionsnepal.com
**Repo:** Local Astro project (not a git repo)

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
npm run build        # Build to dist/
npm run preview      # Preview production build
npm test             # Run 112 tests (node --test)
astro dev --background  # Background dev server
astro dev stop       # Stop background server
astro dev status     # Check background server
astro dev logs       # View dev server logs
```

---

## Project Structure (124 source files, ~30,500 lines)

```
solutionsnepal/
├── public/                    # Static assets (served as-is)
│   ├── favicon.ico
│   ├── favicon.svg
│   ├── hero.webp
│   ├── llms.txt               # AI-readable site description
│   └── robots.txt
├── config/
│   └── neaRules.ts            # NEA electricity rules (TypeScript)
├── tests/                     # 5 test suites, 112 tests
│   ├── calendar.test.mjs
│   ├── nea-bill.test.mjs
│   ├── payslip-checker.test.mjs
│   ├── salary-engine.test.mjs
│   └── vehicle-tax.test.mjs
├── src/
│   ├── styles/
│   │   └── global.css         # Design tokens, theme, base styles
│   ├── layouts/
│   │   └── BaseLayout.astro   # Root layout (head, nav, footer, dark mode)
│   ├── components/            # 16 reusable components
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
│   │   ├── tools.js           # Master tool registry (27 tools)
│   │   ├── categories.js      # 13 categories with icons/colors
│   │   ├── blog-posts.js      # 10 blog posts (JS, not Markdown)
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
│   │   ├── calculators/       # 18 calculator modules
│   │   ├── converters/        # gold.js, land.js
│   │   ├── nepal/             # Services: calendar, forex, fuel, gold, silver, nepal-time
│   │   ├── payslip/ocr.js
│   │   └── utils/             # format.js, npr.js
│   └── pages/                 # 40+ route files
│       ├── index.astro
│       ├── about.astro
│       ├── contact.astro
│       ├── 404.astro
│       ├── foreign-exchange-nepal.astro
│       ├── silver-price-nepal.astro
│       ├── sitemap.xml.js
│       ├── blog/
│       │   ├── [...page].astro
│       │   └── [slug].astro
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
├── README.md                  # (still Astro starter template)
└── skills-lock.json
```

---

## All Routes (verified HTTP 200)

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

## Test Suites (112 tests, 0 failures)

| File | Tests | What it covers |
|------|-------|----------------|
| `calendar.test.mjs` | 24 | BS↔AD conversion, events, holidays, month views |
| `nea-bill.test.mjs` | 12 | NEA bill by ampere (5A/15A/30A/60A), slabs, edge cases |
| `payslip-checker.test.mjs` | 16 | Payslip verification, SSF, TDS, double-count detection |
| `salary-engine.test.mjs` | 48 | Salary engine: SSF, tax slabs, FY switching, attendance, overtime, per-component |
| `vehicle-tax.test.mjs` | 12 | Vehicle tax: all provinces, fine bands, multi-year arrears |

---

## Key Data Files

| File | Content |
|------|---------|
| `data/tools.js` | Master registry of 27 tools with id, title, description, category, href, popular flag |
| `data/categories.js` | 13 categories with id, name, icon (lucide), color, href, tools count |
| `data/blog-posts.js` | 10 blog posts as JS objects with sections, headings, tags |
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
| `format.js` | `formatNPR()`, `formatNumber()`, `formatPercent()`, `parseNumber()`, `copyToClipboard()` |
| `npr.js` | `round2()`, `formatRupee()`, `formatNumber()`, `toDevanagari()`, `formatRupeeBilingual()` |

**Note:** `formatNPR` and `formatNumber` exist in both files with slightly different behavior. `npr.js` conditionally shows decimals; `format.js` always uses 2dp for currency.

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
| Nepal Rastra Bank (NRB) | Foreign exchange rates | Mock data in `forex.js` (needs real API) |
| Nepal Oil Corporation (NOC) | Fuel prices | Mock data in `fuel-price.js` (needs real API) |
| FENEGOSIDA | Gold & silver prices | Mock data in `gold-price.js`, `silver-price.js` (needs real API) |
| Nepal Electricity Authority (NEA) | Electricity tariffs | Rule-based in `electricity-rules.js` |
| KUKL | Water tariffs | Rule-based in `kukl-tariffs.js` |
| Inland Revenue Department (IRD) | Tax slabs, SSF | Rule-based in `data/nepal/tax/` |
| NEB / SEE | Education grading | Rule-based in `nebGradingData.js` |
| @sbmdkl/nepali-date-converter | BS↔AD dates | npm package |

**Important:** Gold, silver, fuel, and forex data are currently hardcoded mock values. The code is structured to swap in real API calls.

---

## Known Issues / Technical Debt

1. **Mock data** — Gold, silver, fuel, and forex prices are hardcoded (not live API)
2. **Duplicate utils** — `formatNPR`/`formatNumber` in both `format.js` and `npr.js`
3. **Broken internal links** — Blog posts reference `/nepal/tools` for Age Calculator, BMI Calculator, percentage calculator (those tools don't exist)
4. **Empty categories** — `currency` and `travel` directories exist but have no pages
5. **README** — Still the default Astro starter template
6. **Footer** — Links to `/privacy` and `/terms` which don't exist
7. **Not a git repo** — No version control initialized

---

## Quick Reference: Tool → Route Mapping

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
