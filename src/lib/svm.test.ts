import { describe, expect, it } from 'vitest';
import { apart, few, mixed, ringed } from '@/data/svm-points';
import { toLabels, toRows } from '@/data/toy2d';
import { lineThrough, streetWidth, svmAccuracy, trainSvm } from './svm';

const HARD = 1e4;

describe('linear SVM on a hand-checkable example', () => {
  // Two columns of points, at x = 0 (class 0) and x = 2 (class 1): the widest street is 2 wide, centred on x = 1.
  const X = [[0, 0], [0, 1], [0, 2], [2, 0], [2, 1], [2, 2]];
  const labels = [0, 0, 0, 1, 1, 1];
  const model = trainSvm(X, labels, { C: HARD });

  it('finds the boundary x = 1 with a margin 2 wide', () => {
    expect(model.converged).toBe(true);
    expect(model.w![0]).toBeCloseTo(1, 2);
    expect(model.w![1]).toBeCloseTo(0, 2);
    expect(-model.b / model.w![0]).toBeCloseTo(1, 2);
    expect(model.marginWidth).toBeCloseTo(2, 2);
  });

  it('puts the support vectors exactly on the margin edges', () => {
    for (const i of model.support) expect(Math.abs(model.decision(X[i]))).toBeCloseTo(1, 2);
    expect(model.decision([1, 5])).toBeCloseTo(0, 2);
  });
});

describe('linear SVM on separable clusters', () => {
  for (const [name, points] of [['apart', apart], ['few', few]] as const) {
    const X = toRows(points);
    const labels = toLabels(points);
    const model = trainSvm(X, labels, { C: HARD });

    it(`${name}: separates the classes with every point outside the margin`, () => {
      expect(model.converged).toBe(true);
      expect(svmAccuracy(model, X, labels)).toBe(1);
      for (const x of X) expect(Math.abs(model.decision(x))).toBeGreaterThan(1 - 1e-3);
    });

    it(`${name}: has only a few support vectors, all on the margin`, () => {
      expect(model.support.length).toBeGreaterThanOrEqual(2);
      expect(model.support.length).toBeLessThanOrEqual(5);
      for (const i of model.support) expect(Math.abs(model.decision(X[i]))).toBeCloseTo(1, 2);
    });

    it(`${name}: no hand-placed line through two points gives a wider street`, () => {
      // The SVM street must be at least as wide as any street found by brute force over point pairs' midlines.
      let best = 0;
      for (let i = 0; i < X.length; i++) {
        for (let j = 0; j < X.length; j++) {
          if (labels[i] === labels[j]) continue;
          // A line through the midpoint of an opposite pair, perpendicular to the segment joining them.
          const mid = [(X[i][0] + X[j][0]) / 2, (X[i][1] + X[j][1]) / 2];
          const dir = [-(X[j][1] - X[i][1]), X[j][0] - X[i][0]];
          const width = streetWidth(mid, [mid[0] + dir[0], mid[1] + dir[1]], X, labels);
          if (width !== null) best = Math.max(best, width);
        }
      }
      expect(model.marginWidth!).toBeGreaterThanOrEqual(best - 1e-3);
    });

    it(`${name}: ignores points that are not support vectors`, () => {
      const keep = X.map((_, i) => i).filter((i) => model.support.includes(i));
      const again = trainSvm(keep.map((i) => X[i]), keep.map((i) => labels[i]), { C: HARD });
      expect(again.marginWidth!).toBeCloseTo(model.marginWidth!, 2);
    });
  }
});

describe('soft margin', () => {
  const X = toRows(mixed);
  const labels = toLabels(mixed);

  it('uses data no line can separate', () => {
    expect(svmAccuracy(trainSvm(X, labels, { C: 100 }), X, labels)).toBeLessThan(1);
  });

  it('widens the margin and recruits more support vectors as C falls', () => {
    const models = [10, 1, 0.1, 0.01].map((C) => trainSvm(X, labels, { C }));
    for (const m of models) expect(m.converged).toBe(true);
    for (let i = 1; i < models.length; i++) {
      expect(models[i].marginWidth!).toBeGreaterThan(models[i - 1].marginWidth!);
      expect(models[i].support.length).toBeGreaterThanOrEqual(models[i - 1].support.length);
    }
  });
});

describe('kernels', () => {
  const X = toRows(ringed);
  const labels = toLabels(ringed);

  it('a straight line cannot separate a ring from its centre', () => {
    expect(svmAccuracy(trainSvm(X, labels, { C: 1 }), X, labels)).toBeLessThan(0.75);
  });

  it('an RBF kernel can', () => {
    const model = trainSvm(X, labels, { C: 1, kernel: { kind: 'rbf', gamma: 0.5 } });
    expect(model.converged).toBe(true);
    expect(svmAccuracy(model, X, labels)).toBeGreaterThan(0.95);
    expect(model.decision([5, 5])).toBeGreaterThan(0);
    expect(model.decision([9.5, 9.5])).toBeLessThan(0);
  });
});

describe('geometry helpers', () => {
  it('measures signed distance from a line', () => {
    const { signedDistance } = lineThrough([0, 0], [0, 1]); // the y axis
    expect(Math.abs(signedDistance([3, 7]))).toBeCloseTo(3);
    expect(Math.sign(signedDistance([3, 0]))).toBe(-Math.sign(signedDistance([-3, 0])));
  });

  it('reports no street when the line does not separate the classes', () => {
    expect(streetWidth([0, 0], [1, 0], [[0, 1], [0, 2]], [0, 1])).toBeNull();
    expect(streetWidth([0, 1.5], [1, 1.5], [[0, 1], [0, 2]], [0, 1])).toBeCloseTo(1);
  });
});
