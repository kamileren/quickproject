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
