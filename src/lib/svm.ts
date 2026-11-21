/**
 * Support vector machines, small enough to run live in a figure.
 *
 * Training solves the dual problem with SMO (sequential minimal optimisation),
 * the standard method: every example has a multiplier α between 0 and C, and
 * the algorithm repeatedly picks the two that most violate the optimality
 * conditions and solves for that pair exactly. Examples that end with α > 0
 * are the support vectors.
 */

export type Kernel = { kind: 'linear' } | { kind: 'rbf'; gamma: number };

export interface SvmOptions {
  /** Cost of a margin violation. Large means "tolerate none" (a hard margin). */
  C: number;
  kernel?: Kernel;
  maxIterations?: number;
  tolerance?: number;
}

export interface SvmModel {
  /** One multiplier per training example; zero for everything except the support vectors. */
  alphas: number[];
  /** Indices of the support vectors. */
  support: number[];
  /** Signed score: positive means class 1, negative class 0, and ±1 are the edges of the margin. */
  decision: (x: readonly number[]) => number;
  /** For a linear kernel: the boundary is w·x + b = 0. */
  w?: number[];
  b: number;
  /** For a linear kernel: distance between the two edges of the margin, 2 / ‖w‖. */
  marginWidth?: number;
  converged: boolean;
}

const dot = (a: readonly number[], b: readonly number[]): number => a.reduce((s, v, i) => s + v * b[i], 0);
const sqDist = (a: readonly number[], b: readonly number[]): number => a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0);

/** Trains an SVM. Labels are 1 or 0; internally they become +1 and −1. */
export function trainSvm(X: readonly (readonly number[])[], labels: readonly number[], options: SvmOptions): SvmModel {
  const { C, kernel = { kind: 'linear' }, maxIterations = 200000, tolerance = 1e-6 } = options;
  const n = X.length;
  if (n === 0 || n !== labels.length) throw new Error('trainSvm: bad shapes');
  const y = labels.map((l) => (l === 1 ? 1 : -1));
  const k = (a: readonly number[], b: readonly number[]): number =>
    kernel.kind === 'linear' ? dot(a, b) : Math.exp(-kernel.gamma * sqDist(a, b));
  const K = X.map((a) => X.map((b) => k(a, b)));

  const alphas = new Array<number>(n).fill(0);
  // grad[t] is the gradient of the dual objective; -y[t]·grad[t] measures how much example t wants to move.
  const grad = new Array<number>(n).fill(-1);
  let converged = false;
  let b = 0;

  for (let iter = 0; iter < maxIterations; iter++) {
    // Most violating pair: i can still go "up", j can still go "down".
    let i = -1;
    let j = -1;
    let up = -Infinity;
    let down = Infinity;
    for (let t = 0; t < n; t++) {
      const v = -y[t] * grad[t];
      const canGoUp = y[t] === 1 ? alphas[t] < C : alphas[t] > 0;
      const canGoDown = y[t] === 1 ? alphas[t] > 0 : alphas[t] < C;
      if (canGoUp && v > up) {
        up = v;
        i = t;
      }
      if (canGoDown && v < down) {
        down = v;
        j = t;
      }
    }
    b = (up + down) / 2;
    if (i < 0 || j < 0 || up - down < tolerance) {
      converged = true;
      break;
    }

    // Move along the pair: alpha_i += y_i·step, alpha_j -= y_j·step, clipped to stay inside [0, C].
    const curvature = Math.max(K[i][i] + K[j][j] - 2 * K[i][j], 1e-12);
    let step = (up - down) / curvature;
    step = Math.min(step, y[i] === 1 ? C - alphas[i] : alphas[i]);
    step = Math.min(step, y[j] === 1 ? alphas[j] : C - alphas[j]);
    alphas[i] += y[i] * step;
    alphas[j] -= y[j] * step;
    for (let t = 0; t < n; t++) grad[t] += y[t] * step * (K[t][i] - K[t][j]);
  }

  const support = alphas.map((a, t) => (a > 1e-8 * Math.max(1, C) ? t : -1)).filter((t) => t >= 0);
  const decision = (x: readonly number[]): number => support.reduce((s, t) => s + alphas[t] * y[t] * k(X[t], x), b);

  if (kernel.kind !== 'linear') return { alphas, support, decision, b, converged };

  const d = X[0].length;
  const w = Array.from({ length: d }, (_, f) => support.reduce((s, t) => s + alphas[t] * y[t] * X[t][f], 0));
  const norm = Math.hypot(...w);
  return { alphas, support, decision, w, b, marginWidth: norm > 0 ? 2 / norm : Infinity, converged };
}

/** Class (1 or 0) predicted by a trained SVM. */
export const svmPredict = (model: SvmModel, x: readonly number[]): number => (model.decision(x) >= 0 ? 1 : 0);

/** Share of points an SVM classifies correctly. */
export const svmAccuracy = (model: SvmModel, X: readonly (readonly number[])[], labels: readonly number[]): number =>
  X.filter((x, i) => svmPredict(model, x) === labels[i]).length / X.length;

/**
 * A straight line through two points, as a classifier: which side each point
 * is on, and how far away. Used by the figure where the reader places the
 * boundary by hand.
 */
export function lineThrough(a: readonly number[], b: readonly number[]) {
  // Normal vector to the line, scaled to length 1.
  const nx = b[1] - a[1];
  const ny = a[0] - b[0];
  const len = Math.hypot(nx, ny) || 1;
  const unit = [nx / len, ny / len];
  /** Signed distance from the line: positive on one side, negative on the other. */
  const signedDistance = (p: readonly number[]) => (p[0] - a[0]) * unit[0] + (p[1] - a[1]) * unit[1];
  return { unit, signedDistance };
}

/**
 * How wide a "street" centred on the line can be before it touches a point,
 * if the line separates the classes; otherwise null.
 */
export function streetWidth(a: readonly number[], b: readonly number[], X: readonly (readonly number[])[], labels: readonly number[]): number | null {
  const { signedDistance } = lineThrough(a, b);
  const d = X.map(signedDistance);
  const ones = d.filter((_, i) => labels[i] === 1);
  const zeros = d.filter((_, i) => labels[i] === 0);
  const separates = (Math.min(...ones) > 0 && Math.max(...zeros) < 0) || (Math.max(...ones) < 0 && Math.min(...zeros) > 0);
  if (!separates) return null;
  return 2 * Math.min(...d.map(Math.abs));
}
