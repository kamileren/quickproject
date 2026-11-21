import { describe, expect, it } from 'vitest';
import { examCentered } from '@/data/exam-scores';
import { numericalDerivative, numericalGradient, secantSlope } from './calculus';
import { lineMse } from './linear';
import { lineGradient } from './optimize';

const square = (x: number) => x * x;

describe('slope by nudging', () => {
  it('gives the chapter values for x squared at x = 1', () => {
    expect(secantSlope(square, 1, 2)).toBeCloseTo(4);
    expect(secantSlope(square, 1, 1)).toBeCloseTo(3);
    expect(secantSlope(square, 1, 0.1)).toBeCloseTo(2.1);
    expect(secantSlope(square, 1, 0.01)).toBeCloseTo(2.01);
  });

  it('approaches the derivative as the nudge shrinks', () => {
    for (const x of [-2, 0, 0.5, 3]) expect(numericalDerivative(square, x)).toBeCloseTo(2 * x, 6);
    expect(numericalDerivative((x) => x ** 3, 2)).toBeCloseTo(12, 5);
    expect(numericalDerivative((x) => 7 * x + 1, 5)).toBeCloseTo(7, 6);
  });
});

describe('gradient', () => {
  const bowl = ([x, y]: number[]) => x * x + 3 * y * y;

  it('matches the partial derivatives of the bowl in the chapter', () => {
    const g = numericalGradient(bowl, [2, 1]);
    expect(g[0]).toBeCloseTo(4, 5);
    expect(g[1]).toBeCloseTo(6, 5);
    const flat = numericalGradient(bowl, [0, 0]);
    expect(flat[0]).toBeCloseTo(0, 6);
    expect(flat[1]).toBeCloseTo(0, 6);
  });

  it('agrees with the hand-derived gradient used for linear regression', () => {
    const at = [1.5, 60];
    const numeric = numericalGradient(([w, b]) => lineMse(examCentered, { w, b }), at);
    const exact = lineGradient(examCentered, { w: at[0], b: at[1] });
    expect(numeric[0]).toBeCloseTo(exact.w, 4);
    expect(numeric[1]).toBeCloseTo(exact.b, 4);
  });
});

describe('chain rule', () => {
  it('multiplies the rates of the two steps', () => {
    // y = (3x)²: the inner step has rate 3, the outer has rate 2u, so dy/dx = 6u = 18x.
    const composed = (x: number) => (3 * x) ** 2;
    for (const x of [0.5, 1, 2]) {
      const inner = numericalDerivative((v) => 3 * v, x);
      const outer = numericalDerivative(square, 3 * x);
      expect(numericalDerivative(composed, x)).toBeCloseTo(inner * outer, 4);
      expect(inner * outer).toBeCloseTo(18 * x, 4);
    }
  });
});
