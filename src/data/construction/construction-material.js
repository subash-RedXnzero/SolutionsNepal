/**
 * Construction Material — Centralized Assumptions
 * ==============================================
 * All assumed ratios, sizes and densities live here — NO hard-coded
 * values inside the calculator engine or UI. Update this file only.
 *
 * DISCLAIMER: These are planning estimates. Actual quantities depend on
 * structural drawings, mix design, site conditions, wastage, material
 * specifications and professional engineering calculations.
 */

export const LAST_CHECKED = '2026-09-13';

// ── Units ──────────────────────────────────────────────────────────
export const UNITS = {
  // 50 kg is the common Nepal cement bag; state assumption in UI.
  CEMENT_BAG_KG: 50,
  CEMENT_BAG_VOLUME_M3: 0.0347, // approx volume of 50kg bag
  // Steel formula: kg/m = d^2 / 162  (d in mm)
  STEEL_FORMULA_DIVISOR: 162,
  M3_TO_CUFT: 35.3147,
  FT_TO_M: 0.3048,
  IN_TO_M: 0.0254,
  SQFT_TO_SQM: 0.092903,
};

// ── Mix Ratios (cement : sand : aggregate) ─────────────────────────
// Dry volume factor for concrete ~1.54 (wet volume * 1.54 = dry volume)
export const CONCRETE_MIX = {
  M10: { label: 'M10 (1:3:6)', ratio: [1, 3, 6], dryFactor: 1.54 },
  M15: { label: 'M15 (1:2:4)', ratio: [1, 2, 4], dryFactor: 1.54 },
  M20: { label: 'M20 (1:1.5:3)', ratio: [1, 1.5, 3], dryFactor: 1.54 },
  M25: { label: 'M25 (1:1:2)', ratio: [1, 1, 2], dryFactor: 1.54 },
  CUSTOM: { label: 'Custom Mix', ratio: null, dryFactor: 1.54 },
};

// ── Plaster ────────────────────────────────────────────────────────
export const PLASTER_MIX = {
  '1:4': { cement: 1, sand: 4 },
  '1:5': { cement: 1, sand: 5 },
  '1:6': { cement: 1, sand: 6 },
};
export const PLASTER_DEFAULT = {
  thicknessM: 0.012, // 12 mm
  wastagePct: 5,
};

// ── Brickwork ──────────────────────────────────────────────────────
// Standard Nepal brick approx 230 x 110 x 55 mm (modular varies)
export const BRICK = {
  standard: { lengthM: 0.23, widthM: 0.11, heightM: 0.055, label: 'Standard Nepal brick (230×110×55 mm)' },
  mortarThicknessM: 0.01, // 10 mm
  wastagePct: 5,
};
// Mortar for brickwork (often 1:6) — estimated cement/sand for mortar volume
export const BRICK_MORTAR_RATIO = { cement: 1, sand: 6 };

// ── Flooring / Tiles ───────────────────────────────────────────────
export const TILE_SIZES = [
  { id: '12x12', label: '12 × 12 in', lengthM: 0.3048, widthM: 0.3048 },
  { id: '24x24', label: '24 × 24 in', lengthM: 0.6096, widthM: 0.6096 },
  { id: '16x16', label: '16 × 16 in', lengthM: 0.4064, widthM: 0.4064 },
];
export const FLOORING_DEFAULT = { wastagePct: 7 };

// ── Steel ──────────────────────────────────────────────────────────
export const STEEL_DIAMETERS = [8, 10, 12, 16, 20, 25, 32]; // mm
export const STEEL_BAR_LENGTH_M = 12; // standard length
export const STEEL_WASTAGE_PCT = 3;

// ── Full Project (preliminary) ─────────────────────────────────────
// Very rough planning factors per sq.ft. built-up — NOT for execution.
export const FULL_PROJECT_FACTORS = {
  // kg cement per sq.ft. is derived from concrete/brick/plaster; these are simplified.
  // We use a blend approach: estimate from built-up area with quality multiplier.
  base: {
    cementBagsPerSqft: 0.45, // bags per sq.ft.
    sandM3PerSqft: 0.022,
    aggregateM3PerSqft: 0.028,
    bricksPerSqft: 9,
    steelKgPerSqft: 2.2,
  },
  qualityMultiplier: { basic: 0.85, standard: 1.0, premium: 1.25 },
  buildingTypeMultiplier: { residential: 1.0, commercial: 1.08 },
};

// ── Generic ────────────────────────────────────────────────────────
export const DEFAULT_WASTAGE_PCT = 5;
export const MAX_DIMENSION_M = 500;
export const MAX_WASTAGE_PCT = 50;

// ── Labels for UI ──────────────────────────────────────────────────
export const CONCRETE_GRADES = Object.keys(CONCRETE_MIX); // ['M10','M15','M20','M25','CUSTOM']
export const BRICK_SIZE_OPTIONS = ['standard', 'custom'];
