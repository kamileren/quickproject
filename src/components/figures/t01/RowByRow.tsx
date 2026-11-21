import { useState } from 'react';
import { dot, matVec } from '@/lib/vectors';
import { ControlBar, Readout, Slider } from '../core/Controls';

/** Four students: hours studied and hours slept. */
const STUDENTS = [
  { name: 'A', row: [1, 6] },
  { name: 'B', row: [4, 7] },
  { name: 'C', row: [6, 5] },
  { name: 'D', row: [9, 8] },
];
const X = STUDENTS.map((s) => s.row);

const cell = 'border border-stone-200 px-3 py-2 text-center font-mono text-sm tabular-nums';
const head = 'px-3 pb-1 text-center font-mono text-[10px] tracking-widest text-stone-500 uppercase';

/**
 * A matrix times a vector, one row at a time. The matrix holds four students;
 * the vector holds one weight per feature; each output is one dot product.
 */
export default function RowByRow() {
  const [w1, setW1] = useState(5);
  const [w2, setW2] = useState(2);
  const [active, setActive] = useState(1);
  const weights = [w1, w2];
  const out = matVec(X, weights);
  const row = X[active];

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-stone-200 bg-stone-50 p-4">
        <table className="m-0 mx-auto table w-auto border-separate border-spacing-0 whitespace-normal" aria-label="A four by two matrix of students multiplied by a vector of two weights">
          <thead>
            <tr>
              <th className={`border-0 ${head}`} />
              <th className={`border-0 ${head}`}>hours studied</th>
              <th className={`border-0 ${head}`}>hours slept</th>
              <th className={`border-0 ${head}`} />
              <th className={`border-0 ${head}`}>score</th>
            </tr>
          </thead>
          <tbody>
            {STUDENTS.map((s, i) => {
              const on = i === active;
              const tone = on ? 'bg-stone-900 text-white' : 'bg-white text-stone-700';
              return (
                <tr key={s.name}>
                  <th scope="row" className="border-0 p-0 pr-2">
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => setActive(i)}
                      className={`btn btn-small ${on ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      Student {s.name}
                    </button>
                  </th>
                  <td className={`${cell} ${tone}`}>{s.row[0]}</td>
                  <td className={`${cell} ${tone}`}>{s.row[1]}</td>
                  <td className="border-0 px-3 text-center font-mono text-sm text-stone-400">→</td>
                  <td className={`${cell} ${on ? 'border-orange-600 bg-orange-50 font-bold text-stone-900' : 'bg-white text-stone-700'}`}>{out[i]}</td>
                </tr>
              );
            })}
            <tr>
              <th scope="row" className="border-0 pt-3 pr-2 text-right font-mono text-[10px] tracking-widest text-stone-500 uppercase">
                weights
              </th>
              <td className={`${cell} border-stone-400 bg-white font-bold text-orange-700`} style={{ borderTopWidth: 2 }}>
                {w1}
              </td>
              <td className={`${cell} border-stone-400 bg-white font-bold text-orange-700`} style={{ borderTopWidth: 2 }}>
                {w2}
              </td>
              <td className="border-0" />
              <td className="border-0" />
            </tr>
          </tbody>
        </table>
      </div>

      <Readout
        items={[
          { label: `Row ${STUDENTS[active].name} · weights`, value: `${row[0]}×${w1} + ${row[1]}×${w2}` },
          { label: `Score for student ${STUDENTS[active].name}`, value: String(dot(row, weights)), key: true },
          { label: 'Shapes', value: '4×2 times 2 gives 4' },
        ]}
      />

      <ControlBar>
        <Slider label="Weight on study" value={w1} min={0} max={8} step={1} onChange={setW1} />
        <Slider label="Weight on sleep" value={w2} min={0} max={8} step={1} onChange={setW2} />
      </ControlBar>
    </div>
  );
}
