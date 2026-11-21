import { useState } from 'react';
import { ControlBar, Readout, Slider } from '../core/Controls';

const NUDGE = 0.01;

const Value = ({ name, value }: { name: string; value: number }) => (
  <div className="min-w-0 flex-1 rounded border border-stone-300 bg-white p-2 text-center">
    <div className="font-mono text-[10px] tracking-widest text-stone-500 uppercase">{name}</div>
    <div className="font-mono text-base font-bold text-stone-900 tabular-nums sm:text-lg">{value.toFixed(2)}</div>
  </div>
);

const Machine = ({ does, rate }: { does: string; rate: string }) => (
  <div className="min-w-0 flex-1 rounded border-2 border-stone-900 bg-stone-900 p-2 text-center text-white">
    <div className="font-sans text-[11px] font-bold sm:text-xs">{does}</div>
    <div className="font-mono text-[10px] text-orange-300">rate {rate}</div>
  </div>
);

const Arrow = () => (
  <span aria-hidden="true" className="shrink-0 text-center font-mono leading-none text-stone-400">
    <span className="sm:hidden">↓</span>
    <span className="hidden sm:inline">→</span>
  </span>
);

/**
 * Two calculations in a row: x is tripled to give u, and u is squared to give
 * y. A nudge to x is magnified by each machine in turn, and the two
 * magnifications multiply.
 */
export default function ChainMachines() {
  const [x, setX] = useState(1);
  const u = 3 * x;
  const y = u * u;
  const first = 3;
  const second = 2 * u;
  const overall = first * second;

  const uNudged = 3 * (x + NUDGE);
  const yNudged = uNudged * uNudged;

  return (
    <div className="space-y-3">
      <div
        className="flex flex-col items-stretch gap-1.5 rounded-lg border border-stone-200 bg-stone-50 p-3 sm:flex-row sm:items-center sm:gap-3 sm:p-4"
        role="img"
        aria-label={`x = ${x.toFixed(2)} is tripled to give u = ${u.toFixed(2)}, which is squared to give y = ${y.toFixed(2)}. The first step has rate 3, the second has rate ${second.toFixed(1)}, so the overall rate is ${overall.toFixed(1)}.`}
      >
        <Value name="x" value={x} />
        <Arrow />
        <Machine does="triple it" rate="3" />
        <Arrow />
        <Value name="u" value={u} />
        <Arrow />
        <Machine does="square it" rate={`2u = ${second.toFixed(1)}`} />
        <Arrow />
        <Value name="y" value={y} />
      </div>

      <Readout
        items={[
          { label: 'Rate of step 1', value: first.toFixed(1) },
          { label: 'Rate of step 2', value: second.toFixed(1) },
          { label: 'Overall: multiply them', value: `${first} × ${second.toFixed(1)} = ${overall.toFixed(1)}`, key: true },
        ]}
      />

      <Readout
        items={[
          { label: `Nudge x by ${NUDGE}`, value: `u moves by ${(uNudged - u).toFixed(3)}` },
          { label: 'and y moves by', value: (yNudged - y).toFixed(3) },
          { label: 'y nudge ÷ x nudge', value: ((yNudged - y) / NUDGE).toFixed(2) },
        ]}
      />

      <ControlBar>
        <Slider label="Input x" value={x} min={-2} max={2} step={0.1} onChange={setX} format={(v) => v.toFixed(1)} />
      </ControlBar>
    </div>
  );
}
