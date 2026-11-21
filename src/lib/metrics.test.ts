import { describe, expect, it } from 'vitest';
import { ILL, patientLabels, patientScores, TOTAL } from '@/data/screening';
import { accuracyOf, auc, confusion, confusionAt, f1, falsePositiveRate, precision, recall, rocCurve } from './metrics';

describe('confusion matrix', () => {
  const labels = [1, 1, 1, 0, 0, 0, 0, 0];
  const preds = [1, 1, 0, 1, 0, 0, 0, 0];
  const c = confusion(labels, preds);

  it('counts the four outcomes', () => {
    expect(c).toEqual({ tp: 2, fp: 1, tn: 4, fn: 1 });
  });

  it('gives the hand-worked rates', () => {
    expect(precision(c)).toBeCloseTo(2 / 3);
    expect(recall(c)).toBeCloseTo(2 / 3);
    expect(falsePositiveRate(c)).toBeCloseTo(1 / 5);
    expect(accuracyOf(c)).toBeCloseTo(6 / 8);
    expect(f1(c)).toBeCloseTo(2 / 3);
  });

  it('handles the edge cases without dividing by zero', () => {
    const none = confusion([1, 0], [0, 0]);
    expect(precision(none)).toBe(1);
    expect(recall(none)).toBe(0);
    expect(f1(none)).toBe(0);
  });
});

describe('ROC and AUC', () => {
  it('is 1 for a perfect ranking and 0 for a reversed one', () => {
    expect(auc([0, 0, 1, 1], [0.1, 0.2, 0.8, 0.9])).toBeCloseTo(1);
    expect(auc([1, 1, 0, 0], [0.1, 0.2, 0.8, 0.9])).toBeCloseTo(0);
  });

  it('matches the textbook four-point example', () => {
    // Pairs (positive, negative) ranked correctly: 3 of 4.
    expect(auc([0, 0, 1, 1], [0.1, 0.4, 0.35, 0.8])).toBeCloseTo(0.75);
  });

  it('equals the share of ill/healthy pairs ranked the right way round', () => {
    let right = 0;
    let pairs = 0;
    patientLabels.forEach((a, i) => {
      if (a !== 1) return;
      patientLabels.forEach((b, j) => {
        if (b !== 0) return;
        pairs++;
        if (patientScores[i] > patientScores[j]) right++;
        else if (patientScores[i] === patientScores[j]) right += 0.5;
      });
    });
    expect(auc(patientLabels, patientScores)).toBeCloseTo(right / pairs, 6);
  });

  it('runs from (0,0) to (1,1) and never goes backwards', () => {
    const pts = rocCurve(patientLabels, patientScores);
    expect(pts[0]).toMatchObject({ fpr: 0, tpr: 0 });
    expect(pts.at(-1)).toMatchObject({ fpr: 1, tpr: 1 });
    for (let i = 1; i < pts.length; i++) {
      expect(pts[i].fpr).toBeGreaterThanOrEqual(pts[i - 1].fpr);
      expect(pts[i].tpr).toBeGreaterThanOrEqual(pts[i - 1].tpr);
    }
  });
});

describe('the screening dataset', () => {
  it('has a rare positive class', () => {
    expect(patientLabels).toHaveLength(TOTAL);
    expect(patientLabels.reduce((a, b) => a + b, 0)).toBe(ILL);
  });

  it('makes "everyone is healthy" 90% accurate and useless', () => {
    const c = confusionAt(patientLabels, patientScores, 2);
    expect(accuracyOf(c)).toBeCloseTo(0.9);
    expect(recall(c)).toBe(0);
  });

  it('trades recall for precision as the threshold rises', () => {
    const low = confusionAt(patientLabels, patientScores, 0.2);
    const high = confusionAt(patientLabels, patientScores, 0.8);
    expect(recall(low)).toBeGreaterThan(recall(high));
    expect(precision(high)).toBeGreaterThan(precision(low));
  });
});
