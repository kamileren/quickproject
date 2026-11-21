import { describe, expect, it } from 'vitest';
import {
  addReadingTime,
  chapterIdFromPath,
  clearProgress,
  loadProgress,
  markRead,
  noteFirstTry,
  noteOpened,
  noteSection,
  paced,
  readerPace,
  resolveMissed,
  saveAnswer,
  savedAnswer,
  setExerciseDone,
  type Store,
} from './progress';

function memoryStore(): Store & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

describe('reading progress', () => {
  it('starts empty', () => {
    expect(loadProgress(memoryStore())).toEqual({ read: {}, last: undefined, answers: {}, exercises: {}, missed: {}, seconds: {}, pace: {} });
  });

  it('remembers the open chapter and finished chapters', () => {
    const store = memoryStore();
    noteOpened('gradient-descent', 'Gradient Descent', 'Chapter 3', store);
    markRead('linear-regression', 1000, store);
    markRead('linear-regression', 2000, store); // the first time is kept
    const progress = loadProgress(store);
    expect(progress.last).toMatchObject({ id: 'gradient-descent', title: 'Gradient Descent', label: 'Chapter 3' });
    expect(progress.read).toEqual({ 'linear-regression': 1000 });
  });

  it('remembers checkpoint answers per chapter and question', () => {
    const store = memoryStore();
    saveAnswer('knn', 'Where is the effort?', 1, store);
    saveAnswer('knn', 'Where is the effort?', 2, store);
    expect(savedAnswer('knn', 'Where is the effort?', store)).toBe(2);
    expect(savedAnswer('knn', 'Another question', store)).toBeNull();
    expect(savedAnswer('svm', 'Where is the effort?', store)).toBeNull();
  });

  it('remembers the section reached, and keeps it when the same chapter is reopened', () => {
    const store = memoryStore();
    noteOpened('knn', 'Nearest Neighbours', 'Chapter 8', store);
    noteSection('knn', 'choosing-k', 'Choosing k', 0.42, store);
    noteSection('svm', 'ignored', 'Ignored', 0.9, store); // not the open chapter
    noteOpened('knn', 'Nearest Neighbours', 'Chapter 8', store);
    expect(loadProgress(store).last).toMatchObject({ section: 'choosing-k', sectionTitle: 'Choosing k', fraction: 0.42 });
    noteOpened('svm', 'Support Vector Machines', 'Chapter 10', store);
    expect(loadProgress(store).last?.section).toBeUndefined();
  });

  it('ticks and unticks exercises', () => {
    const store = memoryStore();
    setExerciseDone('knn', 3, true, store);
    setExerciseDone('knn', 1, true, store);
    expect(setExerciseDone('knn', 1, true, store)).toEqual([1, 3]);
    expect(setExerciseDone('knn', 3, false, store)).toEqual([1]);
  });

  it('keeps a checkpoint for review only when the first answer was wrong', () => {
    const store = memoryStore();
    const entry = (question: string) => ({ chapter: 'knn', chapterTitle: 'Nearest Neighbours', question, options: [{ text: 'a', why: 'no' }, { text: 'b', correct: true, why: 'yes' }] });
    noteFirstTry(entry('one'), false, store);
    saveAnswer('knn', 'one', 0, store);
    noteFirstTry(entry('two'), true, store);
    saveAnswer('knn', 'two', 1, store);
    noteFirstTry(entry('two'), false, store); // a later wrong click does not count
    expect(Object.keys(loadProgress(store).missed)).toEqual(['knn|one']);
    resolveMissed('knn|one', store);
    expect(loadProgress(store).missed['knn|one'].resolved).toBe(true);
  });

  it('learns the reader\'s pace from the chapters they finish', () => {
    const store = memoryStore();
    expect(readerPace(loadProgress(store))).toBe(1);

    // A 10-minute chapter read in 15 minutes: pace 1.5.
    addReadingTime('a', 15 * 60, store);
    markRead('a', 1, store, 10);
    expect(loadProgress(store).pace).toEqual({ a: 1.5 });
    // One chapter is not enough to judge by.
    expect(readerPace(loadProgress(store))).toBe(1);

    // A 20-minute chapter read in 22 minutes: pace 1.1. The middle of 1.1 and 1.5 is 1.3.
    addReadingTime('b', 22 * 60, store);
    markRead('b', 2, store, 20);
    expect(readerPace(loadProgress(store))).toBeCloseTo(1.3);
    expect(paced(20, readerPace(loadProgress(store)))).toBe(26);

    // Skimming to the end is not counted, and time stops adding up once a chapter is finished.
    addReadingTime('c', 60, store);
    markRead('c', 3, store, 20);
    addReadingTime('a', 999, store);
    const progress = loadProgress(store);
    expect(Object.keys(progress.pace)).toEqual(['a', 'b']);
    expect(progress.seconds.a).toBe(900);
  });

  it('keeps the pace within sensible bounds', () => {
    const progress = { ...loadProgress(memoryStore()), pace: { a: 9, b: 8, c: 7 } };
    expect(readerPace(progress)).toBe(2.5);
    expect(readerPace({ ...progress, pace: { a: 0.1, b: 0.2 } })).toBe(0.5);
  });

  it('clears everything', () => {
    const store = memoryStore();
    markRead('a', 1, store);
    clearProgress(store);
    expect(loadProgress(store).read).toEqual({});
  });

  it('survives broken or missing storage', () => {
    const store = memoryStore();
    store.data.set('book-of-ml:progress:v1', '{not json');
    expect(loadProgress(store).read).toEqual({});
    const broken: Store = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    };
    expect(() => markRead('a', 1, broken)).not.toThrow();
    expect(() => clearProgress(broken)).not.toThrow();
    expect(savedAnswer('a', 'q', broken)).toBeNull();
  });

  it('reads the chapter id from a page address', () => {
    expect(chapterIdFromPath('/gradient-descent/')).toBe('gradient-descent');
  });
});
