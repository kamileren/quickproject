// Prints the numbers the chapter on measuring classifiers quotes.
// Run with `npx vitest run --config scripts/stats.vitest.config.ts --silent=false --reporter=verbose screening`.
import { it } from 'vitest';
import { patientLabels, patientScores } from '@/data/screening';
import { accuracyOf, auc, confusionAt, f1, falsePositiveRate, precision, recall } from '@/lib/metrics';

it('prints screening stats', () => {
  console.log('auc', auc(patientLabels, patientScores).toFixed(3));
  let best = { t: 0, f: 0 };
  for (let t = 0.05; t < 0.96; t += 0.05) {
    const c = confusionAt(patientLabels, patientScores, t);
    if (f1(c) > best.f) best = { t, f: f1(c) };
    console.log(
      `t=${t.toFixed(2)} tp=${c.tp} fp=${c.fp} tn=${c.tn} fn=${c.fn} acc=${accuracyOf(c).toFixed(3)} prec=${precision(c).toFixed(2)} rec=${recall(c).toFixed(2)} fpr=${falsePositiveRate(c).toFixed(3)} f1=${f1(c).toFixed(2)} cost(miss=50,alarm=1)=${c.fn * 50 + c.fp}`,
    );
  }
  console.log('best f1 at', best.t.toFixed(2), best.f.toFixed(2));
});
