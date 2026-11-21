// Prints the numbers the classification chapters quote, so prose can be checked against them.
// Run with `npx vitest run --config scripts/stats.vitest.config.ts --silent=false --reporter=verbose passfail`.
import { it } from 'vitest';
import { outcomes, outcomeX, outcomeY, studySleep } from '@/data/pass-fail';
import { decisionPoint, fitLogistic, logLossOne, modelLogLoss, predictProba } from '@/lib/classify';
import { fitLine, predict } from '@/lib/linear';

it('prints pass/fail stats', () => {
  console.log('outcomes', outcomes.map((o) => `${o.hours}:${o.passed}`).join(' '));
  const fit = fitLogistic(outcomeX, outcomeY);
  console.log('logistic', fit.weights.map((w) => w.toFixed(3)).join(', '), 'loss', fit.loss.toFixed(4), 'cut', decisionPoint(fit.weights).toFixed(2));
  for (const h of [0, 1, 2, 3, 3.5, 4, 4.5, 5, 6, 8, 10]) console.log(`p(pass | ${h}h) = ${predictProba(fit.weights, [h]).toFixed(3)}`);
  const right = outcomes.filter((o) => (predictProba(fit.weights, [o.hours]) >= 0.5 ? 1 : 0) === o.passed).length;
  console.log('accuracy', right, 'of', outcomes.length);
  console.log('per-student loss', outcomes.map((o) => `${o.hours}:${logLossOne(o.passed, predictProba(fit.weights, [o.hours])).toFixed(2)}`).join(' '));
  console.log('loss at start (0,0)', modelLogLoss(outcomeX, outcomeY, [0, 0]).toFixed(4), 'at (-4,1)', modelLogLoss(outcomeX, outcomeY, [-4, 1]).toFixed(4));
  const line = fitLine(outcomes.map((o) => ({ x: o.hours, y: o.passed })));
  console.log('straight line on 0/1:', line.w.toFixed(3), line.b.toFixed(3), 'at 0h', predict(line, 0).toFixed(2), 'at 9h', predict(line, 9).toFixed(2), 'at 10h', predict(line, 10).toFixed(2));
  const X = studySleep.map((s) => [s.hours, s.sleep]);
  const y = studySleep.map((s) => s.passed);
  const two = fitLogistic(X, y);
  const ok = X.filter((row, i) => (predictProba(two.weights, row) >= 0.5 ? 1 : 0) === y[i]).length;
  console.log('two features', two.weights.map((w) => w.toFixed(3)).join(', '), 'loss', two.loss.toFixed(4), 'right', ok, 'of', X.length, 'passes', y.reduce((a, b) => a + b, 0));
});
