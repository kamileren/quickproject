/**
 * Behaviour of a chapter page: progress, the section list, links to
 * sections and figures, exercise ticks, formula helpers and printing.
 */
import { addReadingTime, loadProgress, markRead, noteOpened, noteSection, paced, readerPace, setExerciseDone } from '@/lib/progress';
import { copy, toast } from './site';

const article = document.querySelector<HTMLElement>('article[data-chapter-id]');
if (article) {
  const { chapterId = '', chapterTitle = '', chapterLabel = '' } = article.dataset;
  const estimate = Number(article.dataset.chapterMinutes ?? 0);
  const progress = loadProgress();
  noteOpened(chapterId, chapterTitle, chapterLabel);

  // ---- Read, and how far ------------------------------------------------------

  // The chapter counts as read once its last lines have been on screen.
  const end = document.getElementById('chapter-end');
  if (end) {
    const seen = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        if (!progress.read[chapterId]) toast('Chapter finished ✓');
        markRead(chapterId, Date.now(), undefined, estimate || undefined);
        seen.disconnect();
        showSummary();
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
    const heading = current >= 0 ? targets[current] : null;
    // The heading's own words, without the "#" link button added to it.
    const headingText = heading ? [...heading.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent).join('').trim() : undefined;
    noteSection(chapterId, heading?.id, headingText || undefined, done);
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

  // ---- Time spent, and reading time at this reader's pace --------------------------

  // Time counts while the page is in view and the reader has done something in the last minute.
  let lastActive = Date.now();
  let unsaved = 0;
  for (const event of ['scroll', 'pointerdown', 'pointermove', 'keydown'] as const) {
    addEventListener(event, () => (lastActive = Date.now()), { passive: true });
  }
  const TICK = 5;
  if (!progress.read[chapterId]) {
    setInterval(() => {
      if (document.visibilityState !== 'visible' || Date.now() - lastActive > 60_000) return;
      unsaved += TICK;
      if (unsaved >= 15) {
        addReadingTime(chapterId, unsaved);
        unsaved = 0;
      }
    }, TICK * 1000);
    addEventListener('pagehide', () => unsaved > 0 && addReadingTime(chapterId, unsaved));
  }

  const pace = readerPace(progress);
  const timeLabel = document.getElementById('reading-time');
  if (timeLabel && estimate > 0 && Math.abs(pace - 1) >= 0.15) {
    timeLabel.textContent = `about ${paced(estimate, pace)} min at your pace`;
    timeLabel.title = `Estimated at ${estimate} min. Adjusted from the chapters you have finished.`;
  }

  // ---- What the reader did in this chapter -------------------------------------------

  function showSummary(): void {
    const box = document.getElementById('chapter-summary');
    if (!box) return;
    const now = loadProgress();
    const totalExercises = article!.querySelectorAll('.exercise').length;
    const doneExercises = (now.exercises[chapterId] ?? []).length;
    const totalCheckpoints = article!.querySelectorAll('astro-island[component-url*="CheckpointIsland"]').length;
    const answered = Object.keys(now.answers[chapterId] ?? {}).length;
    const missedHere = Object.values(now.missed).filter((m) => m.chapter === chapterId && !m.resolved).length;

    const el = (tag: string, className: string, text?: string) => {
      const node = document.createElement(tag);
      node.className = className;
      if (text !== undefined) node.textContent = text;
      return node;
    };
    const link = (text: string, href: string) => {
      const a = el('a', 'font-semibold text-orange-700 underline decoration-orange-300 decoration-2 underline-offset-4 hover:text-orange-900', text) as HTMLAnchorElement;
      a.href = href;
      return a;
    };
    const row = (name: string, value: string, action?: HTMLAnchorElement) => {
      const line = el('div', 'flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-stone-100 py-2.5 text-sm text-stone-700');
      const left = el('span', '');
      left.append(el('span', 'micro-label mr-3 text-stone-500', name), value);
      line.append(left);
      if (action) line.append(action);
      return line;
    };

    const rows: HTMLElement[] = [];
    if (totalCheckpoints > 0) {
      const rightFirst = Math.max(0, answered - Object.values(now.missed).filter((m) => m.chapter === chapterId).length);
      rows.push(
        row(
          'Checkpoints',
          answered === 0 ? `None of the ${totalCheckpoints} answered yet` : `${answered} of ${totalCheckpoints} answered, ${rightFirst} right first time`,
          missedHere > 0 ? link(`Review ${missedHere} missed`, '/review/') : undefined,
        ),
      );
    }
    if (totalExercises > 0) {
      rows.push(
        row(
          'Exercises',
          `${doneExercises} of ${totalExercises} done`,
          doneExercises < totalExercises ? link(doneExercises === 0 ? 'Try the first one' : 'Do the rest', '#exercises') : undefined,
        ),
      );
    }
    if (rows.length === 0) return;
    const allDone = doneExercises === totalExercises && answered === totalCheckpoints;
    box.replaceChildren(
      el('div', 'micro-label mb-1 text-orange-700', 'Chapter finished'),
      el('p', 'display mb-3 text-xl', allDone ? 'Everything done. On to the next one.' : 'Before you move on'),
      ...rows,
    );
    box.hidden = false;
  }
  // Someone coming back to a finished chapter sees where they left their work.
  if (progress.read[chapterId]) showSummary();

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
      if (!document.getElementById('chapter-summary')?.hidden) showSummary();
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
