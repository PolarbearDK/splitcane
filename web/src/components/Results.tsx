import { useState } from 'react';
import type { ModelResult } from '../engine/types';
import { formatNumber, useI18n } from '../i18n/context';
import { DeflectionChart } from './DeflectionChart';
import { LineChart } from './LineChart';

type ChartTab = 'deflection' | 'thickness' | 'moment' | 'stress';
type TableTab = 'guides' | 'taper' | 'loaded' | 'jig';

function Tabs<T extends string>({ value, options, onChange, label }: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {options.map(([v, text]) => (
        <button key={v} type="button" role="tab" aria-selected={v === value} className={v === value ? 'active' : ''} onClick={() => onChange(v)}>
          {text}
        </button>
      ))}
    </div>
  );
}

export function Results({ result, rodLength }: { result: ModelResult; rodLength: number }) {
  const { t, lang } = useI18n();
  const [chart, setChart] = useState<ChartTab>('deflection');
  const [table, setTable] = useState<TableTab>('guides');
  const n = (v: number, d = 1) => formatNumber(lang, v, d);

  const load = result.loads[result.loads.length - 1];
  const ghost = result.loads.length > 1 ? result.loads[0] : undefined;
  const markers = result.guides.slice(1).map((g) => g.fromButt);
  const { diam, high } = result.section;

  return (
    <div className="results">
      <dl className="stats">
        <div>
          <dt>{t.results.mass}</dt>
          <dd>
            {n(result.design.mass, 1)} <small>{t.units.g}</small>
          </dd>
        </div>
        <div>
          <dt>{t.results.cg}</dt>
          <dd>
            {n(result.design.centreOfGravity, 0)} <small>{t.units.mm}</small>
          </dd>
          <dd className="sub">{t.results.cgHelp}</dd>
        </div>
        <div>
          <dt>{t.results.sigmaMax}</dt>
          <dd>
            {n(load.sigmaMax, 1)} <small>{t.units.Nmm2}</small>
          </dd>
          <dd className="sub">{t.results.sigmaMaxAt(n(rodLength - load.sigmaMaxAt, 0))}</dd>
        </div>
        <div>
          <dt>{t.results.tip}</dt>
          <dd>
            {n(load.tip.x, 0)}; {n(load.tip.y, 0)} <small>{t.units.mm}</small>
          </dd>
          <dd className="sub">
            {n(load.lineTension, 2)} N · {n(load.lineAngle, 0)}° · {t.results.steps(load.steps)}
          </dd>
        </div>
        <div>
          <dt>{t.results.refForce}</dt>
          <dd>
            {n(result.reference.force, 4)} <small>{t.units.N}</small>
          </dd>
          <dd className="sub">{t.results.refForceHelp}</dd>
        </div>
        <div>
          <dt>{t.results.ferrule}</dt>
          <dd>{result.ferrule ? `${n(result.ferrule.start, 0)} – ${n(result.ferrule.end, 0)}` : t.results.noFerrule}</dd>
          <dd className="sub">
            {t.units.mm} · {t.results.shape[result.shapeKind]}
          </dd>
        </div>
      </dl>

      {result.warnings.length > 0 && (
        <div className="notice warn">
          <strong>{t.results.warnings}</strong>
          <ul>
            {result.warnings.map((w, i) => (
              <li key={i}>{t.warnings[w.code]?.(w.params ?? {}) ?? w.code}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="card">
        <Tabs
          label="charts"
          value={chart}
          onChange={setChart}
          options={[
            ['deflection', t.charts.deflection],
            ['thickness', t.charts.thickness],
            ['moment', t.charts.moment],
            ['stress', t.charts.stress],
          ]}
        />
        {chart === 'deflection' && <DeflectionChart result={result} load={load} ghost={ghost} rodLength={rodLength} />}
        {chart === 'thickness' && (
          <LineChart
            title={t.charts.thickness}
            xMax={rodLength}
            xLabel={t.charts.position}
            yUnit="mm"
            digits={2}
            markers={markers}
            band={result.ferrule}
            series={[
              { label: t.charts.diameter, className: 's1', points: result.xl.map((x, i) => ({ x, y: result.rr[i] * diam })) },
              { label: t.charts.height, className: 's2', points: result.xl.map((x, i) => ({ x, y: result.rr[i] * high })) },
            ]}
          />
        )}
        {chart === 'moment' && (
          <LineChart
            title={t.charts.moment}
            xMax={rodLength}
            xLabel={t.charts.position}
            yUnit={t.units.Nmm}
            digits={1}
            markers={markers}
            band={result.ferrule}
            series={[
              ...(ghost ? [{ label: t.results.designLoad, className: 'ghost', points: ghost.rows.map((r) => ({ x: r.x, y: r.moment })) }] : []),
              { label: ghost ? t.results.appliedLoad : t.charts.moment, className: 's1', points: load.rows.map((r) => ({ x: r.x, y: r.moment })) },
            ]}
          />
        )}
        {chart === 'stress' && (
          <LineChart
            title={t.charts.stress}
            xMax={rodLength}
            xLabel={t.charts.position}
            yUnit={t.units.Nmm2}
            digits={2}
            markers={markers}
            band={result.ferrule}
            series={[
              ...(ghost ? [{ label: t.results.designLoad, className: 'ghost', points: ghost.rows.map((r) => ({ x: r.x, y: r.stress })) }] : []),
              { label: ghost ? t.results.appliedLoad : t.charts.stress, className: 's3', points: load.rows.map((r) => ({ x: r.x, y: r.stress })) },
            ]}
          />
        )}
      </section>

      <section className="card">
        <Tabs
          label="tables"
          value={table}
          onChange={setTable}
          options={[
            ['guides', t.tables.guides],
            ['taper', t.tables.taper],
            ['loaded', t.tables.loaded],
            ['jig', t.tables.jig],
          ]}
        />
        <div className="table-wrap">
          {table === 'guides' && (
            <table>
              <thead>
                <tr>
                  <th>{t.tables.no}</th>
                  <th>{t.tables.fromButt}</th>
                  <th>{t.tables.fromTip}</th>
                  <th>{t.tables.spacing}</th>
                  <th>{t.tables.guideHeight}</th>
                </tr>
              </thead>
              <tbody>
                {result.guides.map((g) => (
                  <tr key={g.index}>
                    <td>{g.index === 0 ? t.tables.handle : g.index}</td>
                    <td>{n(g.fromButt, 2)}</td>
                    <td>{n(g.fromTip, 2)}</td>
                    <td>{n(g.spacing, 2)}</td>
                    <td>{g.index === 0 ? '' : n(g.height, 2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5}>{t.units.mm}</td>
                </tr>
              </tfoot>
            </table>
          )}
          {table === 'taper' && (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t.tables.x}</th>
                  <th>{t.tables.fromTip}</th>
                  <th>{t.tables.ux}</th>
                  <th>{t.tables.uy}</th>
                  <th>{t.tables.angle} °</th>
                  <th>{t.tables.diameter}</th>
                  <th>{t.tables.height}</th>
                  <th>{t.tables.radius}</th>
                  <th>{t.tables.width}</th>
                </tr>
              </thead>
              <tbody>
                {result.design.rows.map((r) => (
                  <tr key={r.index} className={r.index === result.lferl ? 'ferrule' : r.index <= result.nhand ? 'handle' : ''}>
                    <td>{r.index}</td>
                    <td>{n(r.x)}</td>
                    <td>{n(r.fromTip)}</td>
                    <td>{n(r.ux)}</td>
                    <td>{n(r.uy)}</td>
                    <td>{n(r.angle, 3)}</td>
                    <td>{n(r.diameter, 2)}</td>
                    <td>{n(r.height, 2)}</td>
                    <td>{n(r.radius, 2)}</td>
                    <td>{n(r.width, 2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={10}>{t.units.mm}</td>
                </tr>
              </tfoot>
            </table>
          )}
          {table === 'loaded' && (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t.tables.x}</th>
                  <th>{t.tables.fromTip}</th>
                  <th>{t.tables.ux}</th>
                  <th>{t.tables.uy}</th>
                  <th>{t.tables.angle} °</th>
                  <th>
                    {t.tables.moment} <small>{t.units.Nmm}</small>
                  </th>
                  <th>
                    {t.tables.stress} <small>{t.units.Nmm2}</small>
                  </th>
                  <th>{t.tables.diameter}</th>
                </tr>
              </thead>
              <tbody>
                {load.rows.map((r) => (
                  <tr key={r.index} className={r.index === result.lferl ? 'ferrule' : ''}>
                    <td>{r.index}</td>
                    <td>{n(r.x)}</td>
                    <td>{n(r.fromTip)}</td>
                    <td>{n(r.ux)}</td>
                    <td>{n(r.uy)}</td>
                    <td>{n(r.angle, 2)}</td>
                    <td>{n(r.moment)}</td>
                    <td>{n(r.stress, 2)}</td>
                    <td>{n(r.diameter, 3)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={9}>
                    {t.results.appliedLoad}: {n(load.lineTension, 2)} N, {n(load.lineAngle, 1)}°
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
          {table === 'jig' && (
            <table>
              <thead>
                <tr>
                  <th rowSpan={2}>{t.tables.screw}</th>
                  <th colSpan={3}>mm</th>
                  <th colSpan={3}>{t.tables.inch}</th>
                </tr>
                <tr>
                  <th>{t.tables.fromTip}</th>
                  <th>{t.tables.depth}</th>
                  <th>{t.tables.diameter}</th>
                  <th>{t.tables.fromTip}</th>
                  <th>{t.tables.depth}</th>
                  <th>{t.tables.diameter}</th>
                </tr>
              </thead>
              <tbody>
                {result.jig.map((j) => (
                  <tr key={j.index}>
                    <td>{j.index}</td>
                    <td>{n(j.z, 1)}</td>
                    <td>{n(j.h, 3)}</td>
                    <td>{n(j.d, 3)}</td>
                    <td>{n(j.zInch, 2)}</td>
                    <td>{n(j.hInch, 3)}</td>
                    <td>{n(j.dInch, 3)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={7}>{t.tables.jigHelp}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
