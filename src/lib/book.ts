import { getCollection, type CollectionEntry } from 'astro:content';

export type Lecture = CollectionEntry<'lectures'>;
export type Part = CollectionEntry<'parts'>;

export const SITE_NAME = 'The Book of Machine Learning';

/** Every chapter in book order. */
export async function getLectures(): Promise<Lecture[]> {
  const all = await getCollection('lectures');
  return all.sort((a, b) => a.data.order - b.data.order);
}

/** Chapters that are published and have a page. */
export async function getReadyLectures(): Promise<Lecture[]> {
  return (await getLectures()).filter((l) => l.data.status === 'ready');
}

export async function getParts(): Promise<Part[]> {
  const all = await getCollection('parts');
  return all.sort((a, b) => a.data.order - b.data.order);
}

/** Toolkit chapters are "0.1"; show them as "T1" in tight spaces. */
export function chapterLabel(number: string): string {
  return number.includes('.') ? `Toolkit ${number}` : `Chapter ${number}`;
}

export function chapterUrl(lecture: Lecture): string {
  return `/${lecture.id}/`;
}

/** "Chapter 8: Nearest Neighbours" or "Toolkit 0.1: Vectors and Matrices". */
export function chapterName(lecture: Lecture): string {
  return `${chapterLabel(lecture.data.number)}: ${lecture.data.title}`;
}

let homes: Promise<Map<string, Lecture>> | undefined;

/**
 * Where each glossary term is introduced: the first published chapter, in
 * book order, that wraps it in <Term>. Read from the chapter sources, so it
 * never has to be kept up to date by hand.
 */
export function termHomes(): Promise<Map<string, Lecture>> {
  homes ??= getReadyLectures().then((lectures) => {
    const map = new Map<string, Lecture>();
    for (const lecture of lectures) {
      for (const [, id] of (lecture.body ?? '').matchAll(/<Term\s+id="([^"]+)"/g)) {
        if (!map.has(id)) map.set(id, lecture);
      }
    }
    return map;
  });
  return homes;
}
