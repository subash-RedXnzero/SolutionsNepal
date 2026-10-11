/**
 * Nepal Overtime Calculator Engine
 * ================================
 * Calculates estimated overtime pay based on Nepal Labour Act, 2074 (2017).
 *
 * SOURCES:
 * - Nepal Labour Act, 2074 (2017), Section 55 — Normal working hours
 * - Nepal Labour Act, 2074 (2017), Section 57 — Overtime rate
 *
 * KEY RULES:
 * - Normal working hours: 8 hours/day, 48 hours/week
 * - Overtime rate: 1.5x the normal hourly wage
 * - Normal hourly wage: Monthly basic salary / Working days / Normal hours per day
 *
 * LAST UPDATED: 2026-08-20
 */

/**
 * Calculation configuration — separate from calculation logic
 * When Nepal rules change, only this config needs updating.
 */
export const OVERTIME_CONFIG = {
  /** Overtime multiplier per Nepal Labour Act 2074 Section 57 */
  overtimeMultiplier: 1.5,
  /** Default normal working hours per day */
  defaultWorkingHours: 8,
  /** Default working days per month */
  defaultWorkingDays: 26,
  /** Legal source reference */
  source: "Nepal Labour Act, 2074 (2017), Section 55 & 57",
  /** Effective date of the rules applied */
  effectiveDate: "2017-09-16",
};

/**
 * Calculate overtime pay
 *
 * @param {Object} input
 * @param {number} input.monthlyBasicSalary - Monthly basic salary in NPR
 * @param {number} input.workingDays - Working days per month
 * @param {number} input.normalWorkingHours - Normal working hours per day
 * @param {number} input.overtimeHours - Overtime hours
 * @returns {Object} Calculation result
 */
export function calculateOvertime({
  monthlyBasicSalary = 0,
  workingDays = OVERTIME_CONFIG.defaultWorkingDays,
  normalWorkingHours = OVERTIME_CONFIG.defaultWorkingHours,
  overtimeHours = 0,
}) {
  // Validation
  if (monthlyBasicSalary <= 0) {
    return { error: "Please enter a valid salary.", valid: false };
  }
  if (workingDays <= 0) {
    return { error: "Working days must be greater than 0.", valid: false };
  }
  if (normalWorkingHours <= 0) {
    return { error: "Working hours must be greater than 0.", valid: false };
  }
  if (overtimeHours < 0) {
    return { error: "Overtime hours cannot be negative.", valid: false };
  }
  if (monthlyBasicSalary > 999999999) {
    return { error: "Salary value is too large.", valid: false };
  }

  // Safe decimal calculation
  const normalHourlyRate = monthlyBasicSalary / workingDays / normalWorkingHours;
  const overtimeHourlyRate = normalHourlyRate * OVERTIME_CONFIG.overtimeMultiplier;
  const overtimePay = overtimeHourlyRate * overtimeHours;
  const roundedOvertimePay = Math.round(overtimePay * 100) / 100;

  return {
    valid: true,
    monthlyBasicSalary,
    workingDays,
    normalWorkingHours,
    overtimeHours,
    normalHourlyRate: Math.round(normalHourlyRate * 100) / 100,
    overtimeHourlyRate: Math.round(overtimeHourlyRate * 100) / 100,
    overtimePay: roundedOvertimePay,
    totalEstimated: monthlyBasicSalary + roundedOvertimePay,
    multiplier: OVERTIME_CONFIG.overtimeMultiplier,
  };
}

/**
 * Format hours as hours and minutes
 * @param {number} hours - Decimal hours
 * @returns {string} Formatted string
 */
export function formatHours(hours) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return h + " hours";
  return h + " hours " + m + " minutes";
}

/**
 * Format NPR currency
 */
export function formatNPR(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "NPR",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}