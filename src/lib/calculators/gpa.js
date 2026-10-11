/**
 * SEE (Secondary Education Examination) GPA Calculator
 * Nepal SEE grading system:
 * A+ = 4.0 (90-100)
 * A  = 3.6 (80-89)
 * B+ = 3.2 (70-79)
 * B  = 2.8 (60-69)
 * C+ = 2.4 (50-59)
 * C  = 2.0 (40-49)
 * D+ = 1.6 (30-39)
 * D  = 1.0 (20-29)
 * NG = 0 (Below 20)
 */

const GRADE_POINTS = {
  'A+': 4.0,
  'A': 3.6,
  'B+': 3.2,
  'B': 2.8,
  'C+': 2.4,
  'C': 2.0,
  'D+': 1.6,
  'D': 1.0,
  'NG': 0,
};

const GRADE_LABELS = {
  'A+': 'Outstanding',
  'A': 'Excellent',
  'B+': 'Very Good',
  'B': 'Good',
  'C+': 'Above Average',
  'C': 'Average',
  'D+': 'Below Average',
  'D': 'Marginal',
  'NG': 'Not Graded',
};

const SUBJECTS = [
  'English',
  'Nepali',
  'Mathematics',
  'Science',
  'Social Studies',
  'Health & Population',
  'Occupation',
];

export function calculateGPA(grades) {
  const validGrades = grades.filter(g => g && GRADE_POINTS[g] !== undefined);

  if (validGrades.length === 0) {
    return { gpa: 0, totalCredits: 0, subjects: [] };
  }

  const totalPoints = validGrades.reduce((sum, g) => sum + GRADE_POINTS[g], 0);
  const gpa = totalPoints / validGrades.length;

  return {
    gpa: Math.round(gpa * 100) / 100,
    totalCredits: validGrades.length,
    subjects: grades.map((g, i) => ({
      name: SUBJECTS[i] || `Subject ${i + 1}`,
      grade: g || '-',
      point: GRADE_POINTS[g] || 0,
      label: GRADE_LABELS[g] || '-',
    })),
  };
}

export function getGpaLabel(gpa) {
  if (gpa >= 3.8) return 'Outstanding';
  if (gpa >= 3.5) return 'Excellent';
  if (gpa >= 3.0) return 'Very Good';
  if (gpa >= 2.5) return 'Good';
  if (gpa >= 2.0) return 'Average';
  if (gpa >= 1.0) return 'Below Average';
  return 'Needs Improvement';
}

export { GRADE_POINTS, GRADE_LABELS, SUBJECTS };
