/**
 * Reusable Salary Calculation Service
 * 
 * Formula:
 * payableDays = presentDays + (halfDayCount * 0.5)
 * grossSalary = payableDays * dailyWageRate
 */

const calculateSalary = (presentDays = 0, halfDays = 0, dailyWageRate = 0) => {
  const present = parseFloat(presentDays);
  const half = parseFloat(halfDays);
  const wage = parseFloat(dailyWageRate);

  const payableDays = present + (half * 0.5);
  const grossSalary = payableDays * wage;

  // Round to two decimal places
  return {
    payableDays: Math.round(payableDays * 100) / 100,
    grossSalary: Math.round(grossSalary * 100) / 100
  };
};

module.exports = {
  calculateSalary
};
