import { useMemo, useState } from 'react';
import { sleepTrain, SLEEP_X, SLEEP_Y } from '@/data/sleep-scores';
import { crossValidate, kFolds } from '@/lib/poly';
import { mulberry32 } from '@/lib/random';
import { ControlBar, Legend, Readout, Segmented, Slider } from '../core/Controls';
import { COLORS, Dots, FnLine, Plot } from '../core/Plot';
import { fitSleep, formatError } from './shared';

const K = 5;
const FOLD_OPTIONS = Array.from({ length: K }, (_, i) => ({ value: String(i), label: `Round ${i + 1}` }));

/**
 * Cross-validation, one round at a time. Each round hides a different fifth
 * of the students, fits on the rest, and scores the fit on the hidden ones.
 */
export default function Folds() {
  const [degree, setDegree] = useState(2);
  const [round, setRound] = useState('0');

  const folds = useMemo(() => kFolds(sleepTrain, K, mulberry32(1)), []);
  const errors = useMemo(() => crossValidate(folds, (train) => fitSleep(train, degree).predict), [folds, degree]);
  const fold = folds[Number(round)];
  const model = useMemo(() => fitSleep(fold.train, degree), [fold, degree]);
  const average = errors.reduce((a, b) => a + b, 0) / K;

  return (
    <div className="space-y-3">
      <Plot
        xDomain={SLEEP_X}
        yDomain={SLEEP_Y}
        xLabel="Hours slept"
        yLabel="Exam score"
        label={`Round ${Number(round) + 1} of ${K}: the curve is fitted on the dark points and scored on the highlighted ones.`}
      >
        <FnLine f={model.predict} />
        <Dots points={fold.train} title={(p) => `Used for fitting: ${p.x} h, score ${p.y}`} />
        <Dots points={fold.validation} fill={COLORS.cool} r={6.5} title={(p) => `Held out this round: ${p.x} h, score ${p.y}`} />
      </Plot>

      <Legend
        items={[
          { label: 'Fitted on these', color: COLORS.ink, shape: 'dot' },
          { label: 'Held out this round', color: COLORS.cool, shape: 'dot' },
          { label: 'Curve fitted without them', color: COLORS.accent, shape: 'line' },
        ]}
      />

      <Readout
        items={[
          { label: 'Error this round', value: formatError(errors[Number(round)]) },
          { label: 'All five rounds', value: errors.map((e) => (e >= 1000 ? 'huge' : e.toFixed(0))).join(' · ') },
          { label: 'Average (the CV score)', value: formatError(average), key: true },
        ]}
      />

      <ControlBar>
        <Segmented label="Cross-validation round" options={FOLD_OPTIONS} value={round} onChange={setRound} />
      </ControlBar>
      <ControlBar>
        <Slider label="Flexibility (degree)" value={degree} min={1} max={6} step={1} onChange={setDegree} />
      </ControlBar>
    </div>
  );
}
