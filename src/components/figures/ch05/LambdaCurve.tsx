import { useMemo, useState } from 'react';
import type { Penalty } from '@/lib/poly';
import { ControlBar, Legend, Readout, Segmented, Slider } from '../core/Controls';
import { COLORS, Dots, Plot, PlotLabel, Polyline, VRule } from '../core/Plot';
import { formatError } from '../ch04/shared';
import { cvError, formatLambda, LOG_MAX, LOG_MIN, PENALTY_OPTIONS, testError, toLambda, trainError } from './shared';

const Y_MAX = 160;
const STEP = 0.1;
const EXPONENTS = Array.from({ length: Math.round((LOG_MAX - LOG_MIN) / STEP) + 1 }, (_, i) => +(LOG_MIN + i * STEP).toFixed(1));

/**
 * Error against penalty strength. Cross-validation, computed from the
 * training students alone, picks a λ close to the one the new students prefer.
 */
export default function LambdaCurve() {
  const [penalty, setPenalty] = useState<Penalty>('ridge');
  const [exponent, setExponent] = useState(0);

  const rows = useMemo(
    () =>
      EXPONENTS.map((e) => {
        const lambda = toLambda(e);
        return { e, train: trainError(penalty, lambda), cv: cvError(penalty, lambda), test: testError(penalty, lambda) };
      }),
    [penalty],
  );
  const best = rows.reduce((a, b) => (b.cv < a.cv ? b : a));
  const row = rows.find((r) => Math.abs(r.e - exponent) < 1e-9) ?? rows[0];
  const cap = (v: number) => Math.min(v, Y_MAX * 2);

  return (
    <div className="space-y-3">
      <Plot
        xDomain={[LOG_MIN, LOG_MAX]}
        yDomain={[0, Y_MAX]}
        xLabel="Penalty strength λ"
        yLabel="Error (MSE)"
        aspect={0.5}
        xTicks={5}
        xTickFormat={(v) => (Number.isInteger(v) ? String(10 ** v) : '')}
        label={`Error against ${penalty} penalty strength. Cross-validation is lowest at λ = ${formatLambda(toLambda(best.e))}.`}
      >
        <VRule at={best.e} stroke={COLORS.faint} dashed strokeWidth={1} />
        <PlotLabel x={best.e} y={Y_MAX} dx={6} dy={14}>
          chosen by cross-validation
        </PlotLabel>
        <Polyline points={rows.map((r) => ({ x: r.e, y: cap(r.train) }))} stroke={COLORS.ink} />
        <Polyline points={rows.map((r) => ({ x: r.e, y: cap(r.test) }))} stroke={COLORS.cool} />
        <Polyline points={rows.map((r) => ({ x: r.e, y: cap(r.cv) }))} stroke={COLORS.accent} strokeWidth={2.5} />
        <Dots points={[{ x: row.e, y: Math.min(row.cv, Y_MAX) }]} fill={COLORS.accent} r={5.5} />
      </Plot>

      <Legend
        items={[
          { label: 'Cross-validation', color: COLORS.accent, shape: 'line' },
          { label: 'New students', color: COLORS.cool, shape: 'line' },
          { label: 'Fitted students', color: COLORS.ink, shape: 'line' },
        ]}
      />

      <Readout
        items={[
          { label: 'Penalty λ', value: formatLambda(toLambda(exponent)) },
          { label: 'Cross-validation', value: formatError(row.cv), key: true },
          { label: 'New students', value: formatError(row.test) },
          { label: 'Fitted students', value: formatError(row.train) },
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
          step={STEP}
          onChange={(v) => setExponent(+v.toFixed(1))}
          format={(e) => formatLambda(toLambda(e))}
        />
      </ControlBar>
    </div>
  );
}
