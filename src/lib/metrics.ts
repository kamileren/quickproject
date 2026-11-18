/** Ways to score predictions against true values. All take plain arrays of equal length. */

function check(yTrue: readonly number[], yPred: readonly number[]): void {
  if (yTrue.length !== yPred.length) throw new Error('metrics: arrays differ in length');
  if (yTrue.length === 0) throw new Error('metrics: empty input');
}

export const mean = (values: readonly number[]): number => values.reduce((a, b) => a + b, 0) / values.length;

/** Mean squared error: the average of the squared residuals. */
export function mse(yTrue: readonly number[], yPred: readonly number[]): number {
  check(yTrue, yPred);
  return mean(yTrue.map((y, i) => (yPred[i] - y) ** 2));
}

/** Root mean squared error: MSE brought back to the units of y. */
export const rmse = (yTrue: readonly number[], yPred: readonly number[]): number => Math.sqrt(mse(yTrue, yPred));

/** Mean absolute error: the average size of a residual. */
export function mae(yTrue: readonly number[], yPred: readonly number[]): number {
  check(yTrue, yPred);
  return mean(yTrue.map((y, i) => Math.abs(yPred[i] - y)));
}

/**
 * R squared: the share of the variation in y that the predictions explain.
 * 1 is perfect, 0 is no better than always predicting the mean, and it is
 * negative when the predictions are worse than that.
 */
export function r2(yTrue: readonly number[], yPred: readonly number[]): number {
  check(yTrue, yPred);
  const yBar = mean(yTrue);
  const ssRes = yTrue.reduce((s, y, i) => s + (y - yPred[i]) ** 2, 0);
  const ssTot = yTrue.reduce((s, y) => s + (y - yBar) ** 2, 0);
  if (ssTot === 0) return ssRes === 0 ? 1 : 0;
  return 1 - ssRes / ssTot;
}

/** Share of predictions that match the true class, from 0 to 1. */
export function accuracy<T>(yTrue: readonly T[], yPred: readonly T[]): number {
  if (yTrue.length !== yPred.length) throw new Error('metrics: arrays differ in length');
  if (yTrue.length === 0) throw new Error('metrics: empty input');
  return yTrue.filter((y, i) => y === yPred[i]).length / yTrue.length;
}
