// Creates a draft stub for every chapter that does not have a file yet.
// Run once with `node scripts/make-stubs.mjs`; safe to re-run.
import fs from 'node:fs';

const chapters = [
  ['0.1', 'vectors-and-matrices', 'Vectors and Matrices', 'toolkit', 'Lists of numbers, the dot product, and what a matrix does to a vector.'],
  ['0.2', 'derivatives-and-gradients', 'Derivatives and Gradients', 'toolkit', 'Slope by nudging, partial derivatives, and the chain rule.'],
  ['0.3', 'probability', 'Probability', 'toolkit', "Random variables, the normal curve, and Bayes' rule."],
  ['1', 'what-is-learning', 'What Is Learning?', 'learning', 'Features, labels, and what it means for a program to learn from examples.'],
  ['2', 'linear-regression', 'Linear Regression', 'learning', 'Fitting a straight line to data, and measuring how well it fits.'],
  ['3', 'gradient-descent', 'Gradient Descent', 'learning', 'Finding the best fit by taking small steps downhill.'],
  ['4', 'generalization', 'Generalization', 'learning', 'Why a model that fits its training data can still fail on new data.'],
  ['5', 'regularization', 'Regularization', 'learning', 'Keeping models simple with ridge and lasso penalties.'],
  ['6', 'logistic-regression', 'Logistic Regression', 'classification', 'Predicting a yes or no answer as a probability.'],
  ['7', 'measuring-classifiers', 'Measuring Classifiers', 'classification', 'Confusion matrices, precision, recall, and the ROC curve.'],
  ['8', 'nearest-neighbours', 'Nearest Neighbours', 'classification', 'Classifying a point by looking at the points around it.'],
  ['9', 'naive-bayes', 'Naive Bayes', 'classification', "Turning Bayes' rule into a fast, simple classifier."],
  ['10', 'support-vector-machines', 'Support Vector Machines', 'classification', 'Separating classes with the widest possible margin.'],
  ['11', 'decision-trees', 'Decision Trees', 'trees', 'Learning a sequence of yes or no questions.'],
  ['12', 'random-forests', 'Random Forests', 'trees', 'Many trees voting together beat one tree alone.'],
  ['13', 'boosting', 'Boosting', 'trees', 'Building a strong model by repeatedly fixing mistakes.'],
  ['14', 'a-single-neuron', 'A Single Neuron', 'networks', 'Inputs, weights, and a bias: the smallest piece of a network.'],
  ['15', 'layers-and-activations', 'Layers and Activations', 'networks', 'Stacking neurons, and why they need to bend.'],
  ['16', 'scoring-a-classifier', 'Scoring a Classifier', 'networks', 'Softmax and cross-entropy: turning outputs into a loss.'],
  ['17', 'backpropagation', 'Backpropagation', 'networks', 'The chain rule, applied backward through a network.'],
  ['18', 'optimizers', 'Optimizers', 'networks', 'Momentum, RMSProp, and Adam: smarter ways to step.'],
  ['19', 'keeping-networks-honest', 'Keeping Networks Honest', 'networks', 'Weight penalties and dropout against overfitting.'],
  ['20', 'one-network-many-jobs', 'One Network, Many Jobs', 'networks', 'Swapping the output layer for different tasks.'],
  ['21', 'a-real-dataset', 'A Real Dataset', 'networks', 'Training, evaluating, saving, and using a network on images.'],
  ['22', 'convolutional-networks', 'Convolutional Networks', 'networks', 'Filters that slide over an image to find patterns.'],
  ['23', 'sequences-and-attention', 'Sequences and Attention', 'networks', 'How networks read text, and the idea behind the transformer.'],
  ['24', 'k-means', 'Clustering with k-Means', 'structure', 'Grouping similar points without any labels.'],
  ['25', 'pca', 'Principal Component Analysis', 'structure', 'Finding the few directions that matter most.'],
  ['26', 'mixture-models', 'Mixture Models and EM', 'structure', 'Soft clusters, and the two-step loop that finds them.'],
  ['27', 'preparing-data', 'Preparing Data', 'practice', 'Scaling, encoding, missing values, and avoiding leakage.'],
  ['28', 'end-to-end-project', 'An End-to-End Project', 'practice', 'From a raw table of houses to a tested model.'],
  ['29', 'where-next', 'Where to Go Next', 'practice', 'A map of what this book left out.'],
];

const dir = 'src/content/lectures';
fs.mkdirSync(dir, { recursive: true });

chapters.forEach(([number, slug, title, part, summary], order) => {
  const prefix = number.includes('.') ? number : number.padStart(2, '0');
  const path = `${dir}/${prefix}-${slug}.mdx`;
  if (fs.existsSync(path)) return;
  const frontmatter = [
    '---',
    `title: ${JSON.stringify(title)}`,
    `number: ${JSON.stringify(number)}`,
    `part: ${part}`,
    `order: ${order}`,
    `summary: ${JSON.stringify(summary)}`,
    'status: draft',
    '---',
    '',
  ].join('\n');
  fs.writeFileSync(path, frontmatter);
  console.log('created', path);
});
