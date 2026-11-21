/**
 * Behaviour of a chapter page: progress, the section list, links to
 * sections and figures, exercise ticks, formula helpers and printing.
 */
import { loadProgress, markRead, noteOpened, noteSection, setExerciseDone } from '@/lib/progress';
import { copy, toast } from './site';

const article = document.querySelector<HTMLElement>('article[data-chapter-id]');
if (article) {
  const { chapterId = '', chapterTitle = '', chapterLabel = '' } = article.dataset;
  const progress = loadProgress();
  noteOpened(chapterId, chapterTitle, chapterLabel);

  // ---- Read, and how far ------------------------------------------------------

  // The chapter counts as read once its last lines have been on screen.
  const end = document.getElementById('chapter-end');
  if (end) {
    const seen = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        if (!progress.read[chapterId]) toast('Chapter finished ✓');
        markRead(chapterId);
        seen.disconnect();
      }
    });
    seen.observe(end);
  }

  const bar = document.getElementById('reading-bar');
  const lists = [...document.querySelectorAll<HTMLElement>('[data-section-list]')];
  const firstList = lists[0];
  const targets = firstList
    ? [...firstList.querySelectorAll<HTMLAnchorElement>('a')].map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1))))
    : [];

  let queued = false;
  const update = () => {
    queued = false;
    const box = article.getBoundingClientRect();
    const done = Math.min(1, Math.max(0, -box.top / Math.max(1, box.height - window.innerHeight)));
    if (bar) bar.style.transform = `scaleX(${done})`;
    // The current section is the last heading that has passed the top third of the window.
    let current = -1;
    targets.forEach((h, i) => {
      if (h && h.getBoundingClientRect().top < window.innerHeight / 3) current = i;
    });
    for (const list of lists) {
      list.querySelectorAll('a').forEach((a, i) => (i === current ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
    }
    noteSection(chapterId, current >= 0 ? targets[current]?.id : undefined);
  };
  const onScroll = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(update);
    }
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  update();

  // ---- Chapters the reader was asked to read first ------------------------------

  const unread = [...document.querySelectorAll<HTMLAnchorElement>('a[data-prerequisite]')].filter((a) => !progress.read[a.dataset.prerequisite ?? '']);
  const note = document.getElementById('prerequisite-note');
  // Only worth saying to someone who is tracking progress at all.
  if (note && unread.length > 0 && Object.keys(progress.read).length > 0) {
    note.textContent = unread.length === 1 ? 'You have not finished that one yet.' : `You have not finished ${unread.length} of these yet.`;
    note.hidden = false;
  }

  // ---- A link to every section and figure ----------------------------------------

  const linkButton = (id: string, what: string): HTMLButtonElement => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'anchor-link';
    button.textContent = '#';
    button.title = `Copy a link to this ${what}`;
    button.setAttribute('aria-label', button.title);
    button.addEventListener('click', () => {
      const url = `${location.origin}${location.pathname}#${id}`;
      history.replaceState(null, '', `#${id}`);
      void copy(url, 'Link copied');
    });
    return button;
  };
  article.querySelectorAll<HTMLElement>('h2[id]').forEach((h) => h.append(linkButton(h.id, 'section')));
  article.querySelectorAll<HTMLElement>('figure.book-figure').forEach((figure, i) => {
    figure.id ||= `figure-${i + 1}`;
    figure.querySelector('[data-anchor-slot]')?.append(linkButton(figure.id, 'figure'));
  });
  // Ids added just now are not known to the browser when it first looks for the address's target.
  if (location.hash.startsWith('#figure-')) document.getElementById(location.hash.slice(1))?.scrollIntoView();

  // ---- Code: a copy button on every block ------------------------------------------

  for (const pre of article.querySelectorAll('pre')) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'copy-code';
    button.textContent = 'Copy';
    button.addEventListener('click', () => void copy(pre.querySelector('code')?.textContent ?? '', 'Code copied'));
    const frame = document.createElement('div');
    frame.className = 'code-frame';
    pre.replaceWith(frame);
    frame.append(pre, button);
  }

  // ---- Formulas: copy as LaTeX, and symbols that explain themselves ----------------

  article.querySelectorAll<HTMLElement>('.katex-display').forEach((display) => {
    const tex = display.querySelector('annotation[encoding="application/x-tex"]')?.textContent;
    if (!tex) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'copy-tex';
    button.textContent = 'Copy LaTeX';
    button.addEventListener('click', () => void copy(tex.trim(), 'LaTeX copied'));
    display.append(button);
  });

  const notation = JSON.parse(document.getElementById('notation-data')?.textContent ?? '{}') as Record<string, string>;
  const tip = document.getElementById('symbol-tip');
  if (tip) {
    article.querySelectorAll<HTMLElement>('.katex-html .mord, .katex-html .mop').forEach((el) => {
      if (el.children.length > 0) return; // only single symbols, not groups
      const meaning = notation[el.textContent ?? ''];
      if (!meaning) return;
      el.classList.add('has-meaning');
      el.tabIndex = 0;
      el.setAttribute('aria-label', `${el.textContent}: ${meaning}`);
      const show = () => {
        tip.textContent = meaning;
        tip.hidden = false;
        const at = el.getBoundingClientRect();
        const width = tip.offsetWidth;
        tip.style.left = `${Math.max(8, Math.min(window.innerWidth - width - 8, at.left + at.width / 2 - width / 2))}px`;
        tip.style.top = `${at.top - tip.offsetHeight - 8}px`;
      };
      const hide = () => (tip.hidden = true);
      el.addEventListener('pointerenter', show);
      el.addEventListener('pointerleave', hide);
      el.addEventListener('focus', show);
      el.addEventListener('blur', hide);
    });
    addEventListener('scroll', () => (tip.hidden = true), { passive: true });
  }

  // ---- Exercises: tick them off ------------------------------------------------------

  const exercises = [...article.querySelectorAll<HTMLElement>('.exercise')];
  const tally = document.getElementById('exercise-tally');
  const showTally = (done: number[]) => {
    if (tally) tally.textContent = done.length > 0 ? `${done.length} of ${exercises.length} done` : '';
  };
  const doneAlready = progress.exercises[chapterId] ?? [];
  exercises.forEach((exercise, i) => {
    const number = i + 1;
    const label = document.createElement('label');
    label.className = 'exercise-done';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = doneAlready.includes(number);
    exercise.classList.toggle('is-done', box.checked);
    box.addEventListener('change', () => {
      exercise.classList.toggle('is-done', box.checked);
      showTally(setExerciseDone(chapterId, number, box.checked));
    });
    label.append(box, ' Done');
    exercise.querySelector('.exercise-head')?.append(label);
  });
  showTally(doneAlready);

  // ---- Figures: fill the screen ---------------------------------------------------------

  article.querySelectorAll<HTMLElement>('figure.book-figure').forEach((figure) => {
    const button = figure.querySelector<HTMLButtonElement>('[data-figure-expand]');
    if (!button) return;
    const set = (on: boolean) => {
      figure.classList.toggle('is-expanded', on);
      document.documentElement.classList.toggle('has-expanded-figure', on);
      const icon = button.querySelector('[data-icon]');
      const label = button.querySelector('[data-label]');
      if (icon) icon.textContent = on ? '✕' : '⤢';
      if (label) label.textContent = on ? 'Close' : 'Expand';
      button.setAttribute('aria-label', on ? 'Close the expanded figure' : 'Expand this figure to fill the screen');
      button.setAttribute('aria-pressed', String(on));
    };
    button.hidden = false;
    button.addEventListener('click', () => set(!figure.classList.contains('is-expanded')));
    figure.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && figure.classList.contains('is-expanded')) set(false);
    });
  });

  // ---- Printing: show what is folded away -------------------------------------------------

  let opened: HTMLDetailsElement[] = [];
  addEventListener('beforeprint', () => {
    opened = [...article.querySelectorAll<HTMLDetailsElement>('details:not([open])')];
    opened.forEach((d) => (d.open = true));
  });
  addEventListener('afterprint', () => {
    opened.forEach((d) => (d.open = false));
    opened = [];
  });
}
