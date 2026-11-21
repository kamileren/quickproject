import { gaussian, mulberry32 } from '@/lib/random';

/**
 * Spiral data: several classes whose points lie along interleaved spiral
 * arms. No straight line, and no simple curve, separates them, which makes
 * the set a standard first test for a neural network. Both features run from
 * roughly −1 to 1.
 */
export interface SpiralPoint {
  x: number;
  y: number;
  /** Class index, 0 to classes − 1. */
  label: number;
}

export const SPIRAL_RANGE: [number, number] = [-1.15, 1.15];

/**
 * @param perClass points on each arm
 * @param classes  number of arms
 * @param noise    how far points stray from their arm, in radians
 */
export function spiral(perClass: number, classes: number, seed: number, noise = 0.3): SpiralPoint[] {
  const rand = mulberry32(seed);
  const points: SpiralPoint[] = [];
  for (let label = 0; label < classes; label++) {
    for (let i = 0; i < perClass; i++) {
      // Each arm starts at the centre, pointing its own way, and makes one and a half turns on the way out.
      const radius = i / (perClass - 1);
      const angle = (label * 2 * Math.PI) / classes + radius * 3 * Math.PI + noise * gaussian(rand);
      points.push({ x: radius * Math.sin(angle), y: radius * Math.cos(angle), label });
    }
  }
  return points;
}

export const spiralRows = (points: readonly SpiralPoint[]): number[][] => points.map((p) => [p.x, p.y]);
export const spiralLabels = (points: readonly SpiralPoint[]): number[] => points.map((p) => p.label);

/** The training set used through the neural network chapters: three arms, 100 points each. */
export const spiralTrain: SpiralPoint[] = spiral(100, 3, 0);
/** Fresh points from the same spirals, never used for training. */
export const spiralTest: SpiralPoint[] = spiral(100, 3, 500);
