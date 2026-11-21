import { sigmoid } from '@/lib/classify';
import { gaussian, mulberry32 } from '@/lib/random';

/**
 * A screening test for a rare illness. Two hundred patients, twenty of whom
 * are ill, each with a risk score between 0 and 1 from some model. Invented:
 * ill patients tend to score high and healthy ones low, with enough overlap
 * that no threshold separates them. Used to show why accuracy misleads when
 * one class is rare.
 */
export interface Patient {
  /** The model's risk score, 0 to 1. */
  score: number;
  /** 1 if the patient is ill, 0 if healthy. */
  ill: number;
  /** A fixed vertical position inside the patient's row of the strip plot, 0 to 1. */
  jitter: number;
}

export const TOTAL = 200;
export const ILL = 20;

export function samplePatients(seed: number): Patient[] {
  const rand = mulberry32(seed);
  return Array.from({ length: TOTAL }, (_, i) => {
    const ill = i < ILL ? 1 : 0;
    const raw = ill ? 0.5 + 1.2 * gaussian(rand) : -1.4 + 1.1 * gaussian(rand);
    return { ill, score: Math.round(sigmoid(raw) * 1000) / 1000, jitter: rand() };
  });
}

export const patients: Patient[] = samplePatients(5);
export const patientLabels: number[] = patients.map((p) => p.ill);
export const patientScores: number[] = patients.map((p) => p.score);
