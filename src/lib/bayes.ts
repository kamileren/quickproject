/** Bayes' rule, and the Naive Bayes text classifier built on it. */

/**
 * Bayes' rule for a yes/no question.
 * @param prior          chance of yes before seeing the evidence
 * @param givenYes       chance of seeing this evidence when the answer is yes
 * @param givenNo        chance of seeing this evidence when the answer is no
 * @returns the chance of yes after seeing the evidence
 */
export function bayesRule(prior: number, givenYes: number, givenNo: number): number {
  const yes = prior * givenYes;
  const no = (1 - prior) * givenNo;
  return yes + no === 0 ? 0 : yes / (yes + no);
}

export interface NaiveBayesModel {
  /** Every word seen in training. */
  vocabulary: string[];
  /** Share of training documents in class 1. */
  prior: number;
  /** Smoothing constant added to every word count. */
  alpha: number;
  /** How often each word appears in class 1 and class 0 documents. */
  counts: Record<string, [inOne: number, inZero: number]>;
  /** Total words in class 1 and class 0 documents. */
  totals: [inOne: number, inZero: number];
  documents: [inOne: number, inZero: number];
}

/** Counts words per class. `alpha` = 1 is the usual "add one" smoothing; 0 turns smoothing off. */
export function trainNaiveBayes(documents: readonly (readonly string[])[], labels: readonly number[], alpha = 1): NaiveBayesModel {
  if (documents.length === 0 || documents.length !== labels.length) throw new Error('trainNaiveBayes: bad shapes');
  const counts: Record<string, [number, number]> = {};
  const totals: [number, number] = [0, 0];
  const docs: [number, number] = [0, 0];
  documents.forEach((words, i) => {
    const slot = labels[i] === 1 ? 0 : 1;
    docs[slot]++;
    for (const w of words) {
      (counts[w] ??= [0, 0])[slot]++;
      totals[slot]++;
    }
  });
  return { vocabulary: Object.keys(counts).sort(), prior: docs[0] / documents.length, alpha, counts, totals, documents: docs };
}

/** P(word | class): the share of that class's words which are this word, with smoothing. */
export function wordLikelihood(model: NaiveBayesModel, word: string, inClassOne: boolean): number {
  const slot = inClassOne ? 0 : 1;
  const count = model.counts[word]?.[slot] ?? 0;
  return (count + model.alpha) / (model.totals[slot] + model.alpha * model.vocabulary.length);
}

/**
 * How hard one word pushes toward class 1: log of P(word | 1) / P(word | 0).
 * Positive pushes toward class 1, negative toward class 0, zero is no push.
 * Without smoothing this is ±Infinity for a word never seen in one class.
 */
export function wordPush(model: NaiveBayesModel, word: string): number {
  return Math.log(wordLikelihood(model, word, true)) - Math.log(wordLikelihood(model, word, false));
}

export interface NaiveBayesResult {
  /** Push from the prior alone: log of P(1) / P(0). */
  priorPush: number;
  /** Each known word in the message with its push, in order of appearance. */
  words: { word: string; push: number }[];
  /** Words the model has never seen, which are ignored. */
  unknown: string[];
  /** Total log-odds: prior push plus every word's push. */
  score: number;
  /** Probability of class 1. */
  probability: number;
}

/** Classifies a tokenised message, keeping each word's contribution so it can be shown. */
export function classifyMessage(model: NaiveBayesModel, tokens: readonly string[]): NaiveBayesResult {
  const priorPush = Math.log(model.prior) - Math.log(1 - model.prior);
  const words: { word: string; push: number }[] = [];
  const unknown: string[] = [];
  for (const t of tokens) {
    if (model.counts[t]) words.push({ word: t, push: wordPush(model, t) });
    else unknown.push(t);
  }
  const score = words.reduce((s, w) => s + w.push, priorPush);
  // exp(score) is the odds; this form stays finite for ±Infinity.
  const probability = Number.isNaN(score) ? 0.5 : score > 0 ? 1 / (1 + Math.exp(-score)) : Math.exp(score) / (1 + Math.exp(score));
  return { priorPush, words, unknown, score, probability };
}
