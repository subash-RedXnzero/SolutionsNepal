/**
 * NEB +2 Class 11 & 12 GPA Calculator Engine
 * Faculty-based calculation with component pass/fail logic.
 * Based on Letter Grading Directive 2078.
 * Pure, deterministic logic (zero UI/DOM reliance).
 * LAST UPDATED: 2026-08-20
 */

import { NEB_GRADING_RULES } from "../../data/nepal/education/nebGradingData.js";

/**
 * Look up grade and grade point from percentage
 */
function getGradeFromPercentage(percentage) {
  var table = NEB_GRADING_RULES.gradeTable;
  for (var i = 0; i < table.length; i++) {
    var row = table[i];
    if (percentage >= row.min && percentage <= row.max) {
      return { grade: row.grade, point: row.point, color: row.color };
    }
  }
  return { grade: "NG", point: 0.0, color: "#6B7280" };
}

/**
 * Look up grade from GPA value
 * @param {number} gpa - GPA value (0.0 to 4.0)
 * @returns {Object} { grade, point, color }
 */
export function getGradeFromGpa(gpa) {
  var val = parseFloat(gpa);
  if (isNaN(val) || val < 0 || val > 4.0) {
    return { grade: "NG", point: 0.0, color: "#6B7280" };
  }
  var table = NEB_GRADING_RULES.gradeTable;
  for (var i = 0; i < table.length; i++) {
    var row = table[i];
    if (Math.abs(val - row.point) < 0.01) {
      return { grade: row.grade, point: row.point, color: row.color };
    }
  }
  return { grade: "NG", point: 0.0, color: "#6B7280" };
}

/**
 * Calculate NEB GPA from component GPA values
 * @param {Array} subjectInputs - Array of { id, name, creditHours, components: [{ type, gpa }] }
 * @returns {Object} GPA calculation result
 */
export function calculateNebGpaFromGpa(subjectInputs) {
  var warnings = [];
  var totalWeightedPoints = 0;
  var totalCreditHours = 0;
  var hasAnyNG = false;
  var completedCount = 0;

  var results = subjectInputs.map(function (sub) {
    var creditHours = sub.creditHours || 5;
    var subjectFailed = false;
    var failReason = "";
    var componentResults = [];
    var componentGpas = [];

    sub.components.forEach(function (comp) {
      var gpaVal = parseFloat(comp.gpa);
      var filled = comp.gpa !== undefined && comp.gpa !== "" && !isNaN(gpaVal);
      var gpa = filled ? gpaVal : 0;

      if (filled && gpa < 1.6) {
        subjectFailed = true;
        failReason = comp.type + " GPA " + gpa.toFixed(2) + " < 1.6 (below D pass mark)";
      }

      var gradeInfo = filled ? getGradeFromGpa(gpa) : { grade: "—", point: 0, color: "#9CA3AF" };
      componentResults.push({ type: comp.type, gpa: gpa, grade: gradeInfo.grade, color: gradeInfo.color });
      if (filled) componentGpas.push(gpa);
    });

    var subjectGpa = componentGpas.length > 0 ? componentGpas.reduce(function (a, b) { return a + b; }, 0) / componentGpas.length : 0;

    var gradeInfo;
    if (subjectFailed) {
      gradeInfo = { grade: "NG", point: 0.0, color: "#6B7280" };
      warnings.push(sub.name + ": " + failReason);
    } else if (componentGpas.length > 0) {
      gradeInfo = getGradeFromGpa(subjectGpa);
    } else {
      gradeInfo = { grade: "—", point: 0, color: "#9CA3AF" };
    }

    if (gradeInfo.grade === "NG") hasAnyNG = true;
    if (componentGpas.length > 0) completedCount++;

    totalWeightedPoints += gradeInfo.point * creditHours;
    totalCreditHours += creditHours;

    return {
      id: sub.id,
      name: sub.name,
      creditHours: creditHours,
      components: componentResults,
      totalMarks: 0,
      totalMax: 0,
      percentage: 0,
      grade: gradeInfo.grade,
      gradePoint: gradeInfo.point,
      color: gradeInfo.color,
      subjectFailed: subjectFailed,
      failReason: failReason,
    };
  });

  var gpa = totalCreditHours > 0 ? totalWeightedPoints / totalCreditHours : 0;
  var roundedGpa = Math.round(gpa * 100) / 100;

  var classification;
  if (hasAnyNG) {
    classification = "NG (Not Graded / Non-Promoted)";
  } else if (roundedGpa >= 3.6) {
    classification = "Distinction";
  } else if (roundedGpa >= 3.2) {
    classification = "First Division";
  } else if (roundedGpa >= 2.4) {
    classification = "Second Division";
  } else if (roundedGpa >= 2.0) {
    classification = "Third Division";
  } else {
    classification = "Not Promoted";
  }

  return {
    valid: true,
    gpa: roundedGpa,
    classification: classification,
    hasAnyNG: hasAnyNG,
    totalCreditHours: totalCreditHours,
    completedCount: completedCount,
    totalSubjects: subjectInputs.length,
    results: results,
    warnings: warnings,
  };
}

/**
 * Calculate NEB GPA from subject marks
 * @param {Array} subjectInputs - Array of { id, name, creditHours, components: [{ type, max, marks }] }
 * @returns {Object} GPA calculation result
 */
export function calculateNebGpa(subjectInputs) {
  var warnings = [];
  var totalWeightedPoints = 0;
  var totalCreditHours = 0;
  var hasAnyNG = false;
  var completedCount = 0;

  var results = subjectInputs.map(function (sub) {
    var creditHours = sub.creditHours || 5;
    var totalMarks = 0;
    var totalMax = 0;
    var subjectFailed = false;
    var failReason = "";
    var componentResults = [];

    sub.components.forEach(function (comp) {
      var marks = Math.max(0, parseFloat(comp.marks) || 0);
      var max = comp.max;
      totalMax += max;
      totalMarks += marks;

      if (comp.type === "Theory") {
        var passMark = max * NEB_GRADING_RULES.theoryPassRate;
        if (marks < passMark) {
          subjectFailed = true;
          failReason = comp.type + " " + marks + "/" + max + " < " + passMark.toFixed(1) + " (35% pass mark)";
        }
      } else {
        var passMark2 = max * NEB_GRADING_RULES.internalPassRate;
        if (marks < passMark2) {
          subjectFailed = true;
          failReason = comp.type + " " + marks + "/" + max + " < " + passMark2.toFixed(1) + " (40% pass mark)";
        }
      }

      componentResults.push({ type: comp.type, marks: marks, max: max });
    });

    var percentage = totalMax > 0 ? (totalMarks / totalMax) * 100 : 0;

    var gradeInfo;
    if (subjectFailed) {
      gradeInfo = { grade: "NG", point: 0.0, color: "#6B7280" };
      warnings.push(sub.name + ": " + failReason);
    } else {
      gradeInfo = getGradeFromPercentage(percentage);
    }

    if (gradeInfo.grade === "NG") hasAnyNG = true;
    if (totalMarks > 0) completedCount++;

    totalWeightedPoints += gradeInfo.point * creditHours;
    totalCreditHours += creditHours;

    return {
      id: sub.id,
      name: sub.name,
      creditHours: creditHours,
      components: componentResults,
      totalMarks: totalMarks,
      totalMax: totalMax,
      percentage: Math.round(percentage * 100) / 100,
      grade: gradeInfo.grade,
      gradePoint: gradeInfo.point,
      color: gradeInfo.color,
      subjectFailed: subjectFailed,
      failReason: failReason,
    };
  });

  var gpa = totalCreditHours > 0 ? totalWeightedPoints / totalCreditHours : 0;
  var roundedGpa = Math.round(gpa * 100) / 100;

  var classification;
  if (hasAnyNG) {
    classification = "NG (Not Graded / Non-Promoted)";
  } else if (roundedGpa >= 3.6) {
    classification = "Distinction";
  } else if (roundedGpa >= 3.2) {
    classification = "First Division";
  } else if (roundedGpa >= 2.4) {
    classification = "Second Division";
  } else if (roundedGpa >= 2.0) {
    classification = "Third Division";
  } else {
    classification = "Not Promoted";
  }

  return {
    valid: true,
    gpa: roundedGpa,
    classification: classification,
    hasAnyNG: hasAnyNG,
    totalCreditHours: totalCreditHours,
    completedCount: completedCount,
    totalSubjects: subjectInputs.length,
    results: results,
    warnings: warnings,
  };
}
