import { describe, expect, it } from 'vitest';
import { closest, editDistance } from './closest';

const chapters = ['linear-regression', 'logistic-regression', 'gradient-descent', 'nearest-neighbours', 'naive-bayes', 'glossary'].map((key) => ({ key, value: key }));

describe('finding the page someone meant', () => {
  it('counts letter changes', () => {
    expect(editDistance('kitten', 'sitting')).toBe(3);
    expect(editDistance('same', 'same')).toBe(0);
    expect(editDistance('', 'abc')).toBe(3);
  });

  it('forgives a typo', () => {
    expect(closest('gradiant-decent', chapters)[0]).toBe('gradient-descent');
    expect(closest('naive-bayse', chapters)[0]).toBe('naive-bayes');
  });

  it('matches part of an address and shared words', () => {
    expect(closest('regression', chapters)).toEqual(expect.arrayContaining(['linear-regression', 'logistic-regression']));
    expect(closest('nearest-neighbors', chapters)[0]).toBe('nearest-neighbours');
    expect(closest('linear_regression.html', chapters)[0]).toBe('linear-regression');
  });

  it('offers nothing when nothing is close', () => {
    expect(closest('wp-admin', chapters)).toEqual([]);
    expect(closest('x', chapters)).toEqual([]);
  });
});
