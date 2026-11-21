import { describe, expect, it } from 'vitest';
import { messageLabels, messageTokens } from '@/data/messages';
import { average, conditional, normalCdf, normalPdf, rollDie, shareWithin, standardDeviation, twoDiceProbability, variance } from './prob';
import { mulberry32 } from './random';

describe('averages and spread', () => {
  it('matches a hand-worked example', () => {
    const scores = [2, 4, 4, 4, 5, 5, 7, 9];
    expect(average(scores)).toBe(5);
    expect(variance(scores)).toBe(4);
    expect(standardDeviation(scores)).toBe(2);
  });
});

describe('two dice', () => {
  it('has probabilities that sum to one and peak at seven', () => {
    const totals = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    expect(totals.reduce((s, t) => s + twoDiceProbability(t), 0)).toBeCloseTo(1);
    expect(twoDiceProbability(7)).toBeCloseTo(6 / 36);
    expect(twoDiceProbability(2)).toBeCloseTo(1 / 36);
    expect(twoDiceProbability(13)).toBe(0);
    expect(totals.reduce((s, t) => s + t * twoDiceProbability(t), 0)).toBeCloseTo(7);
  });

  it('simulated rolls settle toward the expected shares', () => {
    const rand = mulberry32(42);
    const n = 20000;
    let sevens = 0;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const total = rollDie(rand) + rollDie(rand);
      sum += total;
      if (total === 7) sevens++;
    }
    expect(sum / n).toBeCloseTo(7, 1);
    expect(sevens / n).toBeCloseTo(1 / 6, 1);
  });
});

describe('normal curve', () => {
  it('has total area one', () => {
    let area = 0;
    for (let x = 0; x <= 140; x += 0.05) area += normalPdf(x, 67, 10) * 0.05;
    expect(area).toBeCloseTo(1, 3);
  });

  it('gives the 68-95-99.7 shares', () => {
    expect(shareWithin(1)).toBeCloseTo(0.6827, 3);
    expect(shareWithin(2)).toBeCloseTo(0.9545, 3);
    expect(shareWithin(3)).toBeCloseTo(0.9973, 3);
  });

  it('is symmetric about the mean', () => {
    expect(normalCdf(67, 67, 10)).toBeCloseTo(0.5, 6);
    expect(normalCdf(57, 67, 10) + normalCdf(77, 67, 10)).toBeCloseTo(1, 6);
    expect(normalPdf(60, 67, 10)).toBeCloseTo(normalPdf(74, 67, 10));
  });
});

describe('conditional probability on the inbox', () => {
  const has = (word: string, label: number) => messageTokens.filter((t, i) => messageLabels[i] === label && t.includes(word)).length;

  it('gives the two different answers the chapter contrasts', () => {
    const spamWithFree = has('free', 1);
    const normalWithFree = has('free', 0);
    expect([spamWithFree, normalWithFree]).toEqual([9, 1]);
    // Of spam messages, the share containing "free"; and of messages containing "free", the share that are spam.
    expect(conditional(spamWithFree, 14)).toBeCloseTo(9 / 14);
    expect(conditional(spamWithFree, spamWithFree + normalWithFree)).toBeCloseTo(0.9);
  });
});
