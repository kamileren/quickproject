import { SLEEP_X } from '@/data/sleep-scores';
import type { Point } from '@/lib/linear';
import { fitPolynomial, type Penalty, type PolyModel } from '@/lib/poly';

export const MAX_DEGREE = 9;

/** Fits a polynomial to sleep data. Every figure in chapters 4 and 5 goes through this. */
export const fitSleep = (train: readonly Point[], degree: number, penalty: Penalty = 'none', lambda = 0): PolyModel =>
  fitPolynomial(train, degree, { domain: SLEEP_X, penalty, lambda });

/** Errors can be astronomically large for wild fits; keep readouts readable. */
export const formatError = (v: number): string =>
  !Number.isFinite(v) || v >= 100000 ? 'huge' : v >= 1000 ? v.toFixed(0) : v.toFixed(1);

export const describeDegree = (degree: number): string =>
  degree === 1 ? 'straight line' : degree === 2 ? 'one bend' : `up to ${degree - 1} bends`;
