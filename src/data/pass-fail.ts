import { newStudents, passed, students } from './exam-scores';
import { gaussian, mulberry32 } from '@/lib/random';

/**
 * The classification version of the exam data: all eighteen students (the
 * original twelve plus the six kept aside in chapter 1), each with the hours
 * they studied and whether they passed. Two students break the pattern, so no
 * single cut-off separates passes from fails perfectly.
 */
export interface Outcome {
  hours: number;
  /** 1 for a pass, 0 for a fail. */
  passed: number;
}

export const outcomes: Outcome[] = [...students, ...newStudents]
  .map((s) => ({ hours: s.hours, passed: passed(s) ? 1 : 0 }))
  .sort((a, b) => a.hours - b.hours);

export const outcomeX: number[][] = outcomes.map((o) => [o.hours]);
export const outcomeY: number[] = outcomes.map((o) => o.passed);

/**
 * A second, larger class with two features: hours studied and hours slept.
 * Invented, with a known rule: studying and sleeping both help, and luck
 * decides the borderline cases.
 */
export interface StudySleep {
  hours: number;
  sleep: number;
  passed: number;
}

export const STUDY_RANGE: [number, number] = [0, 10];
export const SLEEP_RANGE: [number, number] = [3, 10];

export function sampleStudySleep(count: number, seed: number): StudySleep[] {
  const rand = mulberry32(seed);
  return Array.from({ length: count }, () => {
    const hours = Math.round((0.5 + rand() * 9) * 10) / 10;
    const sleep = Math.round((3.5 + rand() * 6) * 10) / 10;
    const score = 0.9 * (hours - 4.5) + 0.8 * (sleep - 6.5) + 0.9 * gaussian(rand);
    return { hours, sleep, passed: score > 0 ? 1 : 0 };
  });
}

export const studySleep: StudySleep[] = sampleStudySleep(40, 12);
