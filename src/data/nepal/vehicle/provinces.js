/**
 * Nepal Provinces — Vehicle Tax Reference Data
 * ==============================================
 * Seven provinces of Nepal with vehicle-tax-relevant metadata.
 *
 * NOTE: Actual annual vehicle tax rates live in vehicle-tax-data.js
 *       (VEHICLE_TAX_DATA[provinceId][fiscalYear]). Only Bagmati Province
 *       schedules are currently verified. Every other province is flagged
 *       dataStatus 'estimate' and shows Bagmati tables as an estimate until
 *       its own Finance Act schedule is sourced.
 *
 * LAST UPDATED: 2026-08-19
 */

export const PROVINCES = [
  {
    id: 'bagmati',
    name: 'Bagmati',
    nameNepali: 'बागमती',
    capital: 'Kathmandu',
    label: 'Bagmati (Kathmandu)',
    dataStatus: 'verified',
  },
  {
    id: 'koshi',
    name: 'Koshi',
    nameNepali: 'कोशी',
    capital: 'Biratnagar',
    label: 'Koshi (Biratnagar)',
    dataStatus: 'estimate',
  },
  {
    id: 'madhesh',
    name: 'Madhesh',
    nameNepali: 'मधेश',
    capital: 'Janakpur',
    label: 'Madhesh (Janakpur)',
    dataStatus: 'estimate',
  },
  {
    id: 'gandaki',
    name: 'Gandaki',
    nameNepali: 'गण्डकी',
    capital: 'Pokhara',
    label: 'Gandaki (Pokhara)',
    dataStatus: 'estimate',
  },
  {
    id: 'lumbini',
    name: 'Lumbini',
    nameNepali: 'लुम्बिनी',
    capital: 'Butwal',
    label: 'Lumbini (Butwal)',
    dataStatus: 'estimate',
  },
  {
    id: 'karnali',
    name: 'Karnali',
    nameNepali: 'कर्णाली',
    capital: 'Surkhet',
    label: 'Karnali (Surkhet)',
    dataStatus: 'estimate',
  },
  {
    id: 'sudurpashchim',
    name: 'Sudurpashchim',
    nameNepali: 'सुदूरपश्चिम',
    capital: 'Dhangadhi',
    label: 'Sudurpashchim (Dhangadhi)',
    dataStatus: 'estimate',
  },
];

/**
 * Get province by ID
 * @param {string} id - Province ID
 * @returns {Object|null}
 */
export function getProvince(id) {
  return PROVINCES.find(p => p.id === id) || null;
}

/**
 * Get default province (Bagmati)
 * @returns {Object}
 */
export function getDefaultProvince() {
  return PROVINCES[0];
}
