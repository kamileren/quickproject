import { describe, expect, it } from 'vitest';
import { outcomes, outcomeX, outcomeY, studySleep } from '@/data/pass-fail';
import { decisionPoint, fitLogistic, logisticGradient, logisticStep, logLoss, logLossOne, modelLogLoss, predictProba, sigmoid } from './classify';

describe('sigmoid', () => {
  it('has the right landmarks', () => {
    expect(sigmoid(0)).toBe(0.5);
    expect(sigmoid(2) + sigmoid(-2)).toBeCloseTo(1);
    expect(sigmoid(1)).toBeCloseTo(0.7310586, 6);
  });
  it('stays finite for huge inputs', () => {
    expect(sigmoid(1000)).toBe(1);
    expect(sigmoid(-1000)).toBe(0);
  });
});

describe('log loss', () => {
  it('matches hand-worked values', () => {
    expect(logLossOne(1, 0.9)).toBeCloseTo(0.1054, 4);
    expect(logLossOne(1, 0.5)).toBeCloseTo(0.6931, 4);
    expect(logLossOne(1, 0.1)).toBeCloseTo(2.3026, 4);
    expect(logLossOne(0, 0.1)).toBeCloseTo(0.1054, 4);
  });
  it('averages over examples and survives certainty', () => {
    expect(logLoss([1, 0], [0.9, 0.1])).toBeCloseTo(0.1054, 4);
    expect(Number.isFinite(logLoss([1], [0]))).toBe(true);
  });
});

describe('fitLogistic on the eighteen students', () => {
  const fit = fitLogistic(outcomeX, outcomeY);

  it('uses data that is not perfectly separable', () => {
    expect(outcomes).toHaveLength(18);
    expect(fit.converged).toBe(true);
  });

  it('ends where the gradient is zero', () => {
    for (const g of logisticGradient(outcomeX, outcomeY, fit.weights)) expect(g).toBeCloseTo(0, 7);
  });

  it('beats nearby weights', () => {
    const [b, w] = fit.weights;
    for (const [db, dw] of [[0.2, 0], [-0.2, 0], [0, 0.1], [0, -0.1]]) {
      expect(modelLogLoss(outcomeX, outcomeY, [b + db, w + dw])).toBeGreaterThan(fit.loss);
    }
  });

  it('gives higher pass probability for more hours, crossing one half between the two classes', () => {
    expect(fit.weights[1]).toBeGreaterThan(0);
    const cut = decisionPoint(fit.weights);
    expect(cut).toBeGreaterThan(3);
    expect(cut).toBeLessThan(5);
    expect(predictProba(fit.weights, [cut])).toBeCloseTo(0.5);
  });

  it('is reached by plain gradient descent too', () => {
    let w = [0, 0];
    for (let i = 0; i < 60000; i++) w = logisticStep(outcomeX, outcomeY, w, 0.1);
    expect(w[0]).toBeCloseTo(fit.weights[0], 2);
    expect(w[1]).toBeCloseTo(fit.weights[1], 2);
  });
});

describe('fitLogistic elsewhere', () => {
  it('reports when classes separate perfectly instead of pretending to converge', () => {
    const fit = fitLogistic([[1], [2], [3], [4]], [0, 0, 1, 1]);
    expect(fit.converged).toBe(false);
    expect(fit.loss).toBeLessThan(0.01);
  });

  it('a ridge penalty makes separable data well behaved', () => {
    const fit = fitLogistic([[1], [2], [3], [4]], [0, 0, 1, 1], 0.01);
    expect(fit.converged).toBe(true);
    expect(decisionPoint(fit.weights)).toBeCloseTo(2.5, 6);
  });

  it('learns a sensible two-feature boundary', () => {
    const X = studySleep.map((s) => [s.hours, s.sleep]);
    const y = studySleep.map((s) => s.passed);
    const fit = fitLogistic(X, y);
    expect(fit.converged).toBe(true);
    expect(fit.weights[1]).toBeGreaterThan(0);
    expect(fit.weights[2]).toBeGreaterThan(0);
    const right = X.filter((row, i) => (predictProba(fit.weights, row) >= 0.5 ? 1 : 0) === y[i]).length;
    expect(right / X.length).toBeGreaterThan(0.8);
    expect(right).toBeLessThan(X.length);
  });
});
