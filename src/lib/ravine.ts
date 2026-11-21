/**
 * A long narrow valley for comparing optimizers.
 *
 * The surface is f(x, y) = 0.05·x² + y²: twenty times steeper across (y) than
 * along (x). Plain gradient descent struggles on shapes like this, which is
 * what motivates momentum and the adaptive methods.
 */
import type { Optimizer, Param } from './nn';

export interface Spot {
  x: number;
  y: number;
}

export const RAVINE_X: [number, number] = [-10, 10];
export const RAVINE_Y: [number, number] = [-4, 4];
export const RAVINE_START: Spot = { x: -9, y: 3 };

export const ravineHeight = ({ x, y }: Spot): number => 0.05 * x * x + y * y;
export const ravineGradient = ({ x, y }: Spot): Spot => ({ x: 0.1 * x, y: 2 * y });

/** Points on the contour where the surface has the given height. */
export function ravineContour(height: number, samples = 96): Spot[] {
  return Array.from({ length: samples + 1 }, (_, i) => {
    const t = (2 * Math.PI * i) / samples;
    return { x: Math.sqrt(height / 0.05) * Math.cos(t), y: Math.sqrt(height) * Math.sin(t) };
  });
}

/** Every position an optimizer visits on the ravine, starting from `start`. */
export function descendRavine(optimizer: Optimizer, steps: number, start: Spot = RAVINE_START): Spot[] {
  const param: Param = { values: [[start.x, start.y]], grads: [[0, 0]] };
  const path: Spot[] = [start];
  for (let i = 0; i < steps; i++) {
    const here = { x: param.values[0][0], y: param.values[0][1] };
    const g = ravineGradient(here);
    param.grads = [[g.x, g.y]];
    optimizer.step([param]);
    const next = { x: param.values[0][0], y: param.values[0][1] };
    // A run that has blown up is cut short; there is nothing more to learn from it.
    if (!Number.isFinite(next.x) || !Number.isFinite(next.y) || Math.abs(next.x) > 1e6 || Math.abs(next.y) > 1e6) break;
    path.push(next);
  }
  return path;
}

/** First step at which the height drops below `target`, or null if it never does. */
export function stepsToReach(path: readonly Spot[], target: number): number | null {
  const index = path.findIndex((p) => ravineHeight(p) < target);
  return index < 0 ? null : index;
}
