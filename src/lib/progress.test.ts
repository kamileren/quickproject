import { describe, expect, it } from 'vitest';
import {
  chapterIdFromPath,
  clearProgress,
  loadProgress,
  markRead,
  noteFirstTry,
  noteOpened,
  noteSection,
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
    expect(loadProgress(memoryStore())).toEqual({ read: {}, last: undefined, answers: {}, exercises: {}, missed: {} });
  });

  it('remembers the open chapter and finished chapters', () => {
    const store = memoryStore();
    noteOpened('gradient-descent', 'Gradient Descent', 'Chapter 3', store);
    markRead('linear-regression', 1000, store);
    markRead('linear-regression', 2000, store); // the first time is kept
    const progress = loadProgress(store);
    expect(progress.last).toEqual({ id: 'gradient-descent', title: 'Gradient Descent', label: 'Chapter 3', section: undefined });
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
    noteSection('knn', 'choosing-k', store);
    noteSection('svm', 'ignored', store); // not the open chapter
    noteOpened('knn', 'Nearest Neighbours', 'Chapter 8', store);
    expect(loadProgress(store).last?.section).toBe('choosing-k');
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
