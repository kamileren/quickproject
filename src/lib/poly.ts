/**
 * Polynomial regression with optional ridge or lasso penalty.
 *
 * A polynomial of degree d in x is a linear model on the features
 * x, x², ..., x^d, so everything from the linear regression chapter still
 * applies. Two practical steps keep the arithmetic stable and the penalties
 * fair: x is first rescaled to the range [-1, 1], and each feature column is
 * then standardised (mean 0, spread 1) using the training data only.
 */
import { solve, type Point } from './linear';
import { mean, mse } from './metrics';
import { shuffled } from './random';

export type Penalty = 'none' | 'ridge' | 'lasso';

export interface PolyOptions {
  /** The x range the data lives in; mapped to [-1, 1]. */
  domain: [number, number];
  penalty?: Penalty;
  /** Penalty strength. The loss is MSE + λ·Σw² (ridge) or MSE + λ·Σ|w| (lasso). */
  lambda?: number;
}

export interface PolyModel {
  degree: number;
  /** One weight per standardised feature x¹..x^d. The bias is separate and never penalised. */
  weights: number[];
  bias: number;
  predict: (x: number) => number;
}

const softThreshold = (v: number, t: number): number => (v > t ? v - t : v < -t ? v + t : 0);

export function fitPolynomial(points: readonly Point[], degree: number, options: PolyOptions): PolyModel {
  const { domain, penalty = 'none', lambda = 0 } = options;
  if (degree < 1) throw new Error('fitPolynomial: degree must be at least 1');
  if (points.length < 2) throw new Error('fitPolynomial: need at least two points');
  const n = points.length;
  const [lo, hi] = domain;
  const scale = (x: number) => (2 * (x - lo)) / (hi - lo) - 1;
  const powers = (x: number) => {
    const u = scale(x);
    return Array.from({ length: degree }, (_, j) => u ** (j + 1));
  };

  // Standardise each feature column with training statistics.
  const raw = points.map((p) => powers(p.x));
  const mu = Array.from({ length: degree }, (_, j) => mean(raw.map((r) => r[j])));
  const sd = Array.from({ length: degree }, (_, j) => {
    const s = Math.sqrt(mean(raw.map((r) => (r[j] - mu[j]) ** 2)));
    return s > 1e-12 ? s : 1;
  });
  const Z = raw.map((r) => r.map((v, j) => (v - mu[j]) / sd[j]));
  const bias = mean(points.map((p) => p.y));
  const yc = points.map((p) => p.y - bias);

  // Gram matrix ZᵀZ/n and correlation with the target Zᵀy/n.
  const G = Array.from({ length: degree }, (_, a) =>
    Array.from({ length: degree }, (_, b) => Z.reduce((s, row) => s + row[a] * row[b], 0) / n),
  );
  const c = Array.from({ length: degree }, (_, a) => Z.reduce((s, row, i) => s + row[a] * yc[i], 0) / n);

  let weights: number[];
  if (penalty === 'lasso' && lambda > 0) {
    // Coordinate descent: update one weight at a time, holding the others fixed.
    weights = new Array<number>(degree).fill(0);
    for (let sweep = 0; sweep < 200000; sweep++) {
      let change = 0;
      for (let j = 0; j < degree; j++) {
        let rho = c[j];
        for (let k = 0; k < degree; k++) if (k !== j) rho -= G[j][k] * weights[k];
        const next = softThreshold(rho, lambda / 2) / G[j][j];
        change = Math.max(change, Math.abs(next - weights[j]));
        weights[j] = next;
      }
      if (change < 1e-10) break;
    }
  } else {
    const ridge = penalty === 'ridge' ? lambda : 0;
    const A = G.map((row, a) => row.map((v, b) => (a === b ? v + ridge : v)));
    try {
      weights = solve(A, c);
    } catch {
      // More weights than the data can pin down (degree close to the number of points):
      // many curves fit equally well. A vanishing ridge term picks the smallest-weight one.
      weights = solve(A.map((row, a) => row.map((v, b) => (a === b ? v + 1e-8 : v))), c);
    }
  }

  const predict = (x: number) => powers(x).reduce((s, v, j) => s + (weights[j] * (v - mu[j])) / sd[j], bias);
  return { degree, weights, bias, predict };
}

/** Mean squared error of any predictor on a set of points. */
export const pointsMse = (points: readonly Point[], predict: (x: number) => number): number =>
  mse(
    points.map((p) => p.y),
    points.map((p) => predict(p.x)),
  );

export interface Fold {
  train: Point[];
  validation: Point[];
}

/** Splits points into k folds after a seeded shuffle. Each point is in exactly one validation set. */
export function kFolds(points: readonly Point[], k: number, rand: () => number): Fold[] {
  if (k < 2 || k > points.length) throw new Error('kFolds: k must be between 2 and the number of points');
  const order = shuffled(points, rand);
  return Array.from({ length: k }, (_, f) => ({
    validation: order.filter((_, i) => i % k === f),
    train: order.filter((_, i) => i % k !== f),
  }));
}

/** Validation error of each fold for a given way of fitting a model. */
export function crossValidate(folds: readonly Fold[], fit: (train: Point[]) => (x: number) => number): number[] {
  return folds.map((fold) => pointsMse(fold.validation, fit(fold.train)));
}
