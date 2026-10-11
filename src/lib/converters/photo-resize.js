/**
 * Smart Target-Size Photo Compression Engine (client-side)
 * =========================================================
 *
 * Objective: minimize |actualBlobSize - targetSize| using REAL generated
 * Blob sizes (never estimates), while guaranteeing:
 *
 *   1. Output is never larger than the original file (unless the caller
 *      explicitly allows it), and
 *   2. Quality reduction is tried BEFORE dimension reduction, so the image
 *      is not destroyed unnecessarily.
 *
 * Strategy (JPG):
 *   Phase 1 — at full target resolution, binary-search JPEG quality for the
 *             size closest to the target.
 *   Phase 2 — only if even the lowest reasonable quality is still above the
 *             target, step the dimensions down (keeping aspect ratio) and
 *             repeat the quality search per step.
 *
 * PNG has no quality dial, so it searches dimensions + canvas settings and
 * reports honestly when a small target cannot be reached.
 */

import { formatBytes } from './image-compress.js';

export { formatBytes };

const MIN_DIMENSION = 150;      // never shrink below this side length
const QUALITY_FLOOR = 0.3;      // below this JPEG looks broken — stop
const DIM_STEP = 0.85;          // each dimension-reduction step keeps 85%
const CLOSE_ENOUGH_RATIO = 0.02; // within 2% of target → stop searching

function toBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Canvas export failed.'))),
      type,
      quality,
    );
  });
}

/**
 * Draw `source` onto a new canvas of w×h (aspect ratio must already match).
 */
export function scaleCanvas(source, w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, w, h);
  return c;
}

function typeSupportsAlpha(type) {
  return type === 'image/png' || type === 'image/webp';
}

/**
 * Binary-search the encoder quality at fixed dimensions to land as close to
 * `targetBytes` as possible. Returns { blob, bytes, quality } best found.
 */
async function searchQuality(source, targetBytes, type, lo = QUALITY_FLOOR, hi = 0.95) {
  let best = null;

  // Evaluate endpoints first so we know the achievable range.
  const evalQuality = async (q) => {
    const blob = await toBlob(source, type, q);
    const entry = { blob, bytes: blob.size, quality: q };
    const bestDist = best ? Math.abs(best.bytes - targetBytes) : Infinity;
    const dist = Math.abs(entry.bytes - targetBytes);
    if (!best || dist < bestDist) best = entry;
    return entry;
  };

  let loEntry = await evalQuality(lo);
  let hiEntry = await evalQuality(hi);

  // If the whole range is under target, the highest quality is closest.
  if (hiEntry.bytes <= targetBytes) return best;
  // If the whole range is over target, the lowest quality is closest.
  if (loEntry.bytes >= targetBytes) return best;

  // Otherwise bisect ~8 times (enough to converge within ~1% size).
  while (hi - lo > 0.01) {
    if (best && Math.abs(best.bytes - targetBytes) / targetBytes < CLOSE_ENOUGH_RATIO) break;
    const mid = (lo + hi) / 2;
    const entry = await evalQuality(mid);
    if (entry.bytes > targetBytes) {
      hi = mid; // still too big → reduce quality
    } else {
      lo = mid; // under target → try higher quality
    }
    void loEntry; void hiEntry;
  }

  return best;
}

/**
 * Main entry point.
 *
 * @param {HTMLCanvasElement} source  Fully composed crop (already cropped,
 *                                    background-filled by the caller).
 * @param {Object} opts
 * @param {number} opts.targetBytes        Desired file size in bytes.
 * @param {string} [opts.format]           'image/jpeg' | 'image/png'
 * @param {number} [opts.originalBytes]    Size of the user's uploaded file.
 * @param {boolean} [opts.allowLarger]     Allow output larger than original.
 * @returns {Promise<{blob:Blob, bytes:number, width:number, height:number,
 *                     quality:number|null, reachedTarget:boolean,
 *                     scaledDown:boolean, iterations:number}>}
 */
export async function compressToTarget(source, opts = {}) {
  const {
    targetBytes = null,
    format = 'image/jpeg',
    originalBytes = Infinity,
    allowLarger = false,
  } = opts;

  const cap = (bytes) => (allowLarger ? bytes : Math.min(bytes, originalBytes));
  const effectiveTarget = targetBytes ? Math.min(targetBytes, cap(targetBytes)) : null;

  let iterations = 0;
  let best = null; // { blob, bytes, width, height, quality, scaledDown }
  let scaledDown = false;

  const consider = (candidate) => {
    candidate.bytes = candidate.blob.size;
    if (!allowLarger && candidate.bytes > originalBytes) return false;
    iterations++;
    if (
      !best ||
      Math.abs(candidate.bytes - (effectiveTarget === null ? 0 : effectiveTarget)) <
        Math.abs(best.bytes - (effectiveTarget === null ? 0 : effectiveTarget)) ||
      (effectiveTarget === null && candidate.bytes < best.bytes)
    ) {
      best = candidate;
      return true;
    }
    return false;
  };

  const sw = source.width;
  const sh = source.height;

  // ── Phase 1: quality search at full resolution ──────────────────
  if (format === 'image/jpeg' && effectiveTarget !== null) {
    const qBest = await searchQuality(source, effectiveTarget, format);
    if (qBest) {
      consider({ blob: qBest.blob, width: sw, height: sh, quality: qBest.quality, scaledDown: false });
    }
    if (best && best.bytes <= effectiveTarget * (1 + CLOSE_ENOUGH_RATIO)) {
      return finish();
    }
  } else {
    // PNG or no target: single export at high quality.
    const blob = await toBlob(source, format, format === 'image/jpeg' ? 0.92 : undefined);
    consider({ blob, width: sw, height: sh, quality: null, scaledDown: false });
    if (effectiveTarget === null || (best && best.bytes <= effectiveTarget)) return finish();
  }

  // ── Phase 2: dimension reduction ladder ─────────────────────────
  if (effectiveTarget !== null && best && best.bytes > effectiveTarget) {
    let factor = DIM_STEP;
    while (factor > 0.15) {
      const nw = Math.max(MIN_DIMENSION, Math.round(sw * factor));
      const nh = Math.max(MIN_DIMENSION, Math.round(sh * factor));
      if (nw >= sw && nh >= sh) break;
      if (Math.min(nw, nh) <= MIN_DIMENSION) break;

      const smaller = scaleCanvas(source, nw, nh);

      if (format === 'image/jpeg') {
        // Only bother if the previous floor was near the target.
        const qBest = await searchQuality(smaller, effectiveTarget, format);
        if (qBest) {
          consider({ blob: qBest.blob, width: nw, height: nh, quality: qBest.quality, scaledDown: true });
        }
        if (best && best.bytes <= effectiveTarget * (1 + CLOSE_ENOUGH_RATIO)) break;
      } else {
        const blob = await toBlob(smaller, format);
        consider({ blob, width: nw, height: nh, quality: null, scaledDown: true });
        if (best && best.bytes <= effectiveTarget) break;
      }

      // Stop early once we cross under the target going down — the next
      // step would overshoot smaller than needed... but keep one extra
      // step to see whether it lands closer. We simply continue; `consider`
      // keeps whichever is objectively closest to the target.
      factor *= DIM_STEP;
      scaledDown = true;
    }
  }

  // Nothing valid (e.g. every candidate exceeded the original): signal caller.
  if (!best) return null;
  return finish();

  function finish() {
    return {
      ...best,
      reachedTarget: effectiveTarget === null ? true : best.bytes <= effectiveTarget * 1.05,
      iterations,
    };
  }
}

/**
 * Quick validation of an uploaded image file.
 */
export function validatePhoto(file) {
  if (!file) return { valid: false, error: 'No photo selected.' };
  const okTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const nameOk = /\.(jpe?g|png|webp)$/i.test(file.name);
  if (!okTypes.includes(file.type) && !nameOk) {
    return { valid: false, error: 'Please upload a JPG, PNG or WEBP image.' };
  }
  if (file.size === 0) return { valid: false, error: 'The file is empty.' };
  if (file.size > 50 * 1024 * 1024) {
    return { valid: false, error: 'File too large. Maximum supported size is 50 MB.' };
  }
  return { valid: true };
}
