/**
 * Gold Weight Converter (Nepal)
 * 1 Tola = 11.664 grams
 * 1 Vori (Bori) = 13.6 grams (1 Vori = 10 Tola)
 * 1 Gram = 0.08574 Tola
 */

const GRAMS_PER_TOLA = 11.664;
const GRAMS_PER_VORI = 13.6;

export function tolaToGram(tola) {
  return tola * GRAMS_PER_TOLA;
}

export function gramToTola(gram) {
  return gram / GRAMS_PER_TOLA;
}

export function tolaToVori(tola) {
  return tola / 10;
}

export function voriToTola(vori) {
  return vori * 10;
}

export function gramToVori(gram) {
  return gram / GRAMS_PER_VORI;
}

export function voriToGram(vori) {
  return vori * GRAMS_PER_VORI;
}

export { GRAMS_PER_TOLA, GRAMS_PER_VORI };
