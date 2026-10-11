/**
 * Nepal Land Unit Converter
 * Standard conversions:
 * 1 Ropani = 16 Aana
 * 1 Aana = 20 Paisa
 * 1 Paisa = 4 Daam
 * 1 Ropani = 508.737 sq meters (5476 sq feet)
 * 1 Aana = 31.796 sq meters (342.25 sq feet)
 * 1 Paisa = 1.5898 sq meters (17.1125 sq feet)
 * 1 Daam = 0.39745 sq meters (4.2781 sq feet)
 */

const UNITS = {
  ropani: { name: 'Ropani', sqMeters: 508.737 },
  aana: { name: 'Aana', sqMeters: 31.796 },
  paisa: { name: 'Paisa', sqMeters: 1.5898 },
  daam: { name: 'Daam', sqMeters: 0.39745 },
  sqft: { name: 'Square Feet', sqMeters: 0.092903 },
  sqm: { name: 'Square Meters', sqMeters: 1 },
};

export function convertLand(value, fromUnit, toUnit) {
  if (!UNITS[fromUnit] || !UNITS[toUnit]) return 0;
  const sqMeters = value * UNITS[fromUnit].sqMeters;
  return sqMeters / UNITS[toUnit].sqMeters;
}

export function convertRopaniToAana(value) {
  return value * 16;
}

export function convertAanaToRopani(value) {
  return value / 16;
}

export function convertRopaniToPaisa(value) {
  return value * 16 * 20;
}

export function convertAanaToPaisa(value) {
  return value * 20;
}

export function convertRopaniToDaam(value) {
  return value * 16 * 20 * 4;
}

export { UNITS };
