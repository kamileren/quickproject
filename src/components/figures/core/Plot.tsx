import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { scaleLinear, type ScaleLinear } from 'd3-scale';

/** Figure colours. Series order is fixed and validated for colour-blind safety. */
export const COLORS = {
  ink: '#1c1917',
  muted: '#78716c',
  faint: '#a8a29e',
  grid: '#f0efed',
  axis: '#d6d3d1',
  accent: '#ea580c',
  cool: '#2563eb',
  teal: '#0d9488',
  violet: '#7c3aed',
  error: '#dc2626',
  surface: '#fafaf9',
} as const;

export const SERIES = [COLORS.accent, COLORS.cool, COLORS.teal, COLORS.violet] as const;

export interface Point {
  x: number;
  y: number;
}

type Domain = [number, number];

interface PlotContextValue {
  sx: ScaleLinear<number, number>;
  sy: ScaleLinear<number, number>;
  xDomain: Domain;
  yDomain: Domain;
  svgRef: RefObject<SVGSVGElement | null>;
  clipId: string;
}

const PlotContext = createContext<PlotContextValue | null>(null);

export function usePlot(): PlotContextValue {
  const ctx = useContext(PlotContext);
  if (!ctx) throw new Error('Plot marks must be used inside <Plot>');
  return ctx;
}

interface PlotProps {
  xDomain: Domain;
  yDomain: Domain;
  /** One sentence describing the plot for screen readers. */
  label: string;
  xLabel?: string;
  yLabel?: string;
  /** Height divided by width. */
  aspect?: number;
  maxHeight?: number;
  xTicks?: number;
  yTicks?: number;
  /** Format tick values on both axes. */
  tickFormat?: (v: number) => string;
  /** Format x-axis ticks only, e.g. for a logarithmic scale. Falls back to tickFormat. */
  xTickFormat?: (v: number) => string;
  /** Called with data coordinates when the reader clicks or taps an empty part of the plot. */
  onPlotClick?: (p: Point) => void;
  children?: ReactNode;
}

const MARGIN = { top: 12, right: 16, bottom: 40, left: 46 };

/**
 * The frame every figure is drawn on: real axes in data units, a light grid,
 * and a context that lets marks place themselves by data coordinates.
 * The SVG is sized in real pixels so text stays readable on a phone.
 */
export function Plot({
  xDomain,
  yDomain,
  label,
  xLabel,
  yLabel,
  aspect = 0.6,
  maxHeight = 380,
  xTicks = 6,
  yTicks = 5,
  tickFormat = (v) => String(+v.toFixed(4)),
  xTickFormat,
  onPlotClick,
  children,
}: PlotProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const clipId = useId();
  const [width, setWidth] = useState(640);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width);
      if (w > 0) setWidth(w);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const height = Math.round(Math.min(maxHeight, Math.max(220, width * aspect)));
  const [x0, x1] = xDomain;
  const [y0, y1] = yDomain;

  const value = useMemo<PlotContextValue>(() => {
    const sx = scaleLinear().domain([x0, x1]).range([MARGIN.left, width - MARGIN.right]);
    const sy = scaleLinear().domain([y0, y1]).range([height - MARGIN.bottom, MARGIN.top]);
    return { sx, sy, xDomain: [x0, x1], yDomain: [y0, y1], svgRef, clipId };
  }, [x0, x1, y0, y1, width, height, clipId]);

  const { sx, sy } = value;
  const xs = sx.ticks(width < 420 ? Math.min(xTicks, 4) : xTicks);
  const ys = sy.ticks(yTicks);
  const bottom = height - MARGIN.bottom;
  const right = width - MARGIN.right;

  return (
    <div ref={wrapRef} className="w-full overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
      <svg
        ref={svgRef}
        role="img"
        aria-label={label}
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className="block h-auto w-full touch-none select-none"
        style={onPlotClick ? { cursor: 'crosshair' } : undefined}
        onClick={
          onPlotClick
            ? (e) => {
                const ctm = svgRef.current?.getScreenCTM();
                if (!ctm) return;
                const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
                const p = { x: sx.invert(pt.x), y: sy.invert(pt.y) };
                if (p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1) onPlotClick(p);
              }
            : undefined
        }
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={MARGIN.left} y={MARGIN.top} width={right - MARGIN.left} height={bottom - MARGIN.top} />
          </clipPath>
        </defs>

        <g aria-hidden="true">
          {xs.map((t) => (
            <line key={`gx${t}`} x1={sx(t)} x2={sx(t)} y1={MARGIN.top} y2={bottom} stroke={COLORS.grid} />
          ))}
          {ys.map((t) => (
            <line key={`gy${t}`} x1={MARGIN.left} x2={right} y1={sy(t)} y2={sy(t)} stroke={COLORS.grid} />
          ))}
          <line x1={MARGIN.left} x2={right} y1={bottom} y2={bottom} stroke={COLORS.axis} />
          <line x1={MARGIN.left} x2={MARGIN.left} y1={MARGIN.top} y2={bottom} stroke={COLORS.axis} />

          <g fontFamily="ui-monospace, Menlo, Consolas, monospace" fontSize={10} fill={COLORS.muted}>
            {xs.map((t) => (
              <text key={`tx${t}`} x={sx(t)} y={bottom + 14} textAnchor="middle">
                {(xTickFormat ?? tickFormat)(t)}
              </text>
            ))}
            {ys.map((t) => (
              <text key={`ty${t}`} x={MARGIN.left - 7} y={sy(t) + 3} textAnchor="end">
                {tickFormat(t)}
              </text>
            ))}
            {xLabel && (
              <text x={(MARGIN.left + right) / 2} y={height - 6} textAnchor="middle" fontWeight={700} letterSpacing="0.08em">
                {xLabel.toUpperCase()}
              </text>
            )}
            {yLabel && (
              <text
                transform={`translate(11 ${(MARGIN.top + bottom) / 2}) rotate(-90)`}
                textAnchor="middle"
                fontWeight={700}
                letterSpacing="0.08em"
              >
                {yLabel.toUpperCase()}
              </text>
            )}
          </g>
        </g>

        <PlotContext.Provider value={value}>{children}</PlotContext.Provider>
      </svg>
    </div>
  );
}

/* ----------------------------------------------------------------------------
   Marks. All take data coordinates.
   -------------------------------------------------------------------------- */

interface DotsProps {
  points: Point[];
  r?: number;
  fill?: string;
  /** Hover text for a point. */
  title?: (p: Point, i: number) => string;
  hollow?: boolean;
}

export function Dots({ points, r = 4.5, fill = COLORS.ink, title, hollow = false }: DotsProps) {
  const { sx, sy } = usePlot();
  return (
    <g>
      {points.map((p, i) => (
        <circle
          key={i}
          cx={sx(p.x)}
          cy={sy(p.y)}
          r={r}
          fill={hollow ? '#fff' : fill}
          stroke={hollow ? fill : '#fff'}
          strokeWidth={hollow ? 2 : 1.5}
        >
          {title && <title>{title(p, i)}</title>}
        </circle>
      ))}
    </g>
  );
}

interface FnLineProps {
  /** y as a function of x. */
  f: (x: number) => number;
  stroke?: string;
  strokeWidth?: number;
  dashed?: boolean;
  samples?: number;
  opacity?: number;
}

/** Draws y = f(x) across the plot, clipped to the frame. Straight lines and curves alike. */
export function FnLine({ f, stroke = COLORS.accent, strokeWidth = 2, dashed = false, samples = 80, opacity = 1 }: FnLineProps) {
  const { sx, sy, xDomain, yDomain, clipId } = usePlot();
  const [x0, x1] = xDomain;
  const span = yDomain[1] - yDomain[0];
  // Keep wild values finite so a diverging fit still draws.
  const clamp = (y: number) => Math.max(yDomain[0] - 5 * span, Math.min(yDomain[1] + 5 * span, y));
  const d = Array.from({ length: samples + 1 }, (_, i) => {
    const x = x0 + ((x1 - x0) * i) / samples;
    const y = clamp(f(x));
    return `${i === 0 ? 'M' : 'L'}${sx(x).toFixed(1)},${sy(Number.isFinite(y) ? y : 0).toFixed(1)}`;
  }).join('');
  return (
    <path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeDasharray={dashed ? '5 4' : undefined}
      opacity={opacity}
      clipPath={`url(#${clipId})`}
    />
  );
}

interface SegmentsProps {
  segments: { from: Point; to: Point }[];
  stroke?: string;
  dashed?: boolean;
  strokeWidth?: number;
}

/** Straight segments, e.g. the residual from each point to the line. */
export function Segments({ segments, stroke = COLORS.error, dashed = true, strokeWidth = 1.5 }: SegmentsProps) {
  const { sx, sy, clipId } = usePlot();
  return (
    <g clipPath={`url(#${clipId})`}>
      {segments.map((s, i) => (
        <line
          key={i}
          x1={sx(s.from.x)}
          y1={sy(s.from.y)}
          x2={sx(s.to.x)}
          y2={sy(s.to.y)}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={dashed ? '3 3' : undefined}
        />
      ))}
    </g>
  );
}

interface PolylineProps {
  points: Point[];
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
}

export function Polyline({ points, stroke = COLORS.accent, strokeWidth = 2, opacity = 1 }: PolylineProps) {
  const { sx, sy, clipId } = usePlot();
  if (points.length < 2) return null;
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join('');
  return (
    <path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      strokeLinecap="round"
      opacity={opacity}
      clipPath={`url(#${clipId})`}
    />
  );
}

interface PlotLabelProps {
  x: number;
  y: number;
  children: string;
  anchor?: 'start' | 'middle' | 'end';
  dx?: number;
  dy?: number;
  fill?: string;
}

/** A short direct label next to a mark. Text stays in ink colours, never the series colour. */
export function PlotLabel({ x, y, children, anchor = 'start', dx = 8, dy = 4, fill = COLORS.ink }: PlotLabelProps) {
  const { sx, sy } = usePlot();
  return (
    <text
      x={sx(x) + dx}
      y={sy(y) + dy}
      textAnchor={anchor}
      fontFamily="ui-monospace, Menlo, Consolas, monospace"
      fontSize={10}
      fontWeight={700}
      fill={fill}
      stroke="#fafaf9"
      strokeWidth={3}
      paintOrder="stroke"
    >
      {children}
    </text>
  );
}

interface DragHandleProps {
  x: number;
  y: number;
  onChange: (p: Point) => void;
  /** Read by screen readers, e.g. "Left end of the line". */
  label: string;
  fill?: string;
  /** Limit movement, e.g. keep x fixed. */
  constrain?: (p: Point) => Point;
}

/**
 * A point the reader can drag with mouse or finger, or move with the arrow
 * keys. The hit area is larger than the visible dot.
 */
export function DragHandle({ x, y, onChange, label, fill = COLORS.accent, constrain = (p) => p }: DragHandleProps) {
  const { sx, sy, xDomain, yDomain, svgRef } = usePlot();
  const dragging = useRef(false);
  const [active, setActive] = useState(false);

  const clampToPlot = (p: Point): Point => ({
    x: Math.max(xDomain[0], Math.min(xDomain[1], p.x)),
    y: Math.max(yDomain[0], Math.min(yDomain[1], p.y)),
  });

  const fromEvent = (e: PointerEvent): Point | null => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return null;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    return { x: sx.invert(pt.x), y: sy.invert(pt.y) };
  };

  const move = (p: Point) => onChange(clampToPlot(constrain(clampToPlot(p))));

  const onKeyDown = (e: KeyboardEvent) => {
    const stepX = (xDomain[1] - xDomain[0]) / (e.shiftKey ? 10 : 50);
    const stepY = (yDomain[1] - yDomain[0]) / (e.shiftKey ? 10 : 50);
    const delta: Record<string, Point> = {
      ArrowLeft: { x: -stepX, y: 0 },
      ArrowRight: { x: stepX, y: 0 },
      ArrowUp: { x: 0, y: stepY },
      ArrowDown: { x: 0, y: -stepY },
    };
    const d = delta[e.key];
    if (!d) return;
    e.preventDefault();
    move({ x: x + d.x, y: y + d.y });
  };

  return (
    <g
      tabIndex={0}
      role="slider"
      aria-label={`${label}. Use arrow keys to move.`}
      aria-valuenow={+y.toFixed(2)}
      aria-valuetext={`x ${x.toFixed(1)}, y ${y.toFixed(1)}`}
      onKeyDown={onKeyDown}
      onPointerDown={(e) => {
        dragging.current = true;
        setActive(true);
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return;
        const p = fromEvent(e);
        if (p) move(p);
      }}
      onPointerUp={() => {
        dragging.current = false;
        setActive(false);
      }}
      onPointerCancel={() => {
        dragging.current = false;
        setActive(false);
      }}
      style={{ cursor: active ? 'grabbing' : 'grab', outline: 'none' }}
      className="group"
    >
      <circle cx={sx(x)} cy={sy(y)} r={20} fill="transparent" />
      <circle
        cx={sx(x)}
        cy={sy(y)}
        r={active ? 13 : 11}
        fill={fill}
        opacity={0.18}
        className="transition-all group-focus-visible:opacity-40"
      />
      <circle cx={sx(x)} cy={sy(y)} r={6.5} fill={fill} stroke="#fff" strokeWidth={2} />
    </g>
  );
}

interface RuleProps {
  /** Position on the x axis (vertical rule) or y axis (horizontal rule). */
  at: number;
  stroke?: string;
  dashed?: boolean;
  strokeWidth?: number;
}

/** A vertical line across the whole plot, e.g. a decision threshold. */
export function VRule({ at, stroke = COLORS.ink, dashed = false, strokeWidth = 1.5 }: RuleProps) {
  const { sx, sy, yDomain } = usePlot();
  return (
    <line
      x1={sx(at)}
      x2={sx(at)}
      y1={sy(yDomain[0])}
      y2={sy(yDomain[1])}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeDasharray={dashed ? '5 4' : undefined}
    />
  );
}

/** A horizontal line across the whole plot. */
export function HRule({ at, stroke = COLORS.ink, dashed = false, strokeWidth = 1.5 }: RuleProps) {
  const { sx, sy, xDomain } = usePlot();
  return (
    <line
      x1={sx(xDomain[0])}
      x2={sx(xDomain[1])}
      y1={sy(at)}
      y2={sy(at)}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeDasharray={dashed ? '5 4' : undefined}
    />
  );
}

interface BandProps {
  from: number;
  to: number;
  fill?: string;
  opacity?: number;
}

/** A shaded vertical band between two x values, e.g. "predict pass here". */
export function Band({ from, to, fill = COLORS.accent, opacity = 0.08 }: BandProps) {
  const { sx, sy, xDomain, yDomain } = usePlot();
  const a = Math.max(xDomain[0], Math.min(from, to));
  const b = Math.min(xDomain[1], Math.max(from, to));
  if (b <= a) return null;
  return <rect x={sx(a)} y={sy(yDomain[1])} width={sx(b) - sx(a)} height={sy(yDomain[0]) - sy(yDomain[1])} fill={fill} opacity={opacity} />;
}

interface BarsProps {
  /** One bar per entry, centred on `x`, rising or falling from zero to `y`. */
  bars: Point[];
  /** Bar width in x-axis units. */
  width?: number;
  fill?: string;
  title?: (bar: Point) => string;
}

/** Bars anchored to the zero line. Values beyond the plot are clipped at its edge. */
export function Bars({ bars, width = 0.6, fill = COLORS.ink, title }: BarsProps) {
  const { sx, sy, yDomain, clipId } = usePlot();
  const zero = sy(0);
  return (
    <g clipPath={`url(#${clipId})`}>
      {bars.map((bar) => {
        const top = sy(Math.max(yDomain[0], Math.min(yDomain[1], bar.y)));
        const w = Math.max(2, sx(bar.x + width / 2) - sx(bar.x - width / 2) - 2);
        return (
          <rect key={bar.x} x={sx(bar.x) - w / 2} y={Math.min(top, zero)} width={w} height={Math.max(Math.abs(top - zero), 0)} rx={2} fill={fill}>
            {title && <title>{title(bar)}</title>}
          </rect>
        );
      })}
    </g>
  );
}

interface RegionsProps {
  /** Opacity of the shading at a point of the plot, from 0 (none) to 1. */
  opacity: (x: number, y: number) => number;
  fill?: string;
  cols?: number;
  rows?: number;
}

/**
 * Shades the plot cell by cell, e.g. to show which class a model predicts
 * everywhere, or how confident it is. Draw it before the data points.
 */
export function Regions({ opacity, fill = COLORS.accent, cols = 40, rows = 28 }: RegionsProps) {
  const { sx, sy, xDomain, yDomain } = usePlot();
  const dx = (xDomain[1] - xDomain[0]) / cols;
  const dy = (yDomain[1] - yDomain[0]) / rows;
  const cells = [];
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const x = xDomain[0] + c * dx;
      const y = yDomain[0] + r * dy;
      const o = opacity(x + dx / 2, y + dy / 2);
      if (o <= 0.004) continue;
      cells.push(
        <rect key={`${c}-${r}`} x={sx(x)} y={sy(y + dy)} width={sx(x + dx) - sx(x)} height={sy(y) - sy(y + dy)} fill={fill} opacity={Math.min(1, o)} />,
      );
    }
  }
  // crispEdges stops neighbouring cells blending into visible seams.
  return (
    <g aria-hidden="true" shapeRendering="crispEdges">
      {cells}
    </g>
  );
}

interface ArrowProps {
  from: Point;
  to: Point;
  stroke?: string;
  strokeWidth?: number;
  dashed?: boolean;
  opacity?: number;
}

/** An arrow between two data points, e.g. a vector or a gradient direction. */
export function Arrow({ from, to, stroke = COLORS.ink, strokeWidth = 2.5, dashed = false, opacity = 1 }: ArrowProps) {
  const { sx, sy } = usePlot();
  const x1 = sx(from.x);
  const y1 = sy(from.y);
  const x2 = sx(to.x);
  const y2 = sy(to.y);
  const length = Math.hypot(x2 - x1, y2 - y1);
  if (length < 1) return null;
  // Arrowhead in pixel space, so it keeps its shape whatever the axis scales are.
  const head = Math.min(11, length * 0.45);
  const ux = (x2 - x1) / length;
  const uy = (y2 - y1) / length;
  const bx = x2 - ux * head;
  const by = y2 - uy * head;
  const half = head * 0.42;
  return (
    <g opacity={opacity}>
      <line x1={x1} y1={y1} x2={bx} y2={by} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={dashed ? '5 4' : undefined} />
      <polygon points={`${x2},${y2} ${bx - uy * half},${by + ux * half} ${bx + uy * half},${by - ux * half}`} fill={stroke} />
    </g>
  );
}
