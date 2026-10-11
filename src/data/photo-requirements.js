/**
 * Photo Requirement Presets — centralized, editable configuration
 * ================================================================
 *
 * HOW TO UPDATE REQUIREMENTS
 * --------------------------
 * Each preset below is self-contained. To update a requirement after
 * verifying it against an official source:
 *   1. Edit width / height (+ unit) and any size/format limits.
 *   2. Set `verified: true` ONLY after checking the official source.
 *   3. Record the source and date in `source` / `sourceDate`.
 *
 * Dimensions may be given in 'mm', 'px', or 'inch'. The UI converts to
 * pixels at `dpiPx` (default 300 DPI print quality).
 *
 * IMPORTANT: values marked verified:false are COMMON CONVENTIONS, not
 * confirmed official requirements. Do not present them as official.
 */

export const DEFAULT_DPI = 300;

/**
 * @typedef {Object} PhotoRequirement
 * @property {string} id           Stable identifier used in URLs (?preset=)
 * @property {string} label        Card title shown to users
 * @property {string} short        One-line description on the card
 * @property {number} width
 * @property {number} height
 * @property {'mm'|'px'|'inch'} unit
 * @property {'JPG'|'PNG'} format  Recommended export format
 * @property {number|null} maxSizeKB  Official max file size (null = none known)
 * @property {number|null} minSizeKB  Official min file size (null = none)
 * @property {boolean} verified    true ONLY if checked against an official source
 * @property {string|null} source  Where the requirement was verified
 * @property {string|null} sourceDate
 * @property {string} note         Short user-facing guidance
 */

/** @type {PhotoRequirement[]} */
export const PHOTO_REQUIREMENTS = [
  {
    id: 'nepal-passport',
    label: 'Nepal Passport Photo',
    short: '35 × 45 mm (7:9) · white background · 70–80% face coverage',
    width: 35,
    height: 45,
    unit: 'mm',
    format: 'JPG',
    maxSizeKB: null,
    minSizeKB: null,
    verified: false,
    source: null,
    sourceDate: null,
    note: '35 × 45 mm (7:9 ratio) is the standard size for Nepali passport applications. Plain white background required. Head height should cover 70–80% of the frame (~32.5 mm) per ICAO specifications. No borders, no inkjet prints. Confirm with the Department of Passports before submitting.',
  },
  {
    id: 'passport',
    label: 'Passport Photo',
    short: '2 × 2 inch (51 × 51 mm) · standard international size',
    width: 2,
    height: 2,
    unit: 'inch',
    format: 'JPG',
    maxSizeKB: null,
    minSizeKB: null,
    verified: true,
    source: 'US Department of State — Passport Photos (travel.state.gov)',
    sourceDate: '2026-09-11',
    note: '2 × 2 inch (51 × 51 mm) is the official U.S. passport photo size, with head measuring 1–1⅜ inches (25–35 mm) from chin to crown. Many other countries accept the same size. Always confirm with the relevant embassy or authority before submitting.',
  },
  {
    id: 'visa',
    label: 'Visa Photo',
    short: '2 × 2 inch (51 × 51 mm) · 240 KB limit',
    width: 2,
    height: 2,
    unit: 'inch',
    format: 'JPG',
    maxSizeKB: 240,
    minSizeKB: null,
    verified: false,
    source: null,
    sourceDate: null,
    note: '2 × 2 inch (51 × 51 mm) is commonly used for visa applications, including US DS-160. Max 240 KB JPEG. White or off-white background. Verify with the specific embassy or consulate.',
  },
  {
    id: 'dv-lottery',
    label: 'DV Lottery Photo',
    short: '600 × 600 px to 1200 × 1200 px · 24-bit JPEG · max 240 KB',
    width: 600,
    height: 600,
    unit: 'px',
    format: 'JPG',
    maxSizeKB: 240,
    minSizeKB: null,
    verified: true,
    source: 'US Department of State — Diversity Visa Program Instructions (dvprogram.state.gov)',
    sourceDate: '2025-10-01',
    note: 'DV Lottery accepts square images from 600 × 600 px (minimum) up to 1200 × 1200 px, 24-bit color JPEG, maximum 240 KB. Taken within the last 6 months.',
  },
  {
    id: 'citizenship',
    label: 'Citizenship Photo',
    short: '35 × 45 mm (7:9) · for Nepali citizenship applications',
    width: 35,
    height: 45,
    unit: 'mm',
    format: 'JPG',
    maxSizeKB: null,
    minSizeKB: null,
    verified: false,
    source: null,
    sourceDate: null,
    note: '35 × 45 mm (7:9 ratio) is commonly requested for Nepal citizenship (नागरिकता) applications. Some local district offices may specify slightly different sizes — confirm locally.',
  },
  {
    id: 'custom',
    label: 'Custom Photo',
    short: 'Set your own dimensions and target size',
    width: 600,
    height: 600,
    unit: 'px',
    format: 'JPG',
    maxSizeKB: null,
    minSizeKB: null,
    verified: false,
    source: null,
    sourceDate: null,
    note: 'Enter any width and height. Lock the aspect ratio to keep proportions when changing one side.',
  },
];

export function getRequirement(id) {
  return PHOTO_REQUIREMENTS.find((r) => r.id === id) || PHOTO_REQUIREMENTS[PHOTO_REQUIREMENTS.length - 1];
}

/**
 * Convert a requirement's dimensions to pixels at the given DPI.
 * Returns integers suitable for canvas output.
 */
export function toPixels(req, dpi = DEFAULT_DPI) {
  if (req.unit === 'px') {
    return { width: Math.round(req.width), height: Math.round(req.height), exact: true };
  }
  const inchesPerUnit = req.unit === 'mm' ? 1 / 25.4 : 1;
  return {
    width: Math.round(req.width * inchesPerUnit * dpi),
    height: Math.round(req.height * inchesPerUnit * dpi),
    exact: false,
  };
}

/**
 * Convert a value between units (used by the advanced dimension inputs).
 */
export function convertUnit(value, from, to, dpi = DEFAULT_DPI) {
  const pxPerInch = dpi;
  let px = value;
  if (from === 'mm') px = (value / 25.4) * pxPerInch;
  else if (from === 'inch') px = value * pxPerInch;
  if (to === 'px') return Math.round(px);
  if (to === 'mm') return Math.round((px / pxPerInch) * 25.4 * 10) / 10;
  return Math.round((px / pxPerInch) * 1000) / 1000;
}
