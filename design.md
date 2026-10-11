# SolutionsNepal — Design Spec

This document is the design source of truth for SolutionsNepal (Astro + Tailwind v4).
It documents the shared design system. All other project documentation (README,
tool pages) is preserved and unchanged.

## 1. Design System

- **Framework**: Astro pages + island-free client scripts, Tailwind CSS v4.
- **Design language**: Apple-style restraint — near-invisible UI, hairline-flat
  cards (18px radius), full-bleed alternating tiles as section dividers,
  single-accent discipline. No decorative gradients or card shadows; elevation
  is reserved for floating overlays only (search modal).
- **Theme tokens** (defined in `src/styles/global.css`, surfaced as `--nk-*`):
  - `--nk-bg` warm off-white #FAF8F4 (light) / #171717 (dark) /
    `--nk-surface` white #FFFFFF (light) / #222222 (dark)
  - `--nk-text` #171717 almost-black / `--nk-text-secondary` #6B6B6B
  - `--nk-border` #E8E3DC / `--nk-accent` Nepal-inspired red #E62B1E is the
    ONLY interactive color (links, CTAs, focus rings, hero search); positive
    prices/results use green #16A34A, gold accents use #D9A441
  - Radius grammar: 18px cards / 20–24px hero surfaces / pill (9999px) for
    search, chips and buttons
  - Light + dark themes via `[data-theme]`, with `prefers-reduced-motion`
    honoured globally.
- **Typography**: SF Pro system stack (`-apple-system, BlinkMacSystemFont,
  'SF Pro …', Inter fallback`). Body 17px/400/1.47 with -0.011em tracking;
  display weight 600 (never 700/500), h1 clamp→56px/1.07, h2 clamp→40px,
  h3 21px. JetBrains Mono kept for numeric/kbd data only.
- **Shape grammar**: pill (9999px) for actions/search/chips · 18px cards ·
  8px compact utility. Press state: `scale(0.98)` on cards/chips.
- **Numbers**: Nepali rupee amounts always use South-Asian grouping via
  `en-IN` locale: `Rs. 1,00,000`. Single `formatNPR` helper (`src/lib/utils/`).
- **Layout**: search-first homepage hierarchy — WHAT DO YOU WANT TO DO? →
  hero search box (the smart assistant) → Nepal Today strip → Quick Tools →
  Smart Tools → Life Workflows → Popular links. Alternating warm-white /
  white band backgrounds with hairline dividers, max-w-[1100px] containers,
  big typography + generous whitespace + small icons; responsive grids,
  mobile-first single column, no horizontal scroll, no fixed-px widths.