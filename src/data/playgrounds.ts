/**
 * Standalone pages that gather a chapter's interactive figures, for readers
 * who arrive looking for one idea rather than the whole book. Each page in
 * src/pages/playground/ imports its figures and reads its words from here.
 */
export interface Playground {
  slug: string;
  /** Short name for lists and the page heading. */
  name: string;
  /** The page title, written the way people search for it. */
  title: string;
  /** Search-result description, 70 to 160 characters. */
  description: string;
  /** What the reader is looking at, for someone who has not read the chapter. */
  intro: string;
  /** Chapters that explain what the figures show, first one first. */
  chapters: string[];
}

export const PLAYGROUNDS: Playground[] = [
  {
    slug: 'linear-regression',
    name: 'Linear regression',
    title: 'Interactive Linear Regression: Fit a Line by Hand',
    description: 'Drag a line through real data, watch the squared error change, and see how a single outlier pulls the least-squares fit. Free, in your browser.',
    intro:
      'Twelve students wrote down how many hours they studied, then sat the same exam. Each dot is one student. A straight line turns hours into a predicted score, and the error measures how far the line misses.',
    chapters: ['linear-regression'],
  },
  {
    slug: 'gradient-descent',
    name: 'Gradient descent',
    title: 'Gradient Descent Interactive Visualization',
    description: 'Step through gradient descent on real data, change the learning rate until it diverges, try mini-batches, and race momentum and Adam down a valley.',
    intro:
      'Gradient descent finds the best line by starting somewhere and taking small steps downhill on the error. The data are twelve students’ study hours and exam scores. Every point on the error map is one possible line.',
    chapters: ['gradient-descent', 'optimizers'],
  },
  {
    slug: 'overfitting',
    name: 'Overfitting',
    title: 'Overfitting and the Bias–Variance Tradeoff, Interactive',
    description: 'Make a curve more flexible one degree at a time and watch it fit twelve points perfectly, then fail on twenty new ones. Overfitting you can see.',
    intro:
      'A more flexible curve can always fit the data it was trained on more closely. Whether it predicts new data better is a different question. The dark dots are twelve students the curve is fitted to; new students show how it does on data it has not seen.',
    chapters: ['generalization'],
  },
  {
    slug: 'support-vector-machines',
    name: 'Support vector machines',
    title: 'Support Vector Machines, Visually: Margins and Kernels',
    description: 'Build the widest street between two classes by hand, soften the margin with C, and switch to an RBF kernel to see a boundary close into a loop.',
    intro:
      'A support vector machine separates two kinds of point with the widest possible empty street. Only the points on the edge of the street decide where it goes. These figures let you build one by hand, then let the algorithm do it.',
    chapters: ['support-vector-machines'],
  },
  {
    slug: 'nearest-neighbours',
    name: 'Nearest neighbours',
    title: 'k-Nearest Neighbours Interactive Demo',
    description: 'Drag a new point between two classes and watch its nearest neighbours vote, then change k and see the k-NN decision regions smooth out.',
    intro:
      'k-nearest neighbours classifies a new point by looking at the k known points closest to it and taking a vote. There is no model to fit. The only real choice is k.',
    chapters: ['nearest-neighbours'],
  },
  {
    slug: 'neural-networks',
    name: 'Neural networks',
    title: 'Neural Network Playground: Train One in Your Browser',
    description: 'Add hidden neurons and watch a boundary fold, compare activation functions, and train a small network on a spiral with SGD, momentum or Adam.',
    intro:
      'A neural network is many simple neurons stacked in layers. Each figure here runs a real network in your browser, built from scratch for the book, so you can see what more neurons, a different activation or a different optimizer actually change.',
    chapters: ['layers-and-activations', 'backpropagation', 'optimizers'],
  },
];

export const playgroundUrl = (slug: string) => `/playground/${slug}/`;
