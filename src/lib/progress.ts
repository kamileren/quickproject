/**
 * Reading progress, kept in the reader's own browser.
 *
 * Nothing is sent anywhere. If storage is unavailable (private windows, strict
 * settings) every function quietly does nothing and the book works as before.
 */

export interface Progress {
  /** Chapter id → when the reader reached its end (ms since 1970). */
  read: Record<string, number>;
  /** The chapter the reader had open most recently. */
  last?: { id: string; title: string; label: string };
  /** Chapter id → question text → index of the option picked. */
  answers: Record<string, Record<string, number>>;
}

export interface Store {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const KEY = 'book-of-ml:progress:v1';
const empty = (): Progress => ({ read: {}, answers: {} });

function defaultStore(): Store | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    return undefined;
  }
}

export function loadProgress(store: Store | undefined = defaultStore()): Progress {
  try {
    const raw = store?.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return { read: parsed.read ?? {}, last: parsed.last, answers: parsed.answers ?? {} };
  } catch {
    return empty();
  }
}

function save(progress: Progress, store: Store | undefined): void {
  try {
    store?.setItem(KEY, JSON.stringify(progress));
  } catch {
    // Storage full or blocked: progress is a convenience, so carry on without it.
  }
}

/** Remembers which chapter is open, for "continue reading". */
export function noteOpened(id: string, title: string, label: string, store: Store | undefined = defaultStore()): void {
  const progress = loadProgress(store);
  progress.last = { id, title, label };
  save(progress, store);
}

/** Records that the reader reached the end of a chapter. */
export function markRead(id: string, now = Date.now(), store: Store | undefined = defaultStore()): void {
  const progress = loadProgress(store);
  if (progress.read[id]) return;
  progress.read[id] = now;
  save(progress, store);
}

export function saveAnswer(id: string, question: string, option: number, store: Store | undefined = defaultStore()): void {
  const progress = loadProgress(store);
  (progress.answers[id] ??= {})[question] = option;
  save(progress, store);
}

export function savedAnswer(id: string, question: string, store: Store | undefined = defaultStore()): number | null {
  return loadProgress(store).answers[id]?.[question] ?? null;
}

export function clearProgress(store: Store | undefined = defaultStore()): void {
  try {
    store?.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}

/** The chapter id for a page address like "/gradient-descent/". */
export const chapterIdFromPath = (pathname: string): string => pathname.replace(/^\/|\/$/g, '');
