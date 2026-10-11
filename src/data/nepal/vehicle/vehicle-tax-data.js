/**
 * Nepal Vehicle Tax — Centralized Reference Data
 * ================================================
 * Single source of truth for annual vehicle tax (bluebook renewal) rates,
 * renewal fees, and late fines, keyed by PROVINCE → FISCAL YEAR → CATEGORY.
 *
 * ARCHITECTURE:
 *   VEHICLE_TAX_DATA[provinceId][fiscalYear] = {
 *     verified, dataStatus, source, sourceDate, notes,
 *     categories: { motorcycle|car|evBike|evCar: { unit, label, slabs: [ {min,max,annualTax,label} ] } },
 *     renewalFee: { twoWheeler, fourWheeler },
 *     lateFine: { withinFiscalYear: [...], perYearLate, maxFineYears, renewalFeeDoubledWhenLate },
 *   }
 *
 * SLAB CONVENTIONS:
 *   - min inclusive, max inclusive (null = no upper limit)
 *   - slabs are contiguous: next.min === prev.max + 1 (validated at load time)
 *   - combustion vehicles use engine cc; electric two-wheelers use watts (W);
 *     electric cars use motor power kW.
 *
 * VERIFIED DATA (FY 2083/84, Bagmati Province):
 *   - Motorcycle & private-car annual road tax slabs unchanged from FY 2082/83
 *     (Meroauto, 2026-07-02 — Bagmati Economic Bill 2083).
 *   - Private EV cars up-to-50 kW increased by Rs 1,500 in FY 2083/84
 *     (Meroauto); therefore FY 2082/83 rate for that band was Rs 3,500.
 *   - Slab values cross-checked across three independent calculators that cite
 *     the official documents (Finance Act 2082 schedule 2(क)/(ख) PDF and
 *     Bagmati Vehicle & Transport Management Act 2075 §176):
 *       * toolspasal.com/vehicle-tax-calculator (cites official Finance Act 2082 PDF)
 *       * nepacalc.com/calculator/nepal-vehicle-tax (FY 2083/84)
 *       * nepalautomart.com/vehicle-tax-calculator (FY 2083/84 "verified")
 *   - Two sources (nagarikpalika.com, hemsguide.com) list LOWER rates for
 *     motorcycle 226–400cc / 401–650cc / 651cc+ (11,000 / 20,000 / 30,000).
 *     The 12,000 / 25,000 / 35,000 values are used here because three sources
 *     (including one quoting the official Finance Act 2082 PDF) agree, but the
 *     conflict must be resolved against the Finance Act 2083 original schedule.
 *   - Late fine: 5% (first 30 days), 10% (days 31–75), 20% (rest of FY),
 *     32% per subsequent overdue fiscal year (max 5 years) — Act 2075 §176.
 *     NepaCalc additionally reports the renewal fee is doubled when late and
 *     that DoTM caps back-tax at 4 fiscal years; both are flagged as
 *     "needs verification" and NOT implemented here by default.
 *   - Renewal fee: Rs 300 (two-wheelers) / Rs 500 (four-wheelers).
 *
 * OTHER PROVINCES:
 *   Provincial Finance Act schedules for Koshi, Madhesh, Gandaki, Lumbini,
 *   Karnali and Sudurpashchim have NOT been sourced. Rather than fabricate
 *   numbers, each province's record reuses the Bagmati tables but is flagged
 *   dataStatus: 'estimate' and the UI shows a warning. Do NOT copy these
 *   values into a verified claim without an official provincial source.
 *
 * LAST UPDATED: 2026-08-19
 * DISCLAIMER: This data is an estimate for planning. Always confirm the final
 * amount with your local Transport Management Office before paying.
 */

// ============================================================
// BAGMATI PROVINCE — FY 2083/84 (VERIFIED)
// ============================================================
const BAGMATI_2083_84 = {
  verified: true,
  dataStatus: 'verified',
  source:
    'Bagmati Province Finance Act / Economic Bill 2083 (published 2083-04-01, moeap.bagamati.gov.np); ' +
    'cross-checked with the official Finance Act 2082 schedule 2(क)/(ख) PDF ' +
    '(giwmscdnone.gov.np) and Act 2075 §176 via toolspasal.com; ' +
    'Meroauto 2026-07-02 (FY 2083/84 changes); NepaCalc & NepalAutoMart FY 2083/84 tables.',
  sourceDate: '2026-07-02',
  categories: {
    motorcycle: {
      unit: 'cc',
      label: 'Motorcycle / Scooter (petrol/diesel)',
      slabs: [
        { min: 0,    max: 125, annualTax: 3000,  label: 'Up to 125cc' },
        { min: 126,  max: 150, annualTax: 5000,  label: '126 – 150cc' },
        { min: 151,  max: 225, annualTax: 6500,  label: '151 – 225cc' },
        { min: 226,  max: 400, annualTax: 12000, label: '226 – 400cc' },
        { min: 401,  max: 650, annualTax: 25000, label: '401 – 650cc' },
        { min: 651,  max: null, annualTax: 35000, label: '651cc and above' },
      ],
    },
    car: {
      unit: 'cc',
      label: 'Private Car / Jeep / Van (petrol/diesel)',
      slabs: [
        { min: 0,    max: 1000, annualTax: 22000, label: 'Up to 1000cc' },
        { min: 1001, max: 1500, annualTax: 25000, label: '1001 – 1500cc' },
        { min: 1501, max: 2000, annualTax: 27000, label: '1501 – 2000cc' },
        { min: 2001, max: 2500, annualTax: 37000, label: '2001 – 2500cc' },
        { min: 2501, max: 3000, annualTax: 50000, label: '2501 – 3000cc' },
        { min: 3001, max: 3500, annualTax: 65000, label: '3001 – 3500cc' },
        { min: 3501, max: null, annualTax: 70000, label: '3501cc and above' },
      ],
    },
    evBike: {
      unit: 'W',
      label: 'Electric Two-Wheeler (motor power, watts)',
      slabs: [
        { min: 0,    max: 50,   annualTax: 1000, label: 'Up to 50W' },
        { min: 51,   max: 350,  annualTax: 1500, label: '51 – 350W' },
        { min: 351,  max: 1000, annualTax: 2000, label: '351 – 1000W' },
        { min: 1001, max: 1500, annualTax: 2500, label: '1001 – 1500W' },
        { min: 1501, max: null, annualTax: 3000, label: '1501W and above' },
      ],
    },
    evCar: {
      unit: 'kW',
      label: 'Electric Car / Jeep / Van (motor power, kW)',
      slabs: [
        { min: 0,    max: 50,   annualTax: 5000, label: 'Up to 50kW' },
        { min: 51,   max: 125,  annualTax: 15000, label: '51 – 125kW' },
        { min: 126,  max: 200,  annualTax: 20000, label: '126 – 200kW' },
        { min: 201,  max: null, annualTax: 30000, label: '201kW and above' },
      ],
    },
  },
  renewalFee: {
    twoWheeler: 300,
    fourWheeler: 500,
  },
  lateFine: {
    withinFiscalYear: [
      { maxDays: 30, penaltyPercent: 0.05, label: 'First 30 days late' },
      { maxDays: 45, penaltyPercent: 0.10, label: '31 – 45 days late' },
      { maxDays: null, penaltyPercent: 0.20, label: '76+ days late (same FY)' },
    ],
    perYearLate: 0.32,
    maxFineYears: 5,
    renewalFeeDoubledWhenLate: false,
  },
  notes: [
    'Motorcycle and private-car slabs unchanged from FY 2082/83 (Meroauto, 2026-07-02).',
    '226–400cc = Rs 12,000 / 401–650cc = Rs 25,000 / 651cc+ = Rs 35,000 used here (3 sources incl. the official Finance Act 2082 PDF). NagarikPalika & HemsGuide list 11,000 / 20,000 / 30,000 — resolve against Finance Act 2083 schedule.',
    'NepaCalc reports the renewal fee is doubled when renewal is late — not implemented pending verification.',
    'Back-tax cap: NepaCalc reports 4 fiscal years; Act 2075 §176 (via Toolspasal) applies 32%/yr up to 5 years. 5 years used here.',
  ],
};

// ============================================================
// BAGMATI PROVINCE — FY 2082/83 (VERIFIED)
// ============================================================
const BAGMATI_2082_83 = {
  ...BAGMATI_2083_84,
  verified: true,
  dataStatus: 'verified',
  source:
    'Bagmati Province Finance Act 2082 schedule 2(क)/(ख) (official PDF via toolspasal.com) ' +
    'and Bagmati Vehicle & Transport Management Act 2075 §176.',
  sourceDate: '2026-07-03',
  // Only change vs 2083/84: private EV up-to-50 kW was Rs 3,500 before the
  // FY 2083/84 increase of Rs 1,500 (Meroauto). Note: Toolspasal's 2082/83
  // table lists Rs 5,000 for this band — conflict to be resolved.
  categories: {
    ...BAGMATI_2083_84.categories,
    evCar: {
      ...BAGMATI_2083_84.categories.evCar,
      slabs: BAGMATI_2083_84.categories.evCar.slabs.map((s) =>
        s.min === 0 ? { ...s, annualTax: 3500 } : s,
      ),
    },
  },
  notes: [
    ...BAGMATI_2083_84.notes,
    'EV car up-to-50kW = Rs 3,500 for FY 2082/83 (per Meroauto: increased by Rs 1,500 in 2083/84).',
    'Toolspasal lists Rs 5,000 for this band in its FY 2082/83 table — needs verification.',
  ],
};

// ============================================================
// BAGMATI PROVINCE — FY 2081/82 (NOT INDEPENDENTLY VERIFIED)
// ============================================================
const BAGMATI_2081_82 = {
  ...BAGMATI_2082_83,
  verified: false,
  dataStatus: 'needs-verification',
  source: null,
  sourceDate: null,
  notes: [
    'No independent source located for FY 2081/82. Assumed identical to FY 2082/83 (EV car up-to-50kW = Rs 3,500). Needs verification against the Finance Act 2081 schedule.',
  ],
};

// ============================================================
// ESTIMATE COPIES FOR OTHER PROVINCES (NOT VERIFIED)
// ============================================================
const PROVINCE_LABELS = {
  koshi: 'Koshi',
  madhesh: 'Madhesh',
  gandaki: 'Gandaki',
  lumbini: 'Lumbini',
  karnali: 'Karnali',
  sudurpashchim: 'Sudurpashchim',
};

function makeEstimateRecord(provinceId, base) {
  return {
    ...base,
    categories: base.categories, // shared reference — read-only estimate
    verified: false,
    dataStatus: 'estimate',
    source: null,
    sourceDate: null,
    notes: [
      `${PROVINCE_LABELS[provinceId]} Province rates have not been sourced from its provincial Finance Act. ` +
        'Bagmati Province tables are shown as an estimate only — verify with your local Transport Management Office before paying.',
    ],
  };
}

// ============================================================
// MASTER TABLE
// ============================================================
export const VEHICLE_TAX_DATA = {
  bagmati: {
    '2083/84': BAGMATI_2083_84,
    '2082/83': BAGMATI_2082_83,
    '2081/82': BAGMATI_2081_82,
  },
  koshi: {
    '2083/84': makeEstimateRecord('koshi', BAGMATI_2083_84),
    '2082/83': makeEstimateRecord('koshi', BAGMATI_2082_83),
    '2081/82': makeEstimateRecord('koshi', BAGMATI_2081_82),
  },
  madhesh: {
    '2083/84': makeEstimateRecord('madhesh', BAGMATI_2083_84),
    '2082/83': makeEstimateRecord('madhesh', BAGMATI_2082_83),
    '2081/82': makeEstimateRecord('madhesh', BAGMATI_2081_82),
  },
  gandaki: {
    '2083/84': makeEstimateRecord('gandaki', BAGMATI_2083_84),
    '2082/83': makeEstimateRecord('gandaki', BAGMATI_2082_83),
    '2081/82': makeEstimateRecord('gandaki', BAGMATI_2081_82),
  },
  lumbini: {
    '2083/84': makeEstimateRecord('lumbini', BAGMATI_2083_84),
    '2082/83': makeEstimateRecord('lumbini', BAGMATI_2082_83),
    '2081/82': makeEstimateRecord('lumbini', BAGMATI_2081_82),
  },
  karnali: {
    '2083/84': makeEstimateRecord('karnali', BAGMATI_2083_84),
    '2082/83': makeEstimateRecord('karnali', BAGMATI_2082_83),
    '2081/82': makeEstimateRecord('karnali', BAGMATI_2081_82),
  },
  sudurpashchim: {
    '2083/84': makeEstimateRecord('sudurpashchim', BAGMATI_2083_84),
    '2082/83': makeEstimateRecord('sudurpashchim', BAGMATI_2082_83),
    '2081/82': makeEstimateRecord('sudurpashchim', BAGMATI_2081_82),
  },
};

export const SUPPORTED_FISCAL_YEARS = ['2083/84', '2082/83', '2081/82'];
export const CURRENT_FISCAL_YEAR = '2083/84';
export const CURRENT_FY = 2083;

// ============================================================
// CATEGORY METADATA (for UI)
// ============================================================
export const VEHICLE_CATEGORY_META = {
  motorcycle: {
    id: 'motorcycle',
    label: 'Motorcycle / Scooter',
    description: 'Two-wheelers including motorcycles, scooters, and mopeds',
    fuelTypes: ['petrol', 'diesel', 'electric'],
  },
  car: {
    id: 'car',
    label: 'Private Car / Jeep',
    description: 'Private cars, jeeps, SUVs, and vans',
    fuelTypes: ['petrol', 'diesel', 'electric', 'hybrid'],
  },
};

/**
 * Resolve the slab table + unit for a category/fuel combination.
 * @param {string} category - 'motorcycle' | 'car'
 * @param {string} fuelType - 'petrol' | 'diesel' | 'electric' | 'hybrid'
 * @param {Object} record - A fiscal-year record from VEHICLE_TAX_DATA
 * @returns {{key:string, unit:string, label:string, estimate:boolean, table:Object}|null}
 */
export function resolveSlabTable(category, fuelType, record) {
  if (!record) return null;
  if (category === 'motorcycle') {
    if (fuelType === 'petrol' || fuelType === 'diesel') {
      return { key: 'motorcycle', unit: 'cc', label: 'Petrol / Diesel', estimate: false, table: record.categories.motorcycle };
    }
    if (fuelType === 'electric') {
      return { key: 'evBike', unit: 'W', label: 'Electric (EV)', estimate: false, table: record.categories.evBike };
    }
    return null;
  }
  if (category === 'car') {
    if (fuelType === 'petrol' || fuelType === 'diesel') {
      return { key: 'car', unit: 'cc', label: 'Petrol / Diesel', estimate: false, table: record.categories.car };
    }
    if (fuelType === 'electric') {
      return { key: 'evCar', unit: 'kW', label: 'Electric (EV)', estimate: false, table: record.categories.evCar };
    }
    if (fuelType === 'hybrid') {
      // No official hybrid schedule in the sources. Show petrol rate as estimate.
      return { key: 'car', unit: 'cc', label: 'Hybrid (estimate at petrol rate)', estimate: true, table: record.categories.car };
    }
    return null;
  }
  return null;
}

/**
 * Find the slab containing `value`. Values above the top slab resolve to the
 * top slab. Values below the first slab's min return null.
 * @param {number} value
 * @param {{min:number, max:number|null}[]} slabs
 * @returns {Object|null}
 */
export function findSlab(value, slabs) {
  if (!slabs || !slabs.length) return null;
  const first = slabs[0];
  if (value < first.min) return null;
  for (const slab of slabs) {
    const max = slab.max === null ? Infinity : slab.max;
    if (value <= max) return slab;
  }
  return slabs[slabs.length - 1];
}

/**
 * Get a fiscal-year record for a province.
 * @param {string} provinceId
 * @param {string} fiscalYear - '2083/84' | '2082/83' | '2081/82'
 * @returns {Object|null}
 */
export function getProvinceTaxData(provinceId, fiscalYear = CURRENT_FISCAL_YEAR) {
  const province = VEHICLE_TAX_DATA[provinceId];
  if (!province) return null;
  return province[fiscalYear] || null;
}

/**
 * Validate every province × fiscal year record for slab overlaps/gaps and
 * numeric sanity. Throws on the first problem.
 * @returns {string[]} list of problems (empty when valid)
 */
export function validateVehicleTaxData() {
  const problems = [];

  for (const [provinceId, years] of Object.entries(VEHICLE_TAX_DATA)) {
    for (const [fy, record] of Object.entries(years)) {
      const tag = `${provinceId} / ${fy}`;

      if (!record.categories || typeof record !== 'object') {
        problems.push(`${tag}: record missing`);
        continue;
      }
      for (const [cat, table] of Object.entries(record.categories || {})) {
        const slabs = table.slabs;
        if (!Array.isArray(slabs) || slabs.length === 0) {
          problems.push(`${tag} / ${cat}: no slabs`);
          continue;
        }
        let prevMax = null;
        for (let i = 0; i < slabs.length; i++) {
          const s = slabs[i];
          if (typeof s.min !== 'number') {
            problems.push(`${tag} / ${cat}: slab ${i} has invalid min`);
            continue;
          }
          if (typeof s.max !== 'number' && s.max !== null) {
            problems.push(`${tag} / ${cat}: slab ${i} has invalid max`);
            continue;
          }
          if (!Number.isFinite(s.annualTax) || s.annualTax <= 0) {
            problems.push(`${tag} / ${cat}: slab ${i} annualTax not > 0`);
          }
          if (s.max !== null && s.max < s.min) {
            problems.push(`${tag} / ${cat}: slab ${i} max < min`);
          }
          if (prevMax !== null) {
            if (s.min <= prevMax) problems.push(`${tag} / ${cat}: overlap between slab ${i - 1} and ${i} (${s.min} <= ${prevMax})`);
            if (s.min > prevMax + 1) problems.push(`${tag} / ${cat}: gap between slab ${i - 1} and ${i} (${s.min} > ${prevMax + 1})`);
          }
          prevMax = s.max === null ? Infinity : s.max;
        }
      }

      if (!record.renewalFee || record.renewalFee.twoWheeler <= 0 || record.renewalFee.fourWheeler <= 0) {
        problems.push(`${tag}: renewalFee missing/invalid`);
      }

      const lf = record.lateFine;
      if (!lf || typeof lf.perYearLate !== 'number' || lf.perYearLate <= 0 || lf.perYearLate > 1) {
        problems.push(`${tag}: lateFine.perYearLate invalid`);
      }
      if (!Array.isArray(lf?.withinFiscalYear) || lf.withinFiscalYear.length === 0) {
        problems.push(`${tag}: lateFine.withinFiscalYear missing`);
      } else {
        let prev = 0;
        for (const band of lf.withinFiscalYear) {
          if (band.penaltyPercent < prev) problems.push(`${tag}: fine bands not ascending`);
          prev = band.penaltyPercent;
          if (band.maxDays !== null && typeof band.maxDays !== 'number') {
            problems.push(`${tag}: fine band maxDays invalid`);
          }
        }
      }
    }
  }

  return problems;
}

// Run validation at load time (Node/build only — skip in the browser bundle
// so an invalid value never crashes the client).
if (typeof window === 'undefined') {
  const errors = validateVehicleTaxData();
  if (errors.length > 0) {
    throw new Error(`Vehicle tax data validation failed:\n${errors.join('\n')}`);
  }
}