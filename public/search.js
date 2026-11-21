// Search for the book. Wires up every [data-search] block on the page.
// Not bundled, because the index and its loader (dist/pagefind/) only exist
// after the build has finished.

let pagefindPromise;
function loadPagefind() {
  pagefindPromise ??= import('/pagefind/pagefind.js').then(async (pagefind) => {
    await pagefind.options({ excerptLength: 28 });
    pagefind.init();
    return pagefind;
  });
  return pagefindPromise;
}

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

// Pagefind excerpts are escaped text with <mark> around the matches, so they are safe to insert.
const excerpt = (html) => {
  const p = el('p', 'mt-1 text-[15px] leading-relaxed text-stone-600');
  p.innerHTML = html;
  return p;
};

function setUp(root) {
  const box = root.querySelector('input[type="search"]');
  const status = root.querySelector('[data-search-status]');
  const list = root.querySelector('[data-search-results]');
  const syncUrl = root.hasAttribute('data-sync-url');
  root.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    // Enter opens the first result.
    list.querySelector('a')?.click();
  });

  let latest = 0;
  async function run(query) {
    const ticket = ++latest;
    const q = query.trim();
    if (syncUrl) history.replaceState(null, '', q ? `?q=${encodeURIComponent(q)}` : location.pathname);
    if (!q) {
      list.replaceChildren();
      status.textContent = '';
      return;
    }
    let pagefind;
    try {
      pagefind = await loadPagefind();
    } catch {
      status.textContent = 'The search index is only available on the built site (npm run build, then npm run preview).';
      return;
    }
    const found = await pagefind.debouncedSearch(q, {}, 150);
    if (found === null || ticket !== latest) return; // a newer keystroke took over
    const pages = await Promise.all(found.results.slice(0, 12).map((r) => r.data()));
    if (ticket !== latest) return;

    status.textContent =
      found.results.length === 0
        ? `Nothing found for “${q}”.`
        : `${found.results.length} ${found.results.length === 1 ? 'page mentions' : 'pages mention'} “${q}”.`;

    list.replaceChildren(
      ...pages.map((page) => {
        const item = el('li', 'border-b border-stone-100 pb-6');
        if (page.meta.kind) item.append(el('div', 'micro-label mb-1 text-orange-600', page.meta.kind));
        const title = el('a', 'display text-xl underline decoration-orange-300 decoration-2 underline-offset-4 hover:text-orange-700', page.meta.title);
        title.href = page.url;
        item.append(title);

        // Sections of the page that match, each with its own link.
        const sections = page.sub_results.filter((s) => s.url !== page.url).slice(0, 3);
        if (sections.length === 0) item.append(excerpt(page.excerpt));
        for (const section of sections) {
          const row = el('div', 'mt-3 border-l-2 border-stone-200 pl-4');
          const link = el('a', 'font-sans text-sm font-semibold text-stone-800 hover:text-orange-700', section.title);
          link.href = section.url;
          row.append(link, excerpt(section.excerpt));
          item.append(row);
        }
        return item;
      }),
    );
  }

  box.addEventListener('input', () => run(box.value));
  if (syncUrl) {
    const initial = new URLSearchParams(location.search).get('q');
    if (initial) {
      box.value = initial;
      run(initial);
    }
    box.focus();
  }
}

document.querySelectorAll('[data-search]').forEach(setUp);
