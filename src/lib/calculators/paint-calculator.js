/**
 * Paint Calculator — Pure calculation engine (Nepal)
 * ==================================================
 * Deterministic, no DOM. All defaults from src/data/paint-calculator.js
 * Units: feet + sq ft throughout (inputs are ft-based by design).
 *
 * @module paint-calculator
 */

import { LIMITS, DEFAULT_WASTAGE_PCT } from '../../data/paint-calculator.js';

export function sanitizeNum(v, max = LIMITS.maxDimensionFt) {
  if (v == null || String(v).trim() === '') return NaN;
  const n = Number(String(v).replace(/,/g, '').trim());
  if (!Number.isFinite(n)) return NaN;
  return Math.min(n, max);
}

export function sanitizeAmount(v) {
  if (v == null || String(v).trim() === '') return 0;
  const n = Number(String(v).replace(/,/g, '').replace(/^Rs\.?\s*/i, '').trim());
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, LIMITS.maxAmount);
}

export function formatNPR(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 'Rs 0';
  const sign = v < 0 ? '-' : '';
  return `${sign}Rs ${new Intl.NumberFormat('en-IN').format(Math.abs(Math.round(v)))}`;
}

export function formatArea(n) {
  if (!Number.isFinite(n)) return '—';
  return `${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(n))} sq ft`;
}

export function formatLiters(n) {
  if (!Number.isFinite(n)) return '—';
  return `${(Math.round(n * 10) / 10).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} L`;
}

/**
 * @param {object} p
 * Room mode: length,width,height (ft) + openings + ceiling flag.
 * Custom mode: areaSqft used directly as paintable wall area.
 */
export function calcPaint({
  mode = 'room',
  length = NaN, width = NaN, height = NaN,
  areaSqft = NaN,
  doors = 0, doorW = 0, doorH = 0,
  windows = 0, windowW = 0, windowH = 0,
  skipOpenings = false,
  includeCeiling = false,
  coats = 2,
  coverage = 120,
  wastagePct = DEFAULT_WASTAGE_PCT,
  pricePerLiter = 0,
  canLiters = 0,
  primerEnabled = false,
  primerCoats = 1,
  primerCoverage = 120,
  primerPrice = 0,
} = {}) {
  const errors = [];
  const req = (v, label) => {
    if (!Number.isFinite(v) || v <= 0) { errors.push(label); return 0; }
    return v;
  };

  let wallArea = 0, doorArea = 0, windowArea = 0, ceilingArea = 0;
  let paintableWall = 0;

  if (mode === 'custom') {
    const area = sanitizeNum(areaSqft, LIMITS.maxAreaSqft);
    if (!Number.isFinite(area) || area <= 0) errors.push('Enter a paintable area greater than 0.');
    paintableWall = Math.max(0, area || 0);
  } else {
    const L = req(sanitizeNum(length), 'Enter a room length greater than 0.');
    const W = req(sanitizeNum(width), 'Enter a room width greater than 0.');
    const H = req(sanitizeNum(height), 'Enter a wall height greater than 0.');
    wallArea = 2 * (L + W) * H;

    if (!skipOpenings) {
      const nd = Math.max(0, Math.floor(Number(doors) || 0));
      const nw = Math.max(0, Math.floor(Number(windows) || 0));
      if (Number(doors) < 0 || Number(windows) < 0) errors.push('Number of doors/windows cannot be negative.');
      if (nd > 0) {
        const dw = sanitizeNum(doorW), dh = sanitizeNum(doorH);
        if (!Number.isFinite(dw) || dw <= 0 || !Number.isFinite(dh) || dh <= 0)
          errors.push('Enter door width and height greater than 0.');
        else doorArea = nd * dw * dh;
      }
      if (nw > 0) {
        const ww = sanitizeNum(windowW), wh = sanitizeNum(windowH);
        if (!Number.isFinite(ww) || ww <= 0 || !Number.isFinite(wh) || wh <= 0)
          errors.push('Enter window width and height greater than 0.');
        else windowArea = nw * ww * wh;
      }
    }
    paintableWall = Math.max(0, wallArea - doorArea - windowArea);
    if (includeCeiling && wallArea > 0) {
      const L = sanitizeNum(length), W = sanitizeNum(width);
      ceilingArea = (Number.isFinite(L) && Number.isFinite(W)) ? L * W : 0;
    }
  }

  if (![1, 2, 3].includes(Number(coats))) errors.push('Select a valid number of coats (1–3).');
  const cov = sanitizeNum(coverage, LIMITS.maxCoverage);
  if (!Number.isFinite(cov) || cov <= 0) errors.push('Enter paint coverage greater than 0 sq ft/L.');
  const price = sanitizeAmount(pricePerLiter);
  if (price < 0) errors.push('Paint price cannot be negative.');
  const can = Number(canLiters) || 0;
  if (can < 0) errors.push('Can size must be greater than 0.');
  const waste = Math.max(0, Math.min(100, Number(wastagePct) || 0));

  let primer = null;
  if (primerEnabled) {
    const pc = [1, 2].includes(Number(primerCoats)) ? Number(primerCoats) : NaN;
    const pcov = sanitizeNum(primerCoverage, LIMITS.maxCoverage);
    const pprice = sanitizeAmount(primerPrice);
    if (!Number.isFinite(pc)) errors.push('Select valid primer coats (1–2).');
    if (!Number.isFinite(pcov) || pcov <= 0) errors.push('Enter primer coverage greater than 0 sq ft/L.');
    if (Number.isFinite(pc) && Number.isFinite(pcov) && pcov > 0) {
      const pLiters = ((paintableWall + ceilingArea) * pc) / pcov;
      const pWithWaste = pLiters * (1 + waste / 100);
      primer = { liters: pLiters, withWaste: pWithWaste, cost: pWithWaste * pprice };
    }
  }

  if (errors.length > 0) {
    return {
      valid: false, errors, wallArea, doorArea, windowArea, ceilingArea,
      paintableWall, paintableTotal: 0, paintArea: 0, liters: 0, withWaste: 0,
      purchaseLiters: 0, cans: 0, canTotal: 0, leftover: 0, paintCost: 0,
      primer, primerCost: 0, totalCost: 0, coats: Number(coats) || 0,
      coverage: cov, wastagePct: waste, price,
    };
  }

  const paintableTotal = paintableWall + ceilingArea;
  const paintArea = paintableTotal * Number(coats);
  const liters = paintArea / cov;
  const withWaste = liters * (1 + waste / 100);

  let cans = 0, canTotal = 0, leftover = 0, purchaseLiters = Math.ceil(withWaste);
  if (can > 0) {
    cans = Math.ceil(withWaste / can);
    canTotal = cans * can;
    leftover = Math.max(0, canTotal - withWaste);
    purchaseLiters = canTotal;
  }
  const paintCost = purchaseLiters * price;
  const primerCost = primer ? primer.cost : 0;

  return {
    valid: true, errors: [], wallArea, doorArea, windowArea, ceilingArea,
    paintableWall, paintableTotal, paintArea, liters, withWaste,
    purchaseLiters, cans, canTotal, leftover, paintCost,
    primer, primerCost, totalCost: paintCost + primerCost,
    coats: Number(coats), coverage: cov, wastagePct: waste, price,
  };
}
