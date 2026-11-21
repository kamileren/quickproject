# The Book of Machine Learning

A free, interactive machine learning textbook, published at [thebookofml.com](https://thebookofml.com).
Static site built with Astro, MDX and React islands. The full plan and progress are in [PLAN.md](PLAN.md).

## Commands

| Command | What it does |
|---|---|
| `npm install` | Install dependencies (Node 22) |
| `npm run dev` | Local dev server |
| `npm run check` | Lint, type check, unit tests, content rules, production build |
| `npm run preview` | Serve the production build |

`/kit/` on the dev server shows every building block of a chapter on one page.

## Where things live

| Path | Contents |
|---|---|
| `src/content/lectures/` | One MDX file per chapter. `status: draft` chapters show as "Soon" and have no page. |
| `src/content/glossary.yaml` | Every term, defined once. Used by `<Term id="...">`. |
| `src/content/notation.yaml` | Every symbol, with one meaning. Used by `<Symbol id="..." />`. |
| `src/content/parts.yaml` | Parts of the book and their order. |
| `src/data/` | The shared datasets. |
| `src/lib/` | The maths, unit tested. Figures only show numbers computed here. |
| `src/components/prose/`, `popins/` | Blocks available in every chapter without an import. |
| `src/components/figures/core/` | Plot frame, marks, drag handles, sliders, step controls. |
| `src/components/figures/chNN/` | The figures of one chapter. |

## Writing a chapter

1. Open the chapter's stub in `src/content/lectures/` and fill in the frontmatter (`question`, `minutes`, `prerequisites`).
2. Add its terms to `glossary.yaml`.
3. Put any new maths in `src/lib/` with tests, then build figures from `figures/core` and that maths.
4. Write four to seven `##` sections. Each one: a question, an example, the idea, the maths, something to try.
5. Add one `<Pitfall title="...">` (a mistake people really make) before the "In code" section.
6. End with, in this order: `<KeyTakeaways>`, `<NowYouCan>` (skills, each starting with a verb), `<Exercises>`
   holding three to five `<Exercise kind="by hand | with the figure | in code | think">` blocks each ending in an
   optional one-line `<Hint>` and a `<Solution>`, an optional `<GoingFurther>`, `<References>`, and a `<NextUp>` paragraph that leads into the
   next chapter.
7. Set `status: ready`, run `npm run og` to draw the chapter's share picture, then `npm run check`.

Other blocks worth knowing:

- `<Ref to="gradient-descent">the last chapter</Ref>` mentions another chapter with a pop-in recap and a link.
  If that chapter is still a draft the words show as plain text, so it is safe to point forward.
- `<Checkpoint predict ...>` placed just before a figure asks the reader to guess what the figure will show.
- `<CodeFile file="ch17_backprop.py" />` links a companion file in `code/` to GitHub and Colab. After editing a
  file in `code/`, run `npm run notebooks`.
- `dataset:` in the frontmatter must name an entry in `src/content/datasets.yaml`; the chapter header shows it.
- A term's pop-in finds the chapter that introduces it by itself. Add `seeAlso: [other-id]` in `glossary.yaml`
  to link related terms.

Every exercise answer with numbers in it must be checked by running the calculation, not by eye.

The content check enforces the limits that keep chapters readable: per section at most one `<Figure>`, one
`<Checkpoint>` and three new `<Term>`s; every figure has a `try` prompt; every term exists in the glossary and is
introduced once; every chapter has its pitfall, skills list, exercises with solutions, and closing bridge.

The site also builds a glossary (`/glossary/`), a notation table (`/notation/`), a page per part (`/parts/<id>/`)
and a search page (`/search/`, indexed by Pagefind during `npm run build`). Reading progress is stored only in
the reader's browser (`src/lib/progress.ts`).

Figures are React components and need `client:visible` in MDX:

```mdx
import DragLine from '@/components/figures/ch02/DragLine';

<Figure title="Fit the line by eye" caption="Each dot is one student." try="drag the two handles.">
  <DragLine client:visible />
</Figure>
```

## Deploying

Pushing to `master` runs `npm run check` and publishes `dist/` to GitHub Pages.

## Credits

Teaching order for the neural network chapters follows *Neural Networks from Scratch in Python* by Harrison Kinsley
and Daniel Kukieła. All text and figures here are original. Sources are listed at the end of each chapter.
