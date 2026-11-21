import { describe, expect, it } from 'vitest';
import { chapterIdFromPath, clearProgress, loadProgress, markRead, noteOpened, saveAnswer, savedAnswer, type Store } from './progress';

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
    expect(loadProgress(memoryStore())).toEqual({ read: {}, last: undefined, answers: {} });
  });

  it('remembers the open chapter and finished chapters', () => {
    const store = memoryStore();
    noteOpened('gradient-descent', 'Gradient Descent', 'Chapter 3', store);
    markRead('linear-regression', 1000, store);
    markRead('linear-regression', 2000, store); // the first time is kept
    const progress = loadProgress(store);
    expect(progress.last).toEqual({ id: 'gradient-descent', title: 'Gradient Descent', label: 'Chapter 3' });
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
