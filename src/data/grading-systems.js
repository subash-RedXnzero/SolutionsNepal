/**
 * Grading System Configurations — centralized, reusable.
 *
 * Each system defines:
 *   id       — unique identifier
 *   label    — display name
 *   grades   — array of { grade, point, label? }
 *   maxPoint — maximum grade point (used for percentage estimation)
 *   percentFormula — optional function(gpa, maxPoint) → percentage
 *   percentLabel   — label for percentage display
 *
 * To add a new grading system: add an entry to GRADING_SYSTEMS.
 * The GPA/CGPA calculator reads from this config — do NOT duplicate
 * grade mappings elsewhere.
 */

export const GRADING_SYSTEMS = [
  {
    id: 'standard-4',
    label: '4.0 Scale (Standard)',
    maxPoint: 4.0,
    grades: [
      { grade: 'A+', point: 4.0 },
      { grade: 'A', point: 3.7 },
      { grade: 'B+', point: 3.3 },
      { grade: 'B', point: 3.0 },
      { grade: 'B-', point: 2.7 },
      { grade: 'C+', point: 2.3 },
      { grade: 'C', point: 2.0 },
      { grade: 'C-', point: 1.7 },
      { grade: 'D+', point: 1.3 },
      { grade: 'D', point: 1.0 },
      { grade: 'F', point: 0 },
    ],
    percentFormula: (gpa, max) => Math.round((gpa / max) * 100 * 10) / 10,
    percentToGpa: (pct, max) => Math.round((pct / 100) * max * 100) / 100,
    percentLabel: 'Estimated Percentage',
    divisions: [
      { min: 3.5, max: 4.0, label: 'First Division / Distinction' },
      { min: 3.0, max: 3.49, label: 'First Division' },
      { min: 2.5, max: 2.99, label: 'Second Division' },
      { min: 2.0, max: 2.49, label: 'Third Division' },
      { min: 0, max: 1.99, label: 'Fail' },
    ],
    info: 'Standard 4.0 GPA scale. Percentage = (GPA ÷ 4.0) × 100. Commonly used in US-style grading systems.',
  },
  {
    id: 'standard-4-aplus',
    label: '4.0 Scale (with A+)',
    maxPoint: 4.0,
    grades: [
      { grade: 'A+', point: 4.0 },
      { grade: 'A', point: 4.0 },
      { grade: 'A-', point: 3.7 },
      { grade: 'B+', point: 3.3 },
      { grade: 'B', point: 3.0 },
      { grade: 'B-', point: 2.7 },
      { grade: 'C+', point: 2.3 },
      { grade: 'C', point: 2.0 },
      { grade: 'C-', point: 1.7 },
      { grade: 'D', point: 1.0 },
      { grade: 'F', point: 0 },
    ],
    percentFormula: (gpa, max) => Math.round((gpa / max) * 100 * 10) / 10,
    percentToGpa: (pct, max) => Math.round((pct / 100) * max * 100) / 100,
    percentLabel: 'Estimated Percentage',
    divisions: [
      { min: 3.5, max: 4.0, label: 'First Division / Distinction' },
      { min: 3.0, max: 3.49, label: 'First Division' },
      { min: 2.5, max: 2.99, label: 'Second Division' },
      { min: 2.0, max: 2.49, label: 'Third Division' },
      { min: 0, max: 1.99, label: 'Fail' },
    ],
    info: '4.0 scale where both A+ and A equal 4.0. Percentage = (GPA ÷ 4.0) × 100. Used by some institutions that treat A+ and A as the same maximum.',
  },
  {
    id: 'see-nepal',
    label: 'SEE Nepal (10-point)',
    maxPoint: 4.0,
    grades: [
      { grade: 'A+', point: 4.0 },
      { grade: 'A', point: 3.6 },
      { grade: 'B+', point: 3.2 },
      { grade: 'B', point: 2.8 },
      { grade: 'C+', point: 2.4 },
      { grade: 'C', point: 2.0 },
      { grade: 'D+', point: 1.6 },
      { grade: 'D', point: 1.0 },
      { grade: 'NG', point: 0 },
    ],
    percentFormula: (gpa, max) => Math.round((gpa / max) * 100 * 10) / 10,
    percentToGpa: (pct, max) => Math.round((pct / 100) * max * 100) / 100,
    percentLabel: 'Estimated Percentage',
    divisions: [
      { min: 3.6, max: 4.0, label: 'Distinction' },
      { min: 3.2, max: 3.59, label: 'First Division' },
      { min: 2.8, max: 3.19, label: 'Second Division' },
      { min: 2.0, max: 2.79, label: 'Third Division' },
      { min: 0, max: 1.99, label: 'NG (Not Graded)' },
    ],
    info: 'Nepal SEE grading system. GPA maps to 10-point grade letters. Percentage = (GPA ÷ 4.0) × 100. Division boundaries follow Nepal SEE standards.',
  },
  {
    id: '10-point',
    label: '10.0 Scale',
    maxPoint: 10.0,
    grades: [
      { grade: 'O', point: 10.0 },
      { grade: 'A+', point: 9.0 },
      { grade: 'A', point: 8.0 },
      { grade: 'B+', point: 7.0 },
      { grade: 'B', point: 6.0 },
      { grade: 'C', point: 5.0 },
      { grade: 'D', point: 4.0 },
      { grade: 'F', point: 0 },
    ],
    percentFormula: (gpa, max) => Math.round((gpa / max) * 100 * 10) / 10,
    percentToGpa: (pct, max) => Math.round((pct / 100) * max * 100) / 100,
    percentLabel: 'Estimated Percentage',
    divisions: [
      { min: 8.0, max: 10.0, label: 'Outstanding / Distinction' },
      { min: 7.0, max: 7.99, label: 'First Division' },
      { min: 6.0, max: 6.99, label: 'Second Division' },
      { min: 5.0, max: 5.99, label: 'Third Division' },
      { min: 0, max: 4.99, label: 'Fail' },
    ],
    info: '10-point GPA scale used by some Indian and South Asian universities. Percentage = (GPA ÷ 10) × 100.',
  },
];

/**
 * Get a grading system by id.
 * @param {string} id
 * @returns {Object|undefined}
 */
export function getGradingSystem(id) {
  return GRADING_SYSTEMS.find(s => s.id === id);
}

/**
 * Get grade options for a grading system.
 * @param {string} systemId
 * @returns {Array<{grade: string, point: number}>}
 */
export function getGradeOptions(systemId) {
  const sys = getGradingSystem(systemId);
  return sys ? sys.grades : [];
}

/**
 * Calculate GPA from subjects.
 * @param {Array<{grade: string, credits: number}>} subjects
 * @param {string} systemId
 * @returns {{ gpa: number, totalCredits: number, totalPoints: number, percentage: number|null, percentageLabel: string|null }}
 */
export function calculateGpaFromSubjects(subjects, systemId) {
  const sys = getGradingSystem(systemId);
  if (!sys) return { gpa: 0, totalCredits: 0, totalPoints: 0, percentage: null, percentageLabel: null };

  let totalPoints = 0;
  let totalCredits = 0;

  for (const s of subjects) {
    const gradeObj = sys.grades.find(g => g.grade === s.grade);
    if (!gradeObj || !s.credits || s.credits <= 0) continue;
    totalPoints += gradeObj.point * s.credits;
    totalCredits += s.credits;
  }

  if (totalCredits === 0) return { gpa: 0, totalCredits: 0, totalPoints: 0, percentage: null, percentageLabel: null };

  const gpa = Math.round((totalPoints / totalCredits) * 100) / 100;
  const percentage = sys.percentFormula ? sys.percentFormula(gpa, sys.maxPoint) : null;

  return {
    gpa,
    totalCredits,
    totalPoints: Math.round(totalPoints * 100) / 100,
    percentage,
    percentageLabel: sys.percentLabel || null,
  };
}

/**
 * Calculate CGPA from semesters.
 * @param {Array<{gpa: number, credits: number}>} semesters
 * @returns {{ cgpa: number, totalCredits: number, percentage: number|null, percentageLabel: string|null }}
 */
export function calculateCgpa(semesters, systemId) {
  const sys = getGradingSystem(systemId);
  let totalWeighted = 0;
  let totalCredits = 0;

  for (const s of semesters) {
    if (!s.credits || s.credits <= 0 || !Number.isFinite(s.gpa)) continue;
    totalWeighted += s.gpa * s.credits;
    totalCredits += s.credits;
  }

  if (totalCredits === 0) return { cgpa: 0, totalCredits: 0, percentage: null, percentageLabel: null };

  const cgpa = Math.round((totalWeighted / totalCredits) * 100) / 100;
  const percentage = sys?.percentFormula ? sys.percentFormula(cgpa, sys.maxPoint) : null;

  return {
    cgpa,
    totalCredits,
    percentage,
    percentageLabel: sys?.percentLabel || null,
  };
}
