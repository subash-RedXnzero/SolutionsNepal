/**
 * Nepal Fuel Cost Calculator Engine
 * ===================================
 * Reusable, data-driven fuel/travel cost calculation engine.
 *
 * Supports:
 * - Petrol / Diesel (km/L based)
 * - Electric vehicles (kWh/100km based)
 * - One-way and round-trip modes
 * - Trip cost splitting among passengers
 *
 * FORMULAS:
 * Petrol/Diesel:
 *   Fuel Required = Distance ÷ Mileage
 *   Fuel Cost = Fuel Required × Fuel Price
 *   Cost per km = Fuel Cost ÷ Distance
 *
 * EV:
 *   Energy Required = Distance × (kWh per 100km) ÷ 100
 *   Charging Cost = Energy Required × Electricity Price
 *   Cost per km = Charging Cost ÷ Distance
 *
 * LAST UPDATED: 2026-08-19
 */

// ============================================================
// VEHICLE PRESETS (estimates only — user can override)
// ============================================================
export const VEHICLE_PRESETS = {
  motorcycle: {
    id: 'motorcycle',
    label: 'Motorcycle',
    fuelType: 'petrol',
    mileage: 40,        // km/L estimate
    description: 'Standard motorcycle — ~35-45 km/L',
  },
  car: {
    id: 'car',
    label: 'Car (Sedan)',
    fuelType: 'petrol',
    mileage: 15,        // km/L estimate
    description: 'Private car / sedan — ~12-18 km/L',
  },
  suv: {
    id: 'suv',
    label: 'SUV',
    fuelType: 'petrol',
    mileage: 11,        // km/L estimate
    description: 'SUV / large vehicle — ~9-13 km/L',
  },
  ev: {
    id: 'ev',
    label: 'Electric Vehicle',
    fuelType: 'electric',
    mileage: null,       // Not applicable
    consumption: 18,    // kWh/100km estimate
    description: 'EV — ~14-22 kWh/100km',
  },
};

// ============================================================
// FUEL TYPE CONFIG
// ============================================================
export const FUEL_TYPES = {
  petrol: {
    id: 'petrol',
    label: 'Petrol',
    unit: 'km/L',
    priceUnit: 'NPR/L',
    inputLabel: 'Fuel price',
    inputHint: 'Per litre',
    usesMileage: true,
  },
  diesel: {
    id: 'diesel',
    label: 'Diesel',
    unit: 'km/L',
    priceUnit: 'NPR/L',
    inputLabel: 'Fuel price',
    inputHint: 'Per litre',
    usesMileage: true,
  },
  electric: {
    id: 'electric',
    label: 'EV (Electric)',
    unit: 'kWh/100km',
    priceUnit: 'NPR/kWh',
    inputLabel: 'Electricity price',
    inputHint: 'Per kWh',
    usesMileage: false,
  },
};

// ============================================================
// MAIN CALCULATION FUNCTION
// ============================================================

/**
 * Calculate fuel/travel cost
 *
 * @param {Object} input
 * @param {number} input.distance - Distance in km
 * @param {string} input.fuelType - "petrol", "diesel", "electric"
 * @param {number} [input.mileage] - Vehicle mileage in km/L (petrol/diesel only)
 * @param {number} [input.consumption] - Energy consumption in kWh/100km (EV only)
 * @param {number} input.fuelPrice - Price per unit (NPR/L for petrol/diesel, NPR/kWh for EV)
 * @param {string} [input.tripType] - "one-way" or "round-trip"
 * @param {number} [input.people] - Number of passengers for cost splitting (1 = no split)
 * @returns {Object} Complete calculation result
 */
export function calculateFuelCost({
  distance = 0,
  fuelType = 'petrol',
  mileage = 0,
  consumption = 0,
  fuelPrice = 0,
  tripType = 'one-way',
  people = 1,
}) {
  // === VALIDATION ===
  const errors = [];
  if (distance <= 0) errors.push('Distance must be greater than 0');
  if (fuelPrice < 0) errors.push('Fuel price cannot be negative');
  if (people < 1) errors.push('Number of people must be at least 1');

  if (fuelType === 'electric') {
    if (consumption <= 0) errors.push('Energy consumption must be greater than 0');
  } else {
    if (mileage <= 0) errors.push('Mileage must be greater than 0');
  }

  if (errors.length > 0) {
    return { valid: false, errors, totalCost: 0 };
  }

  // === CALCULATE TOTAL DISTANCE ===
  const isRoundTrip = tripType === 'round-trip';
  const totalDistance = isRoundTrip ? distance * 2 : distance;

  // === FUEL / ENERGY CALCULATION ===
  let fuelRequired = 0;
  let fuelRequiredLabel = '';
  let totalCost = 0;
  let costPerKm = 0;
  let formula = {};

  if (fuelType === 'electric') {
    // EV: Energy Required = Distance × Consumption / 100
    fuelRequired = totalDistance * consumption / 100;
    fuelRequiredLabel = `${fuelRequired.toFixed(2)} kWh`;
    totalCost = fuelRequired * fuelPrice;
    costPerKm = totalDistance > 0 ? totalCost / totalDistance : 0;
    formula = {
      energyRequired: `${totalDistance} km × ${consumption} kWh/100km ÷ 100 = ${fuelRequired.toFixed(2)} kWh`,
      chargingCost: `${fuelRequired.toFixed(2)} kWh × NPR ${fuelPrice}/kWh = NPR ${Math.round(totalCost)}`,
    };
  } else {
    // Petrol/Diesel: Fuel Required = Distance ÷ Mileage
    fuelRequired = totalDistance / mileage;
    fuelRequiredLabel = `${fuelRequired.toFixed(2)} L`;
    totalCost = fuelRequired * fuelPrice;
    costPerKm = totalDistance > 0 ? totalCost / totalDistance : 0;
    formula = {
      fuelRequired: `${totalDistance} km ÷ ${mileage} km/L = ${fuelRequired.toFixed(2)} L`,
      fuelCost: `${fuelRequired.toFixed(2)} L × NPR ${fuelPrice}/L = NPR ${Math.round(totalCost)}`,
    };
  }

  // === COST SPLITTING ===
  const costPerPerson = people > 1 ? totalCost / people : totalCost;

  // === FUEL TYPE INFO ===
  const fuelInfo = FUEL_TYPES[fuelType] || FUEL_TYPES.petrol;

  return {
    valid: true,
    errors: [],

    // Input echo
    input: {
      distance,
      fuelType,
      fuelLabel: fuelInfo.label,
      mileage: fuelType !== 'electric' ? mileage : null,
      consumption: fuelType === 'electric' ? consumption : null,
      fuelPrice,
      tripType,
      tripLabel: isRoundTrip ? 'Round Trip' : 'One Way',
      people,
    },

    // Calculations
    totalDistance,
    fuelRequired: Math.round(fuelRequired * 100) / 100,
    fuelRequiredLabel,
    totalCost: Math.round(totalCost),
    costPerKm: Math.round(costPerKm * 100) / 100,

    // Splitting
    costPerPerson: Math.round(costPerPerson),
    isSplit: people > 1,

    // Formula transparency
    formula,

    // Metadata
    lastUpdated: '2026-08-19',
    source: 'Standard fuel cost formulas',
  };
}

// ============================================================
// FORMAT HELPERS
// ============================================================

/**
 * Format NPR currency
 * @param {number} amount
 * @returns {string}
 */
export function formatNPR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'NPR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format number with commas
 * @param {number} num
 * @returns {string}
 */
export function formatNumber(num) {
  return new Intl.NumberFormat('en-IN').format(Math.round(num));
}

/**
 * Format decimal to fixed places
 * @param {number} num
 * @param {number} places
 * @returns {string}
 */
export function formatDecimal(num, places = 2) {
  return num.toFixed(places);
}
