import { describe, expect, it } from 'vitest';
import { SLEEP_X, trueSleepCurve } from '@/data/sleep-scores';
import { MOONS, trainMoons } from '@/components/figures/ch15/shared';
import { fitHinges, relu } from './hinges';
import { fitLine, predict } from './linear';

const [LO, HI] = SLEEP_X;

describe('relu', () => {
  it('clips negatives to zero and passes positives through', () => {
    expect([-3, -0.1, 0, 0.1, 5].map(relu)).toEqual([0, 0, 0, 0.1, 5]);
  });
});

describe('fitHinges', () => {
  it('with a single hinge at the left edge is just the best straight line', () => {
    const fit = fitHinges(trueSleepCurve, LO, HI, 1);
    const xs = Array.from({ length: 121 }, (_, i) => LO + ((HI - LO) * i) / 120);
    const line = fitLine(xs.map((x) => ({ x, y: trueSleepCurve(x) })));
    for (const x of [2, 5, 8, 11]) expect(fit.predict(x)).toBeCloseTo(predict(line, x), 6);
  });

  it('gets closer to the curve with every extra hinge', () => {
    const gaps = [1, 2, 3, 4, 6, 8].map((n) => fitHinges(trueSleepCurve, LO, HI, n).worstGap);
    for (let i = 1; i < gaps.length; i++) expect(gaps[i]).toBeLessThan(gaps[i - 1]);
    expect(gaps[0]).toBeGreaterThan(8);
    expect(gaps.at(-1)).toBeLessThan(1);
  });

  it('is the sum of its parts', () => {
    const fit = fitHinges(trueSleepCurve, LO, HI, 5);
    for (const x of [2.5, 6, 10.2]) {
      const total = fit.slopes.reduce((s, _, i) => s + fit.part(i, x), fit.bias);
      expect(fit.predict(x)).toBeCloseTo(total, 10);
    }
    // To the left of a kink, that hinge contributes nothing.
    expect(fit.part(3, fit.kinks[3] - 0.5)).toBeCloseTo(0, 10);
  });
});

describe('a small network on the moons', () => {
  it('cannot bend its boundary without an activation function', () => {
    const straight = trainMoons(8, false);
    expect(straight.trainAccuracy).toBeLessThan(0.92);
  });

  it('separates them once the hidden layer has ReLUs and enough neurons', () => {
    const bent = trainMoons(8, true);
    expect(bent.trainAccuracy).toBeGreaterThan(0.95);
    expect(bent.testAccuracy).toBeGreaterThan(0.93);
    expect(bent.trainAccuracy).toBeGreaterThan(trainMoons(8, false).trainAccuracy);
  });

  it('gives probabilities between 0 and 1 everywhere', () => {
    const model = trainMoons(4, true);
    for (const p of MOONS.slice(0, 10)) {
      const prob = model.probability(p.x, p.y);
      expect(prob).toBeGreaterThanOrEqual(0);
      expect(prob).toBeLessThanOrEqual(1);
    }
  });
});
