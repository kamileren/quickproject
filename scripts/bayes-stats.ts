// Prints the numbers the Naive Bayes chapter quotes.
// Run with `npx vitest run --config scripts/stats.vitest.config.ts --silent=false --reporter=verbose bayes`.
import { it } from 'vitest';
import { messageLabels, messageTokens, tokenize } from '@/data/messages';
import { bayesRule, classifyMessage, trainNaiveBayes, wordLikelihood, wordPush } from '@/lib/bayes';

it('prints bayes stats', () => {
  const m = trainNaiveBayes(messageTokens, messageLabels);
  console.log('vocab', m.vocabulary.length, 'totals', m.totals, 'docs', m.documents, 'prior', m.prior.toFixed(3));
  const docsWith = (w: string, label: number) => messageTokens.filter((t, i) => messageLabels[i] === label && t.includes(w)).length;
  for (const w of ['free', 'click', 'now', 'prize', 'you', 'the', 'today', 'meeting', 'tomorrow', 'report', 'lunch', 'call', 'your', 'money', 'win']) {
    console.log(
      `${w}: counts ${m.counts[w]}  docs spam ${docsWith(w, 1)} normal ${docsWith(w, 0)}  P(w|spam)=${wordLikelihood(m, w, true).toFixed(4)} P(w|normal)=${wordLikelihood(m, w, false).toFixed(4)} ratio=${Math.exp(wordPush(m, w)).toFixed(2)} push=${wordPush(m, w).toFixed(2)}`,
    );
  }
  for (const text of ['are you free for lunch tomorrow', 'free prize', 'free lunch', 'claim your free prize now', 'free', 'win a free lunch today', 'call me now']) {
    const r = classifyMessage(m, tokenize(text));
    console.log(`"${text}" -> ${(r.probability * 100).toFixed(1)}% score ${r.score.toFixed(2)} [prior ${r.priorPush.toFixed(2)}; ${r.words.map((w) => `${w.word} ${w.push.toFixed(2)}`).join(', ')}]`);
  }
  console.log('one word "free" by docs: P(spam|free) =', bayesRule(14 / 34, docsWith('free', 1) / 14, docsWith('free', 0) / 20).toFixed(3));
  console.log('screening: prior .1 sens .9 fpr .09 ->', bayesRule(0.1, 0.9, 0.09).toFixed(3), ' prior .01 ->', bayesRule(0.01, 0.9, 0.09).toFixed(3));
});
