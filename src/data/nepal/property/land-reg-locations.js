/**
 * Nepal Land Registration — Location & Rate Data
 */

export const LOCAL_BODY_RATES = {
  Metropolitan: 0.05,
  "Sub-Metropolitan": 0.045,
  Municipality: 0.04,
  "Rural Municipality": 0.02,
};

export const PROPERTY_TYPE_RATES = {
  land: null,
  apartment: 0.01,
  highrise: 0.005,
  "group-housing": 0.02,
};

export const PROPERTY_TYPE_LABELS = {
  land: "Land / House",
  apartment: "Apartment",
  highrise: "High-Rise Apartment (5+ Story)",
  "group-housing": "Group Housing",
};

export const TRANSACTION_TYPES = {
  purchase: { label: "Sale / Purchase", familyRate: false },
  family: { label: "Family Transfer", familyRate: true },
  gift: { label: "Gift", familyRate: false },
  partition: { label: "Partition", familyRate: false },
};

const BAGMATI = [
  { id: "kathmandu", name: "Kathmandu", hasSurcharge: true, municipalities: [
    { name: "Kathmandu Metropolitan City", type: "Metropolitan" },
    { name: "Kirtipur Municipality", type: "Municipality" },
    { name: "Budhanilkantha Municipality", type: "Municipality" },
    { name: "Chandragiri Municipality", type: "Municipality" },
    { name: "Tokha Municipality", type: "Municipality" },
    { name: "Shankharapur Municipality", type: "Municipality" },
    { name: "Tarakeshwar Municipality", type: "Municipality" },
    { name: "Dakshinkali Municipality", type: "Municipality" },
    { name: "Gokarneshwar Municipality", type: "Municipality" },
  ]},
  { id: "lalitpur", name: "Lalitpur", hasSurcharge: true, municipalities: [
    { name: "Lalitpur Metropolitan City", type: "Metropolitan" },
    { name: "Mahalaxmi Municipality", type: "Municipality" },
    { name: "Godawari Municipality", type: "Municipality" },
  ]},
  { id: "bhaktapur", name: "Bhaktapur", hasSurcharge: true, municipalities: [
    { name: "Bhaktapur Municipality", type: "Municipality" },
    { name: "Madhyapur Thimi Municipality", type: "Municipality" },
  ]},
  { id: "chitwan", name: "Chitwan", hasSurcharge: false, municipalities: [
    { name: "Bharatpur Metropolitan City", type: "Metropolitan" },
    { name: "Narayangarh Municipality", type: "Municipality" },
    { name: "Ratnanagar Municipality", type: "Municipality" },
  ]},
  { id: "kavrepalanchok", name: "Kavrepalanchok", hasSurcharge: false, municipalities: [
    { name: "Dhulikhel Municipality", type: "Municipality" },
    { name: "Banepa Municipality", type: "Municipality" },
  ]},
  { id: "nuwakot", name: "Nuwakot", hasSurcharge: false, municipalities: [
    { name: "Bidur Municipality", type: "Municipality" },
    { name: "Trishuli Municipality", type: "Municipality" },
  ]},
  { id: "makwanpur", name: "Makwanpur", hasSurcharge: false, municipalities: [
    { name: "Hetauda Sub-Metropolitan City", type: "Sub-Metropolitan" },
  ]},
  { id: "rasuwa", name: "Rasuwa", hasSurcharge: false, municipalities: [
    { name: "Dhunche Municipality", type: "Municipality" },
  ]},
  { id: "dolakha", name: "Dolakha", hasSurcharge: false, municipalities: [
    { name: "Charikot Municipality", type: "Municipality" },
  ]},
  { id: "sindhupalchok", name: "Sindhupalchok", hasSurcharge: false, municipalities: [
    { name: "Chautara Municipality", type: "Municipality" },
  ]},
];

const KOSHI = [
  { id: "biratnagar", name: "Biratnagar", hasSurcharge: false, municipalities: [
    { name: "Biratnagar Metropolitan City", type: "Metropolitan" },
    { name: "Rangeli Municipality", type: "Municipality" },
  ]},
  { id: "jhapa", name: "Jhapa", hasSurcharge: false, municipalities: [
    { name: "Birtamod Municipality", type: "Municipality" },
    { name: "Damak Municipality", type: "Municipality" },
    { name: "Mechinagar Municipality", type: "Municipality" },
  ]},
  { id: "sunsari", name: "Sunsari", hasSurcharge: false, municipalities: [
    { name: "Itahari Sub-Metropolitan City", type: "Sub-Metropolitan" },
    { name: "Dharan Sub-Metropolitan City", type: "Sub-Metropolitan" },
  ]},
  { id: "saptari", name: "Saptari", hasSurcharge: false, municipalities: [
    { name: "Rajbiraj Municipality", type: "Municipality" },
  ]},
];

const MADHESH = [
  { id: "parsa", name: "Parsa", hasSurcharge: false, municipalities: [
    { name: "Birgunj Metropolitan City", type: "Metropolitan" },
  ]},
  { id: "bara", name: "Bara", hasSurcharge: false, municipalities: [
    { name: "Kalaiya Sub-Metropolitan City", type: "Sub-Metropolitan" },
  ]},
  { id: "dhanusha", name: "Dhanusha", hasSurcharge: false, municipalities: [
    { name: "Janakpur Sub-Metropolitan City", type: "Sub-Metropolitan" },
  ]},
];

const GANDAKI = [
  { id: "kaski", name: "Kaski", hasSurcharge: false, municipalities: [
    { name: "Pokhara Metropolitan City", type: "Metropolitan" },
  ]},
  { id: "tanahun", name: "Tanahun", hasSurcharge: false, municipalities: [
    { name: "Damauli Municipality", type: "Municipality" },
  ]},
  { id: "gorkha", name: "Gorkha", hasSurcharge: false, municipalities: [
    { name: "Gorkha Municipality", type: "Municipality" },
  ]},
];

const LUMBINI = [
  { id: "rupandehi", name: "Rupandehi", hasSurcharge: false, municipalities: [
    { name: "Butwal Sub-Metropolitan City", type: "Sub-Metropolitan" },
    { name: "Bhairahawa Municipality", type: "Municipality" },
  ]},
  { id: "dang", name: "Dang", hasSurcharge: false, municipalities: [
    { name: "Tulsipur Sub-Metropolitan City", type: "Sub-Metropolitan" },
    { name: "Ghorahi Sub-Metropolitan City", type: "Sub-Metropolitan" },
  ]},
  { id: "banke", name: "Banke", hasSurcharge: false, municipalities: [
    { name: "Nepalgunj Sub-Metropolitan City", type: "Sub-Metropolitan" },
  ]},
];

const KARNALI = [
  { id: "surkhet", name: "Surkhet", hasSurcharge: false, municipalities: [
    { name: "Birendranagar Municipality", type: "Municipality" },
  ]},
  { id: "jumla", name: "Jumla", hasSurcharge: false, municipalities: [
    { name: "Chandannath Municipality", type: "Municipality" },
  ]},
];

const SUDURPASHCHIM = [
  { id: "kailali", name: "Kailali", hasSurcharge: false, municipalities: [
    { name: "Dhangadhi Sub-Metropolitan City", type: "Sub-Metropolitan" },
  ]},
  { id: "kanchanpur", name: "Kanchanpur", hasSurcharge: false, municipalities: [
    { name: "Mahendranagar Municipality", type: "Municipality" },
  ]},
  { id: "achham", name: "Achham", hasSurcharge: false, municipalities: [
    { name: "Mangalsen Municipality", type: "Municipality" },
  ]},
];

export const PROVINCES = [
  { id: "bagmati", name: "Bagmati Province", districts: BAGMATI },
  { id: "koshi", name: "Koshi Province", districts: KOSHI },
  { id: "madhesh", name: "Madhesh Province", districts: MADHESH },
  { id: "gandaki", name: "Gandaki Province", districts: GANDAKI },
  { id: "lumbini", name: "Lumbini Province", districts: LUMBINI },
  { id: "karnali", name: "Karnali Province", districts: KARNALI },
  { id: "sudurpashchim", name: "Sudurpashchim Province", districts: SUDURPASHCHIM },
];

export function getDistricts(provinceId) {
  const p = PROVINCES.find(x => x.id === provinceId);
  return p ? p.districts : [];
}

export function getMunicipalities(provinceId, districtId) {
  const d = getDistricts(provinceId).find(x => x.id === districtId);
  return d ? d.municipalities : [];
}

export function hasBagmatiSurcharge(provinceId, districtId) {
  const d = getDistricts(provinceId).find(x => x.id === districtId);
  return d ? d.hasSurcharge : false;
}
