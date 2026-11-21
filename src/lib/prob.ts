/** The probability basics used in the probability toolkit chapter. */

/** Average of a list of numbers. */
export const average = (values: readonly number[]): number => values.reduce((a, b) => a + b, 0) / values.length;

/** Variance: the average squared distance from the average. */
export function variance(values: readonly number[]): number {
  const m = average(values);
  return average(values.map((v) => (v - m) ** 2));
}

/** Standard deviation: the square root of the variance, in the same units as the values. */
export const standardDeviation = (values: readonly number[]): number => Math.sqrt(variance(values));

/** Height of the normal (bell) curve at x. */
export function normalPdf(x: number, mean: number, sd: number): number {
  const z = (x - mean) / sd;
  return Math.exp(-0.5 * z * z) / (sd * Math.sqrt(2 * Math.PI));
}

/** The error function, by a standard polynomial approximation accurate to about 1e-7. */
function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const poly = ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t;
  return sign * (1 - poly * Math.exp(-a * a));
}

/** Probability that a normal value is at or below x. */
export const normalCdf = (x: number, mean: number, sd: number): number => 0.5 * (1 + erf((x - mean) / (sd * Math.SQRT2)));

/** Probability that a normal value lands within k standard deviations of its mean. */
export const shareWithin = (k: number): number => normalCdf(k, 0, 1) - normalCdf(-k, 0, 1);

/** Probability that two fair dice add up to `total`. */
export function twoDiceProbability(total: number): number {
  if (!Number.isInteger(total) || total < 2 || total > 12) return 0;
  return (6 - Math.abs(total - 7)) / 36;
}

/** One roll of a fair six-sided die, from a uniform random generator. */
export const rollDie = (rand: () => number): number => 1 + Math.floor(rand() * 6);

/** Conditional probability from counts: of the cases where the condition holds, the share where the event also holds. */
export const conditional = (both: number, conditionTotal: number): number => (conditionTotal === 0 ? 0 : both / conditionTotal);
