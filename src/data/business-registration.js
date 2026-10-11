/**
 * Business Registration — Official OCR Fee Schedule (Nepal)
 * ==========================================================
 * Source: Office of the Company Registrar (OCR), Nepal — ocr.gov.np
 * Legal basis: Companies Act, 2063.
 *
 * Cross-checked against the published OCR slab tables (CompanySewa 2026,
 * NYEF Business Registration Handbook, Lawimperial 2026 guide). The slab
 * boundaries below match all three sources exactly.
 *
 * HOW TO UPDATE WHEN FEES CHANGE:
 *  1. Edit the `brackets` arrays below (max is INCLUSIVE upper bound).
 *  2. Update `LAST_CHECKED` and `sourceUrl` notes.
 *  3. Run `npm test` — boundary tests will catch off-by-one errors.
 *
 * ABOVE-TOP-BRACKET RULES (explicit, never silently guessed):
 *  - Private Ltd above Rs. 10,00,00,000:
 *      fee = 43,000 + 30 for each additional Rs. 1,00,000 (rounded UP).
 *      (NYEF Handbook wording: "NPR 43,000 + NPR 30 for each additional
 *      NPR 100,000". CompanySewa shortens this to "30 per one lakh".)
 *  - Public Ltd above Rs. 50,00,00,000:
 *      fee = 1,60,000 + 3,000 for each additional Rs. 1,00,00,000
 *      (rounded UP). CompanySewa wording: "3,000 per one crore".
 *
 * Sole proprietorships & partnership firms do NOT register at the OCR —
 * they register locally (ward / Cottage & Small Industries / Department of
 * Commerce). Their fees vary by municipality and SolutionsNepal holds no verified
 * national schedule, so this file intentionally contains NO invented amounts
 * for them. The calculator surfaces "varies by municipality" instead.
 */

export const SOURCE = {
  name: 'Office of Company Registrar (OCR), Nepal',
  shortName: 'OCR',
  portalUrl: 'https://ocr.gov.np',
  feeScheduleUrl: 'https://ocr.gov.np',
  lastChecked: '2026-09-11',
};

export const LIMITS = {
  /** Smallest authorized capital the calculator accepts (Rs. 1). */
  minCapital: 1,
  /** Safety ceiling so absurd inputs are rejected, not computed. */
  maxCapital: 10_00_00_00_000, // Rs. 1,000 crore
  minShareholdersPrivate: 1,
  maxShareholdersPrivate: 101,
  minFoundersPublic: 7,
  /** Paid-up capital floor commonly applied in practice for public companies. */
  minPublicCapital: 1_00_00_000, // Rs. 1 crore
};

/**
 * Private Limited Company — authorized capital (inclusive max) → fee.
 * Bracket 1 covers 1 … 1,00,000.
 */
export const PRIVATE_LIMITED_BRACKETS = [
  { max: 1_00_000, fee: 1_000 },
  { max: 5_00_000, fee: 4_500 },
  { max: 25_00_000, fee: 9_500 },
  { max: 1_00_00_000, fee: 16_000 },
  { max: 2_00_00_000, fee: 19_000 },
  { max: 3_00_00_000, fee: 22_000 },
  { max: 4_00_00_000, fee: 25_000 },
  { max: 5_00_00_000, fee: 28_000 },
  { max: 6_00_00_000, fee: 31_000 },
  { max: 7_00_00_000, fee: 34_000 },
  { max: 8_00_00_000, fee: 37_000 },
  { max: 9_00_00_000, fee: 40_000 },
  { max: 10_00_00_000, fee: 43_000 },
];

/** Base fee at the top private bracket; the over-top rule builds on it. */
export const PRIVATE_TOP_FEE = 43_000;
export const PRIVATE_TOP_MAX = 10_00_00_000;
/** Rs. 30 for each additional Rs. 1 lakh above Rs. 10 crore. */
export const PRIVATE_OVER_TOP = { unitAmount: 1_00_000, unitFee: 30 };

/**
 * Public Limited Company — authorized capital (inclusive max) → fee.
 */
export const PUBLIC_LIMITED_BRACKETS = [
  { max: 1_00_00_000, fee: 15_000 },
  { max: 10_00_00_000, fee: 40_000 },
  { max: 20_00_00_000, fee: 70_000 },
  { max: 30_00_00_000, fee: 1_00_000 },
  { max: 40_00_00_000, fee: 1_30_000 },
  { max: 50_00_00_000, fee: 1_60_000 },
];

/** Base fee at the top public bracket; the over-top rule builds on it. */
export const PUBLIC_TOP_FEE = 1_60_000;
export const PUBLIC_TOP_MAX = 50_00_00_000;
/** Rs. 3,000 for each additional Rs. 1 crore above Rs. 50 crore. */
export const PUBLIC_OVER_TOP = { unitAmount: 1_00_00_000, unitFee: 3_000 };

export const BUSINESS_TYPES = [
  {
    id: 'private',
    title: 'Private Limited Company',
    tagline: 'Register a Pvt. Ltd. company',
  },
  {
    id: 'sole',
    title: 'Sole Proprietorship',
    tagline: 'Business owned by one person',
  },
  {
    id: 'partnership',
    title: 'Partnership Firm',
    tagline: 'Business owned by two or more partners',
  },
  {
    id: 'public',
    title: 'Public Limited Company',
    tagline: 'Company registered as a public company',
  },
];

export const BUSINESS_CATEGORIES = [
  'Trading',
  'Manufacturing',
  'Services',
  'IT & Software',
  'Tourism & Hospitality',
  'Construction',
  'Agriculture & Agro-processing',
  'Education & Training',
  'Health Services',
  'Transport & Logistics',
  'Other',
];
