/**
 * Reading progress, kept in the reader's own browser.
 *
 * Nothing is sent anywhere. If storage is unavailable (private windows, strict
 * settings) every function quietly does nothing and the book works as before.
 */

/** A checkpoint the reader got wrong on the first try, kept whole so it can be asked again. */
export interface Missed {
  chapter: string;
  chapterTitle: string;
  question: string;
  options: { text: string; correct?: boolean; why: string }[];
  /** Set once the reader has answered it correctly on the review page. */
  resolved?: boolean;
}

export interface Progress {
  /** Chapter id → when the reader reached its end (ms since 1970). */
  read: Record<string, number>;
  /** The chapter the reader had open most recently, and the section they had reached. */
  last?: { id: string; title: string; label: string; section?: string; sectionTitle?: string; fraction?: number };
  /** Chapter id → question text → index of the option picked. */
  answers: Record<string, Record<string, number>>;
  /** Chapter id → numbers (from 1) of the exercises ticked as done. */
  exercises: Record<string, number[]>;
  /** Checkpoints missed on the first try, by "chapter|question". */
  missed: Record<string, Missed>;
}

export interface Store {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const KEY = 'book-of-ml:progress:v1';
const empty = (): Progress => ({ read: {}, answers: {}, exercises: {}, missed: {} });

function defaultStore(): Store | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    return undefined;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

/** Turns whatever was stored into a well-formed Progress. */
function tidy(parsed: unknown): Progress {
  if (!isRecord(parsed)) return empty();
  const last = isRecord(parsed.last) && typeof parsed.last.id === 'string' ? (parsed.last as Progress['last']) : undefined;
  return {
    read: isRecord(parsed.read) ? (parsed.read as Progress['read']) : {},
    last,
    answers: isRecord(parsed.answers) ? (parsed.answers as Progress['answers']) : {},
    exercises: isRecord(parsed.exercises) ? (parsed.exercises as Progress['exercises']) : {},
    missed: isRecord(parsed.missed) ? (parsed.missed as Progress['missed']) : {},
  };
}

export function loadProgress(store: Store | undefined = defaultStore()): Progress {
  try {
    const raw = store?.getItem(KEY);
    return raw ? tidy(JSON.parse(raw)) : empty();
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
  // Coming back to the same chapter keeps the section the reader had reached.
  const kept = progress.last?.id === id ? progress.last : undefined;
  progress.last = { id, title, label, section: kept?.section, sectionTitle: kept?.sectionTitle, fraction: kept?.fraction };
  save(progress, store);
}

/** Remembers the section the reader has scrolled to in the open chapter. */
export function noteSection(
  id: string,
  section: string | undefined,
  sectionTitle?: string,
  fraction?: number,
  store: Store | undefined = defaultStore(),
): void {
  const progress = loadProgress(store);
  if (progress.last?.id !== id) return;
  // Written when the section changes, or the reader has moved a noticeable way through the chapter.
  const moved = fraction !== undefined && Math.abs(fraction - (progress.last.fraction ?? 0)) >= 0.05;
  if (progress.last.section === section && !moved) return;
  progress.last.section = section;
  progress.last.sectionTitle = sectionTitle;
  if (fraction !== undefined) progress.last.fraction = Math.round(fraction * 100) / 100;
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

/**
 * Called with the reader's first answer to a checkpoint. A wrong first answer
 * is kept for the review page; later answers to the same question are ignored.
 */
export function noteFirstTry(entry: Missed, wasCorrect: boolean, store: Store | undefined = defaultStore()): void {
  const progress = loadProgress(store);
  if (progress.answers[entry.chapter]?.[entry.question] !== undefined) return; // not the first try
  if (wasCorrect) return;
  progress.missed[`${entry.chapter}|${entry.question}`] = entry;
  save(progress, store);
}

/** Marks a missed checkpoint as answered correctly on the review page. */
export function resolveMissed(key: string, store: Store | undefined = defaultStore()): void {
  const progress = loadProgress(store);
  if (!progress.missed[key]) return;
  progress.missed[key].resolved = true;
  save(progress, store);
}

/** Ticks or unticks an exercise. Returns the exercises of that chapter now marked done. */
export function setExerciseDone(id: string, exercise: number, done: boolean, store: Store | undefined = defaultStore()): number[] {
  const progress = loadProgress(store);
  const set = new Set(progress.exercises[id] ?? []);
  if (done) set.add(exercise);
  else set.delete(exercise);
  progress.exercises[id] = [...set].sort((a, b) => a - b);
  save(progress, store);
  return progress.exercises[id];
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
