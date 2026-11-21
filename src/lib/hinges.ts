/**
 * Building a curve out of ReLU "hinges".
 *
 * A network with one input, one hidden layer of ReLU neurons and one output
 * computes a sum of hinges: each hidden neuron is flat up to a kink and then
 * rises (or falls) in a straight line. This file fits such a sum to a target
 * curve in the simplest transparent way: the kinks are spaced evenly, and the
 * height of each hinge is chosen by least squares.
 */
import { fitLeastSquares } from './linear';

export const relu = (x: number): number => (x > 0 ? x : 0);

export interface HingeFit {
  /** Where each hinge starts to rise. */
  kinks: number[];
  /** How steeply each hinge rises after its kink (negative means it falls). */
  slopes: number[];
  /** Value of the sum to the left of every kink. */
  bias: number;
  /** The fitted curve: bias + Σ slope · relu(x − kink). */
  predict: (x: number) => number;
  /** What a single hinge contributes at x. */
  part: (index: number, x: number) => number;
  /** Largest gap between the fit and the target over the sampled range. */
  worstGap: number;
}

/** Fits a sum of `count` evenly spaced ReLU hinges to `target` on the interval [lo, hi]. */
export function fitHinges(target: (x: number) => number, lo: number, hi: number, count: number, samples = 120): HingeFit {
  if (count < 1) throw new Error('fitHinges: need at least one hinge');
  const kinks = Array.from({ length: count }, (_, i) => lo + ((hi - lo) * i) / count);
  const xs = Array.from({ length: samples + 1 }, (_, i) => lo + ((hi - lo) * i) / samples);
  const features = (x: number) => kinks.map((k) => relu(x - k));
  const [bias, ...slopes] = fitLeastSquares(xs.map(features), xs.map(target));
  const part = (index: number, x: number) => slopes[index] * relu(x - kinks[index]);
  const predict = (x: number) => slopes.reduce((s, _, i) => s + part(i, x), bias);
  const worstGap = Math.max(...xs.map((x) => Math.abs(predict(x) - target(x))));
  return { kinks, slopes, bias, predict, part, worstGap };
}
