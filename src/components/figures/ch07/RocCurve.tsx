import { useMemo, useState } from 'react';
import { patientLabels, patientScores } from '@/data/screening';
import { auc, confusionAt, falsePositiveRate, recall, rocCurve } from '@/lib/metrics';
import { ControlBar, Legend, Readout, Slider } from '../core/Controls';
import { COLORS, Dots, FnLine, Plot, PlotLabel, Polyline } from '../core/Plot';

/** The ROC curve: every threshold as one point, with the reader's threshold highlighted. */
export default function RocCurve() {
  const [threshold, setThreshold] = useState(0.5);
  const curve = useMemo(() => rocCurve(patientLabels, patientScores).map((p) => ({ x: p.fpr, y: p.tpr })), []);
  const area = useMemo(() => auc(patientLabels, patientScores), []);
  const c = confusionAt(patientLabels, patientScores, threshold);
  const here = { x: falsePositiveRate(c), y: recall(c) };
  const pct = (v: number) => `${(v * 100).toFixed(0)}%`;

  return (
    <div className="space-y-3">
      <Plot
        xDomain={[0, 1]}
        yDomain={[0, 1.02]}
        xLabel="False alarms: share of healthy patients flagged"
        yLabel="Share of ill caught"
        aspect={0.7}
        maxHeight={400}
        label={`ROC curve for the screening model, area ${area.toFixed(2)}. At threshold ${threshold.toFixed(2)} it catches ${pct(here.y)} of ill patients and flags ${pct(here.x)} of healthy ones.`}
      >
        <FnLine f={(x) => x} stroke={COLORS.faint} dashed strokeWidth={1.5} />
        <PlotLabel x={0.6} y={0.6} dx={8} dy={14} fill={COLORS.muted}>
          guessing at random
        </PlotLabel>
        <Polyline points={curve} strokeWidth={2.5} />
        <PlotLabel x={0} y={1} dx={8} dy={16} fill={COLORS.muted}>
          ← perfect is this corner
        </PlotLabel>
        <Dots points={[here]} fill={COLORS.ink} r={6.5} />
        <PlotLabel x={here.x} y={here.y} dx={12} dy={16}>{`threshold ${threshold.toFixed(2)}`}</PlotLabel>
      </Plot>

      <Legend
        items={[
          { label: 'This model, every threshold', color: COLORS.accent, shape: 'line' },
          { label: 'Your threshold', color: COLORS.ink, shape: 'dot' },
          { label: 'A model that guesses', color: COLORS.faint, shape: 'dash' },
        ]}
      />

      <Readout
        items={[
          { label: 'Threshold', value: threshold.toFixed(2) },
          { label: 'Ill patients caught', value: pct(here.y) },
          { label: 'Healthy patients flagged', value: pct(here.x) },
          { label: 'Area under the curve', value: area.toFixed(3), key: true },
        ]}
      />

      <ControlBar>
        <Slider label="Threshold" value={threshold} min={0.05} max={0.95} step={0.05} onChange={setThreshold} format={(v) => v.toFixed(2)} />
      </ControlBar>
    </div>
  );
}
