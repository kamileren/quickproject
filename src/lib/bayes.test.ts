import { describe, expect, it } from 'vitest';
import { messageLabels, messages, messageTokens, tokenize } from '@/data/messages';
import { bayesRule, classifyMessage, trainNaiveBayes, wordLikelihood, wordPush } from './bayes';

describe('bayesRule', () => {
  it('solves the classic screening example by counting', () => {
    // 1000 people, 100 ill. Test catches 90% of the ill and wrongly flags 9% of the healthy:
    // 90 true positives, 81 false positives, so 90 / 171 of positives are ill.
    expect(bayesRule(0.1, 0.9, 0.09)).toBeCloseTo(90 / 171, 10);
  });
  it('leaves the prior alone when the evidence is equally likely either way', () => {
    expect(bayesRule(0.3, 0.5, 0.5)).toBeCloseTo(0.3);
  });
  it('handles certainty', () => {
    expect(bayesRule(0.2, 0.8, 0)).toBe(1);
    expect(bayesRule(0.2, 0, 0.5)).toBe(0);
  });
});

describe('naive Bayes on the inbox', () => {
  const model = trainNaiveBayes(messageTokens, messageLabels);

  it('counts documents and the prior', () => {
    expect(messages).toHaveLength(34);
    expect(model.documents).toEqual([14, 20]);
    expect(model.prior).toBeCloseTo(14 / 34);
  });

  it('gives word probabilities that sum to 1 within each class', () => {
    for (const inSpam of [true, false]) {
      const total = model.vocabulary.reduce((s, w) => s + wordLikelihood(model, w, inSpam), 0);
      expect(total).toBeCloseTo(1, 10);
    }
  });

  it('pushes the expected way for telling words', () => {
    for (const w of ['free', 'win', 'prize', 'click', 'claim']) expect(wordPush(model, w)).toBeGreaterThan(0.5);
    for (const w of ['meeting', 'report', 'tomorrow', 'lunch', 'thanks']) expect(wordPush(model, w)).toBeLessThan(-0.5);
  });

  it('matches a direct product of probabilities', () => {
    const tokens = tokenize('free lunch tomorrow');
    const result = classifyMessage(model, tokens);
    let spam = model.prior;
    let normal = 1 - model.prior;
    for (const t of tokens) {
      spam *= wordLikelihood(model, t, true);
      normal *= wordLikelihood(model, t, false);
    }
    expect(result.probability).toBeCloseTo(spam / (spam + normal), 10);
  });

  it('classifies clear messages and ignores unknown words', () => {
    expect(classifyMessage(model, tokenize('claim your free prize now')).probability).toBeGreaterThan(0.95);
    expect(classifyMessage(model, tokenize('see you at the meeting tomorrow')).probability).toBeLessThan(0.05);
    const r = classifyMessage(model, tokenize('zebra xylophone'));
    expect(r.unknown).toEqual(['zebra', 'xylophone']);
    expect(r.probability).toBeCloseTo(model.prior);
  });

  it('gets its own training messages right', () => {
    const right = messageTokens.filter((t, i) => (classifyMessage(model, t).probability >= 0.5 ? 1 : 0) === messageLabels[i]).length;
    expect(right).toBeGreaterThanOrEqual(33);
  });
});

describe('smoothing', () => {
  const raw = trainNaiveBayes(messageTokens, messageLabels, 0);
  const smooth = trainNaiveBayes(messageTokens, messageLabels, 1);

  it('without it, one word unseen in a class vetoes everything else', () => {
    // "meeting" never appears in spam, so the unsmoothed model says this cannot be spam,
    // however spammy the other three words are.
    const r = classifyMessage(raw, tokenize('free now your meeting'));
    expect(wordPush(raw, 'meeting')).toBe(-Infinity);
    expect(r.probability).toBe(0);
  });

  it('with it, the same message is judged on all its words', () => {
    const r = classifyMessage(smooth, tokenize('free now your meeting'));
    expect(Number.isFinite(wordPush(smooth, 'meeting'))).toBe(true);
    expect(r.probability).toBeGreaterThan(0.9);
  });

  it('a message pulling both ways without smoothing has no defined answer', () => {
    const r = classifyMessage(raw, tokenize('prize meeting'));
    expect(Number.isNaN(r.score)).toBe(true);
    expect(r.probability).toBe(0.5);
  });
});
