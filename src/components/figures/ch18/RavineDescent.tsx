import { useMemo, useState } from 'react';
import { Adam, RMSProp, SGD, type Optimizer } from '@/lib/nn';
import { descendRavine, RAVINE_START, RAVINE_X, RAVINE_Y, ravineContour, ravineHeight, stepsToReach, type Spot } from '@/lib/ravine';
import { ControlBar, Legend, Readout, Slider, StepControls } from '../core/Controls';
import { COLORS, Dots, Plot, PlotLabel, Polyline, SERIES } from '../core/Plot';
import { useTicker } from '../core/useTicker';

interface RavineDescentProps {
  /**
   * rate:     plain gradient descent with a learning-rate slider
   * decay:    a slightly-too-large learning rate, with a decay slider
   * momentum: a cautious learning rate, with a momentum slider
   * race:     four optimizers side by side, stepped by the reader
   */
  mode: 'rate' | 'decay' | 'momentum' | 'race';
}

const STEPS = 100;
const NEAR_BOTTOM = 0.05;
const LEVELS = [0.25, 1, 2.5, 5, 9, 14];
const RINGS = LEVELS.map((h) => ravineContour(h));

const RACERS: { name: string; setting: string; make: () => Optimizer }[] = [
  { name: 'Plain SGD', setting: 'rate 0.1', make: () => new SGD({ learningRate: 0.1 }) },
  { name: 'Momentum', setting: 'rate 0.1, momentum 0.9', make: () => new SGD({ learningRate: 0.1, momentum: 0.9 }) },
  { name: 'RMSProp', setting: 'rate 0.3', make: () => new RMSProp({ learningRate: 0.3 }) },
  { name: 'Adam', setting: 'rate 0.5', make: () => new Adam({ learningRate: 0.5 }) },
];

const height = (p: Spot | undefined) => (p ? ravineHeight(p) : Infinity);
const formatHeight = (h: number) => (!Number.isFinite(h) ? 'blew up' : h >= 100 ? h.toFixed(0) : h.toFixed(3));

function Surface({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <Plot xDomain={RAVINE_X} yDomain={RAVINE_Y} xLabel="Weight 1 (shallow direction)" yLabel="Weight 2 (steep)" aspect={0.5} label={label}>
      {RINGS.map((ring, i) => (
        <Polyline key={LEVELS[i]} points={ring} stroke={COLORS.faint} strokeWidth={1} opacity={0.9 - i * 0.1} />
      ))}
      <Dots points={[{ x: 0, y: 0 }]} hollow fill={COLORS.ink} r={4} />
      <PlotLabel x={0} y={0} dx={8} dy={-8}>
        lowest
      </PlotLabel>
      {children}
    </Plot>
  );
}

/** Optimizers finding their way down a long, narrow valley. */
export default function RavineDescent({ mode }: RavineDescentProps) {
  const [rate, setRate] = useState(0.1);
  const [decay, setDecay] = useState(0);
  const [momentum, setMomentum] = useState(0);
  const [shown, setShown] = useState(0);
  const [playing, setPlaying] = useState(false);

  const single = useMemo(() => {
    if (mode === 'race') return null;
    const optimizer =
      mode === 'rate' ? new SGD({ learningRate: rate }) : mode === 'decay' ? new SGD({ learningRate: 0.98, decay }) : new SGD({ learningRate: 0.1, momentum });
    return descendRavine(optimizer, STEPS);
  }, [mode, rate, decay, momentum]);

  const races = useMemo(() => (mode === 'race' ? RACERS.map((r) => descendRavine(r.make(), STEPS)) : []), [mode]);
  useTicker(playing, () => setShown((s) => (s >= STEPS ? (setPlaying(false), s) : s + 1)), 70);

  if (single) {
    const reached = stepsToReach(single, NEAR_BOTTOM);
    const blewUp = single.length <= STEPS || height(single[single.length - 1]) > 50;
    const verdict = blewUp ? 'Diverges' : reached === null ? `Not there after ${STEPS} steps` : `Near the bottom in ${reached} steps`;
    return (
      <div className="space-y-3">
        <Surface label={`A path of ${single.length - 1} steps down a narrow valley. ${verdict}.`}>
          <Polyline points={single} strokeWidth={1.5} />
          <Dots points={single.slice(0, 40)} fill={COLORS.accent} r={2.5} />
          <Dots points={[RAVINE_START]} fill={COLORS.ink} r={5} />
        </Surface>

        <Readout
          items={[
            { label: 'Height after 10 steps', value: formatHeight(height(single[10])) },
            { label: `Height after ${STEPS} steps`, value: formatHeight(height(single[STEPS])) },
            { label: 'Verdict', value: verdict, key: true },
          ]}
        />

        <ControlBar>
          {mode === 'rate' && <Slider label="Learning rate" value={rate} min={0.05} max={1.05} step={0.01} onChange={setRate} format={(v) => v.toFixed(2)} />}
          {mode === 'decay' && <Slider label="Decay (rate starts at 0.98)" value={decay} min={0} max={0.2} step={0.005} onChange={setDecay} format={(v) => v.toFixed(3)} />}
          {mode === 'momentum' && <Slider label="Momentum (rate is 0.1)" value={momentum} min={0} max={0.98} step={0.01} onChange={setMomentum} format={(v) => v.toFixed(2)} />}
        </ControlBar>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Surface label={`Four optimizers descending the same valley, after ${shown} steps.`}>
        {races.map((path, i) => (
          <Polyline key={RACERS[i].name} points={path.slice(0, shown + 1)} stroke={SERIES[i]} strokeWidth={2} />
        ))}
        {races.map((path, i) => (
          <Dots key={RACERS[i].name} points={[path[Math.min(shown, path.length - 1)]]} fill={SERIES[i]} r={5} />
        ))}
      </Surface>

      <Legend items={RACERS.map((r, i) => ({ label: `${r.name} (${r.setting})`, color: SERIES[i], shape: 'line' as const }))} />

      <Readout
        items={RACERS.map((r, i) => {
          const reached = stepsToReach(races[i].slice(0, shown + 1), NEAR_BOTTOM);
          return { label: r.name, value: reached === null ? `height ${formatHeight(height(races[i][shown]))}` : `there in ${reached} steps`, key: reached !== null };
        })}
      />

      <ControlBar>
        <StepControls
          playing={playing}
          canAdvance={shown < STEPS}
          onPlayPause={() => setPlaying((p) => !p)}
          onStep={() => setShown((s) => Math.min(STEPS, s + 1))}
          onReset={() => {
            setPlaying(false);
            setShown(0);
          }}
          playLabel="Race"
        />
        <span className="font-mono text-[10px] text-stone-500">Step {shown} of {STEPS}</span>
      </ControlBar>
    </div>
  );
}
