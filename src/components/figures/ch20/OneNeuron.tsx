import { useMemo, useState } from 'react';
import { examPoints, EXAM_X, EXAM_Y } from '@/data/exam-scores';
import { outcomes } from '@/data/pass-fail';
import { fitLogistic, sigmoid } from '@/lib/classify';
import { trainOneNeuron } from '@/lib/heads';
import { fitLine } from '@/lib/linear';
import { ControlBar, Legend, Readout, Segmented, Slider } from '../core/Controls';
import { COLORS, Dots, FnLine, HRule, Plot } from '../core/Plot';

type Kind = 'linear' | 'sigmoid';
const OPTIONS: { value: Kind; label: string }[] = [
  { value: 'linear', label: 'No activation, squared error' },
  { value: 'sigmoid', label: 'Sigmoid, cross-entropy' },
];
const STEPS = { linear: 100, sigmoid: 500 };

/**
 * A network with no hidden layer and one output neuron, trained by the same
 * loop as every other network in this part. Depending on its output layer it
 * lands on the answer of linear regression or of logistic regression.
 */
export default function OneNeuron() {
  const [kind, setKind] = useState<Kind>('linear');
  const [step, setStep] = useState(0);

  const runs = useMemo(
    () => ({
      linear: trainOneNeuron(examPoints.map((p) => p.x), examPoints.map((p) => p.y), 'linear', STEPS.linear, 0.05),
      sigmoid: trainOneNeuron(outcomes.map((o) => o.hours), outcomes.map((o) => o.passed), 'sigmoid', STEPS.sigmoid, 1),
    }),
    [],
  );
  const known = useMemo(() => {
    const line = fitLine(examPoints);
    const logistic = fitLogistic(outcomes.map((o) => [o.hours]), outcomes.map((o) => o.passed)).weights;
    return { linear: { w: line.w, b: line.b }, sigmoid: { w: logistic[1], b: logistic[0] } };
  }, []);

  const state = runs[kind][Math.min(step, STEPS[kind])];
  const target = known[kind];

  return (
    <div className="space-y-3">
      {kind === 'linear' ? (
        <Plot xDomain={EXAM_X} yDomain={EXAM_Y} xLabel="Hours studied" yLabel="Exam score" label={`One neuron with no activation after ${step} training steps: score = ${state.w.toFixed(2)} times hours plus ${state.b.toFixed(2)}.`}>
          <FnLine f={(x) => target.w * x + target.b} stroke={COLORS.ink} strokeWidth={1} dashed opacity={0.6} />
          <FnLine f={(x) => state.w * x + state.b} strokeWidth={2.5} />
          <Dots points={examPoints} />
        </Plot>
      ) : (
        <Plot xDomain={EXAM_X} yDomain={[-0.25, 1.35]} xLabel="Hours studied" yLabel="Chance of passing" yTicks={6} label={`One sigmoid neuron after ${step} training steps.`}>
          <HRule at={0} stroke={COLORS.axis} strokeWidth={1} />
          <HRule at={1} stroke={COLORS.axis} strokeWidth={1} />
          <FnLine f={(x) => sigmoid(target.w * x + target.b)} stroke={COLORS.ink} strokeWidth={1} dashed opacity={0.6} />
          <FnLine f={(x) => sigmoid(state.w * x + state.b)} strokeWidth={2.5} />
          <Dots points={outcomes.filter((o) => o.passed === 1).map((o) => ({ x: o.hours, y: 1 }))} />
          <Dots points={outcomes.filter((o) => o.passed === 0).map((o) => ({ x: o.hours, y: 0 }))} hollow />
        </Plot>
      )}

      <Legend
        items={[
          { label: 'The neuron, at this step', color: COLORS.accent, shape: 'line' },
          { label: kind === 'linear' ? 'Answer from the linear regression formula' : 'Answer from the logistic regression chapter', color: COLORS.ink, shape: 'dash' },
        ]}
      />

      <Readout
        items={[
          { label: 'Weight', value: `${state.w.toFixed(2)} (target ${target.w.toFixed(2)})`, key: true },
          { label: 'Bias', value: `${state.b.toFixed(2)} (target ${target.b.toFixed(2)})`, key: true },
          { label: 'Loss', value: state.loss.toFixed(kind === 'linear' ? 2 : 4) },
        ]}
      />

      <ControlBar>
        <Segmented
          label="Output layer and loss"
          options={OPTIONS}
          value={kind}
          onChange={(v) => {
            setKind(v);
            setStep(0);
          }}
        />
      </ControlBar>
      <ControlBar>
        <Slider label="Training steps" value={Math.min(step, STEPS[kind])} min={0} max={STEPS[kind]} step={1} onChange={setStep} />
      </ControlBar>
    </div>
  );
}
