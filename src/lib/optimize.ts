/** Gradient descent on the mean squared error of a line. */
import { predict, type Line, type Point } from './linear';

/**
 * Gradient of MSE = (1/n)·Σ(ŷ − y)² with respect to the slope w and bias b.
 * Each component says how fast the loss grows if that parameter grows.
 */
export function lineGradient(points: readonly Point[], line: Line): Line {
  let dw = 0;
  let db = 0;
  for (const p of points) {
    const err = predict(line, p.x) - p.y;
    dw += err * p.x;
    db += err;
  }
  const n = points.length;
  return { w: (2 * dw) / n, b: (2 * db) / n };
}

/** One step downhill: move each parameter against its gradient, scaled by the learning rate. */
export function gradientStep(points: readonly Point[], line: Line, learningRate: number): Line {
  const g = lineGradient(points, line);
  return { w: line.w - learningRate * g.w, b: line.b - learningRate * g.b };
}

/** Runs `steps` gradient steps and returns every line visited, starting with `start`. */
export function descend(points: readonly Point[], start: Line, learningRate: number, steps: number): Line[] {
  const path = [start];
  for (let i = 0; i < steps; i++) path.push(gradientStep(points, path[i], learningRate));
  return path;
}

/**
 * Points on the contour where the MSE of a line equals `level`, in (w, b)
 * space. The loss of a line is an exact quadratic bowl, so each contour is an
 * ellipse centred on the least-squares solution. Returns [] if `level` is
 * below the minimum.
 */
export function lossContour(points: readonly Point[], level: number, samples = 72): Line[] {
  const n = points.length;
  const sx = points.reduce((s, p) => s + p.x, 0);
  const sxx = points.reduce((s, p) => s + p.x * p.x, 0);
  const sy = points.reduce((s, p) => s + p.y, 0);
  const sxy = points.reduce((s, p) => s + p.x * p.y, 0);
  const det = n * sxx - sx * sx;
  if (det === 0) throw new Error('lossContour: all x values are the same');
  const best: Line = { w: (n * sxy - sx * sy) / det, b: (sxx * sy - sx * sxy) / det };
  const min = points.reduce((s, p) => s + (predict(best, p.x) - p.y) ** 2, 0) / n;
  if (level <= min) return [];

  // MSE(w, b) = min + δᵀ·A·δ with δ = (w − w*, b − b*) and A = (1/n)·[[Σx², Σx], [Σx, n]].
  const a = sxx / n;
  const off = sx / n;
  const d = 1;
  const mid = (a + d) / 2;
  const spread = Math.sqrt(((a - d) / 2) ** 2 + off * off);
  const l1 = mid + spread;
  const l2 = mid - spread;
  // Unit eigenvector for l1; the other is perpendicular to it.
  let v1: [number, number] = Math.abs(off) < 1e-12 ? (a >= d ? [1, 0] : [0, 1]) : [off, l1 - a];
  const len = Math.hypot(v1[0], v1[1]);
  v1 = [v1[0] / len, v1[1] / len];
  const v2: [number, number] = [-v1[1], v1[0]];
  const r1 = Math.sqrt((level - min) / l1);
  const r2 = Math.sqrt((level - min) / l2);

  return Array.from({ length: samples + 1 }, (_, i) => {
    const t = (2 * Math.PI * i) / samples;
    const c = r1 * Math.cos(t);
    const s = r2 * Math.sin(t);
    return { w: best.w + c * v1[0] + s * v2[0], b: best.b + c * v1[1] + s * v2[1] };
  });
}

/**
 * Largest learning rate for which gradient descent on this data still
 * converges. Above it, every step overshoots further than the last.
 */
export function maxStableLearningRate(points: readonly Point[]): number {
  // The loss is a quadratic bowl; its steepest curvature is the top eigenvalue
  // of the 2x2 matrix (2/n)·[[Σx², Σx], [Σx, n]].
  const n = points.length;
  const sxx = points.reduce((s, p) => s + p.x * p.x, 0);
  const sx = points.reduce((s, p) => s + p.x, 0);
  const a = (2 * sxx) / n;
  const b = (2 * sx) / n;
  const d = 2;
  const top = (a + d) / 2 + Math.sqrt(((a - d) / 2) ** 2 + b * b);
  return 2 / top;
}
