/** Linear models: a line through 2D points, and least squares with many features. */
import { mean, mse } from './metrics';

export interface Point {
  x: number;
  y: number;
}

/** The line ŷ = w·x + b. */
export interface Line {
  w: number;
  b: number;
}

export const predict = (line: Line, x: number): number => line.w * x + line.b;

/** Residual of each point: true value minus prediction. */
export const residuals = (points: readonly Point[], line: Line): number[] =>
  points.map((p) => p.y - predict(line, p.x));

/** Mean squared error of a line on a set of points. */
export const lineMse = (points: readonly Point[], line: Line): number =>
  mse(
    points.map((p) => p.y),
    points.map((p) => predict(line, p.x)),
  );

/** Mean absolute error of a line on a set of points. */
export const lineMae = (points: readonly Point[], line: Line): number =>
  mean(points.map((p) => Math.abs(p.y - predict(line, p.x))));

/** The least-squares line, from the closed-form solution for one feature. */
export function fitLine(points: readonly Point[]): Line {
  if (points.length < 2) throw new Error('fitLine: need at least two points');
  const xBar = mean(points.map((p) => p.x));
  const yBar = mean(points.map((p) => p.y));
  let sxy = 0;
  let sxx = 0;
  for (const p of points) {
    sxy += (p.x - xBar) * (p.y - yBar);
    sxx += (p.x - xBar) ** 2;
  }
  if (sxx === 0) throw new Error('fitLine: all x values are the same');
  const w = sxy / sxx;
  return { w, b: yBar - w * xBar };
}

/**
 * The line with the smallest mean absolute error. An optimal such line always
 * passes through two of the data points, so for small datasets we can simply
 * try every pair.
 */
export function fitLineAbsolute(points: readonly Point[]): Line {
  if (points.length < 2) throw new Error('fitLineAbsolute: need at least two points');
  let best: Line | null = null;
  let bestErr = Infinity;
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const dx = points[j].x - points[i].x;
      if (dx === 0) continue;
      const w = (points[j].y - points[i].y) / dx;
      const line = { w, b: points[i].y - w * points[i].x };
      const err = lineMae(points, line);
      if (err < bestErr - 1e-12) {
        bestErr = err;
        best = line;
      }
    }
  }
  if (!best) throw new Error('fitLineAbsolute: all x values are the same');
  return best;
}

/** Solves A·x = b by Gaussian elimination with partial pivoting. */
export function solve(A: readonly (readonly number[])[], b: readonly number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    if (Math.abs(M[pivot][col]) < 1e-12) throw new Error('solve: matrix is singular');
    [M[col], M[pivot]] = [M[pivot], M[col]];
    for (let r = col + 1; r < n; r++) {
      const f = M[r][col] / M[col][col];
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n];
    for (let c = r + 1; c < n; c++) s -= M[r][c] * x[c];
    x[r] = s / M[r][r];
  }
  return x;
}

/**
 * Least squares with any number of features, by the normal equation
 * (XᵀX + λ·n·I)·w = Xᵀy. Each row of X is one example. A column of ones is
 * added for the bias, which is returned first and is never penalised.
 * `lambda` > 0 gives ridge regression for the loss MSE + λ·Σw².
 */
export function fitLeastSquares(X: readonly (readonly number[])[], y: readonly number[], lambda = 0): number[] {
  const n = X.length;
  if (n === 0 || n !== y.length) throw new Error('fitLeastSquares: bad shapes');
  const rows = X.map((r) => [1, ...r]);
  const d = rows[0].length;
  const A = Array.from({ length: d }, () => new Array<number>(d).fill(0));
  const rhs = new Array<number>(d).fill(0);
  for (let i = 0; i < n; i++) {
    for (let a = 0; a < d; a++) {
      rhs[a] += rows[i][a] * y[i];
      for (let c = 0; c < d; c++) A[a][c] += rows[i][a] * rows[i][c];
    }
  }
  for (let a = 1; a < d; a++) A[a][a] += lambda * n;
  return solve(A, rhs);
}

/** Prediction of a model returned by `fitLeastSquares` (bias first). */
export const predictLinear = (weights: readonly number[], features: readonly number[]): number =>
  features.reduce((s, f, i) => s + weights[i + 1] * f, weights[0]);

/** Turns x into [x, x², ..., x^degree] so a linear model can fit a curve. */
export const polynomialFeatures = (x: number, degree: number): number[] =>
  Array.from({ length: degree }, (_, i) => x ** (i + 1));
