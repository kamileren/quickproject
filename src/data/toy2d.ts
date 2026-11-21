import { gaussian, mulberry32 } from '@/lib/random';

/**
 * Small invented two-class datasets in the plane, used wherever a model's
 * decision regions need to be seen. Both features run from 0 to 10. Class 1 is
 * drawn filled and class 0 hollow throughout the book.
 */
export interface Labelled {
  x: number;
  y: number;
  label: number;
}

export const TOY_RANGE: [number, number] = [0, 10];

const clamp = (v: number) => Math.max(0.2, Math.min(9.8, v));
const round = (v: number) => Math.round(clamp(v) * 100) / 100;

/** Two interlocking crescents. No straight line separates them. */
export function moons(count: number, noise: number, seed: number): Labelled[] {
  const rand = mulberry32(seed);
  return Array.from({ length: count }, (_, i) => {
    const label = i % 2;
    const t = Math.PI * rand();
    const x = label ? 1 - Math.cos(t) : Math.cos(t);
    const y = label ? 0.5 - Math.sin(t) - 0.1 : Math.sin(t) + 0.1;
    // Map the usual moons layout (x in [-1, 2], y in [-0.6, 1.1]) onto the 0-10 square.
    return {
      x: round(((x + 1) / 3) * 8 + 1 + noise * gaussian(rand)),
      y: round(((y + 0.7) / 1.9) * 8 + 1 + noise * gaussian(rand)),
      label,
    };
  });
}

/** Two round clusters that overlap a little. A straight line separates them fairly well. */
export function blobs(count: number, spread: number, seed: number): Labelled[] {
  const rand = mulberry32(seed);
  return Array.from({ length: count }, (_, i) => {
    const label = i % 2;
    const cx = label ? 6.6 : 3.4;
    const cy = label ? 6.4 : 3.6;
    return { x: round(cx + spread * gaussian(rand)), y: round(cy + spread * gaussian(rand)), label };
  });
}

/** One class in the middle, the other in a ring around it. */
export function rings(count: number, noise: number, seed: number): Labelled[] {
  const rand = mulberry32(seed);
  return Array.from({ length: count }, (_, i) => {
    const label = i % 2;
    const radius = (label ? 1.2 : 3.6) + noise * gaussian(rand);
    const angle = 2 * Math.PI * rand();
    return { x: round(5 + radius * Math.cos(angle)), y: round(5 + radius * Math.sin(angle)), label };
  });
}

export const toRows = (points: readonly Labelled[]): number[][] => points.map((p) => [p.x, p.y]);
export const toLabels = (points: readonly Labelled[]): number[] => points.map((p) => p.label);

/** The moons used in the nearest-neighbours chapter: 60 to learn from, 300 fresh ones to test on. */
export const moonsTrain: Labelled[] = moons(60, 1.1, 7);
export const moonsTest: Labelled[] = moons(300, 1.1, 1007);
