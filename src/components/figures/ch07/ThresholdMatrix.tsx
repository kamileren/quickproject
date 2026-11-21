import { useState } from 'react';
import { ILL, patientLabels, patients, patientScores, TOTAL } from '@/data/screening';
import { accuracyOf, confusionAt } from '@/lib/metrics';
import { ControlBar, Readout, Slider } from '../core/Controls';
import { Band, COLORS, Dots, HRule, Plot, PlotLabel, VRule } from '../core/Plot';

interface ThresholdMatrixProps {
  /** Show what each threshold costs when a miss is far worse than a false alarm. */
  showCost?: boolean;
  initialThreshold?: number;
}

export const MISS_COST = 50;
export const ALARM_COST = 1;

// Two rows: healthy patients along the bottom, ill patients along the top.
const row = (ill: number, jitter: number) => (ill ? 1.12 : 0.1) + jitter * 0.78;
const ILL_DOTS = patients.filter((p) => p.ill).map((p) => ({ x: p.score, y: row(1, p.jitter) }));
const HEALTHY_DOTS = patients.filter((p) => !p.ill).map((p) => ({ x: p.score, y: row(0, p.jitter) }));

const Cell = ({ count, name, plain, tone }: { count: number; name: string; plain: string; tone: 'good' | 'bad' }) => (
  <td className={`border border-stone-200 p-3 text-center align-top ${tone === 'bad' ? 'bg-orange-50' : 'bg-white'}`}>
    <div className="font-mono text-xl font-bold text-stone-900 tabular-nums">{count}</div>
    <div className="mt-1 font-sans text-[11px] font-bold text-stone-800">{plain}</div>
    <div className="font-mono text-[9px] tracking-wide text-stone-500 uppercase">{name}</div>
  </td>
);

/**
 * Two hundred patients laid out by risk score, with a movable threshold. The
 * four regions of the picture are the four cells of the confusion matrix.
 */
export default function ThresholdMatrix({ showCost = false, initialThreshold = 0.5 }: ThresholdMatrixProps) {
  const [threshold, setThreshold] = useState(initialThreshold);
  const c = confusionAt(patientLabels, patientScores, threshold);
  const cost = c.fn * MISS_COST + c.fp * ALARM_COST;

  return (
    <div className="space-y-3">
      <Plot
        xDomain={[0, 1]}
        yDomain={[0, 2]}
        xLabel="Risk score from the model"
        aspect={0.42}
        yTicks={0}
        tickFormat={() => ''}
        xTickFormat={(v) => String(+v.toFixed(1))}
        label={`Patients by risk score, ill ones in the top row. With a threshold of ${threshold.toFixed(2)}, ${c.tp} ill patients are caught, ${c.fn} are missed, and ${c.fp} healthy patients are flagged.`}
      >
        <Band from={threshold} to={1} />
        <HRule at={1} stroke={COLORS.axis} strokeWidth={1} />
        <PlotLabel x={0} y={2} dx={6} dy={14} fill={COLORS.muted}>{`ILL (${ILL})`}</PlotLabel>
        <PlotLabel x={0} y={1} dx={6} dy={14} fill={COLORS.muted}>{`HEALTHY (${TOTAL - ILL})`}</PlotLabel>
        <Dots points={HEALTHY_DOTS} hollow r={3.5} title={(p) => `Healthy, score ${p.x.toFixed(2)}`} />
        <Dots points={ILL_DOTS} r={4.5} title={(p) => `Ill, score ${p.x.toFixed(2)}`} />
        <VRule at={threshold} stroke={COLORS.accent} strokeWidth={2} />
        <PlotLabel x={threshold} y={2} dx={6} dy={28}>
          flagged →
        </PlotLabel>
      </Plot>

      <div className="overflow-x-auto">
        <table className="m-0 table w-full border-collapse font-sans whitespace-normal" aria-label="Confusion matrix">
          <thead>
            <tr>
              <td className="border-0" />
              <th scope="col" className="border-0 p-2 text-center font-mono text-[10px] tracking-widest text-stone-500 uppercase">Model: flagged</th>
              <th scope="col" className="border-0 p-2 text-center font-mono text-[10px] tracking-widest text-stone-500 uppercase">Model: cleared</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" className="border-0 p-2 text-right font-mono text-[10px] tracking-widest text-stone-500 uppercase">Really ill</th>
              <Cell count={c.tp} plain="Caught" name="true positive" tone="good" />
              <Cell count={c.fn} plain="Missed" name="false negative" tone="bad" />
            </tr>
            <tr>
              <th scope="row" className="border-0 p-2 text-right font-mono text-[10px] tracking-widest text-stone-500 uppercase">Really healthy</th>
              <Cell count={c.fp} plain="False alarm" name="false positive" tone="bad" />
              <Cell count={c.tn} plain="Correctly cleared" name="true negative" tone="good" />
            </tr>
          </tbody>
        </table>
      </div>

      <Readout
        items={
          showCost
            ? [
                { label: 'Threshold', value: threshold.toFixed(2) },
                { label: `Misses × ${MISS_COST}`, value: String(c.fn * MISS_COST) },
                { label: `False alarms × ${ALARM_COST}`, value: String(c.fp * ALARM_COST) },
                { label: 'Total cost', value: String(cost), key: true },
              ]
            : [
                { label: 'Threshold', value: threshold.toFixed(2) },
                { label: 'Accuracy', value: `${(accuracyOf(c) * 100).toFixed(1)}%`, key: true },
                { label: 'Ill patients missed', value: `${c.fn} of ${ILL}` },
              ]
        }
      />

      <ControlBar>
        <Slider label="Threshold" value={threshold} min={0.05} max={0.95} step={0.05} onChange={setThreshold} format={(v) => v.toFixed(2)} />
      </ControlBar>
    </div>
  );
}
