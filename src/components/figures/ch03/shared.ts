import { examCentered, MEAN_HOURS } from '@/data/exam-scores';
import { fitLine, lineMse, type Line } from '@/lib/linear';

/**
 * Chapter 3 measures hours from the class average, so the bias b is "the score
 * of a student who studied the average amount". Everything here uses that form.
 */
export const POINTS = examCentered;
export const BEST: Line = fitLine(POINTS);
export const BEST_LOSS = lineMse(POINTS, BEST);
export const START: Line = { w: 0, b: 50 };

/** Ranges of the (w, b) map used by the loss-surface figures. */
export const W_RANGE: [number, number] = [-3, 13];
export const B_RANGE: [number, number] = [42, 92];

export const loss = (line: Line): number => lineMse(POINTS, line);

/** Prediction for real (uncentred) hours, so data plots can keep their usual axis. */
export const predictHours = (line: Line, hours: number): number => line.w * (hours - MEAN_HOURS) + line.b;

/** Losses can explode when a run diverges; keep readouts readable. */
export const formatLoss = (v: number): string =>
  !Number.isFinite(v) || v > 1e6 ? 'huge' : v >= 1000 ? v.toFixed(0) : v.toFixed(1);
