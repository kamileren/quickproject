import { useMemo, useRef, useState } from 'react';
import { examPoints, EXAM_X, EXAM_Y } from '@/data/exam-scores';
import type { Line } from '@/lib/linear';
import { gradientStep, lossContour } from '@/lib/optimize';
import { mulberry32, shuffled } from '@/lib/random';
import { ControlBar, Legend, Readout, Segmented, Slider, StepControls } from '../core/Controls';
import { COLORS, Dots, DragHandle, FnLine, Plot, PlotLabel, Polyline } from '../core/Plot';
import { useTicker } from '../core/useTicker';
import { BEST, BEST_LOSS, B_RANGE, formatLoss, loss, POINTS, predictHours, START, W_RANGE } from './shared';

interface DescentProps {
  /** Let the reader choose how many students each step looks at. */
  allowBatch?: boolean;
  initialRate?: number;
}

const MAX_STEPS = 150;
const LEVELS = [10, 25, 60, 120, 220, 360, 560, 820];
const BATCH_OPTIONS = [
  { value: '12', label: 'All 12 students' },
  { value: '4', label: '4 at random' },
  { value: '1', label: '1 at random' },
];

/**
 * Gradient descent on the exam data, shown two ways at once: the line moving
 * through the data, and the same run as a path on the map of the loss.
 */
export default function Descent({ allowBatch = false, initialRate = 0.05 }: DescentProps) {
  const [path, setPath] = useState<Line[]>([START]);
  const [eta, setEta] = useState(initialRate);
  const [playing, setPlaying] = useState(false);
  const [batch, setBatch] = useState('12');
  const rand = useRef(mulberry32(3));

  const current = path[path.length - 1];
  const steps = path.length - 1;
  const currentLoss = loss(current);
  const diverged = !Number.isFinite(currentLoss) || currentLoss > 5000;
  const done = steps >= MAX_STEPS || diverged;

  const contours = useMemo(() => LEVELS.map((level) => lossContour(POINTS, level).map((l) => ({ x: l.w, y: l.b }))), []);

  const advance = () => {
    if (done) {
      setPlaying(false);
      return;
    }
    const size = Number(batch);
    const sample = size >= POINTS.length ? POINTS : shuffled(POINTS, rand.current).slice(0, size);
    setPath((p) => [...p, gradientStep(sample, p[p.length - 1], eta)]);
  };
  useTicker(playing, advance, 90);

  const reset = (start: Line = START) => {
    setPlaying(false);
    rand.current = mulberry32(3);
    setPath([start]);
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <Plot
          xDomain={EXAM_X}
          yDomain={EXAM_Y}
          xLabel="Hours studied"
          yLabel="Exam score"
          aspect={0.8}
          maxHeight={320}
          label="The exam data and the current line."
        >
          <FnLine f={(x) => predictHours(BEST, x)} stroke={COLORS.ink} strokeWidth={1} dashed opacity={0.5} />
          <FnLine f={(x) => predictHours(current, x)} />
          <Dots points={examPoints} r={3.5} />
        </Plot>

        <Plot
          xDomain={W_RANGE}
          yDomain={B_RANGE}
          xLabel="Slope w"
          yLabel="Bias b"
          aspect={0.8}
          maxHeight={320}
          label="A map of the error for every slope and bias. Rings are lines of equal error; the centre is the lowest point."
        >
          {contours.map((ring, i) => (
            <Polyline key={LEVELS[i]} points={ring} stroke={COLORS.faint} strokeWidth={1} opacity={0.9 - i * 0.07} />
          ))}
          <Dots points={[{ x: BEST.w, y: BEST.b }]} hollow fill={COLORS.ink} r={4} />
          <PlotLabel x={BEST.w} y={BEST.b} dx={8} dy={-8}>
            lowest
          </PlotLabel>
          <Polyline points={path.map((l) => ({ x: l.w, y: l.b }))} strokeWidth={1.5} />
          {steps === 0 ? (
            <DragHandle x={current.w} y={current.b} label="Starting point on the error map" onChange={(p) => setPath([{ w: p.x, b: p.y }])} />
          ) : (
            <Dots points={[{ x: current.w, y: current.b }]} fill={COLORS.accent} r={5.5} />
          )}
        </Plot>
      </div>

      <Legend
        items={[
          { label: 'Current line / position', color: COLORS.accent, shape: 'line' },
          { label: 'Best line', color: COLORS.ink, shape: 'dash' },
          { label: 'Equal error', color: COLORS.faint, shape: 'line' },
        ]}
      />

      <Readout
        items={[
          { label: 'Step', value: String(steps) },
          { label: 'Slope w', value: Math.abs(current.w) > 999 ? 'huge' : current.w.toFixed(2) },
          { label: 'Bias b', value: Math.abs(current.b) > 999 ? 'huge' : current.b.toFixed(1) },
          { label: diverged ? 'Error (diverged)' : 'Error', value: formatLoss(currentLoss), key: true },
        ]}
      />

      <ControlBar>
        <StepControls
          playing={playing}
          canAdvance={!done}
          onPlayPause={() => setPlaying((p) => !p)}
          onStep={advance}
          onReset={() => reset()}
        />
        <Slider
          label="Learning rate η"
          ariaLabel="Learning rate eta"
          value={eta}
          min={0.005}
          max={0.2}
          step={0.005}
          onChange={setEta}
          format={(v) => v.toFixed(3)}
        />
      </ControlBar>

      {allowBatch && (
        <ControlBar>
          <span className="font-mono text-[11px] text-stone-500">Each step looks at</span>
          <Segmented
            label="Students used per step"
            options={BATCH_OPTIONS}
            value={batch}
            onChange={(v) => {
              setBatch(v);
              reset();
            }}
          />
        </ControlBar>
      )}

      <p className="font-mono text-[10px] text-stone-500">
        {steps === 0
          ? 'Before the first step you can drag the orange dot on the map to start somewhere else.'
          : diverged
            ? 'The error exploded: every step overshot further than the last. Reset and try a smaller learning rate.'
            : `Lowest possible error is ${BEST_LOSS.toFixed(1)}.`}
      </p>
    </div>
  );
}
