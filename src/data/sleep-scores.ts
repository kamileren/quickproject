import type { Point } from '@/lib/linear';
import { gaussian, mulberry32 } from '@/lib/random';

/**
 * Hours slept the night before an exam, against the score. Invented data with
 * a known shape: scores peak at about seven and a half hours and fall off on
 * both sides, plus random noise. Because the true curve is known, chapters can
 * show exactly when a model is too simple or too flexible.
 */
export const SLEEP_X: [number, number] = [2, 11];
export const SLEEP_Y: [number, number] = [15, 100];
export const NOISE_SD = 5;

/** The pattern behind the data, before noise. A model can never beat this. */
export const trueSleepCurve = (hours: number): number => 78 - 1.6 * (hours - 7.5) ** 2;

/** Draws `count` students from the same process. Different seeds give different classes. */
export function sampleSleepStudents(count: number, seed: number): Point[] {
  const rand = mulberry32(seed);
  const [lo, hi] = SLEEP_X;
  return Array.from({ length: count }, (_, i) => {
    // Spread students across the range, with a little jitter.
    const x = lo + 0.4 + ((hi - lo - 0.8) * (i + rand())) / count;
    const y = trueSleepCurve(x) + NOISE_SD * gaussian(rand);
    return { x: Math.round(x * 10) / 10, y: Math.round(y) };
  });
}

/** The class we fit models to. */
export const sleepTrain: Point[] = sampleSleepStudents(12, 48);
/** A second class from the same school, never used for fitting. */
export const sleepTest: Point[] = sampleSleepStudents(20, 84);
