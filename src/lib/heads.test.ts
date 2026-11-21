import { describe, expect, it } from 'vitest';
import { examPoints } from '@/data/exam-scores';
import { outcomes } from '@/data/pass-fail';
import { sleepTrain, trueSleepCurve } from '@/data/sleep-scores';
import { fitLogistic } from './classify';
import { trainNumberHead, trainOneNeuron, trainYesNoHead } from './heads';
import { fitLine, lineMse } from './linear';

describe('yes/no head', () => {
  const model = trainYesNoHead();
  it('separates the crescents and outputs probabilities', () => {
    expect(model.accuracy).toBeGreaterThan(0.95);
    const p = model.probability(5, 5);
    expect(p).toBeGreaterThanOrEqual(0);
    expect(p).toBeLessThanOrEqual(1);
  });
});

describe('number head', () => {
  const model = trainNumberHead();
  it('follows the rise and fall that a straight line cannot', () => {
    const lineError = lineMse(sleepTrain, fitLine(sleepTrain));
    expect(model.mse).toBeLessThan(lineError / 3);
    // Peaks somewhere in the middle, like the true pattern, and is lower at both ends.
    expect(model.predict(7.5)).toBeGreaterThan(model.predict(3));
    expect(model.predict(7.5)).toBeGreaterThan(model.predict(10.5));
    expect(Math.abs(model.predict(7.5) - trueSleepCurve(7.5))).toBeLessThan(8);
  });
});

describe('one neuron', () => {
  it('with no activation and squared error arrives at the linear regression answer', () => {
    const states = trainOneNeuron(examPoints.map((p) => p.x), examPoints.map((p) => p.y), 'linear', 400, 0.05);
    const best = fitLine(examPoints);
    const end = states[states.length - 1];
    expect(end.w).toBeCloseTo(best.w, 2);
    expect(end.b).toBeCloseTo(best.b, 1);
    expect(end.loss).toBeCloseTo(lineMse(examPoints, best), 2);
    expect(states[0].loss).toBeGreaterThan(end.loss * 10);
  });

  it('with a sigmoid and cross-entropy arrives at the logistic regression answer', () => {
    const states = trainOneNeuron(outcomes.map((o) => o.hours), outcomes.map((o) => o.passed), 'sigmoid', 3000, 1);
    const best = fitLogistic(outcomes.map((o) => [o.hours]), outcomes.map((o) => o.passed));
    const end = states[states.length - 1];
    expect(end.w).toBeCloseTo(best.weights[1], 1);
    expect(end.b).toBeCloseTo(best.weights[0], 0);
    expect(end.loss).toBeCloseTo(best.loss, 3);
  });
});
