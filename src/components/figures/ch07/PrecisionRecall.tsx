import { useMemo, useState } from 'react';
import { patientLabels, patientScores } from '@/data/screening';
import { confusionAt, f1, precision, recall } from '@/lib/metrics';
import { ControlBar, Legend, Readout, Slider } from '../core/Controls';
import { COLORS, Dots, Plot, PlotLabel, Polyline, VRule } from '../core/Plot';

const THRESHOLDS = Array.from({ length: 91 }, (_, i) => +(0.05 + i * 0.01).toFixed(2));

/** Precision and recall against the threshold: as one rises the other falls. */
export default function PrecisionRecall() {
  const [threshold, setThreshold] = useState(0.5);
  const rows = useMemo(
    () =>
      THRESHOLDS.map((t) => {
        const c = confusionAt(patientLabels, patientScores, t);
        return { t, precision: precision(c), recall: recall(c), f1: f1(c) };
      }),
    [],
  );
  const c = confusionAt(patientLabels, patientScores, threshold);
  const pct = (v: number) => `${(v * 100).toFixed(0)}%`;

  return (
    <div className="space-y-3">
      <Plot
        xDomain={[0.05, 0.95]}
        yDomain={[0, 1.05]}
        xLabel="Threshold"
        yLabel="Share"
        aspect={0.5}
        label={`Precision and recall for every threshold. At ${threshold.toFixed(2)}, precision is ${pct(precision(c))} and recall is ${pct(recall(c))}.`}
      >
        <VRule at={threshold} stroke={COLORS.faint} dashed strokeWidth={1} />
        <Polyline points={rows.map((r) => ({ x: r.t, y: r.f1 }))} stroke={COLORS.faint} strokeWidth={1.5} />
        <Polyline points={rows.map((r) => ({ x: r.t, y: r.recall }))} stroke={COLORS.cool} />
        <Polyline points={rows.map((r) => ({ x: r.t, y: r.precision }))} stroke={COLORS.accent} />
        <Dots points={[{ x: threshold, y: recall(c) }]} fill={COLORS.cool} r={5} />
        <Dots points={[{ x: threshold, y: precision(c) }]} fill={COLORS.accent} r={5} />
        <PlotLabel x={0.12} y={rows[7].recall} dx={0} dy={16}>
          recall
        </PlotLabel>
        <PlotLabel x={0.12} y={rows[7].precision} dx={0} dy={-8}>
          precision
        </PlotLabel>
      </Plot>

      <Legend
        items={[
          { label: 'Precision: of those flagged, how many are ill', color: COLORS.accent, shape: 'line' },
          { label: 'Recall: of those ill, how many are flagged', color: COLORS.cool, shape: 'line' },
          { label: 'F1', color: COLORS.faint, shape: 'line' },
        ]}
      />

      <Readout
        items={[
          { label: 'Flagged', value: String(c.tp + c.fp) },
          { label: 'Precision', value: `${c.tp} of ${c.tp + c.fp} = ${pct(precision(c))}`, key: true },
          { label: 'Recall', value: `${c.tp} of ${c.tp + c.fn} = ${pct(recall(c))}`, key: true },
          { label: 'F1', value: f1(c).toFixed(2) },
        ]}
      />

      <ControlBar>
        <Slider label="Threshold" value={threshold} min={0.05} max={0.95} step={0.05} onChange={setThreshold} format={(v) => v.toFixed(2)} />
      </ControlBar>
    </div>
  );
}
