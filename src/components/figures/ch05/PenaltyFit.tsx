import { useMemo, useState } from 'react';
import { sleepTest, sleepTrain, SLEEP_X, SLEEP_Y } from '@/data/sleep-scores';
import { pointsMse } from '@/lib/poly';
import { ControlBar, Legend, Readout, Slider } from '../core/Controls';
import { COLORS, Dots, FnLine, Plot } from '../core/Plot';
import { formatError } from '../ch04/shared';
import { DEGREE, fitPenalised, formatLambda, LOG_MAX, LOG_MIN, toLambda } from './shared';

/**
 * The wild degree-9 curve from the last chapter, with a ridge penalty the
 * reader can turn up. The curve calms down long before the fit gets bad.
 */
export default function PenaltyFit() {
  const [on, setOn] = useState(false);
  const [exponent, setExponent] = useState(-2);
  const lambda = on ? toLambda(exponent) : 0;

  const model = useMemo(() => fitPenalised(on ? 'ridge' : 'none', lambda), [on, lambda]);
  const plain = useMemo(() => fitPenalised('none', 0), []);
  const largest = Math.max(...model.weights.map(Math.abs));

  return (
    <div className="space-y-3">
      <Plot
        xDomain={SLEEP_X}
        yDomain={SLEEP_Y}
        xLabel="Hours slept"
        yLabel="Exam score"
        label={`A degree ${DEGREE} curve fitted to the sleep data with penalty strength ${formatLambda(lambda)}.`}
      >
        {on && <FnLine f={plain.predict} stroke={COLORS.faint} strokeWidth={1.5} dashed />}
        <FnLine f={model.predict} />
        <Dots points={sleepTest} fill={COLORS.cool} hollow r={4} title={(p) => `New student: ${p.x} h, score ${p.y}`} />
        <Dots points={sleepTrain} title={(p) => `${p.x} h, score ${p.y}`} />
      </Plot>

      <Legend
        items={[
          { label: 'Fitted students', color: COLORS.ink, shape: 'dot' },
          { label: 'New students (hollow)', color: COLORS.cool, shape: 'dot' },
          { label: on ? 'With penalty' : 'No penalty', color: COLORS.accent, shape: 'line' },
          ...(on ? [{ label: 'Without penalty', color: COLORS.faint, shape: 'dash' as const }] : []),
        ]}
      />

      <Readout
        items={[
          { label: 'Penalty λ', value: formatLambda(lambda) },
          { label: 'Largest weight', value: largest >= 100 ? largest.toFixed(0) : largest.toFixed(1) },
          { label: 'Error on fitted students', value: formatError(pointsMse(sleepTrain, model.predict)) },
          { label: 'Error on new students', value: formatError(pointsMse(sleepTest, model.predict)), key: true },
        ]}
      />

      <ControlBar>
        <button type="button" className="btn btn-primary btn-small" aria-pressed={on} onClick={() => setOn((v) => !v)}>
          {on ? 'Remove the penalty' : 'Add a penalty'}
        </button>
        <Slider
          label="Penalty strength λ"
          ariaLabel="Penalty strength lambda"
          value={exponent}
          min={LOG_MIN}
          max={LOG_MAX}
          step={0.1}
          disabled={!on}
          onChange={setExponent}
          format={(e) => formatLambda(toLambda(e))}
        />
      </ControlBar>
    </div>
  );
}
