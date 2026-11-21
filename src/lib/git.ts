/**
 * Build-time facts read from the repository's history.
 * Only runs while the site is being built, never in the browser.
 */
import { execFileSync } from 'node:child_process';

const cache = new Map<string, string | undefined>();

/**
 * The date of the last commit that touched a file, as "2026-11-21".
 * Undefined if git is unavailable or the file has never been committed.
 * (The deploy workflow fetches the full history so that these dates are real.)
 */
export function lastChanged(filePath: string): string | undefined {
  if (!cache.has(filePath)) {
    let date: string | undefined;
    try {
      date = execFileSync('git', ['log', '-1', '--format=%cs', '--', filePath], { encoding: 'utf8' }).trim() || undefined;
    } catch {
      date = undefined;
    }
    cache.set(filePath, date);
  }
  return cache.get(filePath);
}

/** "2026-11-21" as "21 November 2026". */
export function longDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}
