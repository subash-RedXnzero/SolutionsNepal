/**
 * Construction Material — Calculation Engine
 * =========================================
 * Pure, deterministic functions. All assumptions imported from
 * src/data/construction/construction-material.js
 * @module construction-material
 */
import {
  UNITS,
  CONCRETE_MIX,
  PLASTER_MIX,
  PLASTER_DEFAULT,
  BRICK,
  BRICK_MORTAR_RATIO,
  TILE_SIZES,
  STEEL_DIAMETERS,
  FULL_PROJECT_FACTORS,
  DEFAULT_WASTAGE_PCT,
} from '../../data/construction/construction-material.js';

// ── Helpers ────────────────────────────────────────────────────────
export function sanitize(v, fallback = 0) {
  const n = typeof v === 'string' ? Number(String(v).replace(/,/g, '').trim()) : Number(v);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return n;
}
export function sanitizeInt(v, fallback = 0) {
  return Math.max(0, Math.floor(sanitize(v, fallback)));
}
export function clampWastage(p) {
  const n = sanitize(p, DEFAULT_WASTAGE_PCT);
  return Math.max(0, Math.min(50, n));
}
export function toMeters(value, unit) {
  const n = sanitize(value, 0);
  if (unit === 'm') return n;
  if (unit === 'ft') return n * UNITS.FT_TO_M;
  if (unit === 'in') return n * UNITS.IN_TO_M;
  return n;
}
export function formatNumber(n, decimals = 2) {
  if (!Number.isFinite(n)) return '0';
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);
}
export function formatInt(n) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(n));
}
export function formatNPR(n) { return formatInt(n); }

// ── Concrete ───────────────────────────────────────────────────────
/**
 * @param {object} p { length, width, depth, unit: 'ft'|'m', grade: 'M10'|..., customRatio:[c,s,a], wastagePct }
 * Ratio: [cement, sand, aggregate]
 */
export function calcConcrete({ length = 0, width = 0, depth = 0, unit = 'ft', grade = 'M15', customRatio = null, wastagePct = 5 } = {}) {
  const L = toMeters(length, unit);
  const W = toMeters(width, unit);
  const D = toMeters(depth, unit);
  if (L <= 0 || W <= 0 || D <= 0) return null;
  const volumeM3 = L * W * D;
  const wastage = clampWastage(wastagePct);
  const volWithWastage = volumeM3 * (1 + wastage / 100);

  const mix = CONCRETE_MIX[grade] || CONCRETE_MIX.M15;
  let ratio = mix.ratio;
  if (grade === 'CUSTOM' && Array.isArray(customRatio) && customRatio.length === 3) {
    ratio = customRatio.map((v) => sanitize(v, 0));
    if (ratio.some((v) => v <= 0)) ratio = [1, 2, 4];
  }
  const sumRatio = ratio.reduce((a, b) => a + b, 0);
  const dryVolume = volWithWastage * (mix.dryFactor || 1.54);

  const cementVolume = dryVolume * (ratio[0] / sumRatio);
  const sandVolume = dryVolume * (ratio[1] / sumRatio);
  const aggregateVolume = dryVolume * (ratio[2] / sumRatio);

  const cementBags = cementVolume / UNITS.CEMENT_BAG_VOLUME_M3;
  const cementKg = cementBags * UNITS.CEMENT_BAG_KG;

  return {
    volumeM3,
    volumeWithWastageM3: volWithWastage,
    wastagePct: wastage,
    ratio,
    dryVolumeM3: dryVolume,
    cementBags,
    cementBagsCeiled: Math.ceil(cementBags),
    cementKg,
    sandM3: sandVolume,
    aggregateM3: aggregateVolume,
    sandCuFt: sandVolume * UNITS.M3_TO_CUFT,
    aggregateCuFt: aggregateVolume * UNITS.M3_TO_CUFT,
  };
}

// ── Brickwork ──────────────────────────────────────────────────────
export function calcBrickwork({ length = 0, height = 0, thickness = 0, unit = 'ft', brickSize = 'standard', customBrick = null, mortarThicknessM = null, wastagePct = 5, mortarRatio = null } = {}) {
  const L = toMeters(length, unit);
  const H = toMeters(height, unit);
  const T = toMeters(thickness, unit) || 0.23; // default 1 brick thick if not given
  if (L <= 0 || H <= 0) return null;
  const areaM2 = L * H;
  const volumeM3 = areaM2 * T;

  // Brick dimensions
  let brick = BRICK.standard;
  if (brickSize === 'custom' && customBrick) {
    brick = {
      lengthM: sanitize(customBrick.lengthM, BRICK.standard.lengthM),
      widthM: sanitize(customBrick.widthM, BRICK.standard.widthM),
      heightM: sanitize(customBrick.heightM, BRICK.standard.heightM),
    };
  }
  const mThickness = mortarThicknessM != null ? sanitize(mortarThicknessM, BRICK.mortarThicknessM) : BRICK.mortarThicknessM;
  const wastage = clampWastage(wastagePct);

  // Bricks per m2/m3 estimation
  const effLength = brick.lengthM + mThickness;
  const effHeight = brick.heightM + mThickness;
  const bricksPerM2 = 1 / (effLength * effHeight);
  // For volume, bricks per m3 approx
  const effWidth = brick.widthM + mThickness;
  const brickVol = brick.lengthM * brick.widthM * brick.heightM;
  const effBrickVol = effLength * effWidth * effHeight;
  const bricksPerM3 = 1 / effBrickVol;

  const bricks = volumeM3 * bricksPerM3 * (1 + wastage / 100);
  // Alternative via area if thickness small: use per m2
  // We keep volume-based as more accurate for thick walls.

  // Mortar volume = wall volume - bricks volume
  const actualBricksVol = (bricks / (1 + wastage / 100)) * brickVol;
  let mortarVol = Math.max(0, volumeM3 - actualBricksVol);
  mortarVol *= 1 + wastage / 100; // wastage on mortar too? commonly yes

  const ratio = mortarRatio || BRICK_MORTAR_RATIO;
  const sum = ratio.cement + ratio.sand;
  const cementVol = mortarVol * (ratio.cement / sum);
  const sandVol = mortarVol * (ratio.sand / sum);
  const cementBags = cementVol / UNITS.CEMENT_BAG_VOLUME_M3;

  return {
    areaM2,
    areaSqFt: areaM2 / UNITS.SQFT_TO_SQM,
    volumeM3,
    volumeCuFt: volumeM3 * UNITS.M3_TO_CUFT,
    wastagePct: wastage,
    brick,
    mThickness,
    bricks: Math.ceil(bricks),
    bricksRaw: bricks,
    mortarVolM3: mortarVol,
    cementBags,
    cementBagsCeiled: Math.ceil(cementBags),
    cementKg: cementBags * UNITS.CEMENT_BAG_KG,
    sandM3: sandVol,
    sandCuFt: sandVol * UNITS.M3_TO_CUFT,
  };
}

// ── Plaster ────────────────────────────────────────────────────────
export function calcPlaster({ length = 0, height = 0, unit = 'ft', numWalls = 1, thicknessM = null, mixKey = '1:4', customRatio = null, wastagePct = 5 } = {}) {
  const L = toMeters(length, unit);
  const H = toMeters(height, unit);
  const walls = Math.max(1, sanitizeInt(numWalls, 1));
  if (L <= 0 || H <= 0) return null;
  const areaM2 = L * H * walls;
  const t = thicknessM != null ? sanitize(thicknessM, PLASTER_DEFAULT.thicknessM) : PLASTER_DEFAULT.thicknessM;
  const wastage = clampWastage(wastagePct);

  const wetVolume = areaM2 * t;
  const dryVolume = wetVolume * 1.27; // plaster dry factor
  const volWithWastage = dryVolume * (1 + wastage / 100);

  let ratio = PLASTER_MIX[mixKey];
  if (mixKey === 'custom' && customRatio) ratio = customRatio;
  if (!ratio) ratio = PLASTER_MIX['1:4'];
  const sum = ratio.cement + ratio.sand;
  const cementVol = volWithWastage * (ratio.cement / sum);
  const sandVol = volWithWastage * (ratio.sand / sum);
  const cementBags = cementVol / UNITS.CEMENT_BAG_VOLUME_M3;

  return {
    areaM2,
    areaSqFt: areaM2 / UNITS.SQFT_TO_SQM,
    thicknessM: t,
    walls,
    wetVolumeM3: wetVolume,
    dryVolumeM3: volWithWastage,
    wastagePct: wastage,
    ratio,
    cementBags,
    cementBagsCeiled: Math.ceil(cementBags),
    cementKg: cementBags * UNITS.CEMENT_BAG_KG,
    sandM3: sandVol,
    sandCuFt: sandVol * UNITS.M3_TO_CUFT,
  };
}

// ── Flooring / Tiles ───────────────────────────────────────────────
export function calcFlooring({ length = 0, width = 0, unit = 'ft', tileId = '12x12', customTile = null, wastagePct = 7 } = {}) {
  const L = toMeters(length, unit);
  const W = toMeters(width, unit);
  if (L <= 0 || W <= 0) return null;
  const areaM2 = L * W;
  const areaSqFt = areaM2 / UNITS.SQFT_TO_SQM;
  const wastage = clampWastage(wastagePct);

  let tile = TILE_SIZES.find((t) => t.id === tileId);
  if (tileId === 'custom' && customTile) {
    tile = { lengthM: sanitize(customTile.lengthM, 0.3048), widthM: sanitize(customTile.widthM, 0.3048) };
  }
  if (!tile) tile = TILE_SIZES[0];
  const tileArea = tile.lengthM * tile.widthM;
  const tiles = areaM2 / tileArea;
  const tilesWithWastage = tiles * (1 + wastage / 100);

  return {
    areaM2,
    areaSqFt,
    tile,
    wastagePct: wastage,
    tiles: Math.ceil(tiles),
    tilesCeiledWithWastage: Math.ceil(tilesWithWastage),
    tilesRaw: tiles,
    tilesWithWastageRaw: tilesWithWastage,
  };
}

// ── Steel ──────────────────────────────────────────────────────────
// Weight kg/m = d^2 / 162  (d in mm)
// Total weight = kg/m * length * bars
export function steelWeightPerMeter(diaMm) {
  const d = sanitize(diaMm, 0);
  if (d <= 0) return 0;
  return (d * d) / UNITS.STEEL_FORMULA_DIVISOR;
}
export function calcSteel({ diaMm = 12, barLengthM = 12, numBars = 1, totalLengthM = null, wastagePct = 3 } = {}) {
  const d = sanitize(diaMm, 12);
  const kgPerM = steelWeightPerMeter(d);
  const wastage = clampWastage(wastagePct);
  let totalLength = 0;
  if (totalLengthM != null && sanitize(totalLengthM, 0) > 0) {
    totalLength = sanitize(totalLengthM, 0);
  } else {
    const len = sanitize(barLengthM, 12);
    const n = Math.max(0, sanitizeInt(numBars, 0));
    totalLength = len * n;
  }
  totalLength *= 1 + wastage / 100;
  const weightKg = totalLength * kgPerM;
  return {
    diaMm: d,
    kgPerM,
    totalLengthM: totalLength,
    weightKg,
    weightTon: weightKg / 1000,
    wastagePct: wastage,
  };
}
export function calcSteelFromBars(bars = []) {
  // bars: [{diaMm, lengthM, count}]
  let totalLen = 0;
  let totalKg = 0;
  const details = bars.map((b) => {
    const d = sanitize(b.diaMm, 12);
    const len = sanitize(b.lengthM, 12);
    const c = sanitizeInt(b.count, 0);
    const kgm = steelWeightPerMeter(d);
    const l = len * c;
    const kg = l * kgm;
    totalLen += l;
    totalKg += kg;
    return { diaMm: d, lengthM: len, count: c, kgPerM: kgm, totalLength: l, weightKg: kg };
  });
  return { details, totalLengthM: totalLen, totalWeightKg: totalKg, totalTon: totalKg / 1000 };
}

// ── Full Project (preliminary) ─────────────────────────────────────
export function calcFullProject({ builtUpArea = 0, areaUnit = 'sqft', floors = 1, buildingType = 'residential', quality = 'standard', selected = null } = {}) {
  const areaSqft = areaUnit === 'sqm' ? sanitize(builtUpArea, 0) / UNITS.SQFT_TO_SQM : sanitize(builtUpArea, 0);
  const totalArea = areaSqft * Math.max(1, sanitize(floors, 1));
  if (totalArea <= 0) return null;
  const qMult = FULL_PROJECT_FACTORS.qualityMultiplier[quality] ?? 1;
  const tMult = FULL_PROJECT_FACTORS.buildingTypeMultiplier[buildingType] ?? 1;
  const mult = qMult * tMult;

  const base = FULL_PROJECT_FACTORS.base;
  const cementBags = totalArea * base.cementBagsPerSqft * mult;
  const sandM3 = totalArea * base.sandM3PerSqft * mult;
  const aggregateM3 = totalArea * base.aggregateM3PerSqft * mult;
  const bricks = totalArea * base.bricksPerSqft * mult;
  const steelKg = totalArea * base.steelKgPerSqft * mult;

  const sel = selected || { concrete: true, brickwork: true, plaster: true, flooring: true, steel: true };

  return {
    totalAreaSqft: totalArea,
    totalAreaSqm: totalArea * UNITS.SQFT_TO_SQM,
    floors: Math.max(1, sanitize(floors, 1)),
    buildingType,
    quality,
    multiplier: mult,
    selected: sel,
    cementBags: sel.concrete || sel.plaster || sel.brickwork ? cementBags : 0,
    cementBagsCeiled: sel.concrete || sel.plaster || sel.brickwork ? Math.ceil(cementBags) : 0,
    cementKg: cementBags * UNITS.CEMENT_BAG_KG,
    sandM3: sel.concrete || sel.plaster || sel.brickwork ? sandM3 : 0,
    aggregateM3: sel.concrete ? aggregateM3 : 0,
    bricks: sel.brickwork ? Math.ceil(bricks) : 0,
    steelKg: sel.steel ? steelKg : 0,
    steelTon: sel.steel ? steelKg / 1000 : 0,
  };
}
