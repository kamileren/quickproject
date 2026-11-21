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

/** The four possible outcomes of a yes/no prediction, counted over a dataset. */
export interface Confusion {
  /** Predicted yes, truly yes. */
  tp: number;
  /** Predicted yes, truly no: a false alarm. */
  fp: number;
  /** Predicted no, truly no. */
  tn: number;
  /** Predicted no, truly yes: a miss. */
  fn: number;
}

/** Counts the four outcomes. Labels and predictions are 1 (yes) or 0 (no). */
export function confusion(labels: readonly number[], predictions: readonly number[]): Confusion {
  if (labels.length !== predictions.length) throw new Error('metrics: arrays differ in length');
  const c: Confusion = { tp: 0, fp: 0, tn: 0, fn: 0 };
  labels.forEach((y, i) => {
    if (predictions[i] === 1) c[y === 1 ? 'tp' : 'fp']++;
    else c[y === 1 ? 'fn' : 'tn']++;
  });
  return c;
}

/** Counts the four outcomes when scores at or above `threshold` are called yes. */
export const confusionAt = (labels: readonly number[], scores: readonly number[], threshold: number): Confusion =>
  confusion(
    labels,
    scores.map((s) => (s >= threshold ? 1 : 0)),
  );

const ratio = (top: number, bottom: number, whenEmpty: number): number => (bottom === 0 ? whenEmpty : top / bottom);

/** Of everything flagged yes, the share that really was yes. Defined as 1 when nothing is flagged. */
export const precision = (c: Confusion): number => ratio(c.tp, c.tp + c.fp, 1);
/** Of everything that really was yes, the share that was caught. Also called the true positive rate. */
export const recall = (c: Confusion): number => ratio(c.tp, c.tp + c.fn, 0);
/** Of everything that really was no, the share wrongly flagged. */
export const falsePositiveRate = (c: Confusion): number => ratio(c.fp, c.fp + c.tn, 0);
/** Share of all predictions that were right. */
export const accuracyOf = (c: Confusion): number => (c.tp + c.tn) / (c.tp + c.fp + c.tn + c.fn);
/** One number that is high only when precision and recall are both high (their harmonic mean). */
export function f1(c: Confusion): number {
  const p = precision(c);
  const r = recall(c);
  return p + r === 0 ? 0 : (2 * p * r) / (p + r);
}

export interface RocPoint {
  threshold: number;
  fpr: number;
  tpr: number;
}

/**
 * The ROC curve: false positive rate against true positive rate for every
 * useful threshold, from "flag nothing" at (0, 0) to "flag everything" at (1, 1).
 */
export function rocCurve(labels: readonly number[], scores: readonly number[]): RocPoint[] {
  const thresholds = [...new Set(scores)].sort((a, b) => b - a);
  const points: RocPoint[] = [{ threshold: Infinity, fpr: 0, tpr: 0 }];
  for (const t of thresholds) {
    const c = confusionAt(labels, scores, t);
    points.push({ threshold: t, fpr: falsePositiveRate(c), tpr: recall(c) });
  }
  return points;
}

/**
 * Area under the ROC curve. It equals the chance that a randomly chosen yes
 * gets a higher score than a randomly chosen no: 1 is perfect ranking, 0.5 is guessing.
 */
export function auc(labels: readonly number[], scores: readonly number[]): number {
  const pts = rocCurve(labels, scores);
  let area = 0;
  for (let i = 1; i < pts.length; i++) area += ((pts[i].fpr - pts[i - 1].fpr) * (pts[i].tpr + pts[i - 1].tpr)) / 2;
  return area;
}
