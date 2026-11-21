/**
 * Behaviour shared by every page: the search, settings and shortcut windows,
 * keyboard shortcuts, reading preferences, and offline support.
 */
import { applyPrefs, loadPrefs, savePrefs, type Prefs } from '@/lib/prefs';

const dialog = (id: string) => document.getElementById(id) as HTMLDialogElement | null;

function open(id: string): void {
  const d = dialog(id);
  if (!d || d.open) return;
  document.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach((other) => other.close());
  d.showModal();
  // Focus goes to the search field if there is one, otherwise to the window itself
  // (not to its Close button, which would light up as if it had been chosen).
  const field = d.querySelector<HTMLInputElement>('input[type="search"]');
  if (field) field.focus();
  else {
    d.tabIndex = -1;
    d.focus();
  }
}

/** Shows a short message at the bottom of the window. */
export function toast(message: string): void {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.style.opacity = '1';
  window.clearTimeout(Number(el.dataset.timer));
  el.dataset.timer = String(window.setTimeout(() => (el.style.opacity = '0'), 1800));
}

/** Copies text, and says so. */
export async function copy(text: string, said = 'Copied'): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast(said);
  } catch {
    toast('Could not copy. Select it and press Ctrl+C.');
  }
}

// ---- Windows ----------------------------------------------------------------

document.querySelectorAll<HTMLDialogElement>('dialog.site-dialog').forEach((d) => {
  d.querySelector('[data-close]')?.addEventListener('click', () => d.close());
  // A click on the dimmed area around the window closes it.
  d.addEventListener('click', (e) => {
    // Following a link inside the window (a section, a search result) also closes it.
    if (e.target === d || (e.target as Element).closest('a:not([data-open])')) d.close();
  });
});

document.addEventListener('click', (e) => {
  const trigger = (e.target as Element).closest<HTMLElement>('[data-open]');
  if (!trigger) return;
  const id = trigger.dataset.open ?? '';
  if (!dialog(id)) return; // no such window on this page: let the link work normally
  e.preventDefault();
  open(id);
});

// ---- Preferences ------------------------------------------------------------

let prefs: Prefs = loadPrefs();

function showPrefs(): void {
  document.querySelectorAll<HTMLElement>('[data-pref]').forEach((group) => {
    const current = prefs[group.dataset.pref as keyof Prefs];
    group.querySelectorAll<HTMLElement>('[data-value]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === current)));
  });
}

document.querySelectorAll<HTMLElement>('[data-pref] [data-value]').forEach((button) => {
  button.addEventListener('click', () => {
    const key = button.closest<HTMLElement>('[data-pref]')?.dataset.pref as keyof Prefs;
    prefs = { ...prefs, [key]: button.dataset.value };
    savePrefs(prefs);
    applyPrefs(prefs);
    showPrefs();
  });
});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyPrefs(prefs));
showPrefs();

// ---- Keyboard shortcuts -----------------------------------------------------

/** True when the key press belongs to something the reader is typing in or steering. */
function busy(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('input, textarea, select, [contenteditable], [role="slider"], figure, dialog'));
}

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey || busy(e.target)) return;
  const go = (selector: string) => {
    const link = document.querySelector<HTMLAnchorElement>(selector);
    if (link) location.href = link.href;
  };
  switch (e.key) {
    case '/':
      e.preventDefault();
      if (dialog('search-window')) open('search-window');
      else document.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
      break;
    case '?':
      open('shortcuts-window');
      break;
    case 't':
      open('settings-window');
      break;
    case 'g':
      location.href = '/glossary/';
      break;
    case 'c':
      location.href = '/#contents';
      break;
    case 'e':
      document.getElementById('exercises')?.scrollIntoView();
      break;
    case 'ArrowLeft':
      go('a[rel="prev"]');
      break;
    case 'ArrowRight':
      go('a[rel="next"]');
      break;
  }
});

// ---- The top bar ------------------------------------------------------------

// On a phone the bar slides away while the reader scrolls down and returns as
// soon as they scroll up, so it never takes space from the text.
const siteBar = document.getElementById('site-bar');
if (siteBar) {
  let lastY = window.scrollY;
  addEventListener(
    'scroll',
    () => {
      const y = window.scrollY;
      const goingDown = y > lastY + 4;
      const goingUp = y < lastY - 4;
      const away = goingDown && y > 240 ? true : goingUp || y <= 240 ? false : undefined;
      if (away !== undefined) {
        siteBar.classList.toggle('is-away', away);
        // On a chapter the bottom bar goes with it, so the text has the whole screen.
        document.getElementById('mobile-tabs')?.classList.toggle('is-away', away);
      }
      if (goingDown || goingUp) lastY = y;
    },
    { passive: true },
  );
  // Anything that takes focus inside the bar brings it back.
  siteBar.addEventListener('focusin', () => siteBar.classList.remove('is-away'));
  // So does reaching the end of the page, where the next step is in the bottom bar.
  addEventListener(
    'scroll',
    () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 80) {
        siteBar.classList.remove('is-away');
        document.getElementById('mobile-tabs')?.classList.remove('is-away');
      }
    },
    { passive: true },
  );
}

// ---- Offline ----------------------------------------------------------------

// Pages the reader has opened stay readable without a connection.
if ('serviceWorker' in navigator && location.hostname !== 'localhost') {
  addEventListener('load', () => void navigator.serviceWorker.register('/sw.js').catch(() => undefined));
}
