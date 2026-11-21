/**
 * Finds the entries whose keys look most like a mistyped word. Used by the
 * "page not found" page to suggest the chapter someone probably meant.
 */

/** How many single-letter changes turn one word into the other. */
export function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    previous = current;
  }
  return previous[b.length];
}

const tidy = (text: string): string => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * The best matches for `wanted`, nearest first. An entry counts as a match if
 * one contains the other, they share a whole word, or they are within a few
 * letter changes of each other.
 */
export function closest<T>(wanted: string, entries: readonly { key: string; value: T }[], limit = 3): T[] {
  const want = tidy(wanted);
  if (want.length < 3) return [];
  const words = new Set(want.split('-').filter((w) => w.length > 3));
  return entries
    .map(({ key, value }) => {
      const k = tidy(key);
      const distance = editDistance(want, k);
      const contains = k.includes(want) || want.includes(k);
      const shared = k.split('-').filter((w) => words.has(w)).length;
      const near = distance <= Math.max(2, Math.floor(Math.max(want.length, k.length) * 0.34));
      // Lower is better: containing or sharing words beats mere closeness in spelling.
      const score = distance - (contains ? 100 : 0) - shared * 20;
      return { value, score, match: contains || shared > 0 || near };
    })
    .filter((e) => e.match)
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((e) => e.value);
}
