import { Legend, Readout } from '../core/Controls';
import { COLORS, Dots, Plot, PlotLabel, Polyline, VRule } from '../core/Plot';
import { useFashion, Waiting } from './shared';

/** The loss recorded during the real training run, with the end of each epoch marked. */
export default function TrainingLog() {
  const state = useFashion();
  if (state.status !== 'ready') return <Waiting status={state.status} />;
  const { log } = state.data;
  const last = log.epochs[log.epochs.length - 1];
  const epochPoints = log.epochs.map((e) => ({ x: e.step, y: e.meanLoss }));

  return (
    <div className="space-y-3">
      <Plot
        xDomain={[0, last.step]}
        yDomain={[0, 1.6]}
        xLabel="Training steps (one batch each)"
        yLabel="Loss"
        aspect={0.5}
        label={`Loss over ${last.step} training steps on Fashion-MNIST, falling from about ${log.loss[0][1].toFixed(1)} to about ${last.meanLoss.toFixed(1)}.`}
      >
        {log.epochs.map((e) => (
          <VRule key={e.epoch} at={e.step} stroke={COLORS.grid} strokeWidth={1} />
        ))}
        {log.epochs.map((e) => (
          <PlotLabel key={e.epoch} x={e.step} y={1.6} dx={-4} dy={14} anchor="end" fill={COLORS.muted}>{`epoch ${e.epoch}`}</PlotLabel>
        ))}
        <Polyline points={log.loss.map(([x, y]) => ({ x, y }))} stroke={COLORS.faint} strokeWidth={1.2} />
        <Polyline points={epochPoints} strokeWidth={2.5} />
        <Dots points={epochPoints} fill={COLORS.accent} r={4.5} />
      </Plot>

      <Legend
        items={[
          { label: 'Loss on single batches', color: COLORS.faint, shape: 'line' },
          { label: 'Average over each epoch', color: COLORS.accent, shape: 'line' },
        ]}
      />

      <div className="overflow-x-auto">
        <table className="m-0 table w-full border-collapse font-mono text-[12px] whitespace-normal tabular-nums" aria-label="Loss and accuracy after each epoch">
          <thead>
            <tr>
              {['Epoch', 'Steps so far', 'Mean loss', 'Training accuracy', 'Test accuracy'].map((h) => (
                <th key={h} className="border-0 border-b-2 border-stone-900 px-2 py-1.5 text-right text-[10px] tracking-wider text-stone-900 uppercase first:text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {log.epochs.map((e) => (
              <tr key={e.epoch}>
                <td className="border-0 border-b border-stone-200 px-2 py-1.5 text-left">{e.epoch}</td>
                <td className="border-0 border-b border-stone-200 px-2 py-1.5 text-right">{e.step}</td>
                <td className="border-0 border-b border-stone-200 px-2 py-1.5 text-right">{e.meanLoss.toFixed(3)}</td>
                <td className="border-0 border-b border-stone-200 px-2 py-1.5 text-right">{(e.trainAccuracy * 100).toFixed(1)}%</td>
                <td className="border-0 border-b border-stone-200 px-2 py-1.5 text-right font-bold">{(e.testAccuracy * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Readout
        items={[
          { label: 'Images per batch', value: String(log.batchSize) },
          { label: 'Batches per epoch', value: String(log.stepsPerEpoch) },
          { label: 'Final test accuracy', value: `${(last.testAccuracy * 100).toFixed(1)}%`, key: true },
        ]}
      />
    </div>
  );
}
