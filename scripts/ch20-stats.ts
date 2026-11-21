// Prints the numbers chapter 20 quotes.
// Run with `npx vitest run --config scripts/stats.vitest.config.ts --silent=false --reporter=verbose ch20`.
import { it } from 'vitest';
import { examPoints } from '@/data/exam-scores';
import { outcomes } from '@/data/pass-fail';
import { sleepTrain, trueSleepCurve } from '@/data/sleep-scores';
import { trainNumberHead, trainOneNeuron, trainYesNoHead } from '@/lib/heads';
import { fitLine, lineMse } from '@/lib/linear';
import { Adam } from '@/lib/nn';
import { createSpiralTrainer } from '@/lib/spiral-trainer';

it(
  'prints head stats',
  () => {
    let t0 = performance.now();
    const yn = trainYesNoHead();
    console.log(`yesNo: accuracy ${(yn.accuracy * 100).toFixed(0)}% loss ${yn.loss.toFixed(3)} ${(performance.now() - t0).toFixed(0)}ms`);
    t0 = performance.now();
    const num = trainNumberHead();
    console.log(
      `number: mse ${num.mse.toFixed(1)} (line ${lineMse(sleepTrain, fitLine(sleepTrain)).toFixed(1)}) predict 3h ${num.predict(3).toFixed(1)} 7.5h ${num.predict(7.5).toFixed(1)} 10.5h ${num.predict(10.5).toFixed(1)} true 7.5 ${trueSleepCurve(7.5)} ${(performance.now() - t0).toFixed(0)}ms`,
    );
    t0 = performance.now();
    const sp = createSpiralTrainer(new Adam({ learningRate: 0.05 }), { hidden: 32 });
    sp.run(600);
    console.log(`classes: train ${(sp.trainAccuracy() * 100).toFixed(0)}% test ${(sp.testAccuracy() * 100).toFixed(0)}% loss ${sp.loss().toFixed(3)} ${(performance.now() - t0).toFixed(0)}ms`);
    const lin = trainOneNeuron(examPoints.map((p) => p.x), examPoints.map((p) => p.y), 'linear', 400, 0.05);
    for (const s of [0, 1, 5, 20, 50, 100, 200, 400]) console.log(`linear neuron step ${s}: w ${lin[s].w.toFixed(3)} b ${lin[s].b.toFixed(2)} loss ${lin[s].loss.toFixed(2)}`);
    const sig = trainOneNeuron(outcomes.map((o) => o.hours), outcomes.map((o) => o.passed), 'sigmoid', 3000, 1);
    for (const s of [0, 10, 100, 500, 1000, 3000]) console.log(`sigmoid neuron step ${s}: w ${sig[s].w.toFixed(3)} b ${sig[s].b.toFixed(2)} loss ${sig[s].loss.toFixed(4)}`);
  },
  120000,
);
