import { useState } from 'react';
import { IMAGE_SIDE, imageAt, PIXELS, scalePixel } from '@/lib/fashion';
import { Readout } from '../core/Controls';
import { Thumb, useFashion, Waiting } from './shared';

const CHOICES = 16;
const BIG = 252; // 9 CSS pixels per image pixel

/**
 * An image is a grid of numbers. The reader picks an image and points at a
 * pixel to see its value, the value the network is given, and where it lands
 * when the grid is unrolled into one long list.
 */
export default function PixelInspector() {
  const state = useFashion();
  const [picked, setPicked] = useState(0);
  const [pixel, setPixel] = useState<number>(14 * IMAGE_SIDE + 14);

  if (state.status !== 'ready') return <Waiting status={state.status} />;
  const { samples, log } = state.data;
  const pixels = imageAt(samples, picked);
  const row = Math.floor(pixel / IMAGE_SIDE);
  const col = pixel % IMAGE_SIDE;
  const value = pixels[pixel];
  const cell = BIG / IMAGE_SIDE;

  const point = (e: React.PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const c = Math.min(IMAGE_SIDE - 1, Math.max(0, Math.floor(((e.clientX - box.left) / box.width) * IMAGE_SIDE)));
    const r = Math.min(IMAGE_SIDE - 1, Math.max(0, Math.floor(((e.clientY - box.top) / box.height) * IMAGE_SIDE)));
    setPixel(r * IMAGE_SIDE + c);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col items-center gap-4 rounded-lg border border-stone-200 bg-stone-50 p-4 sm:flex-row sm:items-start sm:justify-center sm:gap-8">
        <div
          className="relative shrink-0 cursor-crosshair touch-none border border-stone-300"
          style={{ width: BIG, height: BIG }}
          onPointerMove={point}
          onPointerDown={point}
          role="img"
          aria-label={`A ${log.classes[samples.labels[picked]]}, enlarged. The highlighted pixel in row ${row + 1}, column ${col + 1} has brightness ${value}.`}
        >
          <Thumb samples={samples} index={picked} size={BIG} label="" />
          <div className="pointer-events-none absolute border-2 border-orange-600" style={{ left: col * cell, top: row * cell, width: cell, height: cell }} />
        </div>
        <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-4" role="group" aria-label="Choose an image">
          {Array.from({ length: CHOICES }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-pressed={i === picked}
              aria-label={`Image ${i + 1}: ${log.classes[samples.labels[i]]}`}
              onClick={() => setPicked(i)}
              className={`cursor-pointer rounded-sm border-2 p-0 ${i === picked ? 'border-orange-600' : 'border-transparent hover:border-stone-300'}`}
            >
              <Thumb samples={samples} index={i} size={32} label="" />
            </button>
          ))}
        </div>
      </div>

      <Readout
        items={[
          { label: 'This image is a', value: log.classes[samples.labels[picked]] },
          { label: `Pixel in row ${row + 1}, column ${col + 1}`, value: `${value} of 255`, key: true },
          { label: 'As the network sees it', value: scalePixel(value).toFixed(2) },
          { label: 'Position in the flattened list', value: `${pixel + 1} of ${PIXELS}` },
        ]}
      />
      <p className="font-mono text-[10px] text-stone-500">Move over the large image, or tap it, to inspect a pixel. Pick another image on the right.</p>
    </div>
  );
}
