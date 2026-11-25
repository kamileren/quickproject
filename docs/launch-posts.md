# Launch post drafts

Drafts to adapt and post yourself. Read each community's rules before posting: r/MachineLearning only allows
project posts in its weekly self-promotion thread or with a [P] tag, and r/learnmachinelearning asks that
resources are free (this one is). Post on one site per day so you can answer every comment.

Before posting, check the numbers against the live site (21 chapters, 79 figures, 105 exercises at the time of
writing), and that `/playground/` and `/exercises/` are deployed.

---

## Show HN

**Title** (80 characters max):

> Show HN: The Book of Machine Learning – a free textbook where every figure is interactive

**URL:** https://thebookofml.com

**First comment** (post it yourself right after submitting):

> I've been writing a machine learning textbook that teaches from first principles, where the figures are things
> you use rather than look at. You drag a line through twelve students' exam scores and watch the squared error
> change, turn up the learning rate until gradient descent diverges, or add hidden neurons one at a time and see
> the decision boundary fold.
>
> It's 21 chapters so far: regression, gradient descent, generalization, classification (logistic regression,
> k-NN, naive Bayes, SVMs), and a neural network built from scratch one piece per chapter until it classifies
> Fashion-MNIST. Every chapter has exercises with worked solutions, and the network chapters each come with a
> short NumPy file that runs on its own.
>
> It's a static Astro site with React figures. All the maths behind the figures is in plain, unit-tested
> TypeScript, so the numbers in the text are the numbers the figures compute. No accounts; reading progress stays in
> your own browser.
>
> Trees, ensembles, unsupervised learning, CNNs and attention are still being written. I'd particularly like to
> hear where an explanation lost you.
>
> Figures by topic: https://thebookofml.com/playground/
> All exercises: https://thebookofml.com/exercises/

---

## r/learnmachinelearning

**Title:**

> I wrote a free ML textbook where you learn by dragging, sliding and training the figures yourself

**Body:**

> Most ML resources I learned from either skipped the maths or buried the intuition under it. I've been writing
> one that tries to do both, one idea at a time, with a figure to play with for each idea.
>
> Some things you can try without reading anything:
>
> - Fit a line by hand and try to beat the least-squares error: https://thebookofml.com/playground/linear-regression/
> - Break gradient descent with a learning rate that's too high: https://thebookofml.com/playground/gradient-descent/
> - Watch a degree-9 curve bend through 12 points and miss 20 new ones: https://thebookofml.com/playground/overfitting/
> - Train a small network on a spiral with SGD, then with Adam: https://thebookofml.com/playground/neural-networks/
>
> The book itself (https://thebookofml.com) has 21 chapters so far, from "what is learning?" to a neural network
> built from scratch, with 105 exercises and worked solutions. It's free, with no sign-up.
>
> It's still being written, so if something is confusing or wrong, I'd really like to know.

---

## r/MachineLearning (weekly self-promotion thread, or as a [P] post if allowed)

> [P] The Book of Machine Learning: a free interactive textbook built around 79 manipulable figures
>
> https://thebookofml.com. First-principles chapters on regression, optimisation, generalization, classical
> classifiers and a from-scratch neural network, each with exercises and worked solutions. The maths behind the
> figures is unit-tested TypeScript; the network chapters have standalone NumPy files. Feedback on accuracy is
> very welcome.

---

## LinkedIn (one post per figure, with a 10–20 second screen recording)

> Gradient descent in one picture: the left panel is the line moving through the data, the right is the same run
> as a path across the error surface. Every point on that map is one possible line.
>
> Turn the learning rate up past 0.164 and it stops converging and flies off.
>
> Try it yourself, free, in your browser: https://thebookofml.com/playground/gradient-descent/

Other figures that work well as short clips: the overfitting curve (degree 1 → 9), the SVM "widest street", the
k-NN regions as k grows, and the spiral network training with Adam.

---

## Email to a course instructor

**Subject:** Free interactive reading for [course code]: [topic]

> Dear Professor [name],
>
> I'm writing a free, open textbook on machine learning, thebookofml.com, and noticed [course code] covers
> [topic] in week [n]. The chapter on [topic] might be useful as supplementary reading: [chapter URL]
>
> Each chapter builds the idea from first principles, with interactive figures students can manipulate (for
> example, [one specific figure]), checkpoint questions, and exercises with worked solutions. It's free with no
> sign-up, and works on phones.
>
> If you do take a look, I'd be grateful for any corrections or places where students might get stuck.
>
> Best regards,
> [your name]

Send these one at a time, to courses that actually teach the chapter's topic, and name the specific chapter and
week. A generic "please share my book" email is easy to ignore.

---

## Resource lists

Read each list's contributing guide first; most want a pull request adding one line in a set format.

| List | Section to add to | Line |
|---|---|---|
| EbookFoundation/free-programming-books | `books/free-programming-books-subjects.md` → Machine Learning | `* [The Book of Machine Learning](https://thebookofml.com) - [author name]` (check their author format) |
| josephmisiti/awesome-machine-learning | `books.md` → Machine Learning | `* [The Book of Machine Learning](https://thebookofml.com) - A free, interactive textbook teaching ML from first principles.` |
| ChristosChristofidis/awesome-deep-learning | Books (only once the network chapters are complete) | same as above |

Open textbook directories (Open Textbook Library, OER Commons) require an open licence such as CC BY. The repo has
no licence yet, so choose one before submitting there.
