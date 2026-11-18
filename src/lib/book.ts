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
