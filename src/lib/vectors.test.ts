import { describe, expect, it } from 'vitest';
import { examPoints } from '@/data/exam-scores';
import { fitLine, predict } from './linear';
import { add, angleBetween, dot, matVec, norm, project, scale, shape } from './vectors';

describe('vectors', () => {
  it('adds and scales entry by entry', () => {
    expect(add([1, 2], [3, -1])).toEqual([4, 1]);
    expect(scale([1, -2, 3], 2)).toEqual([2, -4, 6]);
    expect(() => add([1, 2], [1])).toThrow();
  });

  it('computes the dot product from the chapter example', () => {
    // 5 points per hour of study, 2 per hour of sleep, for a student with 4 and 7 hours.
    expect(dot([5, 2], [4, 7])).toBe(34);
    expect(dot([1, 0], [0, 1])).toBe(0);
    expect(dot([1, 2], [-2, -4])).toBeLessThan(0);
  });

  it('measures length and angle', () => {
    expect(norm([3, 4])).toBe(5);
    expect(angleBetween([1, 0], [0, 2])).toBeCloseTo(90);
    expect(angleBetween([1, 1], [2, 2])).toBeCloseTo(0);
    expect(angleBetween([1, 0], [-3, 0])).toBeCloseTo(180);
  });

  it('projects one vector onto another', () => {
    expect(project([3, 4], [1, 0])).toEqual([3, 0]);
    const p = project([2, 2], [0, 5]);
    expect(p[0]).toBeCloseTo(0);
    expect(p[1]).toBeCloseTo(2);
    // The dot product is the projection's length times the other vector's length.
    expect(dot([3, 4], [2, 0])).toBeCloseTo(norm(project([3, 4], [2, 0])) * norm([2, 0]));
  });
});

describe('matrices', () => {
  it('multiplies a matrix by a vector, one dot product per row', () => {
    expect(matVec([[1, 2], [3, 4], [5, 6]], [10, 1])).toEqual([12, 34, 56]);
    expect(shape([[1, 2], [3, 4], [5, 6]])).toEqual([3, 2]);
    expect(() => matVec([[1, 2, 3]], [1, 2])).toThrow();
  });

  it('reproduces every linear regression prediction in one multiplication', () => {
    const line = fitLine(examPoints);
    // Each row is [hours, 1]; the weight vector is [w, b].
    const X = examPoints.map((p) => [p.x, 1]);
    const predictions = matVec(X, [line.w, line.b]);
    examPoints.forEach((p, i) => expect(predictions[i]).toBeCloseTo(predict(line, p.x)));
  });
});
