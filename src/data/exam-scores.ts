import type { Point } from '@/lib/linear';

/**
 * The running regression dataset of the book: twelve students, the hours each
 * studied for an exam, and the score they got (out of 100). Invented, small
 * enough to check by hand, and noisy enough to be interesting.
 */
export interface Student {
  hours: number;
  score: number;
}

export const students: Student[] = [
  { hours: 1, score: 48 },
  { hours: 1.5, score: 53 },
  { hours: 2, score: 50 },
  { hours: 3, score: 60 },
  { hours: 3.5, score: 57 },
  { hours: 4, score: 66 },
  { hours: 5, score: 68 },
  { hours: 5.5, score: 75 },
  { hours: 6, score: 71 },
  { hours: 7, score: 82 },
  { hours: 8, score: 83 },
  { hours: 9, score: 91 },
];

/** The same data as (x, y) points: x is hours, y is score. */
export const examPoints: Point[] = students.map((s) => ({ x: s.hours, y: s.score }));

/** Axis ranges that frame the data comfortably. */
export const EXAM_X: [number, number] = [0, 10];
export const EXAM_Y: [number, number] = [30, 100];

/** A pass is 65 or more. Used from the classification chapters onward. */
export const PASS_MARK = 65;
