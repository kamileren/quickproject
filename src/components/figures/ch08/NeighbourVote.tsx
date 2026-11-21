import { useMemo, useState } from 'react';
import { moonsTrain, toLabels, toRows, TOY_RANGE } from '@/data/toy2d';
import { nearest } from '@/lib/knn';
import { ControlBar, Legend, Readout, Slider } from '../core/Controls';
import { COLORS, Dots, DragHandle, Plot, Segments, type Point } from '../core/Plot';

const X = toRows(moonsTrain);
const Y = toLabels(moonsTrain);
const FILLED = moonsTrain.filter((p) => p.label === 1);
const HOLLOW = moonsTrain.filter((p) => p.label === 0);

/** Drag a new point around and watch its k nearest neighbours vote on its class. */
export default function NeighbourVote() {
  const [query, setQuery] = useState<Point>({ x: 5, y: 5.2 });
  const [k, setK] = useState(5);

  const idx = useMemo(() => nearest(X, [query.x, query.y], k), [query, k]);
  const filledVotes = idx.filter((i) => Y[i] === 1).length;
  const hollowVotes = k - filledVotes;
  const verdict = filledVotes > hollowVotes ? 'filled' : 'hollow';

  return (
    <div className="space-y-3">
      <div className="mx-auto max-w-[460px]">
        <Plot
          xDomain={TOY_RANGE}
          yDomain={TOY_RANGE}
          xLabel="Feature 1"
          yLabel="Feature 2"
          aspect={1}
          maxHeight={460}
          label={`Sixty known points of two kinds and one new point. Its ${k} nearest neighbours vote ${filledVotes} filled to ${hollowVotes} hollow.`}
        >
          <Segments segments={idx.map((i) => ({ from: query, to: moonsTrain[i] }))} stroke={COLORS.accent} dashed={false} strokeWidth={1.5} />
          <Dots points={FILLED} title={(p) => `Filled kind at (${p.x}, ${p.y})`} />
          <Dots points={HOLLOW} hollow title={(p) => `Hollow kind at (${p.x}, ${p.y})`} />
          <DragHandle x={query.x} y={query.y} label="The new point to classify" onChange={setQuery} />
        </Plot>
      </div>

      <Legend
        items={[
          { label: 'Known: filled kind', color: COLORS.ink, shape: 'dot' },
          { label: 'Known: hollow kind', color: COLORS.faint, shape: 'dot' },
          { label: 'New point and its neighbours', color: COLORS.accent, shape: 'line' },
        ]}
      />

      <Readout
        items={[
          { label: 'Neighbours asked (k)', value: String(k) },
          { label: 'Votes', value: `${filledVotes} filled · ${hollowVotes} hollow` },
          { label: 'The new point is called', value: verdict, key: true },
        ]}
      />

      <ControlBar>
        <Slider label="Neighbours k" value={k} min={1} max={15} step={2} onChange={setK} />
        <span className="font-mono text-[10px] text-stone-500">Drag the orange point.</span>
      </ControlBar>
    </div>
  );
}
