import { useState } from 'react';
import { predictProba } from '@/lib/classify';
import { ControlBar, Readout, Slider } from '../core/Controls';
import { COLORS, Dots, FnLine, HRule, Plot, VRule } from '../core/Plot';
import { dotTitle, FAILED, HOURS, PASSED, PROB } from './shared';

/**
 * The two numbers of logistic regression, w and b, and what each does to the
 * S-curve: w sets how sharp the rise is, and together they set where it happens.
 */
export default function SigmoidExplorer() {
  const [w, setW] = useState(0.6);
  const [b, setB] = useState(-4);
  const weights = [b, w];
  const midpoint = -b / w;
  const onChart = midpoint >= HOURS[0] && midpoint <= HOURS[1];

  return (
    <div className="space-y-3">
      <Plot
        xDomain={HOURS}
        yDomain={PROB}
        xLabel="Hours studied"
        yLabel="Chance of passing"
        yTicks={6}
        label={`The curve sigmoid of ${w.toFixed(2)} times hours plus ${b.toFixed(1)}. It crosses one half at ${midpoint.toFixed(1)} hours.`}
      >
        <HRule at={0} stroke={COLORS.axis} strokeWidth={1} />
        <HRule at={1} stroke={COLORS.axis} strokeWidth={1} />
        <HRule at={0.5} stroke={COLORS.faint} dashed strokeWidth={1} />
        {onChart && <VRule at={midpoint} stroke={COLORS.faint} dashed strokeWidth={1} />}
        <FnLine f={(x) => predictProba(weights, [x])} />
        <Dots points={PASSED} title={dotTitle(true)} />
        <Dots points={FAILED} hollow title={dotTitle(false)} />
      </Plot>

      <Readout
        items={[
          { label: 'Score at 4.5 h: w·x + b', value: (w * 4.5 + b).toFixed(2) },
          { label: 'Chance of passing at 4.5 h', value: `${(predictProba(weights, [4.5]) * 100).toFixed(0)}%`, key: true },
          { label: 'Curve crosses 50% at', value: onChart ? `${midpoint.toFixed(1)} hours` : 'off the chart' },
        ]}
      />

      <ControlBar>
        <Slider label="Weight w" value={w} min={0.1} max={4} step={0.05} onChange={setW} format={(v) => v.toFixed(2)} />
        <Slider label="Bias b" value={b} min={-16} max={2} step={0.1} onChange={setB} format={(v) => v.toFixed(1)} />
      </ControlBar>
    </div>
  );
}
