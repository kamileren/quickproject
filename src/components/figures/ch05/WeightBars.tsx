import { useMemo, useState } from 'react';
import type { Penalty } from '@/lib/poly';
import { ControlBar, Readout, Segmented, Slider } from '../core/Controls';
import { Bars, COLORS, Dots, HRule, Plot } from '../core/Plot';
import { formatError } from '../ch04/shared';
import { DEGREE, fitPenalised, formatLambda, LOG_MAX, LOG_MIN, PENALTY_OPTIONS, testError, toLambda } from './shared';

const Y: [number, number] = [-8, 8];

/**
 * The nine weights of the degree-9 model as bars. Ridge shrinks them all
 * together; lasso switches them off one by one.
 */
export default function WeightBars() {
  const [penalty, setPenalty] = useState<Penalty>('ridge');
  const [exponent, setExponent] = useState(-1);
  const lambda = toLambda(exponent);

  const model = useMemo(() => fitPenalised(penalty, lambda), [penalty, lambda]);
  const bars = model.weights.map((w, j) => ({ x: j + 1, y: w }));
  const zeros = bars.filter((b) => b.y === 0);
  const total = model.weights.reduce((s, w) => s + Math.abs(w), 0);
  const clipped = model.weights.some((w) => Math.abs(w) > Y[1]);

  return (
    <div className="space-y-3">
      <Plot
        xDomain={[0.4, DEGREE + 0.6]}
        yDomain={Y}
        xLabel="Feature (power of x)"
        yLabel="Weight"
        aspect={0.5}
        xTicks={9}
        label={`The nine weights of the model under a ${penalty} penalty of strength ${formatLambda(lambda)}. ${zeros.length} are exactly zero.`}
      >
        <HRule at={0} stroke={COLORS.axis} strokeWidth={1} />
        <Bars bars={bars} title={(b) => `Weight on x to the power ${b.x}: ${b.y.toFixed(2)}`} />
        {/* A ring on the zero line marks a weight that has been switched off completely. */}
        <Dots points={zeros} hollow fill={COLORS.accent} r={5} title={(p) => `Weight ${p.x} is exactly zero`} />
      </Plot>

      <Readout
        items={[
          { label: 'Penalty λ', value: formatLambda(lambda) },
          { label: 'Weights at exactly zero', value: `${zeros.length} of ${DEGREE}`, key: true },
          { label: 'Total size of weights', value: total >= 100 ? total.toFixed(0) : total.toFixed(1) },
          { label: 'Error on new students', value: formatError(testError(penalty, lambda)) },
        ]}
      />

      <ControlBar>
        <Segmented label="Kind of penalty" options={PENALTY_OPTIONS} value={penalty} onChange={setPenalty} />
        <Slider
          label="Penalty strength λ"
          ariaLabel="Penalty strength lambda"
          value={exponent}
          min={LOG_MIN}
          max={LOG_MAX}
          step={0.1}
          onChange={setExponent}
          format={(e) => formatLambda(toLambda(e))}
        />
      </ControlBar>

      <p className="font-mono text-[10px] text-stone-500">
        An orange ring marks a weight that is exactly zero.
        {clipped ? ' Some bars run off the chart: those weights are larger than 8.' : ''}
      </p>
    </div>
  );
}
