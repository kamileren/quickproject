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

/** Average hours studied across the class (4.625). */
export const MEAN_HOURS = students.reduce((s, st) => s + st.hours, 0) / students.length;

/**
 * The same points with hours measured from the class average. With this shift
 * the bias of a line means "the score of a student who studied the average
 * amount", and gradient descent behaves far better (see the chapter on it).
 */
export const examCentered: Point[] = examPoints.map((p) => ({ x: p.x - MEAN_HOURS, y: p.y }));

/** Axis ranges that frame the data comfortably. */
export const EXAM_X: [number, number] = [0, 10];
export const EXAM_Y: [number, number] = [30, 100];

/** A pass is 65 or more. Used from the classification chapters onward. */
export const PASS_MARK = 65;

/**
 * Six more students from the same class, kept aside. Models never see these
 * while fitting; they are used to show how a rule does on new people. Two of
 * them break the pattern: one passed on 3 hours, one failed on 4.5.
 */
export const newStudents: Student[] = [
  { hours: 0.5, score: 44 },
  { hours: 2.5, score: 55 },
  { hours: 3, score: 67 },
  { hours: 4.5, score: 62 },
  { hours: 6.5, score: 78 },
  { hours: 8.5, score: 88 },
];

export const passed = (student: Student): boolean => student.score >= PASS_MARK;
