/** Logistic regression: predicting a yes/no answer as a probability. */
import { solve } from './linear';

/** Squashes any number into the range 0 to 1. Written to stay accurate for large |z|. */
export function sigmoid(z: number): number {
  if (z >= 0) return 1 / (1 + Math.exp(-z));
  const e = Math.exp(z);
  return e / (1 + e);
}

/** The score before squashing: bias + Σ weight·feature. `weights[0]` is the bias. */
export const logit = (weights: readonly number[], features: readonly number[]): number =>
  features.reduce((s, f, i) => s + weights[i + 1] * f, weights[0]);

/** Predicted probability of the positive class. */
export const predictProba = (weights: readonly number[], features: readonly number[]): number =>
  sigmoid(logit(weights, features));

const EPS = 1e-12;

/** Loss for one example: −log of the probability the model gave to what actually happened. */
export function logLossOne(label: number, p: number): number {
  const q = Math.min(1 - EPS, Math.max(EPS, p));
  return label === 1 ? -Math.log(q) : -Math.log(1 - q);
}

/** Mean log loss (also called cross-entropy) over a set of examples. Labels are 0 or 1. */
export function logLoss(labels: readonly number[], probabilities: readonly number[]): number {
  if (labels.length === 0 || labels.length !== probabilities.length) throw new Error('logLoss: bad shapes');
  return labels.reduce((s, y, i) => s + logLossOne(y, probabilities[i]), 0) / labels.length;
}

/** Mean log loss of a logistic model on a dataset. */
export const modelLogLoss = (X: readonly (readonly number[])[], y: readonly number[], weights: readonly number[]): number =>
  logLoss(
    y,
    X.map((row) => predictProba(weights, row)),
  );

/**
 * Gradient of the mean log loss. It has the same form as for linear
 * regression: the average of (prediction − truth) × feature, bias first.
 */
export function logisticGradient(X: readonly (readonly number[])[], y: readonly number[], weights: readonly number[]): number[] {
  const n = X.length;
  const grad = new Array<number>(weights.length).fill(0);
  for (let i = 0; i < n; i++) {
    const miss = predictProba(weights, X[i]) - y[i];
    grad[0] += miss;
    for (let j = 0; j < X[i].length; j++) grad[j + 1] += miss * X[i][j];
  }
  return grad.map((g) => g / n);
}

/** One step of gradient descent on the log loss. */
export function logisticStep(X: readonly (readonly number[])[], y: readonly number[], weights: readonly number[], learningRate: number): number[] {
  const grad = logisticGradient(X, y, weights);
  return weights.map((w, j) => w - learningRate * grad[j]);
}

export interface LogisticFit {
  /** Bias first, then one weight per feature. */
  weights: number[];
  loss: number;
  /** False when the classes can be separated perfectly, so the weights would grow without limit. */
  converged: boolean;
}

/**
 * Fits logistic regression by Newton's method, which reaches the minimum of
 * the log loss in a handful of steps for small problems. `lambda` adds a
 * ridge penalty λ·Σw² on the non-bias weights.
 */
export function fitLogistic(X: readonly (readonly number[])[], y: readonly number[], lambda = 0, maxIterations = 50): LogisticFit {
  const n = X.length;
  if (n === 0 || n !== y.length) throw new Error('fitLogistic: bad shapes');
  const d = X[0].length + 1;
  const rows = X.map((r) => [1, ...r]);
  let weights = new Array<number>(d).fill(0);
  const objective = (w: number[]) => modelLogLoss(X, y, w) + lambda * w.slice(1).reduce((s, v) => s + v * v, 0);
  let converged = false;

  for (let iter = 0; iter < maxIterations; iter++) {
    const grad = new Array<number>(d).fill(0);
    const H = Array.from({ length: d }, () => new Array<number>(d).fill(0));
    for (let i = 0; i < n; i++) {
      const p = sigmoid(rows[i].reduce((s, v, j) => s + v * weights[j], 0));
      const curve = Math.max(p * (1 - p), 1e-10);
      for (let a = 0; a < d; a++) {
        grad[a] += ((p - y[i]) * rows[i][a]) / n;
        for (let b = 0; b < d; b++) H[a][b] += (curve * rows[i][a] * rows[i][b]) / n;
      }
    }
    for (let a = 1; a < d; a++) {
      grad[a] += 2 * lambda * weights[a];
      H[a][a] += 2 * lambda;
    }
    if (Math.max(...grad.map(Math.abs)) < 1e-9) {
      converged = true;
      break;
    }
    let step: number[];
    try {
      step = solve(H, grad);
    } catch {
      break;
    }
    // Halve the step until the loss goes down, so a bad start cannot overshoot.
    const before = objective(weights);
    let scale = 1;
    let next = weights.map((w, j) => w - step[j]);
    while (objective(next) > before && scale > 1e-6) {
      scale /= 2;
      next = weights.map((w, j) => w - scale * step[j]);
    }
    weights = next;
    // Perfectly separable data: the weights head for infinity and never settle.
    if (Math.max(...weights.map(Math.abs)) > 1e4) break;
  }
  const loss = modelLogLoss(X, y, weights);
  // A vanishing loss with runaway weights means the classes were separable, not that a real optimum was found.
  const separable = lambda === 0 && (loss < 1e-6 || Math.max(...weights.map(Math.abs)) > 1e3);
  return { weights, loss, converged: converged && !separable };
}

/** For one feature: the input value where the predicted probability is exactly one half. */
export const decisionPoint = (weights: readonly number[]): number => -weights[0] / weights[1];
