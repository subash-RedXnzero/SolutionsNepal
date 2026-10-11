/**
 * NEB +2 Class 11 & 12 — Faculty-Based Subject Configuration
 * Organized: +2 → Class → Faculty → Compulsory + Optional Slots
 * Based on CDC Curriculum Framework + Letter Grading Directive 2078.
 *
 * Source: National Examinations Board (NEB) Nepal
 *         Curriculum Development Centre (CDC)
 * Academic Year: 2082/83 BS (2025/26 AD)
 * Last Verified: 2026-08-21
 *
 * Compulsory varies by faculty:
 *   Science: English + Nepali + Physics + Chemistry + Mathematics (5 compulsory)
 *   Other faculties: English + Nepali + (Mathematics OR Social Studies) (3 compulsory)
 * Optional: 1–3 subjects from faculty-specific list (100 marks each)
 * Total = 6 subjects per student.
 *
 * NOTE: Available subjects may vary by school/college.
 * This covers the broad NEB subject bank. Consult your institution
 * for the exact subject combination offered.
 */

export const NEB_CONFIG = {
  academicYear: "2082/83",
  academicYearAD: "2025/26",
  directive: "Letter Grading Directive 2078",
  source: "National Examinations Board (NEB) Nepal",
  sourceUrl: "https://www.neb.gov.np",
  curriculumSource: "Curriculum Development Centre (CDC)",
  curriculumUrl: "https://cdctu.edu.np",
  lastVerified: "2026-08-21",
};

export const NEB_GRADING_RULES = {
  directive: "Letter Grading Directive 2078",
  lastVerified: "2026-08-21",
  source: "National Examinations Board (NEB) Nepal",
  sourceUrl: "https://www.neb.gov.np",
  gradeTable: [
    { min: 90, max: 100, grade: "A+", point: 4.0, color: "#059669" },
    { min: 80, max: 89.99, grade: "A", point: 3.6, color: "#16A34A" },
    { min: 70, max: 79.99, grade: "B+", point: 3.2, color: "#2563EB" },
    { min: 60, max: 69.99, grade: "B", point: 2.8, color: "#7C3AED" },
    { min: 50, max: 59.99, grade: "C+", point: 2.4, color: "#D97706" },
    { min: 40, max: 49.99, grade: "C", point: 2.0, color: "#EA580C" },
    { min: 35, max: 39.99, grade: "D", point: 1.6, color: "#DC2626" },
    { min: 0, max: 34.99, grade: "NG", point: 0.0, color: "#6B7280" },
  ],
  theoryPassRate: 0.35,
  internalPassRate: 0.40,
};

/**
 * Subject bank: all available NEB +2 subjects with full metadata.
 * Referenced by faculty optional slot choices.
 */
export const NEB_SUBJECT_BANK = {
  eng:   { id: "eng",   name: "English",                  code: "Eng.101",  creditHours: 4, components: [{ type: "Theory", max: 75 }, { type: "Internal", max: 25 }] },
  nep:   { id: "nep",   name: "Nepali",                   code: "Nep.101",  creditHours: 3, components: [{ type: "Theory", max: 75 }, { type: "Internal", max: 25 }] },
  sol:   { id: "sol",   name: "Social Studies & Life Skills", code: "Sol.447", creditHours: 5, components: [{ type: "Theory", max: 75 }, { type: "Internal", max: 25 }] },
  math:  { id: "math",  name: "Mathematics",              code: "Mat.101",  creditHours: 5, components: [{ type: "Theory", max: 75 }, { type: "Internal", max: 25 }] },
  phy:   { id: "phy",   name: "Physics",                  code: "Phy.101",  creditHours: 5, components: [{ type: "Theory", max: 75 }, { type: "Practical", max: 25 }] },
  chem:  { id: "chem",  name: "Chemistry",                code: "Che.101",  creditHours: 5, components: [{ type: "Theory", max: 75 }, { type: "Practical", max: 25 }] },
  bio:   { id: "bio",   name: "Biology",                  code: "Bio.201",  creditHours: 5, components: [{ type: "Theory", max: 75 }, { type: "Practical", max: 25 }] },
  cs:    { id: "cs",    name: "Computer Science",         code: "Com.231",  creditHours: 5, components: [{ type: "Theory", max: 50 }, { type: "Practical", max: 50 }] },
  acc:   { id: "acc",   name: "Accountancy",              code: "Acc.101",  creditHours: 5, components: [{ type: "Theory", max: 75 }, { type: "Internal", max: 25 }] },
  eco:   { id: "eco",   name: "Economics",                code: "Eco.101",  creditHours: 5, components: [{ type: "Theory", max: 75 }, { type: "Internal", max: 25 }] },
  bus:   { id: "bus",   name: "Business Studies",         code: "Bus.101",  creditHours: 5, components: [{ type: "Theory", max: 75 }, { type: "Internal", max: 25 }] },
  bmt:   { id: "bmt",   name: "Business Mathematics",     code: "Bmt.201",  creditHours: 5, components: [{ type: "Theory", max: 75 }, { type: "Internal", max: 25 }] },
  mar:   { id: "mar",   name: "Marketing",                code: "Mar.307",  creditHours: 5, components: [{ type: "Theory", max: 75 }, { type: "Internal", max: 25 }] },
  fin:   { id: "fin",   name: "Finance",                  code: "Fin.417",  creditHours: 5, components: [{ type: "Theory", max: 75 }, { type: "Internal", max: 25 }] },
  hm:    { id: "hm",    name: "Hotel Management",         code: "Hom.439",  creditHours: 5, components: [{ type: "Theory", max: 50 }, { type: "Practical", max: 50 }] },
  his:   { id: "his",   name: "History",                  code: "His.101",  creditHours: 5, components: [{ type: "Theory", max: 75 }, { type: "Internal", max: 25 }] },
  pol:   { id: "pol",   name: "Political Science",        code: "Pol.101",  creditHours: 5, components: [{ type: "Theory", max: 75 }, { type: "Internal", max: 25 }] },
  geo:   { id: "geo",   name: "Geography",                code: "Geo.201",  creditHours: 5, components: [{ type: "Theory", max: 75 }, { type: "Internal", max: 25 }] },
  soc:   { id: "soc",   name: "Sociology",                code: "Soc.201",  creditHours: 5, components: [{ type: "Theory", max: 75 }, { type: "Internal", max: 25 }] },
  psy:   { id: "psy",   name: "Psychology",               code: "Psy.101",  creditHours: 5, components: [{ type: "Theory", max: 75 }, { type: "Internal", max: 25 }] },
  phil:  { id: "phil",  name: "Philosophy",               code: "Phi.201",  creditHours: 5, components: [{ type: "Theory", max: 75 }, { type: "Internal", max: 25 }] },
  edu:   { id: "edu",   name: "Education",                code: "Edu.101",  creditHours: 5, components: [{ type: "Theory", max: 75 }, { type: "Internal", max: 25 }] },
  ped:   { id: "ped",   name: "Pedagogy",                 code: "Ped.201",  creditHours: 5, components: [{ type: "Theory", max: 75 }, { type: "Internal", max: 25 }] },
  rd:    { id: "rd",    name: "Rural Development",        code: "Rd.105",   creditHours: 5, components: [{ type: "Theory", max: 75 }, { type: "Internal", max: 25 }] },
  pop:   { id: "pop",   name: "Population Studies",       code: "Pop.201",  creditHours: 5, components: [{ type: "Theory", max: 75 }, { type: "Internal", max: 25 }] },
  mc:    { id: "mc",    name: "Mass Communication",       code: "Mc.201",   creditHours: 5, components: [{ type: "Theory", max: 75 }, { type: "Internal", max: 25 }] },
  gend:  { id: "gend",  name: "Gender Studies",           code: "Gen.201",  creditHours: 5, components: [{ type: "Theory", max: 75 }, { type: "Internal", max: 25 }] },
  hpe:   { id: "hpe",   name: "Health & Physical Education", code: "Hpe.201", creditHours: 5, components: [{ type: "Theory", max: 75 }, { type: "Internal", max: 25 }] },
  hs:    { id: "hs",    name: "Home Science",             code: "Hsc.201",  creditHours: 5, components: [{ type: "Theory", max: 75 }, { type: "Internal", max: 25 }] },
  cul:   { id: "cul",   name: "Culture",                  code: "Cul.201",  creditHours: 5, components: [{ type: "Theory", max: 75 }, { type: "Internal", max: 25 }] },
  gl:    { id: "gl",    name: "General Law",              code: "Glaw.201", creditHours: 5, components: [{ type: "Theory", max: 75 }, { type: "Internal", max: 25 }] },
  hr:    { id: "hr",    name: "Human Rights",             code: "Hrts.201", creditHours: 5, components: [{ type: "Theory", max: 75 }, { type: "Internal", max: 25 }] },
  sans:  { id: "sans",  name: "Sanskrit",                 code: "Sns.201",  creditHours: 5, components: [{ type: "Theory", max: 75 }, { type: "Internal", max: 25 }] },
  sans_g:{ id: "sans_g",name: "Sanskrit Grammar",         code: "Sns.G01",  creditHours: 5, components: [{ type: "Theory", max: 75 }, { type: "Internal", max: 25 }] },
  sans_l:{ id: "sans_l",name: "Sanskrit Literature",      code: "Sns.L01",  creditHours: 5, components: [{ type: "Theory", max: 75 }, { type: "Internal", max: 25 }] },
  sans_p:{ id: "sans_p",name: "Sanskrit Philosophy",      code: "Sns.P01",  creditHours: 5, components: [{ type: "Theory", max: 75 }, { type: "Internal", max: 25 }] },
  sans_v:{ id: "sans_v",name: "Vedic Studies",            code: "Sns.V01",  creditHours: 5, components: [{ type: "Theory", max: 75 }, { type: "Internal", max: 25 }] },
  tms:   { id: "tms",   name: "Tourism & Mountaineering", code: "Tms.305",  creditHours: 5, components: [{ type: "Theory", max: 75 }, { type: "Internal", max: 25 }] },
};

/**
 * Faculty definitions: compulsory subjects + optional slot choices.
 * Compulsory: English + Nepali + (Math OR Social Studies)
 * Each faculty has 3 optional slots. Each slot lists the valid choices.
 */
export const NEB_FACULTIES = {
  11: {
    science: {
      label: "Science",
      compulsory: ["eng", "nep", "phy", "chem", "math"],
      optionalSlots: [
        ["bio", "cs"],
      ],
    },
    management: {
      label: "Management",
      compulsory: ["eng", "nep", "acc"],
      optionalSlots: [
        ["eco", "mar"],
        ["bus", "cs", "hm"],
        ["sol", "bmt"],
      ],
    },
    humanities: {
      label: "Humanities",
      compulsory: ["eng", "nep", "sol"],
      thirdCompulsoryDefault: "sol",
      optionalSlots: [
        ["his", "psy", "pop", "mc", "gend"],
        ["pol", "geo", "hpe", "hs", "cul"],
        ["eco", "phil", "soc", "rd"],
      ],
    },
    education: {
      label: "Education",
      compulsory: ["eng", "nep", "edu"],
      thirdCompulsoryDefault: "sol",
      optionalSlots: [
        ["psy", "pop", "hpe"],
        ["sol", "ped", "soc"],
        ["pol", "geo", "mc", "rd"],
      ],
    },
    law: {
      label: "Law",
      compulsory: ["eng", "nep", "sol"],
      thirdCompulsoryDefault: "sol",
      optionalSlots: [
        ["gl", "hr", "pol"],
        ["his", "eco", "geo"],
        ["psy", "phil", "soc", "mc"],
      ],
    },
    sanskrit: {
      label: "Sanskrit",
      compulsory: ["eng", "nep", "sans"],
      thirdCompulsoryDefault: "sol",
      optionalSlots: [
        ["sans_g", "sans_l"],
        ["sans_p", "sans_v"],
        ["his", "phil", "pol"],
      ],
    },
    other: {
      label: "Other",
      compulsory: ["eng", "nep", "sol"],
      thirdCompulsoryDefault: "sol",
      optionalSlots: [
        ["phy", "chem", "math", "bio", "cs"],
        ["acc", "eco", "bus", "bmt", "mar", "fin", "hm", "tms"],
        ["his", "pol", "geo", "psy", "phil", "soc", "edu", "ped", "pop", "mc", "gend", "hpe", "hs", "cul", "rd", "gl", "hr", "sans", "sans_g", "sans_l", "sans_p", "sans_v"],
      ],
    },
  },
  12: {
    science: {
      label: "Science",
      compulsory: ["eng", "nep", "phy", "chem", "math"],
      optionalSlots: [
        ["bio", "cs"],
      ],
    },
    management: {
      label: "Management",
      compulsory: ["eng", "nep", "acc"],
      optionalSlots: [
        ["eco", "mar"],
        ["bus", "cs", "hm"],
        ["sol", "bmt"],
      ],
    },
    humanities: {
      label: "Humanities",
      compulsory: ["eng", "nep", "sol"],
      thirdCompulsoryDefault: "sol",
      optionalSlots: [
        ["his", "psy", "pop", "mc", "gend"],
        ["pol", "geo", "hpe", "hs", "cul"],
        ["eco", "phil", "soc", "rd"],
      ],
    },
    education: {
      label: "Education",
      compulsory: ["eng", "nep", "edu"],
      thirdCompulsoryDefault: "sol",
      optionalSlots: [
        ["psy", "pop", "hpe"],
        ["sol", "ped", "soc"],
        ["pol", "geo", "mc", "rd"],
      ],
    },
    law: {
      label: "Law",
      compulsory: ["eng", "nep", "sol"],
      thirdCompulsoryDefault: "sol",
      optionalSlots: [
        ["gl", "hr", "pol"],
        ["his", "eco", "geo"],
        ["psy", "phil", "soc", "mc"],
      ],
    },
    sanskrit: {
      label: "Sanskrit",
      compulsory: ["eng", "nep", "sans"],
      thirdCompulsoryDefault: "sol",
      optionalSlots: [
        ["sans_g", "sans_l"],
        ["sans_p", "sans_v"],
        ["his", "phil", "pol"],
      ],
    },
    other: {
      label: "Other",
      compulsory: ["eng", "nep", "sol"],
      thirdCompulsoryDefault: "sol",
      optionalSlots: [
        ["phy", "chem", "math", "bio", "cs"],
        ["acc", "eco", "bus", "bmt", "mar", "fin", "hm", "tms"],
        ["his", "pol", "geo", "psy", "phil", "soc", "edu", "ped", "pop", "mc", "gend", "hpe", "hs", "cul", "rd", "gl", "hr", "sans", "sans_g", "sans_l", "sans_p", "sans_v"],
      ],
    },
  },
};

/** Resolve a subject ID to its full object from the bank */
export function resolveSubject(id) {
  return NEB_SUBJECT_BANK[id] || null;
}

/** Get the full faculty config for a given class + faculty key */
export function getFacultyConfig(classNum, facultyKey) {
  var cls = NEB_FACULTIES[classNum];
  if (!cls) return null;
  return cls[facultyKey] || null;
}

/** Get faculty list for a given class */
export function getFaculties(classNum) {
  var cls = NEB_FACULTIES[classNum];
  if (!cls) return [];
  return Object.keys(cls).map(function (key) {
    return { key: key, label: cls[key].label };
  });
}
