/**
 * Nepal Locations — Property Registration Reference Data
 * ======================================================
 * Seven provinces of Nepal with districts for property registration.
 *
 * SOURCES:
 * - Government of Nepal, Ministry of Land Management
 * - Department of Land Management and Archives
 *
 * NOTE: District and municipality data is for UI structure.
 *       Actual location-specific rates need verification.
 *
 * LAST UPDATED: 2026-08-19
 */

export const PROVINCES = [
  {
    id: 'bagmati',
    name: 'Bagmati',
    nameNepali: 'बागमती',
    label: 'Bagmati',
    districts: [
      { id: 'kathmandu', name: 'Kathmandu', label: 'Kathmandu' },
      { id: 'lalitpur', name: 'Lalitpur', label: 'Lalitpur' },
      { id: 'bhaktapur', name: 'Bhaktapur', label: 'Bhaktapur' },
      { id: 'kavrepalanchok', name: 'Kavrepalanchok', label: 'Kavrepalanchok' },
      { id: 'nuwakot', name: 'Nuwakot', label: 'Nuwakot' },
      { id: 'rasuwa', name: 'Rasuwa', label: 'Rasuwa' },
      { id: 'dolakha', name: 'Dolakha', label: 'Dolakha' },
      { id: 'sindhupalchok', name: 'Sindhupalchok', label: 'Sindhupalchok' },
      { id: 'makwanpur', name: 'Makwanpur', label: 'Makwanpur' },
      { id: 'chitwan', name: 'Chitwan', label: 'Chitwan' },
    ],
  },
  {
    id: 'koshi',
    name: 'Koshi',
    nameNepali: 'कोशी',
    label: 'Koshi',
    districts: [
      { id: 'biratnagar', name: 'Biratnagar', label: 'Biratnagar' },
      { id: 'birgunj', name: 'Birgunj', label: 'Birgunj' },
      { id: 'itahari', name: 'Itahari', label: 'Itahari' },
      { id: 'dharan', name: 'Dharan', label: 'Dharan' },
      { id: 'janakpur', name: 'Janakpur', label: 'Janakpur' },
      { id: 'bhadrapur', name: 'Bhadrapur', label: 'Bhadrapur' },
      { id: 'rajbiraj', name: 'Rajbiraj', label: 'Rajbiraj' },
    ],
  },
  {
    id: 'madhesh',
    name: 'Madhesh',
    nameNepali: 'मधेश',
    label: 'Madhesh',
    districts: [
      { id: 'janakpur_m', name: 'Janakpur', label: 'Janakpur' },
      { id: 'birgunj_m', name: 'Birgunj', label: 'Birgunj' },
      { id: 'rajbiraj_m', name: 'Rajbiraj', label: 'Rajbiraj' },
      { id: 'kalaiya', name: 'Kalaiya', label: 'Kalaiya' },
      { id: 'bara', name: 'Bara', label: 'Bara' },
      { id: 'parsa', name: 'Parsa', label: 'Parsa' },
    ],
  },
  {
    id: 'gandaki',
    name: 'Gandaki',
    nameNepali: 'गण्डकी',
    label: 'Gandaki',
    districts: [
      { id: 'pokhara', name: 'Pokhara', label: 'Pokhara' },
      { id: 'kaski', name: 'Kaski', label: 'Kaski' },
      { id: 'tanahun', name: 'Tanahun', label: 'Tanahun' },
      { id: 'syangja', name: 'Syangja', label: 'Syangja' },
      { id: 'gorkha', name: 'Gorkha', label: 'Gorkha' },
      { id: 'lamjung', name: 'Lamjung', label: 'Lamjung' },
    ],
  },
  {
    id: 'lumbini',
    name: 'Lumbini',
    nameNepali: 'लुम्बिनी',
    label: 'Lumbini',
    districts: [
      { id: 'butwal', name: 'Butwal', label: 'Butwal' },
      { id: 'bhairahawa', name: 'Bhairahawa', label: 'Bhairahawa' },
      { id: 'nepalgunj', name: 'Nepalgunj', label: 'Nepalgunj' },
      { id: 'dang', name: 'Dang', label: 'Dang' },
      { id: 'rupandehi', name: 'Rupandehi', label: 'Rupandehi' },
      { id: 'kapilvastu', name: 'Kapilvastu', label: 'Kapilvastu' },
    ],
  },
  {
    id: 'karnali',
    name: 'Karnali',
    nameNepali: 'कर्णाली',
    label: 'Karnali',
    districts: [
      { id: 'surkhet', name: 'Surkhet', label: 'Surkhet' },
      { id: 'jumla', name: 'Jumla', label: 'Jumla' },
      { id: 'dolpa', name: 'Dolpa', label: 'Dolpa' },
      { id: 'humla', name: 'Humla', label: 'Humla' },
      { id: 'mugu', name: 'Mugu', label: 'Mugu' },
    ],
  },
  {
    id: 'sudurpashchim',
    name: 'Sudurpashchim',
    nameNepali: 'सुदूरपश्चिम',
    label: 'Sudurpashchim',
    districts: [
      { id: 'dhangadhi', name: 'Dhangadhi', label: 'Dhangadhi' },
      { id: 'mahendranagar', name: 'Mahendranagar', label: 'Mahendranagar' },
      { id: 'bhimdatta', name: 'Bhimdatta', label: 'Bhimdatta' },
      { id: 'doti', name: 'Doti', label: 'Doti' },
      { id: 'achham', name: 'Achham', label: 'Achham' },
    ],
  },
];

/**
 * Get all districts for a province
 * @param {string} provinceId
 * @returns {Array}
 */
export function getDistricts(provinceId) {
  const province = PROVINCES.find(p => p.id === provinceId);
  return province ? province.districts : [];
}

/**
 * Get province by ID
 * @param {string} id
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
