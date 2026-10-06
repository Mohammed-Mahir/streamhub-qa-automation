/**
 * Independent EMI maths (does NOT read anything from the app under test).
 * EMI = P * r * (1+r)^n / ((1+r)^n - 1), r = annual% / 12 / 100, n = years * 12
 */
function computeEmi(principal, annualRatePct, years) {
  const r = annualRatePct / 12 / 100;
  const n = years * 12;
  if (r === 0) return principal / n;
  const f = Math.pow(1 + r, n);
  return (principal * r * f) / (f - 1);
}

function summary(principal, annualRatePct, years) {
  const emi = computeEmi(principal, annualRatePct, years);
  const total = emi * years * 12;
  return { emi, totalPayment: total, totalInterest: total - principal };
}

const lakh = (n) => n * 100000;

/** "₹ 33,038" -> 33038 ; "1,234.50" -> 1234.5 */
function parseAmount(text) {
  const cleaned = String(text).replace(/[^0-9.]/g, '');
  return cleaned === '' ? NaN : Number(cleaned);
}

/** All numbers in a string, e.g. tooltip text */
function extractNumbers(text) {
  return (String(text).match(/\d[\d,]*\.?\d*/g) || []).map((s) => Number(s.replace(/,/g, '')));
}

module.exports = { computeEmi, summary, lakh, parseAmount, extractNumbers };
