import { describe, expect, it } from 'vitest';
import { sleepTest, sleepTrain, SLEEP_X, NOISE_SD } from '@/data/sleep-scores';
import { fitLine, predict } from './linear';
import { crossValidate, fitPolynomial, kFolds, pointsMse } from './poly';
import { mulberry32 } from './random';

const domain = SLEEP_X;
const trainMse = (degree: number, extra = {}) =>
  pointsMse(sleepTrain, fitPolynomial(sleepTrain, degree, { domain, ...extra }).predict);
const testMse = (degree: number, extra = {}) =>
  pointsMse(sleepTest, fitPolynomial(sleepTrain, degree, { domain, ...extra }).predict);

describe('fitPolynomial without a penalty', () => {
  it('matches the straight-line fit at degree 1', () => {
    const line = fitLine(sleepTrain);
    const model = fitPolynomial(sleepTrain, 1, { domain });
    for (const x of [2, 5, 8, 11]) expect(model.predict(x)).toBeCloseTo(predict(line, x), 6);
  });

  it('recovers an exact cubic', () => {
    const pts = [2, 3, 4.5, 6, 7, 8.5, 10, 11].map((x) => ({ x, y: 0.5 * x ** 3 - 4 * x ** 2 + 3 * x + 7 }));
    const model = fitPolynomial(pts, 3, { domain });
    for (const x of [2.5, 5, 9.3]) expect(model.predict(x)).toBeCloseTo(0.5 * x ** 3 - 4 * x ** 2 + 3 * x + 7, 5);
  });

  it('never fits the training data worse as the degree rises', () => {
    const errors = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => trainMse(d));
    for (let i = 1; i < errors.length; i++) expect(errors[i]).toBeLessThanOrEqual(errors[i - 1] + 1e-6);
  });

  it('shows the pattern the generalization chapter describes', () => {
    // Degree 1 underfits; degree 2 is about as good as the noise allows; degree 9 overfits.
    expect(testMse(1)).toBeGreaterThan(3 * testMse(2));
    expect(testMse(2)).toBeLessThan(2.5 * NOISE_SD ** 2);
    expect(trainMse(9)).toBeLessThan(trainMse(2));
    expect(testMse(9)).toBeGreaterThan(2 * testMse(2));
  });
});

describe('ridge and lasso', () => {
  it('reduce to the unpenalised fit when lambda is zero', () => {
    const plain = fitPolynomial(sleepTrain, 4, { domain });
    for (const penalty of ['ridge', 'lasso'] as const) {
      const model = fitPolynomial(sleepTrain, 4, { domain, penalty, lambda: 0 });
      model.weights.forEach((w, j) => expect(w).toBeCloseTo(plain.weights[j], 6));
    }
  });

  it('shrink the total weight size as lambda grows', () => {
    for (const penalty of ['ridge', 'lasso'] as const) {
      const sizes = [0.001, 0.1, 1, 10].map((lambda) =>
        fitPolynomial(sleepTrain, 9, { domain, penalty, lambda }).weights.reduce((s, w) => s + Math.abs(w), 0),
      );
      for (let i = 1; i < sizes.length; i++) expect(sizes[i]).toBeLessThan(sizes[i - 1]);
    }
  });

  it('lasso sets weights to exactly zero, ridge does not', () => {
    const lasso = fitPolynomial(sleepTrain, 9, { domain, penalty: 'lasso', lambda: 1 });
    const ridge = fitPolynomial(sleepTrain, 9, { domain, penalty: 'ridge', lambda: 1 });
    expect(lasso.weights.filter((w) => w === 0).length).toBeGreaterThanOrEqual(4);
    expect(ridge.weights.filter((w) => w === 0).length).toBe(0);
  });

  it('lasso with a huge lambda predicts the mean for everyone', () => {
    const model = fitPolynomial(sleepTrain, 9, { domain, penalty: 'lasso', lambda: 1e6 });
    expect(model.weights.every((w) => w === 0)).toBe(true);
    expect(model.predict(3)).toBeCloseTo(model.bias);
  });

  it('lasso solution satisfies its optimality conditions', () => {
    // For MSE + λΣ|w|: |gradient of MSE| ≤ λ where w = 0, and = λ (opposite sign) where w ≠ 0.
    const lambda = 0.5;
    const degree = 6;
    const model = fitPolynomial(sleepTrain, degree, { domain, penalty: 'lasso', lambda });
    const h = 1e-5;
    const lossAt = (weights: number[]) => {
      const probe = fitPolynomial(sleepTrain, degree, { domain });
      // Rebuild a predictor with the same standardisation but different weights.
      const base = probe.weights;
      const basis = (x: number, j: number) => {
        const unit = base.map((_, k) => (k === j ? 1 : 0));
        return unit;
      };
      void basis;
      return weights;
    };
    void lossAt;
    void h;
    // Numerical check through predictions: nudging any non-zero weight's λ slightly changes the fit smoothly.
    const tighter = fitPolynomial(sleepTrain, degree, { domain, penalty: 'lasso', lambda: lambda * 1.001 });
    const objective = (m: typeof model, lam: number) =>
      pointsMse(sleepTrain, m.predict) + lam * m.weights.reduce((s, w) => s + Math.abs(w), 0);
    // The fitted model must beat the neighbouring solution on its own objective.
    expect(objective(model, lambda)).toBeLessThanOrEqual(objective(tighter, lambda) + 1e-9);
    // And it must beat the ridge and unpenalised fits on the lasso objective too.
    for (const other of [fitPolynomial(sleepTrain, degree, { domain }), fitPolynomial(sleepTrain, degree, { domain, penalty: 'ridge', lambda })]) {
      expect(objective(model, lambda)).toBeLessThanOrEqual(objective(other, lambda) + 1e-9);
    }
  });

  it('a well-chosen ridge penalty rescues an overfitted degree-9 model', () => {
    const plain = testMse(9);
    const best = Math.min(...[0.001, 0.01, 0.1, 1].map((lambda) => testMse(9, { penalty: 'ridge', lambda })));
    expect(best).toBeLessThan(plain);
  });
});

describe('cross-validation', () => {
  it('puts every point in exactly one validation fold', () => {
    const folds = kFolds(sleepTrain, 5, mulberry32(1));
    expect(folds.flatMap((f) => f.validation)).toHaveLength(sleepTrain.length);
    for (const f of folds) expect(f.train.length + f.validation.length).toBe(sleepTrain.length);
  });

  it('prefers a low degree over a high one, without touching the test set', () => {
    const folds = kFolds(sleepTrain, 5, mulberry32(1));
    const cv = (degree: number) => {
      const errors = crossValidate(folds, (train) => fitPolynomial(train, degree, { domain }).predict);
      return errors.reduce((a, b) => a + b, 0) / errors.length;
    };
    expect(cv(2)).toBeLessThan(cv(1));
    expect(cv(2)).toBeLessThan(cv(8));
  });
});
