import { sleepTest, sleepTrain } from '@/data/sleep-scores';
import { crossValidate, kFolds, pointsMse, type Penalty } from '@/lib/poly';
import { mulberry32 } from '@/lib/random';
import { fitSleep } from '../ch04/shared';

/** Chapter 5 keeps the over-flexible degree-9 model and tames it with a penalty instead. */
export const DEGREE = 9;

/** The slider moves in powers of ten: -3 means λ = 0.001, 1.5 means λ ≈ 31.6. */
export const LOG_MIN = -3;
export const LOG_MAX = 1.5;
export const toLambda = (exponent: number): number => 10 ** exponent;
export const formatLambda = (lambda: number): string =>
  lambda === 0 ? 'none' : lambda >= 1 ? lambda.toFixed(1) : lambda >= 0.01 ? lambda.toFixed(3) : lambda.toFixed(4);

export const fitPenalised = (penalty: Penalty, lambda: number) => fitSleep(sleepTrain, DEGREE, penalty, lambda);

export const trainError = (penalty: Penalty, lambda: number): number => pointsMse(sleepTrain, fitPenalised(penalty, lambda).predict);
export const testError = (penalty: Penalty, lambda: number): number => pointsMse(sleepTest, fitPenalised(penalty, lambda).predict);

const folds = kFolds(sleepTrain, 5, mulberry32(1));

/** Five-fold cross-validation error on the training students only. */
export function cvError(penalty: Penalty, lambda: number): number {
  const errors = crossValidate(folds, (train) => fitSleep(train, DEGREE, penalty, lambda).predict);
  return errors.reduce((a, b) => a + b, 0) / errors.length;
}

export const PENALTY_OPTIONS: { value: Penalty; label: string }[] = [
  { value: 'ridge', label: 'Ridge' },
  { value: 'lasso', label: 'Lasso' },
];
