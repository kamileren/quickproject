# The Book of Machine Learning: rebuild plan

Working plan for rebuilding this site as a full interactive textbook. Tick steps off as they are finished.

## Rules

- Work on the local branch `rebuild`. One commit per step or chapter.
- Do not push and do not merge to `master` without the owner's approval; `master` deploys the live site at thebookofml.com.
- Write original prose and draw original figures. Never copy text or images from the reference PDFs or the online sources. Credit sources in each chapter's "References" list.
- Code adapted from *Neural Networks from Scratch* is MIT licensed: keep its copyright notice in `code/LICENSE-NNFS`.
- `LectureReference/` stays out of git.
- Keep the existing look (see "Style").
- After every step: lint, type check, tests, build. Fix failures before moving on.

## Why the rebuild

The current site is a Vite SPA with one lecture. Known faults: no real URLs (state-based navigation), the prerendered lecture page is replaced by the welcome page on load, wrong sitemap and canonical tags, missing favicon, 38 lint problems, four figures that show wrong or made-up numbers, inconsistent numbering and notation, hover-only tooltips, margin notes hidden on most screens.

## Stack

| Concern | Choice |
|---|---|
| Framework | Astro (static output, GitHub Pages) |
| Lectures | MDX in a content collection with typed frontmatter |
| Interactive pieces | React islands, hydrated when visible |
| Styling | Tailwind 4 with theme tokens |
| Math | KaTeX at build time (`remark-math`, `rehype-katex`) |
| Pop-ins | Radix Popover |
| Plots | Hand-written SVG on a shared `Plot` frame, `d3-scale` |
| Code samples | Shiki (built into Astro), static |
| Quality | TypeScript, `astro check`, ESLint, Vitest |
| Search | Pagefind (wave 5) |

Use current stable versions at install time and check the docs for anything that has changed.

## Style

White page, stone greys, orange-600 accent, Georgia serif headings, mono uppercase micro-labels with wide tracking, left-ruled definitions, black-bordered figure boxes with "Figure N.M" and a caption, dark "Key Takeaways" block. Capture these as Tailwind theme tokens; the home page must match the current one side by side.

## Layout

```
src/
  content/
    parts.yaml
    lectures/NN-slug.mdx      # frontmatter: title, part, order, summary, status, prerequisites, dataset
    glossary.yaml             # one definition per term
    notation.yaml             # one meaning per symbol
  data/                       # shared datasets
  lib/                        # linear, optimize, metrics, classify, trees, nn, cluster (all tested)
  components/
    prose/                    # Definition, Equation, Example, Figure, MarginNote, KeyTakeaways, GoingFurther
    popins/                   # Term, Symbol, Checkpoint, Derivation
    figures/core/             # Plot, Axis, Draggable, Slider, StepControls, LossCurve, BoundaryCanvas
    figures/chNN/             # one file per figure
  layouts/                    # BaseLayout (SEO head), LectureLayout (header, section nav, prev/next)
  pages/                      # index.astro, [slug].astro, 404.astro, kit.astro (noindex)
code/                         # companion NumPy code for Part IV
```

Section numbers, figure numbers, the table of contents and prev/next links are generated, never typed. Chapters with `status: draft` show as "coming soon". The existing URL `/linear-regression/` must keep working.

## Chapter template

1. Opening: the question, the dataset, what the reader will be able to do.
2. Four to six sections, each: question, example, idea, math, try it.
3. In code: about 15 lines of Python.
4. Key takeaways: five lines at most.
5. Going further: collapsed.
6. References.

Limits per section: one figure, one checkpoint, three new terms, one displayed equation before an example appears. Target 15 to 20 minutes of reading per chapter.

## Pop-ins

| Pop-in | Use | Behaviour |
|---|---|---|
| `Term` | Jargon on first use only | Popover from the glossary; hover, focus or tap |
| `Symbol` | A symbol in an equation | Popover from the notation file |
| `MarginNote` | A side remark | Margin on wide screens, inline callout on small ones |
| `Derivation` | Steps most readers can skip | Collapsed "show the steps" |
| `Checkpoint` | One question per section | Pick an answer, get a one-line explanation |
| `Figure` | The interactive | Framed, numbered, caption says what to try |

## Notation

`x` input, `y` target, `ŷ` prediction, `w` weights, `b` bias, `n` examples, `d` features, `η` learning rate, `λ` penalty strength, `L` loss.

## Datasets

- Exam scores: hours studied against score (regression).
- Pass/fail: the same students (classification).
- 2D toy points: blobs, moons, rings, spiral.
- House prices: several features (synthetic, generated with a fixed seed).
- Fashion-MNIST subset (MIT licensed) for images.

## Curriculum

Sources: LR = `LectureReference/linear_regression_lecture.pdf`; NNFS = *Neural Networks from Scratch in Python*; web sources are listed per chapter at the end.

### Part 0: Toolkit (optional)

| # | Chapter | Covers | Signature interactive | Source |
|---|---|---|---|---|
| 0.1 | Vectors and matrices | Lists of numbers, dot product by loop then formula, matrix times vector, shapes | Drag two vectors; dot product and projection update | NNFS 2 |
| 0.2 | Derivatives and gradients | Slope by nudging, derivative, partial derivatives, chain rule | Slide along a curve; tangent and slope update | NNFS 7, 8 |
| 0.3 | Probability | Random variables, mean and variance, normal curve, conditional probability, Bayes' rule | Draw samples; the histogram settles | web |

### Part I: Learning from data

| # | Chapter | Covers | Signature interactive | Source |
|---|---|---|---|---|
| 1 | What is learning? | Features, labels, numbers versus categories, with and without labels | Guess a rule from examples, test it on new ones | LR §3–4, NNFS 1 |
| 2 | Linear regression | Line model, residuals, squared loss, exact solution, several features, RMSE and R² | Drag the line by hand on the exam data | LR §5–9, 14 |
| 3 | Gradient descent | Why random guessing stalls, following the slope, learning rate, mini-batches | Loss surface with the path; a step size that can diverge | LR §9, NNFS 6, 10 |
| 4 | Generalization | Overfitting, train/validation/test, cross-validation, bias and variance | Polynomial degree slider with train and test error | NNFS 11–13 |
| 5 | Regularization | Ridge, lasso, elastic net, choosing λ | Weights shrinking on the real fit as λ grows | LR §13, NNFS 14 |

### Part II: Classification

| # | Chapter | Covers | Signature interactive | Source |
|---|---|---|---|---|
| 6 | Logistic regression | Sigmoid, probability output, log loss, decision boundary | Pass/fail curve; drag the boundary | NNFS 16 |
| 7 | Measuring classifiers | Why accuracy misleads, confusion matrix, precision, recall, F1, ROC | Threshold slider moving the matrix and the ROC point | web |
| 8 | Nearest neighbours | Distance, choosing k, why scale matters, many dimensions | Click to add points; change k and regions redraw | web |
| 9 | Naive Bayes | Bayes' rule as a classifier, likelihood, independence shortcut, smoothing | Word counts tipping a spam score | web |
| 10 | Support vector machines | Margin, support vectors, soft margin, kernels | Drag points; margin and support vectors update | web |

### Part III: Trees and ensembles

| # | Chapter | Covers | Signature interactive | Source |
|---|---|---|---|---|
| 11 | Decision trees | Splitting, impurity, depth and pruning, trees for numbers | Choose a split yourself; compare with the best one | web |
| 12 | Random forests | Resampling, voting, random features, feature importance | Add trees one by one; the boundary smooths | web |
| 13 | Boosting | Weak learners, fitting the mistakes, gradient boosting, rounds versus step size | Step through rounds; residuals shrink | web |

### Part IV: Neural networks (build one network from scratch)

| # | Chapter | Covers | Signature interactive | Source |
|---|---|---|---|---|
| 14 | A single neuron | Inputs, weights, bias | Sliders on weights and bias; the output updates | NNFS 1, 2 |
| 15 | Layers and activations | Dense layers, ReLU, why straight lines are not enough | Add ReLU units one at a time to bend a line onto a curve | NNFS 3, 4 |
| 16 | Scoring a classifier | Softmax and cross-entropy | Drag the network's confidence; the loss reacts | NNFS 4, 5 |
| 17 | Backpropagation | Chain rule, one neuron then a network | Step forward and backward through a tiny graph | NNFS 7–9 |
| 18 | Optimizers | Decay, momentum, AdaGrad, RMSProp, Adam | Race them on one loss surface | NNFS 10 |
| 19 | Keeping networks honest | L1/L2 penalties, dropout | Toggle each on the spiral; the boundary smooths | NNFS 14, 15 |
| 20 | One network, many jobs | Output layers for yes/no, many classes, numbers | Swap the output layer; same network, three tasks | NNFS 16, 17 |
| 21 | A real dataset | Batches, shuffling, evaluating, saving, predicting | Pick a clothing image; see the class scores | NNFS 18–22 |
| 22 | Convolutional networks | Filters, feature maps, pooling | Slide a filter over an image | web |
| 23 | Sequences and attention | Embeddings, attention, the transformer | Hover a word; see what it attends to | web |

### Part V: Finding structure without labels

| # | Chapter | Covers | Signature interactive | Source |
|---|---|---|---|---|
| 24 | Clustering with k-means | Assign and update, choosing k, starting points, where it fails | Place centroids; step through assign and update | web |
| 25 | PCA | Variance, principal directions, projecting, rebuilding, how much is kept | Rotate an axis to find the direction of most variance | web |
| 26 | Mixture models and EM | Soft clusters, Gaussians, the two alternating steps | Soft assignments shifting each iteration | web |

### Part VI: Doing it for real

| # | Chapter | Covers | Signature interactive | Source |
|---|---|---|---|---|
| 27 | Preparing data | Scaling, encoding categories, missing values, leakage | Toggle scaling; k-NN changes its answer | NNFS 13 |
| 28 | An end-to-end project | House prices: framing, baseline, iterating, testing once | Walkthrough with real results at each stage | web |
| 29 | Where to go next | A map of what the book left out | Clickable topic map | web |

Cross-links to keep: chapter 3 opens with the random-search experiment; chapter 4 states that preprocessing is fitted on training data only; chapter 20 shows chapters 2 and 6 as one-neuron networks.

## Chapter recipe

1. Outline: MDX file with frontmatter and section headings; add glossary and notation entries.
2. Maths: library functions with tests against known answers.
3. Figures: built only from the figure core and the library, so every number shown is real.
4. Prose: opening, examples, checkpoints, code sample, takeaways, going further, references.
5. Checks: lint, types, tests, build, section limits; keyboard and phone in a browser.
6. Commit with `status: ready`.

## Steps

### Wave 0: foundation

- [x] 1. Branch `rebuild`; ignore `LectureReference/`; untrack the committed PDF (`git rm --cached`).
- [x] 2. Scaffold Astro, React, TypeScript, Tailwind 4, MDX; park old code in `legacy/`.
- [x] 3. Style tokens, base layout, home page ported; matches today's page.
- [x] 4. Content collections, `parts.yaml`, glossary and notation files, lecture layout with auto numbering and prev/next; a stub chapter renders.
- [x] 5. Prose components, each shown on `/kit`.
- [x] 6. Pop-ins; all work by keyboard and on a phone.
- [x] 7. Figure core; a demo plot with a draggable point on `/kit`.
- [x] 8. Tooling: ESLint, type check, Vitest, build checks for undefined terms and section limits; one command runs all.
- [x] 9. Deploy workflow: Node 22, generated sitemap, per-page canonical, favicon, 404.

### Wave 1: Part I

- [x] 10. Exam-score and house-price datasets; `linear`, `optimize`, `metrics` libraries.
- [x] 11. Chapter 1.
- [x] 12. Chapter 2; delete `legacy/`. (Merge to `master` waits for the owner.)
- [x] 13. Chapter 3.
- [x] 14. Chapter 4.
- [x] 15. Chapter 5. Owner reviews Part I.

### Wave 2: Part II and the toolkit

- [x] 16. Pass/fail and 2D toy datasets; `BoundaryCanvas`; `classify` library.
- [x] 17. Chapter 6.
- [x] 18. Chapter 7.
- [x] 19. Chapter 8.
- [x] 20. Chapter 9.
- [x] 21. Chapter 10.
- [x] 22. Toolkit 0.1.
- [x] 23. Toolkit 0.2.
- [x] 24. Toolkit 0.3; link earlier chapters back to the toolkit. Owner reviews.

### Wave 3: Part IV, from scratch

- [x] 25. `nn` library, spiral data, `code/` folder with the MIT notice. (The Fashion-MNIST subset is prepared with chapter 21.)
- [x] 26. Chapter 14.
- [x] 27. Chapter 15.
- [x] 28. Chapter 16.
- [x] 29. Chapter 17.
- [x] 30. Chapter 18.
- [x] 31. Chapter 19.
- [x] 32. Chapter 20.
- [ ] 33. Chapter 21, with the Fashion-MNIST subset and pretrained weights. Owner reviews.

### Wave 4: remaining models

- [ ] 34. `trees` library.
- [ ] 35–37. Chapters 11, 12, 13.
- [ ] 38. `cluster` library.
- [ ] 39–41. Chapters 24, 25, 26.
- [ ] 42–43. Chapters 22 and 23, with tiny pretrained weights as static files. Owner reviews.

### Wave 5: finish

- [ ] 44–46. Chapters 27, 28, 29.
- [ ] 47. Search, generated glossary and notation pages, reading progress saved in the browser.
- [ ] 48. Final pass: SEO, accessibility, page weight, README and a short authoring guide.

## Sources

Use these for facts, teaching order and ideas for interactives; do not copy from them. Links marked (checked) came back in a web search on 2026-11-18; the others are well-known addresses that should be opened and confirmed before they are cited in a chapter. Check each source's licence before reusing any code or data.

### Books, free to read online

| Book | Address | Use for |
|---|---|---|
| An Introduction to Statistical Learning (James, Witten, Hastie, Tibshirani) | https://www.statlearning.com | Chapters 2, 4, 5, 6, 8, 10–13, 24, 25 |
| The Elements of Statistical Learning (Hastie, Tibshirani, Friedman) | https://hastie.su.domains/ElemStatLearn/ | Deeper reference for the same chapters |
| Mathematics for Machine Learning (Deisenroth, Faisal, Ong) | https://mml-book.github.io | Toolkit, chapters 2, 25, 26 |
| Pattern Recognition and Machine Learning (Bishop) | Microsoft Research site | Chapters 9, 10, 26 |
| Probabilistic Machine Learning (Murphy) | https://probml.github.io/pml-book/ | Chapters 0.3, 9, 26 |
| Understanding Deep Learning (Prince) (checked) | https://udlbook.github.io/udlbook/ | Chapters 14–23 |
| Dive into Deep Learning (Zhang et al.) (checked) | https://d2l.ai | Chapters 14–23, code patterns |
| Neural Networks and Deep Learning (Nielsen) | http://neuralnetworksanddeeplearning.com | Chapters 14–17 |
| Deep Learning (Goodfellow, Bengio, Courville) | https://www.deeplearningbook.org | Chapters 17–19, 22 |

### Courses and notes

| Source | Address | Use for |
|---|---|---|
| Stanford CS229 main notes (checked) | https://cs229.stanford.edu/main_notes.pdf | Chapters 2, 3, 6, 9, 10, 24, 26 |
| Stanford CS231n notes (checked) | https://cs231n.github.io | Chapters 8, 17 (`/optimization-2/`), 18, 22 (`/convolutional-networks/`) |
| Google Machine Learning Crash Course (checked) | https://developers.google.com/machine-learning/crash-course | Chapters 1, 6, 7 (`/classification/thresholding`), 14, 27 |
| scikit-learn user guide | https://scikit-learn.org/stable/user_guide.html | "In code" sections; chapters 8–13, 24–27 |

### Interactive explainers and articles

| Source | Address | Use for |
|---|---|---|
| MLU-Explain (checked) | https://mlu-explain.github.io | Chapters 2 (`/linear-regression/`), 4 (`/bias-variance/`, `/cross-validation/`), 7 (`/roc-auc/`), 11 (`/decision-tree/`) |
| R2D3, A Visual Introduction to Machine Learning (checked) | https://r2d3.us/visual-intro-to-machine-learning-part-1/ | Chapters 1, 4, 11 |
| How to explain gradient boosting (Parr, Howard) (checked) | https://explained.ai/gradient-boosting | Chapter 13 |
| CNN Explainer (checked) | https://poloclub.github.io/cnn-explainer/ | Chapter 22 |
| Transformer Explainer (checked) | https://poloclub.github.io/transformer-explainer/ | Chapter 23 |
| The Illustrated Transformer (Alammar) (checked) | https://jalammar.github.io/illustrated-transformer/ | Chapter 23 |
| Seeing Theory | https://seeing-theory.brown.edu | Toolkit 0.3, chapter 9 |
| Setosa, Explained Visually (PCA) | https://setosa.io/ev/principal-component-analysis/ | Chapter 25 |
| Distill, Why Momentum Really Works | https://distill.pub/2017/momentum/ | Chapter 18 |
| TensorFlow Playground | https://playground.tensorflow.org | Chapters 14, 15, 19 |
| Calculus on Computational Graphs (Olah) | https://colah.github.io/posts/2015-08-Backprop/ | Chapter 17 |
| 3Blue1Brown, Neural Networks | https://www.3blue1brown.com/topics/neural-networks | Chapters 14, 17, 23 |
| StatQuest (videos) | https://statquest.org | Chapters 7, 11–13, 25 |

### Gaps

Chapters 28 and 29 have no single source; build 28 from the book's own earlier chapters and 29 from the tables of contents of the books above.
