import { useMemo } from 'react';
import { SLEEP_X, SLEEP_Y, sleepTrain } from '@/data/sleep-scores';
import { SPIRAL_RANGE, spiralTrain } from '@/data/spiral';
import { TOY_RANGE } from '@/data/toy2d';
import { HEAD_MOONS, trainNumberHead, trainYesNoHead } from '@/lib/heads';
import { Adam } from '@/lib/nn';
import { createSpiralTrainer } from '@/lib/spiral-trainer';
import { ClassMap } from '../core/ClassMap';
import { Legend, Readout } from '../core/Controls';
import { COLORS, Dots, FnLine, Plot, Regions, SERIES } from '../core/Plot';

interface TaskHeadProps {
  task: 'yesNo' | 'classes' | 'numbers';
}

const SPEC = {
  yesNo: { outputs: '1 neuron', activation: 'Sigmoid', loss: 'Binary cross-entropy' },
  classes: { outputs: '1 neuron per class (3)', activation: 'Softmax', loss: 'Cross-entropy' },
  numbers: { outputs: '1 neuron', activation: 'None', loss: 'Mean squared error' },
};

function YesNo() {
  const model = useMemo(() => trainYesNoHead(), []);
  return (
    <>
      <div className="mx-auto max-w-[420px]">
        <Plot xDomain={TOY_RANGE} yDomain={TOY_RANGE} aspect={1} maxHeight={420} label={`Two crescents separated by a network with a single sigmoid output. It gets ${(model.accuracy * 100).toFixed(0)} percent right.`}>
          <Regions cols={46} rows={46} opacity={(x, y) => 0.4 * model.probability(x, y)} />
          <Dots points={HEAD_MOONS.filter((p) => p.label === 1)} r={4} />
          <Dots points={HEAD_MOONS.filter((p) => p.label === 0)} r={4} hollow />
        </Plot>
      </div>
      <Legend items={[{ label: 'Darker shading: output closer to 1', color: COLORS.accent, shape: 'dot' }]} />
      <Result spec={SPEC.yesNo} score="Right on the points shown" value={`${(model.accuracy * 100).toFixed(0)}%`} />
    </>
  );
}

function Classes() {
  const trainer = useMemo(() => {
    const t = createSpiralTrainer(new Adam({ learningRate: 0.05 }), { hidden: 32 });
    t.run(600);
    return t;
  }, []);
  return (
    <>
      <div className="mx-auto max-w-[420px]">
        <Plot xDomain={SPIRAL_RANGE} yDomain={SPIRAL_RANGE} aspect={1} maxHeight={420} xTicks={4} yTicks={4} label="Three spiral arms and the regions a network with three softmax outputs assigns to each.">
          <ClassMap classify={trainer.classify} version="trained" />
          {[0, 1, 2].map((k) => (
            <Dots key={k} points={spiralTrain.filter((p) => p.label === k)} fill={SERIES[k]} r={3} />
          ))}
        </Plot>
      </div>
      <Legend items={[0, 1, 2].map((k) => ({ label: `Class ${k + 1}`, color: SERIES[k], shape: 'dot' as const }))} />
      <Result spec={SPEC.classes} score="Right on new points" value={`${(trainer.testAccuracy() * 100).toFixed(0)}%`} />
    </>
  );
}

function Numbers() {
  const model = useMemo(() => trainNumberHead(), []);
  return (
    <>
      <Plot xDomain={SLEEP_X} yDomain={SLEEP_Y} xLabel="Hours slept" yLabel="Exam score" label="Exam score against hours slept, with the curve predicted by a network whose single output has no activation.">
        <FnLine f={model.predict} strokeWidth={2.5} samples={200} />
        <Dots points={sleepTrain} title={(p) => `${p.x} h, score ${p.y}`} />
      </Plot>
      <Legend
        items={[
          { label: 'Students', color: COLORS.ink, shape: 'dot' },
          { label: "The network's prediction", color: COLORS.accent, shape: 'line' },
        ]}
      />
      <Result spec={SPEC.numbers} score="Mean squared error" value={model.mse.toFixed(1)} />
    </>
  );
}

function Result({ spec, score, value }: { spec: (typeof SPEC)['yesNo']; score: string; value: string }) {
  return (
    <Readout
      items={[
        { label: 'Output layer', value: spec.outputs },
        { label: 'Final activation', value: spec.activation },
        { label: 'Loss', value: spec.loss },
        { label: score, value, key: true },
      ]}
    />
  );
}

/** The same kind of hidden layer with one of three output layers, trained when the figure appears. */
export default function TaskHead({ task }: TaskHeadProps) {
  return <div className="space-y-3">{task === 'yesNo' ? <YesNo /> : task === 'classes' ? <Classes /> : <Numbers />}</div>;
}
