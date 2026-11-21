/** k-nearest neighbours: classify a point by a vote among the closest known points. */
import { mulberry32 } from './random';

/** Straight-line distance between two points with any number of features. */
export function euclidean(a: readonly number[], b: readonly number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
  return Math.sqrt(sum);
}

/** Indices of the k points closest to `query`, nearest first. */
export function nearest(points: readonly (readonly number[])[], query: readonly number[], k: number): number[] {
  if (k < 1) throw new Error('nearest: k must be at least 1');
  return points
    .map((p, i) => ({ i, d: euclidean(p, query) }))
    .sort((a, b) => a.d - b.d || a.i - b.i)
    .slice(0, Math.min(k, points.length))
    .map((e) => e.i);
}

/** Share of the k nearest neighbours that have label 1. */
export function knnProba(points: readonly (readonly number[])[], labels: readonly number[], query: readonly number[], k: number): number {
  const idx = nearest(points, query, k);
  return idx.reduce((s, i) => s + labels[i], 0) / idx.length;
}

/** The majority label (0 or 1) among the k nearest neighbours. An exact tie goes to the single nearest point. */
export function knnPredict(points: readonly (readonly number[])[], labels: readonly number[], query: readonly number[], k: number): number {
  const p = knnProba(points, labels, query, k);
  if (p === 0.5) return labels[nearest(points, query, 1)[0]];
  return p > 0.5 ? 1 : 0;
}

/** Share of `testPoints` that k-NN, using `points` as its memory, labels correctly. */
export function knnAccuracy(
  points: readonly (readonly number[])[],
  labels: readonly number[],
  testPoints: readonly (readonly number[])[],
  testLabels: readonly number[],
  k: number,
): number {
  const right = testPoints.filter((q, i) => knnPredict(points, labels, q, k) === testLabels[i]).length;
  return right / testPoints.length;
}

export interface Scaler {
  mean: number[];
  sd: number[];
  transform: (row: readonly number[]) => number[];
}

/** Learns each feature's average and spread, and returns a function that rescales rows to mean 0, spread 1. */
export function standardizer(rows: readonly (readonly number[])[]): Scaler {
  const d = rows[0].length;
  const mean = Array.from({ length: d }, (_, j) => rows.reduce((s, r) => s + r[j], 0) / rows.length);
  const sd = Array.from({ length: d }, (_, j) => {
    const v = Math.sqrt(rows.reduce((s, r) => s + (r[j] - mean[j]) ** 2, 0) / rows.length);
    return v > 1e-12 ? v : 1;
  });
  return { mean, sd, transform: (row) => row.map((v, j) => (v - mean[j]) / sd[j]) };
}

/**
 * For `count` random points in a unit cube of `dimensions` dimensions: the
 * distance from the first point to its nearest neighbour, divided by the
 * distance to its farthest. Near 0 means "near" and "far" are very different;
 * near 1 means every point is about equally far away.
 */
export function nearFarRatio(dimensions: number, count: number, seed: number): number {
  const rand = mulberry32(seed);
  const pts = Array.from({ length: count }, () => Array.from({ length: dimensions }, () => rand()));
  const dists = pts.slice(1).map((p) => euclidean(p, pts[0]));
  return Math.min(...dists) / Math.max(...dists);
}
