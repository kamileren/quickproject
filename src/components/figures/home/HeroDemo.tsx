import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { examPoints, EXAM_X, EXAM_Y } from '@/data/exam-scores';
import { moonsTrain, toLabels, toRows, TOY_RANGE } from '@/data/toy2d';
import { nearest } from '@/lib/knn';
import { fitLine, lineMse, predict, type Line } from '@/lib/linear';
import { Slider } from '../core/Controls';
import { Band, COLORS, Dots, DragHandle, FnLine, Plot, Polyline, Segments, VRule } from '../core/Plot';

/**
 * The cover's taste of the book. One of several small figures is shown, a
 * different one on each visit, and the reader can ask for another. Each has a
 * goal that takes a few seconds to reach, and reaching it names the idea and
 * links to its chapter.
 */

const ROTATION_KEY = 'book-of-ml:cover-demo';

interface DemoProps {
  /** Address of the chapter this figure comes from. */
  url: string;
}

/** The line of text under a figure: an instruction, encouragement, or the pay-off. */
function Message({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 min-h-[4.5rem] font-serif text-[15px] leading-relaxed text-stone-700 sm:min-h-12" aria-live="polite">
      {children}
    </p>
  );
}

function ChapterLink({ url, children }: { url: string; children: ReactNode }) {
  return (
    <a href={url} className="font-semibold text-orange-700 underline decoration-orange-300 decoration-2 underline-offset-4 hover:text-orange-900">
      {children}
    </a>
  );
}

/** A thin bar that fills as the reader gets closer to the goal, with a number beside it. */
function Meter({ share, done, children }: { share: number; done: boolean; children: ReactNode }) {
  return (
    <div className="mt-3 flex items-center gap-3 font-sans">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-100" aria-hidden="true">
        <div className="h-full rounded-full transition-[width] duration-150" style={{ width: `${Math.max(4, Math.min(100, share * 100))}%`, background: done ? COLORS.ink : COLORS.accent }} />
      </div>
      <span className="font-mono text-[11px] text-stone-500 tabular-nums">{children}</span>
    </div>
  );
}

// ---- 1. Fit a line -----------------------------------------------------------------------

const LEFT_X = 1;
const RIGHT_X = 9;

function FitLine({ url }: DemoProps) {
  // The line starts out plainly wrong, so there is something to fix.
  const [ends, setEnds] = useState({ left: 78, right: 52 });
  const [touched, setTouched] = useState(false);
  const line: Line = useMemo(() => {
    const w = (ends.right - ends.left) / (RIGHT_X - LEFT_X);
    return { w, b: ends.left - w * LEFT_X };
  }, [ends]);
  const best = useMemo(() => Math.sqrt(lineMse(examPoints, fitLine(examPoints))), []);
  const miss = Math.sqrt(lineMse(examPoints, line));
  const solved = miss <= best * 1.2;
  const move = (side: 'left' | 'right') => (p: { y: number }) => {
    setTouched(true);
    setEnds((e) => ({ ...e, [side]: p.y }));
  };

  return (
    <>
      <Plot xDomain={EXAM_X} yDomain={EXAM_Y} xLabel="Hours studied" yLabel="Exam score" aspect={0.5} maxHeight={300} label="Twelve students: exam score against hours studied, with a line you can move by its two ends.">
        <Segments segments={examPoints.map((p) => ({ from: p, to: { x: p.x, y: predict(line, p.x) } }))} />
        <FnLine f={(x) => predict(line, x)} />
        <Dots points={examPoints} title={(p) => `${p.x} hours, score ${p.y}`} />
        <DragHandle x={LEFT_X} y={ends.left} label="Left end of the line" constrain={(p) => ({ x: LEFT_X, y: p.y })} onChange={move('left')} />
        <DragHandle x={RIGHT_X} y={ends.right} label="Right end of the line" constrain={(p) => ({ x: RIGHT_X, y: p.y })} onChange={move('right')} />
      </Plot>
      <Meter share={best / miss} done={solved}>
        off by {miss.toFixed(1)} points
      </Meter>
      <Message>
        {solved ? (
          <>
            <strong className="text-stone-900">That is about as good as a line can get.</strong> You just did linear regression by hand. <ChapterLink url={url}>See how a computer finds it</ChapterLink>.
          </>
        ) : touched ? (
          <>Closer. Each red line is a miss for one student. Make them as short as you can.</>
        ) : (
          <>
            <strong className="text-stone-900">Drag the two orange dots</strong> until the line runs through the students.
          </>
        )}
      </Message>
    </>
  );
}

// ---- 2. Find the cut-off -------------------------------------------------------------------

const PASS_MARK = 62;
const passed = examPoints.filter((p) => p.y >= PASS_MARK);
const failed = examPoints.filter((p) => p.y < PASS_MARK);

function CutOff({ url }: DemoProps) {
  const [cut, setCut] = useState(7.5);
  const [touched, setTouched] = useState(false);
  const right = examPoints.filter((p) => p.x >= cut === p.y >= PASS_MARK).length;
  const solved = right === examPoints.length;

  return (
    <>
      <Plot xDomain={EXAM_X} yDomain={EXAM_Y} xLabel="Hours studied" yLabel="Exam score" aspect={0.5} maxHeight={300} label="Twelve students. Filled dots passed the exam, hollow dots failed. A vertical line you can move predicts a pass for everyone to its right.">
        <Band from={cut} to={EXAM_X[1]} />
        <VRule at={cut} stroke={COLORS.accent} strokeWidth={2} />
        <Dots points={passed} title={(p) => `${p.x} hours: passed`} />
        <Dots points={failed} hollow title={(p) => `${p.x} hours: failed`} />
        <DragHandle
          x={cut}
          y={EXAM_Y[0] + 8}
          label="The cut-off, in hours of study"
          constrain={(p) => ({ x: Math.round(p.x * 4) / 4, y: EXAM_Y[0] + 8 })}
          onChange={(p) => {
            setTouched(true);
            setCut(p.x);
          }}
        />
      </Plot>
      <Meter share={right / examPoints.length} done={solved}>
        right about {right} of {examPoints.length}
      </Meter>
      <Message>
        {solved ? (
          <>
            <strong className="text-stone-900">All twelve.</strong> Nobody told you the rule. You found it from examples, which is what learning means here. <ChapterLink url={url}>Read chapter 1</ChapterLink>.
          </>
        ) : touched ? (
          <>The shaded side is "predict a pass". Filled dots passed and hollow dots failed. Keep sliding.</>
        ) : (
          <>
            <strong className="text-stone-900">Slide the orange dot</strong> to find the number of hours that separates the students who passed (filled) from those who failed (hollow).
          </>
        )}
      </Message>
    </>
  );
}

// ---- 3. Ask the neighbours --------------------------------------------------------------------

const KNOWN = toRows(moonsTrain);
const KINDS = toLabels(moonsTrain);
const filled = moonsTrain.filter((p) => p.label === 1);
const hollow = moonsTrain.filter((p) => p.label === 0);

function Neighbours({ url }: DemoProps) {
  const [at, setAt] = useState({ x: 2, y: 8 });
  const [touched, setTouched] = useState(false);
  const near = nearest(KNOWN, [at.x, at.y], 5);
  const votes = near.filter((i) => KINDS[i] === 1).length;
  const split = votes === 2 || votes === 3;

  return (
    <>
      <div className="mx-auto max-w-[340px]">
        <Plot xDomain={TOY_RANGE} yDomain={TOY_RANGE} aspect={1} maxHeight={340} label="Sixty known points of two kinds, filled and hollow. A point you can move is joined to its five nearest neighbours, who vote on its kind.">
          <Segments segments={near.map((i) => ({ from: at, to: moonsTrain[i] }))} stroke={COLORS.accent} dashed={false} />
          <Dots points={filled} r={4} />
          <Dots points={hollow} r={4} hollow />
          <DragHandle
            x={at.x}
            y={at.y}
            label="The new point"
            onChange={(p) => {
              setTouched(true);
              setAt(p);
            }}
          />
        </Plot>
      </div>
      <Meter share={1 - Math.abs(votes - 2.5) / 2.5} done={split}>
        {votes} filled, {5 - votes} hollow
      </Meter>
      <Message>
        {split && touched ? (
          <>
            <strong className="text-stone-900">A split vote: you are on the boundary.</strong> This classifier has no formula at all. It asks the five nearest known points and goes with the majority. <ChapterLink url={url}>See what else it can do</ChapterLink>.
          </>
        ) : touched ? (
          <>
            The five nearest points say <strong className="text-stone-900">{votes >= 3 ? 'filled' : 'hollow'}</strong>. Find the place where they stop agreeing.
          </>
        ) : (
          <>
            <strong className="text-stone-900">Drag the orange dot</strong> between the two groups. Its five nearest neighbours vote on what it is. Find a spot where the vote is 3 to 2.
          </>
        )}
      </Message>
    </>
  );
}

// ---- 4. Pick a step size ---------------------------------------------------------------------------

const TARGET = 3;
const START_W = -0.5;
const STEPS = 8;
const bowl = (w: number) => (w - TARGET) ** 2;

function StepSize({ url }: DemoProps) {
  const [rate, setRate] = useState(0.05);
  const [touched, setTouched] = useState(false);
  const path = useMemo(() => {
    const points = [{ x: START_W, y: bowl(START_W) }];
    let w = START_W;
    for (let i = 0; i < STEPS; i++) {
      w -= rate * 2 * (w - TARGET); // step against the slope
      points.push({ x: w, y: bowl(w) });
    }
    return points;
  }, [rate]);
  const left = Math.abs(path[STEPS].x - TARGET);
  const diverging = rate > 1;
  const bouncing = !diverging && rate > 0.5;
  const solved = left < 0.05 && !bouncing && !diverging;
  // Points that have flown off the plot are left out of the drawing.
  const visible = path.filter((p) => p.x >= -2 && p.x <= 8 && p.y <= 26);

  return (
    <>
      <Plot xDomain={[-2, 8]} yDomain={[0, 26]} xLabel="A weight" yLabel="Error" aspect={0.5} maxHeight={300} label="A bowl-shaped error curve. A path of eight steps runs down it from the left, with a step size you choose.">
        <FnLine f={bowl} stroke={COLORS.ink} />
        <Polyline points={visible} strokeWidth={1.5} />
        <Dots points={visible.slice(1)} r={4} fill={COLORS.accent} />
        <Dots points={[path[0]]} r={5} />
      </Plot>
      <div className="mt-3">
        <Slider
          label="Step size"
          value={rate}
          min={0.05}
          max={1.1}
          step={0.05}
          format={(v) => v.toFixed(2)}
          onChange={(v) => {
            setTouched(true);
            setRate(v);
          }}
        />
      </div>
      <Message>
        {solved ? (
          <>
            <strong className="text-stone-900">At the bottom in {STEPS} steps, with no bouncing.</strong> Choosing this number well is half the craft of training a model. <ChapterLink url={url}>Learn why it works</ChapterLink>.
          </>
        ) : diverging ? (
          <>
            <strong className="text-stone-900">Too big.</strong> Every step jumps over the bottom and lands higher than before. The error grows without limit.
          </>
        ) : bouncing ? (
          <>It gets there, but by leaping from side to side. Ease off a little.</>
        ) : touched ? (
          <>Still {left.toFixed(1)} away from the bottom after {STEPS} steps. Bigger steps would get there sooner.</>
        ) : (
          <>
            <strong className="text-stone-900">Move the slider.</strong> The orange dots walk downhill, each step in proportion to the slope. Find a step size that reaches the bottom in {STEPS} steps.
          </>
        )}
      </Message>
    </>
  );
}

// ---- The rotation ---------------------------------------------------------------------------------------

const DEMOS = [
  { id: 'fit', name: 'Fit a line', Component: FitLine },
  { id: 'cutoff', name: 'Find the cut-off', Component: CutOff },
  { id: 'neighbours', name: 'Ask the neighbours', Component: Neighbours },
  { id: 'step', name: 'Pick a step size', Component: StepSize },
] as const;

interface HeroDemoProps {
  /** Chapter address for each figure. Figures whose chapter is not published are left out. */
  urls: Partial<Record<(typeof DEMOS)[number]['id'], string>>;
}

export default function HeroDemo({ urls }: HeroDemoProps) {
  const demos = DEMOS.filter((d) => urls[d.id]);
  // The first figure is drawn on the server; the visit's own figure replaces it once the page is live.
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let next: number;
    try {
      next = (Number(localStorage.getItem(ROTATION_KEY) ?? -1) + 1) % demos.length;
      localStorage.setItem(ROTATION_KEY, String(next));
    } catch {
      next = Math.floor(Math.random() * demos.length);
    }
    setIndex(next);
  }, [demos.length]);

  const another = () => {
    const next = (index + 1) % demos.length;
    setIndex(next);
    try {
      localStorage.setItem(ROTATION_KEY, String(next));
    } catch {
      // The choice is not remembered; nothing else changes.
    }
  };

  const demo = demos[index];
  if (!demo) return null;
  const Demo = demo.Component;
  return (
    <div className="text-left">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="micro-label text-stone-900">Try it: {demo.name}</span>
        {demos.length > 1 && (
          <button type="button" onClick={another} className="micro-label -my-1 cursor-pointer py-1 text-orange-700 hover:text-orange-900">
            Another one ({index + 1}/{demos.length}) ›
          </button>
        )}
      </div>
      {/* The key gives each figure a fresh start when the reader switches. */}
      <Demo key={demo.id} url={urls[demo.id] ?? '/'} />
    </div>
  );
}
