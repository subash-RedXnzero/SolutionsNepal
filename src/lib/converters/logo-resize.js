/**
 * Logo Size Resizer — client-side engine (pure + browser helpers)
 * =================================================================
 * Pure geometry/validation functions are DOM-free so they run under
 * `node --test`. Browser-only functions (loadLogoImage, composeLogo,
 * exportLogo) touch `document`/Canvas at call time only — never import them
 * in Node tests.
 *
 * Privacy: everything runs locally. No uploads, no network calls.
 *
 * @module logo-resize
 */

// ── Constants ─────────────────────────────────────────────────────

export const PRESETS = [
  { id: 'header', label: 'Website header', w: 250, h: 80 },
  { id: 'header-compact', label: 'Compact header', w: 160, h: 50 },
  { id: 'logo-large', label: 'Large website logo', w: 400, h: 120 },
  { id: 'square', label: 'Square logo', w: 512, h: 512 },
  { id: 'app-icon', label: 'App icon', w: 192, h: 192 },
  { id: 'favicon', label: 'Favicon', w: 48, h: 48 },
];

export const SUPPORTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
export const SUPPORTED_EXTS = ['png', 'jpg', 'jpeg', 'webp', 'svg'];
export const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB — logos are small; anything bigger is a mistake
export const MIN_DIM = 16;
export const MAX_DIM = 4096;

// ── Validation (pure) ─────────────────────────────────────────────

/**
 * Validate an upload candidate. Accepts a File/Blob-like ({name,type,size}).
 * SVG passes here; it is sanitized separately before rendering.
 */
export function validateLogoFile(file) {
  if (!file) return { valid: false, error: 'No file selected.' };
  const type = (file.type || '').toLowerCase();
  const ext = (file.name || '').split('.').pop().toLowerCase();
  const typeOk = SUPPORTED_TYPES.includes(type);
  const extOk = SUPPORTED_EXTS.includes(ext);
  if (!typeOk && !extOk) {
    return { valid: false, error: 'Unsupported format. Please upload a PNG, JPG, WebP or SVG logo.' };
  }
  if (!file.size) return { valid: false, error: 'The file is empty.' };
  if (file.size > MAX_FILE_BYTES) {
    return { valid: false, error: 'File too large. Maximum supported size is 20 MB.' };
  }
  return { valid: true };
}

export function isSvgFile(file) {
  const type = (file.type || '').toLowerCase();
  const ext = (file.name || '').split('.').pop().toLowerCase();
  return type === 'image/svg+xml' || ext === 'svg';
}

/**
 * Parse a dimension input. Returns an integer or null when invalid.
 * Range enforcement is separate (clampDim) so callers can show errors.
 */
export function parseDim(value) {
  if (typeof value === 'string') value = value.trim();
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || Math.floor(n) !== n || n < 1) return null;
  return n;
}

export function clampDim(n) {
  if (!Number.isFinite(n)) return null;
  return Math.min(MAX_DIM, Math.max(MIN_DIM, Math.floor(n)));
}

export function maxPadding(w, h) {
  return Math.max(0, Math.floor(Math.min(w, h) / 2) - 1);
}

// ── Aspect-ratio math (pure) ──────────────────────────────────────

/** Given one edited side, compute the other from the source ratio. */
export function lockedSize(changed, value, srcW, srcH) {
  if (!(srcW > 0 && srcH > 0) || !(value > 0)) return null;
  if (changed === 'w') return { w: value, h: Math.max(1, Math.round((value * srcH) / srcW)) };
  return { w: Math.max(1, Math.round((value * srcW) / srcH)), h: value };
}

/**
 * Contain: largest rect of source ratio fitting inside dst, centered,
 * with `pad` px inset on every side. Returns canvas draw rect.
 */
export function fitContain(srcW, srcH, dstW, dstH, pad = 0) {
  const p = Math.min(Math.max(0, pad || 0), maxPadding(dstW, dstH));
  const aw = dstW - p * 2;
  const ah = dstH - p * 2;
  const scale = Math.min(aw / srcW, ah / srcH);
  const dw = Math.max(1, Math.round(srcW * scale));
  const dh = Math.max(1, Math.round(srcH * scale));
  return { dx: Math.round((dstW - dw) / 2), dy: Math.round((dstH - dh) / 2), dw, dh, pad: p };
}

/**
 * Cover: centered source rect (in source pixels) that exactly fills dst
 * when scaled. Anything outside this rect is cropped away.
 */
export function fitCoverCrop(srcW, srcH, dstW, dstH) {
  const scale = Math.max(dstW / srcW, dstH / srcH);
  const sw = Math.min(srcW, Math.round(dstW / scale));
  const sh = Math.min(srcH, Math.round(dstH / scale));
  return { sx: Math.round((srcW - sw) / 2), sy: Math.round((srcH - sh) / 2), sw, sh };
}

/** What share of the source is cropped away under `cover` (0–100). */
export function coverCropPercent(srcW, srcH, dstW, dstH) {
  const c = fitCoverCrop(srcW, srcH, dstW, dstH);
  const kept = (c.sw * c.sh) / (srcW * srcH);
  return Math.round((1 - kept) * 100);
}

// ── Format helpers (pure) ─────────────────────────────────────────

export function outputMime(format) {
  if (format === 'jpeg') return 'image/jpeg';
  if (format === 'webp') return 'image/webp';
  return 'image/png';
}

export function extForFormat(format) {
  if (format === 'jpeg') return 'jpg';
  if (format === 'webp') return 'webp';
  return 'png';
}

export function formatSupportsAlpha(format) {
  return format === 'png' || format === 'webp';
}

/**
 * Resolve the canvas background. Returns { color: string|null, coerced: bool }.
 * `bg`: 'transparent' | 'white' | 'black' | 'custom'. JPEG has no alpha, so a
 * transparent request is coerced to white and flagged (never silent).
 */
export function resolveBackground(format, bg, customColor) {
  if (formatSupportsAlpha(format)) {
    if (bg === 'transparent' || !bg) return { color: null, coerced: false };
  }
  if (bg === 'white' || (!formatSupportsAlpha(format) && (!bg || bg === 'transparent'))) {
    return { color: '#ffffff', coerced: bg === 'transparent' && !formatSupportsAlpha(format) };
  }
  if (bg === 'black') return { color: '#000000', coerced: false };
  if (bg === 'custom') return { color: /^#[0-9a-fA-F]{6}$/.test(customColor || '') ? customColor : '#ffffff', coerced: false };
  return { color: '#ffffff', coerced: !formatSupportsAlpha(format) };
}

/** `my-logo-250x80.png` — strips extension, path and unsafe chars. */
export function buildFileName(originalName, w, h, ext) {
  const base = (originalName || 'logo').split(/[\\/]/).pop().replace(/\.[^.]+$/, '') || 'logo';
  const safe = base.toLowerCase().replace(/[^a-z0-9-_]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'logo';
  return `${safe}-${w}x${h}.${ext}`;
}

// ── SVG handling ──────────────────────────────────────────────────
// SVGs rasterized through <img> cannot execute scripts (no scripting,
// no external subresources in that context). sanitizeSvgText is a second
// layer: it also protects the "download sanitized SVG" path.

/** Extract raster size from SVG markup (width/height attrs or viewBox). */
export function parseSvgSize(text) {
  if (typeof text !== 'string') return null;
  const num = (v) => {
    if (!v) return null;
    const m = v.trim().match(/^([\d.]+)(px)?$/);
    return m ? parseFloat(m[1]) : null;
  };
  const wMatch = text.match(/<svg[^>]*\bwidth\s*=\s*["']([^"']+)["']/i);
  const hMatch = text.match(/<svg[^>]*\bheight\s*=\s*["']([^"']+)["']/i);
  const w = wMatch ? num(wMatch[1]) : null;
  const h = hMatch ? num(hMatch[1]) : null;
  if (w > 0 && h > 0) return { w: Math.floor(w), h: Math.floor(h) };
  const vb = text.match(/viewBox\s*=\s*["']\s*[\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)\s*["']/i);
  if (vb && parseFloat(vb[1]) > 0 && parseFloat(vb[2]) > 0) {
    return { w: Math.floor(parseFloat(vb[1])), h: Math.floor(parseFloat(vb[2])) };
  }
  return null;
}

export function sanitizeSvgText(text) {
  if (typeof text !== 'string') return { svg: '', removed: true, reason: 'Not SVG text.' };
  let out = text;
  let removed = false;
  const strip = (re) => {
    if (re.test(out)) { removed = true; out = out.replace(re, ''); }
  };
  strip(/<\?.*?\?>/gs); // XML prolog / processing instructions
  strip(/<!DOCTYPE[^>]*(\[[^\]]*\])?>/gis); // DOCTYPE incl. internal ENTITY subsets
  strip(/<script[\s\S]*?<\/script\s*>/gi);
  strip(/<foreignObject[\s\S]*?<\/foreignObject\s*>/gi);
  strip(/<handler[\s\S]*?<\/handler\s*>/gi);
  strip(/<listener[\s\S]*?\/>/gi);
  strip(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi); // event handler attributes
  strip(/\s(href|xlink:href)\s*=\s*["']\s*javascript:[^"']*["']/gi);
  // External (non-data) references in image/use/embed/link/script-ish spots.
  strip(/<(image|use|embed|iframe|link|script|audio|video)[^>]*(href|xlink:href)\s*=\s*["'](?!data:image\/)[^"']*["'][^>]*\/?>/gi);
  if (!/<svg[\s>]/i.test(out)) return { svg: '', removed: true, reason: 'No <svg> root element found.' };
  return { svg: out, removed };
}

// ── Browser-only: loading, composing, exporting ───────────────────
// (Call these from page scripts only — they need DOM + Canvas.)

function readAsText(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('Could not read SVG file.'));
    r.readAsText(file);
  });
}

function blobToImage(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not decode image.')); };
    img.src = url;
  });
}

function ensureSvgSize(svgText, fallbackW, fallbackH) {
  // <img> rasterization needs intrinsic dimensions; inject from viewBox when absent.
  const hasW = /<svg[^>]*\bwidth\s*=/i.test(svgText);
  const hasH = /<svg[^>]*\bheight\s*=/i.test(svgText);
  if (hasW && hasH) return svgText;
  const size = parseSvgSize(svgText) || { w: fallbackW || 512, h: fallbackH || 512 };
  return svgText.replace(/<svg/i, `<svg width="${size.w}" height="${size.h}"`);
}

/**
 * Load any supported logo file into an HTMLImageElement.
 * Returns { img, objectUrl, sanitizedSvg } — caller must revoke objectUrl.
 * SVG goes through sanitizeSvgText first; rasterization via <img> blocks scripts.
 */
export async function loadLogoImage(file) {
  if (isSvgFile(file)) {
    const text = await readAsText(file);
    const { svg, removed } = sanitizeSvgText(text);
    if (!svg) throw new Error('That SVG could not be sanitized safely.');
    const sized = ensureSvgSize(svg);
    const blob = new Blob([sized], { type: 'image/svg+xml' });
    const { img, url } = await blobToImage(blob);
    const w = img.naturalWidth || parseSvgSize(sized)?.w || 512;
    const h = img.naturalHeight || parseSvgSize(sized)?.h || 512;
    return { img, objectUrl: url, sanitizedSvg: sized, sanitized: removed, naturalW: w, naturalH: h, wasSvg: true };
  }
  const { img, url } = await blobToImage(file);
  if (!img.naturalWidth || !img.naturalHeight) {
    URL.revokeObjectURL(url);
    throw new Error('Could not decode image.');
  }
  return { img, objectUrl: url, sanitizedSvg: null, sanitized: false, naturalW: img.naturalWidth, naturalH: img.naturalHeight, wasSvg: false };
}

/**
 * Compose the output canvas. Never distorts unless fit === 'stretch'.
 * opts: { w, h, fit: 'contain'|'cover'|'stretch', bg, customColor, format, pad }
 */
export function composeLogo(img, srcW, srcH, opts) {
  const { w, h, fit = 'contain', bg = 'transparent', customColor = '#ffffff', format = 'png', pad = 0 } = opts;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const { color } = resolveBackground(format, bg, customColor);
  if (color) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
  } else {
    ctx.clearRect(0, 0, w, h);
  }
  if (fit === 'cover') {
    const c = fitCoverCrop(srcW, srcH, w, h);
    ctx.drawImage(img, c.sx, c.sy, c.sw, c.sh, 0, 0, w, h);
  } else if (fit === 'stretch') {
    ctx.drawImage(img, 0, 0, srcW, srcH, 0, 0, w, h);
  } else {
    const r = fitContain(srcW, srcH, w, h, pad);
    ctx.drawImage(img, 0, 0, srcW, srcH, r.dx, r.dy, r.dw, r.dh);
  }
  return canvas;
}

export function canvasToBlob(canvas, format, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Export failed. Your browser may not support this format.'))),
      outputMime(format),
      format === 'png' ? undefined : quality,
    );
  });
}
