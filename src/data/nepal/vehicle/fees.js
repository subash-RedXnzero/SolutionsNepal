/**
 * Nepal Vehicle Renewal Fees & Charges
 * ======================================
 * Bluebook renewal insurance estimates and pollution/emission charges for
 * vehicle tax calculations.
 *
 * NOTE: The ANNUAL VEHICLE TAX SLABS, BLUEBOOK RENEWAL FEES and LATE FINE
 * structure now live in vehicle-tax-data.js (VEHICLE_TAX_DATA[provinceId]
 * [fiscalYear]) — that is the single source of truth for rates.
 * This module only carries insurance estimates and optional other charges.
 *
 * SOURCES & VERIFICATION:
 * - Nepal Insurance Authority (Beema Samiti) — third-party premiums vary by
 *   insurer; figures below are rough annual estimates.
 * - Pollution/emission test fees: commonly cited ~Rs 400 total; the values
 *   below (200 test + 50 sticker + 100 service) are placeholders flagged as
 *   "needs verification".
 *
 * LAST UPDATED: 2026-08-20
 */

// ============================================================
// POLLUTION / EMISSION CHECK  (optional other charges)
// ============================================================
export const POLLUTION_CHARGES = {
  emissionTest: 200, // NPR
  pollutionSticker: 50, // NPR
  serviceCharge: 100, // NPR (office processing)
  needsVerification: true,
  get total() {
    return this.emissionTest + this.pollutionSticker + this.serviceCharge;
  },
};

// ============================================================
// INSURANCE ESTIMATES (Third-party mandatory)
// ============================================================
export const INSURANCE_ESTIMATES = {
  // Third-party liability insurance (mandatory in Nepal for renewal).
  // Approximate annual premiums — actual rates vary by insurer.
  thirdParty: {
    motorcycle: {
      'up-to-149cc': 1715, // NPR/year
      '151-to-250cc': 1941, // NPR/year
      'above-250cc': 2167, // NPR/year
    },
    car: {
      'up-to-1000cc': 3000, // NPR/year
      '1001-to-1500cc': 4500, // NPR/year
      '1501-to-2000cc': 6000, // NPR/year
      'above-2000cc': 8000, // NPR/year
    },
  },
};

/**
 * Get third-party insurance estimate for a vehicle.
 * Electric vehicles have no verified premium schedule in the sources; the
 * minimum band premium is returned and flagged as an estimate.
 *
 * @param {string} category - "motorcycle" or "car"
 * @param {number} value - Engine cc (combustion) or motor power (EV)
 * @param {string} [measure] - "cc" | "W" | "kW"
 * @returns {{amount:number, estimate:boolean}}
 */
export function getThirdPartyInsuranceEstimate(category, value, measure = 'cc') {
  const rates = INSURANCE_ESTIMATES.thirdParty[category];
  if (!rates) return { amount: 0, estimate: false };

  // EV premiums are not in the verified sources — return the minimum band.
  if (measure === 'W' || measure === 'kW') {
    return {
      amount: category === 'motorcycle' ? rates['up-to-149cc'] : rates['up-to-1000cc'],
      estimate: true,
    };
  }

  if (category === 'motorcycle') {
    if (value <= 149) return { amount: rates['up-to-149cc'], estimate: false };
    if (value <= 250) return { amount: rates['151-to-250cc'], estimate: false };
    return { amount: rates['above-250cc'], estimate: false };
  }

  if (category === 'car') {
    if (value <= 1000) return { amount: rates['up-to-1000cc'], estimate: false };
    if (value <= 1500) return { amount: rates['1001-to-1500cc'], estimate: false };
    if (value <= 2000) return { amount: rates['1501-to-2000cc'], estimate: false };
    return { amount: rates['above-2000cc'], estimate: false };
  }

  return { amount: 0, estimate: false };
}