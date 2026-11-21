import { useState } from 'react';
import { SLEEP_RANGE, STUDY_RANGE, studySleep } from '@/data/pass-fail';
import { ControlBar, Legend, Readout, Slider } from '../core/Controls';
import { COLORS, Dots, Plot, Regions, Segments } from '../core/Plot';

const toPoint = (s: { hours: number; sleep: number }) => ({ x: s.hours, y: s.sleep });
const PASSED = studySleep.filter((s) => s.passed === 1).map(toPoint);
const FAILED = studySleep.filter((s) => s.passed === 0).map(toPoint);

/**
 * A neuron with two inputs, drawn on the plane of those inputs. Its output is
 * positive on one side of a straight line and negative on the other; the
 * weights turn the line and the bias slides it.
 */
export default function NeuronBoundary() {
  const [w1, setW1] = useState(1);
  const [w2, setW2] = useState(1);
  const [b, setB] = useState(-8);
  const z = (hours: number, sleep: number) => w1 * hours + w2 * sleep + b;

  const agrees = studySleep.filter((s) => (z(s.hours, s.sleep) > 0 ? 1 : 0) === s.passed).length;
  const positive = studySleep.filter((s) => z(s.hours, s.sleep) > 0).length;

  // The line where the output is exactly zero, drawn across whichever axis it crosses.
  const line =
    Math.abs(w2) >= Math.abs(w1) && w2 !== 0
      ? [{ from: { x: -5, y: (-b + 5 * w1) / w2 }, to: { x: 15, y: (-b - 15 * w1) / w2 } }]
      : w1 !== 0
        ? [{ from: { x: (-b + 5 * w2) / w1, y: -5 }, to: { x: (-b - 15 * w2) / w1, y: 15 } }]
        : [];

  return (
    <div className="space-y-3">
      <Plot
        xDomain={STUDY_RANGE}
        yDomain={SLEEP_RANGE}
        xLabel="Hours studied"
        yLabel="Hours slept"
        label={`Forty students by hours studied and slept. The neuron's output is positive in the shaded area, which matches pass or fail for ${agrees} of them.`}
      >
        <Regions opacity={(x, y) => (z(x, y) > 0 ? 0.18 : 0)} />
        <Segments segments={line} stroke={COLORS.ink} dashed={false} strokeWidth={2} />
        <Dots points={PASSED} title={(p) => `${p.x} h study, ${p.y} h sleep, passed`} />
        <Dots points={FAILED} hollow title={(p) => `${p.x} h study, ${p.y} h sleep, failed`} />
      </Plot>

      <Legend
        items={[
          { label: 'Shaded: output above zero', color: COLORS.accent, shape: 'dot' },
          { label: 'Line: output exactly zero', color: COLORS.ink, shape: 'line' },
          { label: 'Passed (filled) / failed (hollow)', color: COLORS.ink, shape: 'dot' },
        ]}
      />

      <Readout
        items={[
          { label: 'Output for 4 h study, 7 h sleep', value: z(4, 7).toFixed(1) },
          { label: 'Students with positive output', value: `${positive} of 40` },
          { label: 'Matches pass / fail for', value: `${agrees} of 40`, key: true },
        ]}
      />

      <ControlBar>
        <Slider label="Weight on study" value={w1} min={-2} max={4} step={0.1} onChange={setW1} format={(v) => v.toFixed(1)} />
        <Slider label="Weight on sleep" value={w2} min={-2} max={4} step={0.1} onChange={setW2} format={(v) => v.toFixed(1)} />
      </ControlBar>
      <ControlBar>
        <Slider label="Bias" value={b} min={-40} max={10} step={0.5} onChange={setB} format={(v) => v.toFixed(1)} />
      </ControlBar>
    </div>
  );
}
