import { describe, expect, it } from 'vitest';
import { blobs, moons, moonsTest, moonsTrain, rings, toLabels, toRows } from '@/data/toy2d';
import { euclidean, knnAccuracy, knnPredict, knnProba, nearest, nearFarRatio, standardizer } from './knn';

describe('distance and neighbours', () => {
  it('measures a 3-4-5 triangle', () => {
    expect(euclidean([0, 0], [3, 4])).toBe(5);
    expect(euclidean([1, 2, 3], [1, 2, 3])).toBe(0);
  });

  it('returns neighbours nearest first', () => {
    const pts = [[0, 0], [5, 5], [1, 0], [0, 2]];
    expect(nearest(pts, [0, 0.1], 3)).toEqual([0, 2, 3]);
    expect(nearest(pts, [0, 0], 10)).toHaveLength(4);
  });
});

describe('voting', () => {
  const pts = [[0, 0], [1, 0], [0, 1], [5, 5], [6, 5]];
  const labels = [0, 0, 0, 1, 1];

  it('follows the majority of the k nearest', () => {
    expect(knnPredict(pts, labels, [0.2, 0.2], 3)).toBe(0);
    expect(knnPredict(pts, labels, [5.5, 5], 1)).toBe(1);
    expect(knnProba(pts, labels, [5.5, 5], 5)).toBeCloseTo(0.4);
    // With k = 5 every point votes, and class 0 outnumbers class 1 everywhere.
    expect(knnPredict(pts, labels, [5.5, 5], 5)).toBe(0);
  });

  it('breaks an exact tie with the single nearest point', () => {
    expect(knnPredict([[0, 0], [2, 0]], [0, 1], [0.5, 0], 2)).toBe(0);
  });

  it('with k = 1 gets every training point right', () => {
    const X = toRows(moonsTrain);
    const y = toLabels(moonsTrain);
    expect(knnAccuracy(X, y, X, y, 1)).toBe(1);
  });
});

describe('choosing k on the moons', () => {
  const X = toRows(moonsTrain);
  const y = toLabels(moonsTrain);
  const acc = (k: number) => knnAccuracy(X, y, toRows(moonsTest), toLabels(moonsTest), k);

  it('does better with a moderate k than with k = 1 or a huge k', () => {
    const best = Math.max(...[5, 7, 9, 11, 13, 15].map(acc));
    expect(best).toBeGreaterThan(acc(1));
    expect(best).toBeGreaterThan(acc(59));
    expect(best).toBeGreaterThan(0.8);
  });
});

describe('scaling', () => {
  it('standardises to mean 0 and spread 1', () => {
    const rows = [[1, 100], [2, 300], [3, 500]];
    const s = standardizer(rows);
    const z = rows.map(s.transform);
    for (const j of [0, 1]) {
      expect(z.reduce((a, r) => a + r[j], 0)).toBeCloseTo(0);
      expect(z.reduce((a, r) => a + r[j] ** 2, 0) / 3).toBeCloseTo(1);
    }
  });

  it('changes who the nearest neighbour is when units differ wildly', () => {
    // Feature 2 is in units 100 times larger, so unscaled distance ignores feature 1.
    const rows = [[0, 500], [10, 510], [0.5, 800]];
    const q = [0, 520];
    expect(nearest(rows, q, 1)[0]).toBe(1);
    const s = standardizer(rows);
    expect(nearest(rows.map(s.transform), s.transform(q), 1)[0]).toBe(0);
  });
});

describe('many dimensions', () => {
  it('makes nearest and farthest neighbours almost equally far', () => {
    const avg = (d: number) => [1, 2, 3, 4, 5].reduce((s, seed) => s + nearFarRatio(d, 200, seed), 0) / 5;
    expect(avg(2)).toBeLessThan(0.1);
    expect(avg(100)).toBeGreaterThan(0.6);
    expect(avg(10)).toBeGreaterThan(avg(2));
    expect(avg(100)).toBeGreaterThan(avg(10));
  });
});

describe('toy datasets', () => {
  it('are balanced, reproducible and inside the plot', () => {
    for (const make of [() => moons(40, 0.5, 1), () => blobs(40, 1, 1), () => rings(40, 0.3, 1)]) {
      const a = make();
      expect(a).toEqual(make());
      expect(a.filter((p) => p.label === 1)).toHaveLength(20);
      for (const p of a) {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(10);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThanOrEqual(10);
      }
    }
  });
});
