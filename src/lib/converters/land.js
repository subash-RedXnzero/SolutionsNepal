/**
 * Nepal Land Unit Converter
 * Standard conversions (Nepal chain, 16 → 4 → 4):
 * 1 Ropani = 16 Aana
 * 1 Aana = 4 Paisa
 * 1 Paisa = 4 Daam
 * 1 Ropani = 508.737 sq meters (5476 sq feet)
 * 1 Aana = 31.796 sq meters (342.25 sq feet)
 * 1 Paisa = 7.949 sq meters (85.56 sq feet)
 * 1 Daam = 1.98725 sq meters (21.39 sq feet)
 */

const UNITS = {
  ropani: { name: 'Ropani', sqMeters: 508.737 },
  aana: { name: 'Aana', sqMeters: 31.796 },
  paisa: { name: 'Paisa', sqMeters: 7.949 },
  daam: { name: 'Daam', sqMeters: 1.98725 },
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
  return value * 16 * 4;
}

export function convertAanaToPaisa(value) {
  return value * 4;
}

export function convertRopaniToDaam(value) {
  return value * 16 * 4 * 4;
}

export { UNITS };
