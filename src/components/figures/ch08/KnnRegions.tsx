import { useMemo, useState } from 'react';
import { moonsTest, moonsTrain, toLabels, toRows, TOY_RANGE, type Labelled } from '@/data/toy2d';
import { knnAccuracy, knnPredict } from '@/lib/knn';
import { ControlBar, Legend, Readout, Segmented, Slider } from '../core/Controls';
import { COLORS, Dots, Plot, Regions } from '../core/Plot';

const TEST_X = toRows(moonsTest);
const TEST_Y = toLabels(moonsTest);
const KIND_OPTIONS = [
  { value: '1', label: 'Add filled' },
  { value: '0', label: 'Add hollow' },
];

/**
 * The whole map of k-NN's answers. The reader changes k and adds points of
 * either kind by clicking, and the regions are recomputed from scratch.
 */
export default function KnnRegions() {
  const [points, setPoints] = useState<Labelled[]>(moonsTrain);
  const [k, setK] = useState(1);
  const [kind, setKind] = useState('1');

  const X = useMemo(() => toRows(points), [points]);
  const Y = useMemo(() => toLabels(points), [points]);
  const kUsed = Math.min(k, points.length);
  const accuracy = useMemo(() => knnAccuracy(X, Y, TEST_X, TEST_Y, kUsed), [X, Y, kUsed]);

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
          onPlotClick={(p) => setPoints((prev) => [...prev, { x: +p.x.toFixed(2), y: +p.y.toFixed(2), label: Number(kind) }])}
          label={`The plane coloured by what ${kUsed}-nearest-neighbours would answer at each spot. Shaded means filled. ${points.length} known points.`}
        >
          <Regions cols={46} rows={46} opacity={(x, y) => (knnPredict(X, Y, [x, y], kUsed) === 1 ? 0.2 : 0)} />
          <Dots points={points.filter((p) => p.label === 1)} r={4} />
          <Dots points={points.filter((p) => p.label === 0)} r={4} hollow />
        </Plot>
      </div>

      <Legend
        items={[
          { label: 'Shaded: would be called filled', color: COLORS.accent, shape: 'dot' },
          { label: 'Unshaded: would be called hollow', color: COLORS.faint, shape: 'dot' },
        ]}
      />

      <Readout
        items={[
          { label: 'Neighbours asked (k)', value: String(kUsed) },
          { label: 'Known points', value: String(points.length) },
          { label: 'Right on 300 new points', value: `${(accuracy * 100).toFixed(1)}%`, key: true },
        ]}
      />

      <ControlBar>
        <Slider label="Neighbours k" value={k} min={1} max={41} step={2} onChange={setK} />
        <Segmented label="Kind of point added by a click" options={KIND_OPTIONS} value={kind} onChange={setKind} />
        <button type="button" className="btn btn-secondary btn-small" onClick={() => setPoints(moonsTrain)}>
          Reset
        </button>
      </ControlBar>
      <p className="font-mono text-[10px] text-stone-500">Click or tap anywhere on the plot to add a point of the selected kind.</p>
    </div>
  );
}
