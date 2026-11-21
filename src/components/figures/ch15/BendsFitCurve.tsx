import { useMemo, useState } from 'react';
import { SLEEP_X, SLEEP_Y, trueSleepCurve } from '@/data/sleep-scores';
import { fitHinges } from '@/lib/hinges';
import { ControlBar, Legend, Readout, Slider } from '../core/Controls';
import { COLORS, Dots, FnLine, Plot } from '../core/Plot';

/**
 * A curve built from ReLU hinges, one per hidden neuron. More neurons give
 * more bends, and the sum hugs the target more closely.
 */
export default function BendsFitCurve() {
  const [count, setCount] = useState(1);
  const [showParts, setShowParts] = useState(true);
  const fit = useMemo(() => fitHinges(trueSleepCurve, SLEEP_X[0], SLEEP_X[1], count), [count]);

  return (
    <div className="space-y-3">
      <Plot
        xDomain={SLEEP_X}
        yDomain={SLEEP_Y}
        xLabel="Hours slept"
        yLabel="Exam score"
        label={`The sleep-and-score curve approximated by ${count} ReLU hinge${count === 1 ? '' : 's'}. The largest gap is ${fit.worstGap.toFixed(1)} points.`}
      >
        {showParts &&
          fit.kinks.map((_, i) => (
            <FnLine key={i} f={(x) => fit.bias + fit.part(i, x)} stroke={COLORS.cool} strokeWidth={1} opacity={0.45} samples={200} />
          ))}
        <FnLine f={trueSleepCurve} stroke={COLORS.ink} strokeWidth={1.5} dashed />
        <FnLine f={fit.predict} strokeWidth={2.5} samples={300} />
        <Dots points={fit.kinks.map((k) => ({ x: k, y: fit.predict(k) }))} fill={COLORS.accent} r={3.5} />
      </Plot>

      <Legend
        items={[
          { label: 'Target curve', color: COLORS.ink, shape: 'dash' },
          { label: 'Sum of all the hinges', color: COLORS.accent, shape: 'line' },
          ...(showParts ? [{ label: 'Each hinge on its own', color: COLORS.cool, shape: 'line' as const }] : []),
        ]}
      />

      <Readout
        items={[
          { label: 'Hidden neurons (hinges)', value: String(count) },
          { label: 'Straight pieces', value: String(count) },
          { label: 'Largest gap from the target', value: `${fit.worstGap.toFixed(1)} points`, key: true },
        ]}
      />

      <ControlBar>
        <Slider label="Hidden neurons" value={count} min={1} max={12} step={1} onChange={setCount} />
        <button type="button" className="btn btn-secondary btn-small" aria-pressed={showParts} onClick={() => setShowParts((s) => !s)}>
          {showParts ? 'Hide single hinges' : 'Show single hinges'}
        </button>
      </ControlBar>
    </div>
  );
}
