/**
 * Nepal Vehicle Tax — Category Registry (compatibility layer)
 * ============================================================
 * DEPRECATED as a rate source. All annual vehicle tax rates, renewal fees and
 * late fines now live in src/data/nepal/vehicle/vehicle-tax-data.js
 * (VEHICLE_TAX_DATA[provinceId][fiscalYear]).
 *
 * This module keeps the category metadata (labels + supported fuel types)
 * that UI pages import, derived from VEHICLE_CATEGORY_META so there is a
 * single source of truth. Do not add rate schedules here.
 *
 * LAST UPDATED: 2026-08-19
 */

import { VEHICLE_CATEGORY_META, findSlab } from './vehicle-tax-data.js';

/**
 * @typedef {Object} VehicleCategoryMeta
 * @property {string} id
 * @property {string} label
 * @property {string} description
 * @property {string[]} fuelTypes
 */

export const VEHICLE_CATEGORIES = Object.fromEntries(
  Object.entries(VEHICLE_CATEGORY_META).map(([id, meta]) => [
    id,
    { id: meta.id, label: meta.label, description: meta.description, fuelTypes: meta.fuelTypes },
  ]),
);

/**
 * Get vehicle category metadata by ID
 * @param {string} id
 * @returns {VehicleCategoryMeta|null}
 */
export function getVehicleCategory(id) {
  return VEHICLE_CATEGORIES[id] || null;
}

/**
 * Get all available vehicle categories
 * @returns {VehicleCategoryMeta[]}
 */
export function getAvailableCategories() {
  return Object.values(VEHICLE_CATEGORIES).map((c) => ({
    id: c.id,
    label: c.label,
    description: c.description,
    fuelTypes: c.fuelTypes,
  }));
}

/**
 * Compatibility shim: find the slab for a value against a table with `.slabs`.
 * Prefer findSlab from vehicle-tax-data.js in new code.
 * @param {number} value - Engine cc / W / kW
 * @param {{slabs: Array<{min:number, max:number|null}>}} table
 * @returns {Object|null}
 */
export function getCCSlab(value, table) {
  if (!table || !Array.isArray(table.slabs)) return null;
  return findSlab(value, table.slabs);
}