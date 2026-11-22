import { useMemo, useState } from 'react';
import type { LoadResult, ModelResult, Point } from '../engine/types';
import { formatNumber, useI18n } from '../i18n/context';
import { niceTicks } from './ticks';

interface Props {
  result: ModelResult;
  load: LoadResult;
  /** Faint comparison shape (the design load when a test load is shown). */
  ghost?: LoadResult;
  rodLength: number;
}

const EXAGGERATIONS = [1, 5, 10, 20];

/**
 * Re-implementation of the "UDBØJNING" QuickWin window from CALCPLOT.F90.
 * World coordinates are millimetres with y up; the SVG flips y.
 */
export function DeflectionChart({ result, load, ghost, rodLength }: Props) {
  const { t, lang } = useI18n();
  const [k, setK] = useState(5);

  // Window as in CALCPLOT: XMAX = STAL, YMAX = 0.65·XMAX
  const XMAX = rodLength;
  const YMAX = 0.65 * XMAX;
  const left = -0.07 * XMAX;
  const right = 1.04 * XMAX;
  const bottom = -0.06 * XMAX;
  const top = 0.7 * XMAX;
  const W = right - left;
  const H = top - bottom;
  const sy = (y: number) => -y;
  const pt = (p: Point) => `${p.x},${sy(p.y)}`;

  const polys = useMemo(() => {
    const out: { d: string; kind: 'rod' | 'handle' | 'ferrule' }[] = [];
    const { rr, nhand, lferl } = result;
    for (let i = 1; i < load.shape.length; i++) {
      const a = load.shape[i - 1];
      const b = load.shape[i];
      const kind = i === lferl ? 'ferrule' : i <= nhand ? 'handle' : 'rod';
      const f = (kind === 'ferrule' ? 1.2 : kind === 'handle' ? 2.0 : 1.0) * k;
      const r1 = rr[i - 1] * f;
      const r2 = rr[i] * f;
      const t1 = { x: -r1 * Math.sin(a.angle), y: r1 * Math.cos(a.angle) };
      const t2 = { x: -r2 * Math.sin(b.angle), y: r2 * Math.cos(b.angle) };
      const p = [
        { x: a.x + t1.x, y: a.y + t1.y },
        { x: a.x - t1.x, y: a.y - t1.y },
        { x: b.x - t2.x, y: b.y - t2.y },
        { x: b.x + t2.x, y: b.y + t2.y },
      ];
      out.push({ d: `M${p.map(pt).join('L')}Z`, kind });
    }
    return out;
  }, [result, load, k]);

  // The line: from x = 0 through the guides, then out at the line angle to the edge of the plot.
  const line = useMemo(() => {
    const pts = [load.lineStart, ...load.guides];
    const last = load.guides[load.guides.length - 1];
    const rish = (load.lineAngle * Math.PI) / 180;
    let cx = last.x + (YMAX - last.y) / Math.tan(rish);
    let cy = YMAX;
    if (cx > XMAX) {
      cx = XMAX;
      cy = last.y + Math.tan(rish) * (XMAX - last.x);
    } else if (cx < 0) {
      cx = 0;
      cy = last.y + Math.tan(rish) * (0 - last.x);
    }
    pts.push({ x: cx, y: cy });
    return pts;
  }, [load, XMAX, YMAX]);

  const xt = niceTicks(0, XMAX, 10);
  const yt = niceTicks(0, YMAX, 7);
  const font = W / 70;
  const showIdeal = result.shapeKind !== 'custom';
  const centre = result.center;
  const nhandPt = load.shape[result.nhand];
  const idealEnd = result.ideal[result.ideal.length - 1];
  const centreVisible = centre && centre.x > left && centre.x < right && centre.y < top;

  return (
    <figure className="chart deflection">
      <div className="chart-tools">
        <label>
          {t.charts.exaggeration}
          <select value={k} onChange={(e) => setK(Number(e.target.value))}>
            {EXAGGERATIONS.map((v) => (
              <option key={v} value={v}>
                {v}×
              </option>
            ))}
          </select>
        </label>
      </div>
      <svg viewBox={`${left} ${-top} ${W} ${H}`} role="img" aria-label={t.charts.deflection}>
        <g className="grid">
          {xt.map((x) => (
            <line key={`x${x}`} x1={x} x2={x} y1={0} y2={sy(YMAX)} />
          ))}
          {yt.map((y) => (
            <line key={`y${y}`} x1={0} x2={XMAX} y1={sy(y)} y2={sy(y)} />
          ))}
        </g>
        <g className="axis-labels" fontSize={font}>
          {xt.map((x) => (
            <text key={`xl${x}`} x={x} y={font * 1.5} textAnchor="middle">
              {x}
            </text>
          ))}
          {yt.map((y) => (
            <text key={`yl${y}`} x={-font * 0.6} y={sy(y) + font * 0.35} textAnchor="end">
              {y}
            </text>
          ))}
        </g>

        {showIdeal && centre && centreVisible && (
          <polyline className="radii" points={[nhandPt, centre, idealEnd].map(pt).join(' ')} />
        )}
        {showIdeal && <polyline className="ideal" points={result.ideal.map(pt).join(' ')} />}
        {ghost && <polyline className="ghost" points={ghost.shape.map(pt).join(' ')} />}

        <g className="rod">
          {polys.map((p, i) => (
            <path key={i} d={p.d} className={p.kind} />
          ))}
        </g>

        <polyline className="line" points={line.map(pt).join(' ')} />
        <g className="guides">
          {load.guides.map((g, i) => (
            <line key={i} x1={g.x} y1={sy(g.y)} x2={load.guideFeet[i].x} y2={sy(load.guideFeet[i].y)} />
          ))}
          {load.guides.map((g, i) => (
            <circle key={`c${i}`} cx={g.x} cy={sy(g.y)} r={W / 260} />
          ))}
        </g>
        {showIdeal && centre && centreVisible && <circle className="centre" cx={centre.x} cy={sy(centre.y)} r={W / 300} />}
        <text className="tip-label" x={load.tip.x} y={sy(load.tip.y) - font} fontSize={font} textAnchor="middle">
          ({formatNumber(lang, load.tip.x, 0)}; {formatNumber(lang, load.tip.y, 0)})
        </text>
      </svg>
      <figcaption>
        <ul className="legend">
          <li>
            <span className="sw rod" />
            {t.charts.legendRod}
          </li>
          <li>
            <span className="sw handle" />
            {t.charts.legendHandle}
          </li>
          {result.lferl > 0 && (
            <li>
              <span className="sw ferrule" />
              {t.charts.legendFerrule}
            </li>
          )}
          {showIdeal && (
            <li>
              <span className="sw ideal" />
              {t.charts.legendIdeal}
            </li>
          )}
          {showIdeal && centreVisible && (
            <li>
              <span className="sw radii" />
              {t.charts.legendCentre}
            </li>
          )}
          {ghost && (
            <li>
              <span className="sw ghost" />
              {t.charts.legendDesignLoad}
            </li>
          )}
          <li>
            <span className="sw line" />
            {t.charts.legendLine}
          </li>
          <li>
            <span className="sw guide" />
            {t.charts.legendGuides}
          </li>
        </ul>
        <span className="note">{t.charts.deflectionNote} mm.</span>
      </figcaption>
    </figure>
  );
}
