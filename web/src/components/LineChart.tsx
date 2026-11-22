import { useRef, useState } from 'react';
import { formatNumber, useI18n } from '../i18n/context';
import { niceTicks } from './ticks';

export interface Series {
  label: string;
  className: string;
  points: { x: number; y: number }[];
}

interface Props {
  title: string;
  series: Series[];
  xMax: number;
  xLabel: string;
  yUnit: string;
  digits: number;
  /** Vertical guide markers, in mm from the butt. */
  markers: number[];
  /** Shaded ferrule range. */
  band?: { start: number; end: number } | null;
}

const W = 900;
const H = 340;
const M = { l: 64, r: 20, t: 34, b: 44 };

/** Line chart for the thickness, bending moment and stress windows of CALCPLOT. */
export function LineChart({ title, series, xMax, xLabel, yUnit, digits, markers, band }: Props) {
  const { lang } = useI18n();
  const ref = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const all = series.flatMap((s) => s.points);
  const yMaxData = Math.max(0, ...all.map((p) => p.y));
  const yMinData = Math.min(0, ...all.map((p) => p.y));
  const yt = niceTicks(yMinData, yMaxData * 1.08 || 1, 6);
  const yMin = Math.min(yMinData, yt[0]);
  const yMax = Math.max(yt[yt.length - 1], yMaxData * 1.05);
  const xt = niceTicks(0, xMax, 10);
  const px = (x: number) => M.l + (x / xMax) * (W - M.l - M.r);
  const py = (y: number) => H - M.b - ((y - yMin) / (yMax - yMin || 1)) * (H - M.t - M.b);

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = ref.current;
    if (!svg) return;
    const box = svg.getBoundingClientRect();
    const sx = ((e.clientX - box.left) / box.width) * W;
    const x = ((sx - M.l) / (W - M.l - M.r)) * xMax;
    setHover(x >= 0 && x <= xMax ? x : null);
  };
  const nearest = (pts: { x: number; y: number }[], x: number) =>
    pts.reduce((best, p) => (Math.abs(p.x - x) < Math.abs(best.x - x) ? p : best), pts[0]);
  const hoverPts = hover === null ? [] : series.map((s) => ({ s, p: nearest(s.points, hover) }));

  return (
    <figure className="chart line-chart">
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={title}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        {band && <rect className="band" x={px(band.start)} y={M.t} width={px(band.end) - px(band.start)} height={H - M.t - M.b} />}
        <g className="grid">
          {yt.map((y) => (
            <line key={y} x1={M.l} x2={W - M.r} y1={py(y)} y2={py(y)} />
          ))}
        </g>
        <g className="markers">
          {markers.map((x, i) => (
            <g key={i}>
              <line x1={px(x)} x2={px(x)} y1={M.t - 6} y2={H - M.b} />
              <text x={px(x)} y={M.t - 10} textAnchor="middle">
                {i + 1}
              </text>
            </g>
          ))}
        </g>
        <g className="axis-labels">
          {yt.map((y) => (
            <text key={y} x={M.l - 8} y={py(y) + 4} textAnchor="end">
              {formatNumber(lang, y, y % 1 === 0 ? 0 : 1)}
            </text>
          ))}
          {xt.map((x) => (
            <text key={x} x={px(x)} y={H - M.b + 18} textAnchor="middle">
              {x}
            </text>
          ))}
          <text x={(M.l + W - M.r) / 2} y={H - 6} textAnchor="middle" className="axis-title">
            {xLabel} (mm)
          </text>
          <text x={14} y={M.t - 14} className="axis-title">
            {yUnit}
          </text>
        </g>
        <line className="axis" x1={M.l} x2={W - M.r} y1={py(0)} y2={py(0)} />
        {series.map((s) => (
          <polyline key={s.label} className={`series ${s.className}`} points={s.points.map((p) => `${px(p.x)},${py(p.y)}`).join(' ')} />
        ))}
        {hover !== null && hoverPts.length > 0 && (
          <g className="hover">
            <line x1={px(hoverPts[0].p.x)} x2={px(hoverPts[0].p.x)} y1={M.t} y2={H - M.b} />
            {hoverPts.map(({ s, p }) => (
              <circle key={s.label} className={s.className} cx={px(p.x)} cy={py(p.y)} r={4} />
            ))}
          </g>
        )}
      </svg>
      <figcaption>
        <ul className="legend">
          {series.map((s) => (
            <li key={s.label}>
              <span className={`sw ${s.className}`} />
              {s.label}
            </li>
          ))}
        </ul>
        <span className="readout" aria-live="polite">
          {hoverPts.length > 0
            ? `X = ${formatNumber(lang, hoverPts[0].p.x, 1)} mm · ` +
              hoverPts.map(({ s, p }) => `${s.label}: ${formatNumber(lang, p.y, digits)} ${yUnit}`).join(' · ')
            : ' '}
        </span>
      </figcaption>
    </figure>
  );
}
