import { describe, expect, it } from 'vitest';
import { examCentered, examPoints } from '@/data/exam-scores';
import {
  fitLeastSquares,
  fitLine,
  fitLineAbsolute,
  lineMae,
  lineMse,
  polynomialFeatures,
  predictLinear,
  solve,
} from './linear';
import { mae, mse, r2, rmse } from './metrics';
import { descend, gradientStep, lineGradient, lossContour, maxStableLearningRate } from './optimize';

describe('fitLine', () => {
  it('recovers an exact line', () => {
    const pts = [0, 1, 2, 3].map((x) => ({ x, y: 3 * x - 2 }));
    const line = fitLine(pts);
    expect(line.w).toBeCloseTo(3);
    expect(line.b).toBeCloseTo(-2);
  });

  it('matches a hand-worked three-point example', () => {
    // x̄ = 2, ȳ = 5/3; slope = 1/2, intercept = 2/3.
    const line = fitLine([
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
    ]);
    expect(line.w).toBeCloseTo(0.5);
    expect(line.b).toBeCloseTo(2 / 3);
  });

  it('beats nearby lines on the exam data', () => {
    const best = fitLine(examPoints);
    const loss = lineMse(examPoints, best);
    for (const [dw, db] of [
      [0.1, 0],
      [-0.1, 0],
      [0, 0.5],
      [0, -0.5],
    ]) {
      expect(lineMse(examPoints, { w: best.w + dw, b: best.b + db })).toBeGreaterThan(loss);
    }
  });

  it('rejects data with a single x value', () => {
    expect(() =>
      fitLine([
        { x: 1, y: 1 },
        { x: 1, y: 2 },
      ]),
    ).toThrow();
  });
});

describe('fitLineAbsolute', () => {
  it('ignores a single wild outlier that drags least squares', () => {
    const clean = [0, 1, 2, 3, 4, 5, 6].map((x) => ({ x, y: 2 * x + 1 }));
    const withOutlier = [...clean, { x: 7, y: 100 }];
    const l1 = fitLineAbsolute(withOutlier);
    const l2 = fitLine(withOutlier);
    expect(l1.w).toBeCloseTo(2);
    expect(l1.b).toBeCloseTo(1);
    expect(l2.w).toBeGreaterThan(5);
    expect(lineMae(withOutlier, l1)).toBeLessThan(lineMae(withOutlier, l2));
  });
});

describe('fitLeastSquares', () => {
  it('agrees with fitLine for one feature', () => {
    const line = fitLine(examPoints);
    const [b, w] = fitLeastSquares(
      examPoints.map((p) => [p.x]),
      examPoints.map((p) => p.y),
    );
    expect(w).toBeCloseTo(line.w);
    expect(b).toBeCloseTo(line.b);
  });

  it('recovers a plane with two features', () => {
    const X = [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
      [2, 3],
    ];
    const y = X.map(([a, c]) => 4 + 2 * a - 3 * c);
    const w = fitLeastSquares(X, y);
    expect(w[0]).toBeCloseTo(4);
    expect(w[1]).toBeCloseTo(2);
    expect(w[2]).toBeCloseTo(-3);
    expect(predictLinear(w, [5, 5])).toBeCloseTo(-1);
  });

  it('fits a parabola through polynomial features', () => {
    const xs = [-2, -1, 0, 1, 2];
    const w = fitLeastSquares(
      xs.map((x) => polynomialFeatures(x, 2)),
      xs.map((x) => x * x - x + 1),
    );
    expect(w[0]).toBeCloseTo(1);
    expect(w[1]).toBeCloseTo(-1);
    expect(w[2]).toBeCloseTo(1);
  });

  it('shrinks weights as the ridge penalty grows', () => {
    const X = examPoints.map((p) => [p.x]);
    const y = examPoints.map((p) => p.y);
    const slopes = [0, 1, 10, 100].map((lambda) => Math.abs(fitLeastSquares(X, y, lambda)[1]));
    expect(slopes[0]).toBeGreaterThan(slopes[1]);
    expect(slopes[1]).toBeGreaterThan(slopes[2]);
    expect(slopes[2]).toBeGreaterThan(slopes[3]);
  });
});

describe('solve', () => {
  it('solves a 2x2 system', () => {
    const x = solve(
      [
        [2, 1],
        [1, 3],
      ],
      [3, 5],
    );
    expect(x[0]).toBeCloseTo(0.8);
    expect(x[1]).toBeCloseTo(1.4);
  });
  it('throws on a singular matrix', () => {
    expect(() =>
      solve(
        [
          [1, 2],
          [2, 4],
        ],
        [1, 2],
      ),
    ).toThrow();
  });
});

describe('metrics', () => {
  const y = [1, 2, 3, 4];
  it('scores a perfect prediction', () => {
    expect(mse(y, y)).toBe(0);
    expect(mae(y, y)).toBe(0);
    expect(r2(y, y)).toBe(1);
  });
  it('computes MSE, RMSE and MAE by hand', () => {
    const pred = [2, 2, 2, 2]; // errors 1, 0, -1, -2
    expect(mse(y, pred)).toBeCloseTo(1.5);
    expect(rmse(y, pred)).toBeCloseTo(Math.sqrt(1.5));
    expect(mae(y, pred)).toBeCloseTo(1);
  });
  it('gives R² of zero for predicting the mean and negative for worse', () => {
    expect(r2(y, [2.5, 2.5, 2.5, 2.5])).toBeCloseTo(0);
    expect(r2(y, [4, 3, 2, 1])).toBeLessThan(0);
  });
});

describe('gradient descent', () => {
  it('has zero gradient at the least-squares line', () => {
    const g = lineGradient(examPoints, fitLine(examPoints));
    expect(g.w).toBeCloseTo(0, 8);
    expect(g.b).toBeCloseTo(0, 8);
  });

  it('matches a numerical gradient', () => {
    const line = { w: 1.3, b: 20 };
    const h = 1e-5;
    const g = lineGradient(examPoints, line);
    const numW =
      (lineMse(examPoints, { ...line, w: line.w + h }) - lineMse(examPoints, { ...line, w: line.w - h })) / (2 * h);
    const numB =
      (lineMse(examPoints, { ...line, b: line.b + h }) - lineMse(examPoints, { ...line, b: line.b - h })) / (2 * h);
    expect(g.w).toBeCloseTo(numW, 4);
    expect(g.b).toBeCloseTo(numB, 4);
  });

  it('lowers the loss with a small step and converges to the exact answer', () => {
    const start = { w: 0, b: 0 };
    expect(lineMse(examPoints, gradientStep(examPoints, start, 0.01))).toBeLessThan(lineMse(examPoints, start));
    const end = descend(examPoints, start, 0.03, 20000).at(-1)!;
    const best = fitLine(examPoints);
    expect(end.w).toBeCloseTo(best.w, 3);
    expect(end.b).toBeCloseTo(best.b, 2);
  });

  it('draws contours that really sit at the requested loss', () => {
    for (const pts of [examPoints, examCentered]) {
      const ring = lossContour(pts, 100);
      expect(ring.length).toBeGreaterThan(10);
      for (const line of ring) expect(lineMse(pts, line)).toBeCloseTo(100, 6);
      expect(lossContour(pts, 1)).toEqual([]);
    }
  });

  it('agrees with the hand-worked first step in the gradient descent chapter', () => {
    const start = { w: 0, b: 50 };
    const g = lineGradient(examCentered, start);
    expect(g.w).toBeCloseTo(-64.667, 2);
    expect(g.b).toBeCloseTo(-34, 6);
    const next = gradientStep(examCentered, start, 0.1);
    expect(next.w).toBeCloseTo(6.467, 2);
    expect(next.b).toBeCloseTo(53.4, 6);
    expect(lineMse(examCentered, start)).toBeCloseTo(466.83, 1);
    expect(lineMse(examCentered, next)).toBeCloseTo(199.2, 0);
    expect(maxStableLearningRate(examCentered)).toBeCloseTo(0.164, 2);
  });

  it('diverges just above the stable learning rate and not just below', () => {
    const limit = maxStableLearningRate(examPoints);
    const start = { w: 0, b: 0 };
    const lossAfter = (eta: number) => lineMse(examPoints, descend(examPoints, start, eta, 200).at(-1)!);
    expect(lossAfter(limit * 1.05)).toBeGreaterThan(lineMse(examPoints, start));
    expect(lossAfter(limit * 0.95)).toBeLessThan(lineMse(examPoints, start));
  });
});
