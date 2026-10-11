/**
 * Paint Calculator — Centralized assumptions & options (Nepal)
 * ============================================================
 * All editable defaults live here. Coverage and wastage are planning
 * assumptions — always defer to the manufacturer's label.
 */

export const LAST_CHECKED = 'September 2026';

export const COAT_OPTIONS = [1, 2, 3];
export const PRIMER_COAT_OPTIONS = [1, 2];

export const CAN_SIZES = [
  { id: '1', label: '1 L', liters: 1 },
  { id: '4', label: '4 L', liters: 4 },
  { id: '10', label: '10 L', liters: 10 },
  { id: '20', label: '20 L', liters: 20 },
  { id: 'custom', label: 'Custom', liters: null },
];

/** Practical waste allowance applied visibly to the final quantity. */
export const DEFAULT_WASTAGE_PCT = 10;

export const DEFAULTS = {
  mode: 'room',
  doors: 1,
  doorW: 3,
  doorH: 7,
  windows: 2,
  windowW: 4,
  windowH: 4,
  skipOpenings: false,
  includeCeiling: false,
  coats: 2,
  coverage: 120,
  wastagePct: DEFAULT_WASTAGE_PCT,
  canId: null,
  primerEnabled: false,
  primerCoats: 1,
  primerCoverage: 120,
};

export const LIMITS = {
  maxDimensionFt: 1000,
  maxAreaSqft: 1000000,
  maxAmount: 1e10,
  maxRate: 100000,
  maxCoverage: 1000,
  maxCount: 100,
};
