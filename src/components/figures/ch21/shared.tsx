import { useEffect, useRef, useState } from 'react';
import { IMAGE_SIDE, imageAt, loadFashion, type Fashion, type FashionSamples } from '@/lib/fashion';

type State = { status: 'loading' } | { status: 'ready'; data: Fashion } | { status: 'error' };

/** Loads the trained weights and sample images once; every figure on the page shares them. */
export function useFashion(): State {
  const [state, setState] = useState<State>({ status: 'loading' });
  useEffect(() => {
    let alive = true;
    loadFashion()
      .then((data) => alive && setState({ status: 'ready', data }))
      .catch(() => alive && setState({ status: 'error' }));
    return () => {
      alive = false;
    };
  }, []);
  return state;
}

/** Shown while the files download, or if they cannot be fetched. */
export function Waiting({ status }: { status: 'loading' | 'error' }) {
  return (
    <div className="flex min-h-48 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 p-6 text-center font-mono text-[11px] text-stone-500" role="status">
      {status === 'loading'
        ? 'Loading the trained network and 500 test images (about 600 KB)…'
        : 'The network and images could not be loaded. Reload the page to try again.'}
    </div>
  );
}

interface ThumbProps {
  samples: FashionSamples;
  index: number;
  /** Size on screen, in CSS pixels. */
  size?: number;
  label?: string;
}

/**
 * One 28 × 28 image. The dataset stores clothing as bright pixels on black;
 * here it is drawn dark on the page's light background.
 */
export function Thumb({ samples, index, size = 56, label }: ThumbProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    const pixels = imageAt(samples, index);
    const image = ctx.createImageData(IMAGE_SIDE, IMAGE_SIDE);
    for (let i = 0; i < pixels.length; i++) {
      // Blend from the figure background (stone-50) toward ink (stone-900) by brightness.
      const t = pixels[i] / 255;
      image.data[i * 4] = Math.round(250 + (28 - 250) * t);
      image.data[i * 4 + 1] = Math.round(250 + (25 - 250) * t);
      image.data[i * 4 + 2] = Math.round(249 + (23 - 249) * t);
      image.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
  }, [samples, index]);
  return (
    <canvas
      ref={ref}
      width={IMAGE_SIDE}
      height={IMAGE_SIDE}
      role="img"
      aria-label={label ?? 'A clothing image'}
      style={{ width: size, height: size, imageRendering: 'pixelated' }}
      className="block rounded-sm"
    />
  );
}

/** Short names that fit in a table header. */
export const SHORT = ['T-shirt', 'Trouser', 'Pullover', 'Dress', 'Coat', 'Sandal', 'Shirt', 'Sneaker', 'Bag', 'Boot'];
