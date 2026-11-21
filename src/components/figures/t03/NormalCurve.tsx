import { useState } from 'react';
import { normalCdf, normalPdf } from '@/lib/prob';
import { ControlBar, Readout, Segmented, Slider } from '../core/Controls';
import { Band, COLORS, FnLine, Plot, VRule } from '../core/Plot';

const X: [number, number] = [20, 110];
const SPAN_OPTIONS = [
  { value: '1', label: 'Within 1 spread' },
  { value: '2', label: 'Within 2' },
  { value: '3', label: 'Within 3' },
];

/** The bell curve for exam scores, with its centre and spread under the reader's control. */
export default function NormalCurve() {
  const [mean, setMean] = useState(67);
  const [sd, setSd] = useState(10);
  const [span, setSpan] = useState('1');
  const k = Number(span);
  const lo = mean - k * sd;
  const hi = mean + k * sd;
  const share = normalCdf(hi, mean, sd) - normalCdf(lo, mean, sd);

  return (
    <div className="space-y-3">
      <Plot
        xDomain={X}
        yDomain={[0, 0.105]}
        xLabel="Exam score"
        yLabel="How common"
        aspect={0.5}
        yTicks={0}
        tickFormat={() => ''}
        xTickFormat={(v) => String(v)}
        label={`A bell curve centred on ${mean} with a spread of ${sd}. ${(share * 100).toFixed(0)} percent of scores fall between ${lo.toFixed(0)} and ${hi.toFixed(0)}.`}
      >
        <Band from={lo} to={hi} opacity={0.14} />
        <VRule at={mean} stroke={COLORS.faint} dashed strokeWidth={1} />
        <FnLine f={(x) => normalPdf(x, mean, sd)} stroke={COLORS.ink} samples={240} />
      </Plot>

      <Readout
        items={[
          { label: 'Average (centre)', value: String(mean) },
          { label: 'Standard deviation (spread)', value: String(sd) },
          { label: `Scores from ${lo.toFixed(0)} to ${hi.toFixed(0)}`, value: `${(share * 100).toFixed(1)}%`, key: true },
        ]}
      />

      <ControlBar>
        <Slider label="Average" value={mean} min={45} max={85} step={1} onChange={setMean} />
        <Slider label="Spread" value={sd} min={4} max={18} step={1} onChange={setSd} />
      </ControlBar>
      <ControlBar>
        <Segmented label="Shaded range" options={SPAN_OPTIONS} value={span} onChange={setSpan} />
      </ControlBar>
    </div>
  );
}
