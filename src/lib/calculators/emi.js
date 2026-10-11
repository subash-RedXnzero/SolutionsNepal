/**
 * EMI Calculator
 * Standard EMI formula: EMI = P × r × (1+r)^n / ((1+r)^n - 1)
 */

export function calculateEMI(principal, annualRate, tenureMonths) {
  const monthlyRate = annualRate / 12 / 100;

  if (monthlyRate === 0) {
    return {
      emi: Math.round(principal / tenureMonths),
      totalPayment: principal,
      totalInterest: 0,
      principal,
      annualRate,
      tenureMonths,
    };
  }

  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const emi = principal * monthlyRate * factor / (factor - 1);
  const totalPayment = emi * tenureMonths;
  const totalInterest = totalPayment - principal;

  return {
    emi: Math.round(emi),
    totalPayment: Math.round(totalPayment),
    totalInterest: Math.round(totalInterest),
    principal,
    annualRate,
    tenureMonths,
  };
}

export function tenureFromYears(years) {
  return years * 12;
}

export function tenureFromMonths(months) {
  return months;
}
