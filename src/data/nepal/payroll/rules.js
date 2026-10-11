/**
 * Nepal Payroll Assumptions & Attendance Rules
 * =============================================
 * Attendance deduction methods are CALCULATION METHODS, not automatically
 * legal rules. Which one applies depends on the employment contract and the
 * employer's payroll practice. The calculator never claims one method is
 * universally required.
 *
 * VERIFIED 2026-08-19
 * --------------------
 * - No single statutory attendance-deduction method exists in Nepal's Labour
 *   Act 2074; leave/deduction treatment is largely contract- and practice-
 *   driven. The Labour Act prescribes leave entitlements but not a universal
 *   formula for unpaid-day deduction.
 * - Rest/weekly-off days are handled separately and are NOT treated as
 *   absence unless the selected method requires it.
 */

export const PAYROLL_RULES = {
  id: 'current',
  label: 'Payroll assumptions currently in effect',
  lastVerified: '2026-08-19',

  // Salary deduction methods offered to the user
  deductionMethods: [
    {
      id: 'not-specified',
      label: 'Not specified',
      formula: 'No attendance deduction applied. The payable salary is treated as the contractual gross unless unpaid leave is entered.',
      isDefault: true,
      note: 'Default. Select a method only if you know how your employer calculates unpaid-day deductions.',
    },
    {
      id: 'employer-contract',
      label: 'Employer / Contract Method',
      formula: 'As defined in the employment contract or employer payroll policy',
      isDefault: false,
      note: 'The exact formula depends on the contract — treated as needing verification.',
    },
    {
      id: 'calendar',
      label: 'Calendar-Day Method',
      formula: 'Monthly salary ÷ calendar days in the month × unpaid days',
      isDefault: false,
      note: 'Uses the actual number of calendar days in the month.',
    },
    {
      id: '30-day',
      label: '30-Day Method',
      formula: 'Monthly salary ÷ 30 × unpaid days',
      isDefault: false,
      note: 'Assumes a fixed 30-day month regardless of the actual calendar.',
    },
    {
      id: 'working-day',
      label: 'Working-Day Method',
      formula: 'Monthly salary ÷ working days in the month × unpaid days',
      isDefault: false,
      note: 'Uses the month\u2019s working days (excludes rest days & public holidays).',
    },
  ],

  attendance: {
    note: 'Present + paid leave + unpaid leave + absent + public holidays + rest days should reconcile to the calendar period, but the calculator does NOT force this equality and does NOT automatically convert unaccounted days into absence.',
    neverAssumeAbsenceIsUnpaid:
      'Do not assume every absence is an unpaid day. Absent days are only treated as unpaid if the user explicitly opts in.',
  },

  overtime: {
    note: 'Overtime is NOT automatically derived from monthly salary ÷ 30 unless an official/employer rule supports that. If the user enters an OT amount, use it. If OT is calculated from hours + rate, show the formula and label the assumption/source.',
  },

  // Rounding conventions
  rounding: {
    internalPrecision: 'Full precision internally',
    displayDecimals: 2,
    wholeAmounts: 'Whole rupee amounts display without decimals (e.g. Rs. 12,170)',
    fractionalAmounts: 'Fractional amounts display with 2 decimals (e.g. Rs. 1,338.70)',
    comparisonTolerance: {
      absolute: 1.0, // NPR
      relative: 0.001, // 0.1%
    },
  },

  notes: [
    'Attendance deduction methods are assumptions — verify the employer\u2019s actual payroll rule.',
    'Employer payroll method defaults to "Not specified" so the calculator does not invent one.',
  ],
};

/**
 * Get a deduction method definition by id.
 * @param {string} id
 * @returns {object}
 */
export function getDeductionMethod(id) {
  return PAYROLL_RULES.deductionMethods.find(m => m.id === id) || PAYROLL_RULES.deductionMethods[0];
}

/**
 * Compare two rupee amounts with the configured rounding tolerance.
 * @param {number} expected
 * @param {number} actual
 * @returns {{diff: number, matches: boolean}}
 */
export function withinTolerance(expected, actual, tolerance = PAYROLL_RULES.rounding.comparisonTolerance) {
  const diff = Math.round((actual - expected) * 100) / 100;
  const absDiff = Math.abs(diff);
  const relative = expected !== 0 ? absDiff / Math.abs(expected) : absDiff;
  const matches = absDiff <= tolerance.absolute || relative <= tolerance.relative;
  return { diff, matches };
}