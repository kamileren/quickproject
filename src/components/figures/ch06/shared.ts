import { outcomes, outcomeX, outcomeY } from '@/data/pass-fail';
import { fitLogistic, modelLogLoss, predictProba } from '@/lib/classify';
import type { Point } from '@/lib/linear';

export const HOURS: [number, number] = [0, 10];
/** A little room above 1 and below 0, so a straight line can be seen leaving the valid range. */
export const PROB: [number, number] = [-0.25, 1.35];

export const PASSED: Point[] = outcomes.filter((o) => o.passed === 1).map((o) => ({ x: o.hours, y: 1 }));
export const FAILED: Point[] = outcomes.filter((o) => o.passed === 0).map((o) => ({ x: o.hours, y: 0 }));

/** The best logistic model for the eighteen students: weights are [bias, weight on hours]. */
export const BEST = fitLogistic(outcomeX, outcomeY);

export const lossOf = (weights: readonly number[]): number => modelLogLoss(outcomeX, outcomeY, weights);

export const correctCount = (weights: readonly number[], threshold = 0.5): number =>
  outcomes.filter((o) => (predictProba(weights, [o.hours]) >= threshold ? 1 : 0) === o.passed).length;

export const dotTitle = (didPass: boolean) => (p: Point) => `${p.x} hours, ${didPass ? 'passed' : 'failed'}`;
