import { useRef, useState } from 'react';
import { mulberry32 } from '@/lib/random';
import { ControlBar, Readout, Slider } from '../core/Controls';

const LAYERS = [
  { name: 'Inputs', size: 4, droppable: false },
  { name: 'Hidden 1', size: 8, droppable: true },
  { name: 'Hidden 2', size: 8, droppable: true },
  { name: 'Outputs', size: 3, droppable: false },
];
const HIDDEN = LAYERS.filter((l) => l.droppable).reduce((s, l) => s + l.size, 0);

/** Draws which hidden neurons survive one training step, for a given dropout rate. */
function draw(rate: number, rand: () => number): boolean[][] {
  return LAYERS.map((layer) => Array.from({ length: layer.size }, () => !layer.droppable || rand() >= rate));
}

/**
 * Dropout shown on a small network. Each press is one training step: a fresh
 * random set of hidden neurons is switched off, and the rest are scaled up.
 */
export default function DropoutSketch() {
  const rand = useRef(mulberry32(5));
  const [rate, setRate] = useState(0.3);
  const [alive, setAlive] = useState<boolean[][]>(() => draw(0.3, mulberry32(5)));
  const [presses, setPresses] = useState(1);

  const survivors = alive.reduce((s, layer, i) => s + (LAYERS[i].droppable ? layer.filter(Boolean).length : 0), 0);
  const scale = 1 / (1 - rate);

  const again = (r = rate) => {
    setAlive(draw(r, rand.current));
    setPresses((p) => p + 1);
  };

  return (
    <div className="space-y-3">
      <div
        className="flex items-stretch justify-around gap-2 rounded-lg border border-stone-200 bg-stone-50 p-4"
        role="img"
        aria-label={`A network with two hidden layers of eight neurons. With a dropout rate of ${(rate * 100).toFixed(0)} percent, ${HIDDEN - survivors} of the ${HIDDEN} hidden neurons are switched off for this step.`}
      >
        {LAYERS.map((layer, i) => (
          <div key={layer.name} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="text-center font-mono text-[9px] tracking-wider text-stone-500 uppercase sm:text-[10px]">{layer.name}</div>
            <div className="flex flex-1 flex-col items-center justify-center gap-1.5">
              {alive[i].map((on, j) => (
                <div
                  key={j}
                  className={`flex h-5 w-5 items-center justify-center rounded-full border-2 font-mono text-[10px] leading-none transition-colors sm:h-6 sm:w-6 ${
                    on ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-300 bg-white text-stone-400'
                  }`}
                >
                  {on ? '' : '×'}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Readout
        items={[
          { label: 'Hidden neurons switched off', value: `${HIDDEN - survivors} of ${HIDDEN}`, key: true },
          { label: 'Survivors are multiplied by', value: scale.toFixed(2) },
          { label: 'Training steps drawn', value: String(presses) },
        ]}
      />

      <ControlBar>
        <button type="button" className="btn btn-primary btn-small" onClick={() => again()}>
          Next training step
        </button>
        <Slider
          label="Dropout rate"
          value={rate}
          min={0}
          max={0.8}
          step={0.1}
          onChange={(v) => {
            const r = +v.toFixed(1);
            setRate(r);
            again(r);
          }}
          format={(v) => `${(v * 100).toFixed(0)}%`}
        />
      </ControlBar>
    </div>
  );
}
