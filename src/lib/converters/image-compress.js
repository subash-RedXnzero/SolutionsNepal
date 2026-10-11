/**
 * Image Compression Engine — Aggressive Target Size
 * ==================================================
 * Client-side image compression that ACTIVELY tries to reach the user's
 * target file size. Never gives up early. Iteratively reduces quality
 * and dimensions until the target is approached.
 *
 * Priority:
 * 1. Reach the user's requested target size
 * 2. Get as CLOSE to the target as possible (not way below)
 * 3. Preserve best visual quality at that size
 * 4. Preserve aspect ratio
 *
 * Strategy:
 * 1. Try quality reduction at full dimensions (binary search)
 * 2. If still over target, try format conversion (PNG→WebP/JPEG)
 * 3. If still over target, gradually reduce dimensions
 * 4. At each dimension, search quality again
 * 5. Always return the result closest to target (never original if smaller is possible)
 *
 * @module image-compress
 */

/**
 * UPNG is loaded lazily (dynamic import) instead of statically because its
 * single-file bundle chokes Vite's dev optimizer ("504 Outdated Optimize
 * Dep"), which killed every page importing this module in dev. Production
 * bundling is unaffected — Rollup still includes it. Callers must tolerate
 * a null return (PNG-lossless path is skipped, WebP/JPEG fallback covers it).
 */
let _upngPromise = null;
function loadUPNG() {
  if (!_upngPromise) {
    _upngPromise = import('upng-js').then((m) => m.default || m).catch(() => null);
  }
  return _upngPromise;
}

const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_DIMENSION = 8192;

// ═══════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════

export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i];
}

export function getExtFromMime(mime) {
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

export function isSupported(file) {
  return SUPPORTED_TYPES.includes(file.type);
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
    img.src = url;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((blob) => resolve(blob), type, quality);
    } catch (e) {
      resolve(null);
    }
  });
}

function drawToCanvas(img, w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  c.getContext('2d').drawImage(img, 0, 0, w, h);
  return c;
}

// ═══════════════════════════════════════════════════════════════════════
// JPEG METADATA STRIP
// ═══════════════════════════════════════════════════════════════════════

function stripJpegMetadata(arrayBuffer) {
  const src = new Uint8Array(arrayBuffer);
  const dst = [];
  let i = 0;
  if (src[0] !== 0xFF || src[1] !== 0xD8) return new Blob([src], { type: 'image/jpeg' });
  dst.push(0xFF, 0xD8); i = 2;

  while (i < src.length - 1) {
    if (src[i] !== 0xFF) { while (i < src.length) dst.push(src[i++]); break; }
    const m = src[i + 1];
    if (m === 0xD9) { dst.push(0xFF, 0xD9); i += 2; break; }
    if (m === 0xDA) { while (i < src.length) dst.push(src[i++]); break; }
    if ((m >= 0xD0 && m <= 0xD7) || m === 0x01) { dst.push(0xFF, m); i += 2; continue; }
    if (i + 3 >= src.length) break;
    const sz = (src[i + 2] << 8) | src[i + 3];
    const keep = (m >= 0xC0 && m <= 0xCF) || m === 0xC4 || m === 0xDB || m === 0xDD;
    if (keep) { for (let j = i; j < i + 2 + sz && j < src.length; j++) dst.push(src[j]); }
    i += 2 + sz;
  }
  return new Blob([new Uint8Array(dst)], { type: 'image/jpeg' });
}

// ═══════════════════════════════════════════════════════════════════════
// CORE COMPRESSION — Tries hard to reach the target
// ═══════════════════════════════════════════════════════════════════════

/**
 * Binary search for the HIGHEST quality that produces a blob <= targetBytes.
 * Returns { blob, quality } or null if even the lowest quality exceeds target.
 */
async function findBestQuality(canvas, mime, targetBytes) {
  // First check: can the lowest quality even reach the target?
  const lowestBlob = await canvasToBlob(canvas, mime, 0.05);
  if (!lowestBlob || lowestBlob.size > targetBytes) return null;

  // Binary search: find highest quality <= target
  let lo = 0.05;
  let hi = 0.95;

  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    const blob = await canvasToBlob(canvas, mime, mid);
    if (!blob) { hi = mid - 0.01; continue; }
    if (blob.size <= targetBytes) {
      lo = mid; // can go higher
    } else {
      hi = mid; // too big, go lower
    }
  }

  // Collect candidates in a narrow band around the threshold
  const bandLo = Math.max(0.05, lo - 0.10);
  const bandHi = Math.min(0.95, lo + 0.10);
  const candidates = [];

  for (let q = bandHi; q >= bandLo; q -= 0.01) {
    const qRound = Math.round(q * 100) / 100;
    const blob = await canvasToBlob(canvas, mime, qRound);
    if (blob && blob.size > 0 && blob.size <= targetBytes) {
      candidates.push({ blob, quality: qRound });
    }
  }

  // Pick the candidate closest to target (largest that fits)
  let best = null;
  for (const c of candidates) {
    if (!best || c.blob.size > best.blob.size) best = c;
  }
  return best;
}

/**
 * Find the best quality for a given canvas at full dimensions.
 * Tries the preferred format, then falls back to others.
 * Returns { blob, formatChanged } or null.
 */
async function findBestAtDimensions(canvas, img, targetBytes, preferredMime) {
  const formats = [preferredMime, 'image/webp', 'image/jpeg'].filter(
    (m, i, arr) => arr.indexOf(m) === i // deduplicate
  );

  let best = null;
  let bestMime = preferredMime;

  for (const mime of formats) {
    const found = await findBestQuality(canvas, mime, targetBytes);
    if (found && found.blob) {
      if (!best || found.blob.size > best.blob.size) {
        best = found;
        bestMime = mime;
      }
    }
  }

  if (best) {
    return {
      blob: best.blob,
      formatChanged: bestMime !== preferredMime,
      outputFormat: bestMime,
    };
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPRESSION PIPELINE
// ═══════════════════════════════════════════════════════════════════════

export async function compressLosslessToTarget(file, targetBytes) {
  const originalBytes = file.size;

  // Already under target
  if (originalBytes <= targetBytes) {
    const img = await loadImage(file);
    return {
      blob: file,
      width: img.naturalWidth,
      height: img.naturalHeight,
      originalBytes,
      optimizedBytes: originalBytes,
      targetBytes,
      reached: true,
      message: 'Image is already under the target size.',
    };
  }

  const img = await loadImage(file);
  let width = img.naturalWidth;
  let height = img.naturalHeight;

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    return {
      blob: file, width, height,
      originalBytes, optimizedBytes: originalBytes, targetBytes,
      reached: false,
      message: 'Image dimensions exceed maximum supported size.',
    };
  }

  const originalMime = file.type;
  let bestBlob = null;
  let bestWidth = width;
  let bestHeight = height;
  let bestFormatChanged = false;
  let bestOutputFormat = originalMime;

  // ── Step 1: Try JPEG metadata strip ──
  if (originalMime === 'image/jpeg') {
    try {
      const buf = await file.arrayBuffer();
      const stripped = stripJpegMetadata(buf);
      if (stripped.size <= targetBytes) {
        bestBlob = stripped;
        bestWidth = width;
        bestHeight = height;
        bestOutputFormat = 'image/jpeg';
      }
    } catch (e) { /* */ }
  }

  // ── Step 2: Try quality reduction at full dimensions ──
  if (!bestBlob || bestBlob.size > targetBytes) {
    const canvas = drawToCanvas(img, width, height);
    const result = await findBestAtDimensions(canvas, img, targetBytes, originalMime);
    if (result && result.blob) {
      if (!bestBlob || result.blob.size > bestBlob.size) {
        bestBlob = result.blob;
        bestWidth = width;
        bestHeight = height;
        bestFormatChanged = result.formatChanged;
        bestOutputFormat = result.outputFormat;
      }
    }
  }

  // ── Step 3: Try PNG→WebP/JPEG conversion if original is PNG ──
  if (originalMime === 'image/png' && (!bestBlob || bestBlob.size > targetBytes)) {
    // Try UPNG lossless first
    try {
      const UPNG = await loadUPNG();
      if (!UPNG) throw new Error('upng unavailable');
      const buf = await file.arrayBuffer();
      const decoded = UPNG.decode(new Uint8Array(buf));
      const frames = UPNG.toRGBA8(decoded);
      const compressed = UPNG.encode(frames, decoded.width, decoded.height, 0);
      const blob = new Blob([compressed], { type: 'image/png' });
      if (blob.size <= targetBytes) {
        if (!bestBlob || blob.size > bestBlob.size) {
          bestBlob = blob;
          bestFormatChanged = false;
          bestOutputFormat = 'image/png';
        }
      }
    } catch (e) { /* */ }

    // If still over target, try WebP/JPEG at full dimensions
    if (!bestBlob || bestBlob.size > targetBytes) {
      const canvas = drawToCanvas(img, width, height);
      for (const mime of ['image/webp', 'image/jpeg']) {
        const found = await findBestQuality(canvas, mime, targetBytes);
        if (found && found.blob) {
          if (!bestBlob || found.blob.size > bestBlob.size) {
            bestBlob = found.blob;
            bestWidth = width;
            bestHeight = height;
            bestFormatChanged = true;
            bestOutputFormat = mime;
          }
        }
      }
    }
  }

  // ── Step 4: If still over target, try dimension scaling ──
  if (!bestBlob || bestBlob.size > targetBytes) {
    // Start from 90% and go down to 10%
    for (let pct = 90; pct >= 10; pct -= 5) {
      const scale = pct / 100;
      const w = Math.max(1, Math.round(width * scale));
      const h = Math.max(1, Math.round(height * scale));
      const canvas = drawToCanvas(img, w, h);

      // Try all formats at this dimension
      for (const mime of ['image/webp', 'image/jpeg', 'image/png']) {
        const found = await findBestQuality(canvas, mime, targetBytes);
        if (found && found.blob) {
          if (!bestBlob || found.blob.size > bestBlob.size) {
            bestBlob = found.blob;
            bestWidth = w;
            bestHeight = h;
            bestFormatChanged = mime !== originalMime;
            bestOutputFormat = mime;
          }
        }
      }

      // If we found something close to target (within 80%), stop shrinking
      if (bestBlob && bestBlob.size <= targetBytes && bestBlob.size >= targetBytes * 0.8) {
        break;
      }
    }
  }

  // ── Step 5: Last resort — absolute minimum quality + tiny dimensions ──
  if (!bestBlob || bestBlob.size > targetBytes) {
    const minW = Math.max(1, Math.round(width * 0.1));
    const minH = Math.max(1, Math.round(height * 0.1));
    const canvas = drawToCanvas(img, minW, minH);

    for (const mime of ['image/webp', 'image/jpeg']) {
      const blob = await canvasToBlob(canvas, mime, 0.05);
      if (blob && blob.size > 0) {
        if (!bestBlob || blob.size > bestBlob.size) {
          bestBlob = blob;
          bestWidth = minW;
          bestHeight = minH;
          bestFormatChanged = true;
          bestOutputFormat = mime;
        }
      }
    }
  }

  // ── Final: decide what to return ──
  if (!bestBlob) {
    // Absolute failure — return original
    return {
      blob: file,
      width, height,
      originalBytes, optimizedBytes: originalBytes, targetBytes,
      reached: false,
      message: 'Unable to compress this image.',
    };
  }

  // If best result is still the original file, check if we can at least strip metadata
  if (bestBlob === file || bestBlob.size >= originalBytes) {
    // Try one more time: just strip metadata for JPEG
    if (originalMime === 'image/jpeg') {
      try {
        const buf = await file.arrayBuffer();
        const stripped = stripJpegMetadata(buf);
        if (stripped.size < originalBytes) {
          bestBlob = stripped;
          bestOutputFormat = 'image/jpeg';
        }
      } catch (e) { /* */ }
    }
  }

  const optimizedBytes = bestBlob.size;
  const reached = optimizedBytes <= targetBytes;
  const saved = originalBytes - optimizedBytes;
  const savedPct = originalBytes > 0 ? ((saved / originalBytes) * 100).toFixed(1) : '0.0';
  const outputFormat = bestOutputFormat || originalMime;

  // Build message
  let message;
  if (reached) {
    const diff = targetBytes - optimizedBytes;
    if (diff < targetBytes * 0.05) {
      message = `Target reached. ${savedPct}% smaller than original.`;
    } else {
      message = `Compressed to ${formatBytes(optimizedBytes)}. ${savedPct}% smaller than original.`;
    }
  } else if (saved > 0) {
    // We got smaller but didn't reach target
    message = `Best result is ${formatBytes(optimizedBytes)} (${savedPct}% smaller). Target of ${formatBytes(targetBytes)} could not be reached without significant quality loss.`;
  } else {
    // No reduction possible at all
    message = 'This image is already highly optimized. No further reduction was possible.';
  }

  return {
    blob: bestBlob,
    width: bestWidth,
    height: bestHeight,
    originalBytes,
    optimizedBytes,
    targetBytes,
    reached,
    message,
    formatChanged: bestFormatChanged,
    outputFormat,
  };
}
