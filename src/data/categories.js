import { tools } from './tools.js';

export const categories = [
  {
    id: 'date',
    name: 'Date & Calendar',
    description: 'Nepali calendar, BS ↔ AD converters & date calculators',
    icon: 'calendar',
    href: '/nepal/date',
    color: '#E2726A',
  },
  {
    id: 'finance',
    name: 'Finance',
    description: 'Salary, tax, loans, forex & money calculators',
    icon: 'banknote',
    href: '/nepal/finance',
    color: '#059669',
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Break-even, registration costs & business calculators',
    icon: 'briefcase',
    href: '/nepal/business',
    color: '#475569',
  },
  {
    id: 'nepse',
    name: 'NEPSE',
    description: 'Nepal stock exchange tools and calculators',
    icon: 'trending-up',
    href: '/nepal/nepse',
    color: '#2563EB',
  },
  {
    id: 'land',
    name: 'Land & Property',
    description: 'Ropani ↔ Aana converters & land registration costs',
    icon: 'land-plot',
    href: '/nepal/land',
    color: '#D97706',
  },
  {
    id: 'gold',
    name: 'Gold & Silver',
    description: 'Gold & silver prices and weight converters',
    icon: 'gem',
    href: '/nepal/gold',
    color: '#CA8A04',
  },
  {
    id: 'education',
    name: 'Education',
    description: 'Academic calculators and GPA tools',
    icon: 'graduation-cap',
    href: '/nepal/education',
    color: '#7C3AED',
  },
  {
    id: 'language',
    name: 'Language & Text',
    description: 'Nepali Unicode, translator & number-to-words tools',
    icon: 'languages',
    href: '/nepal/tools',
    color: '#6366F1',
  },
  {
    id: 'utilities',
    name: 'Utilities',
    description: 'Bills, weather, QR codes & everyday utilities',
    icon: 'droplets',
    href: '/nepal/utilities',
    color: '#0EA5E9',
  },
  {
    id: 'vehicle',
    name: 'Vehicles',
    description: 'Fuel prices, trip cost & ownership cost',
    icon: 'car',
    href: '/nepal/vehicle',
    color: '#0891B2',
  },
  {
    id: 'transport',
    name: 'Transport',
    description: 'Vehicle tax, fines, renewal & likhit test',
    icon: 'truck',
    href: '/nepal/transport',
    color: '#0D9488',
  },
  {
    id: 'construction',
    name: 'Construction & Property',
    description: 'House building cost & material estimates',
    icon: 'hammer',
    href: '/nepal/construction',
    color: '#B45309',
  },
  {
    id: 'photo',
    name: 'Photo & Image',
    description: 'Passport photos, ID photos & image compression',
    icon: 'camera',
    href: '/tools/photo',
    color: '#EA580C',
  },
  {
    id: 'pdf',
    name: 'PDF Tools',
    description: 'Convert, combine, compress, and manage PDF files',
    icon: 'file-text',
    href: '/tools/pdf',
    color: '#B3261E',
  },
  {
    id: 'names',
    name: 'Names',
    description: 'Nepali names, meanings, and baby name directory',
    icon: 'baby',
    href: '/nepal/names',
    color: '#DB2777',
  },
];

/** Sidebar/hub display order. Single source of truth for category ordering. */
export const CATEGORY_ORDER = [
  'date',
  'finance',
  'business',
  'nepse',
  'land',
  'gold',
  'education',
  'language',
  'utilities',
  'vehicle',
  'construction',
  'transport',
  'photo',
  'image-convert',
  'pdf',
  'names',
];

/** Live tool counts derived from the tools registry — never hardcoded. */
export function getCategoryCounts() {
  const counts = {};
  tools.forEach((t) => {
    counts[t.category] = (counts[t.category] || 0) + 1;
  });
  return counts;
}

/** Categories that actually contain tools, in display order, each with a live `count`. */
export function getActiveCategories() {
  const counts = getCategoryCounts();
  return CATEGORY_ORDER.map((id) => categories.find((c) => c.id === id))
    .filter((c) => c && counts[c.id] > 0)
    .map((c) => ({ ...c, count: counts[c.id] }));
}

export function getCategoryById(id) {
  return categories.find((c) => c.id === id);
}
