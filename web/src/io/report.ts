/** Plain-text report, the successor of the .OUT file. */
import type { ModelResult } from '../engine/types';
import { formatNumber } from '../i18n/context';
import type { Lang, Strings } from '../i18n/strings';
import { DESIGN_KEYS, type RodDocument } from './document';

export function buildReport(doc: RodDocument, result: ModelResult, t: Strings, lang: Lang): string {
  const n = (v: number, d = 1) => formatNumber(lang, v, d);
  const pad = (s: string, w: number) => s.padStart(w);
  const row = (cells: string[], widths: number[]) => cells.map((c, i) => pad(c, widths[i])).join(' ');
  const out: string[] = [];
  const h = (s: string) => out.push('', s, '-'.repeat(s.length));

  out.push(`${t.report.title}: ${doc.name}`);
  out.push(`${t.report.generated} ${new Date().toLocaleString(lang === 'da' ? 'da-DK' : 'en-GB')}`);
  if (doc.notes) out.push('', doc.notes);

  h(t.report.input);
  out.push(`  ${t.curve.label.padEnd(38)} ${doc.curve === 'parabola' ? t.curve.parabola : t.curve.spiral}`);
  for (const k of DESIGN_KEYS) out.push(`  ${t.fields[k].label.padEnd(38)} ${n(doc.design[k], 3)}`);
  if (doc.load) out.push(`  ${(t.results.appliedLoad + ': ' + t.fields.loadTension.label).padEnd(38)} ${n(doc.load.lineTension, 3)}`, `  ${(t.results.appliedLoad + ': ' + t.fields.loadAngle.label).padEnd(38)} ${n(doc.load.lineAngle, 3)}`);

  h(`${t.results.mass} / ${t.results.cg} / ${t.results.refForce}`);
  out.push(`  ${t.results.mass}: ${n(result.design.mass, 2)} g`);
  out.push(`  ${t.results.cg}: ${n(result.design.centreOfGravity, 2)} mm ${t.results.cgHelp}`);
  out.push(`  ${t.results.refForce}: ${n(result.reference.force, 6)} N (${t.results.refForceHelp})`);
  out.push(`  ${t.results.ferrule}: ${result.ferrule ? `${n(result.ferrule.start, 2)} – ${n(result.ferrule.end, 2)} mm` : t.results.noFerrule}`);

  h(t.tables.guides);
  const gw = [8, 12, 12, 12, 10];
  out.push(row([t.tables.no, t.tables.fromButt, t.tables.fromTip, t.tables.spacing, t.tables.guideHeight], gw));
  for (const g of result.guides) out.push(row([g.index === 0 ? t.tables.handle : String(g.index), n(g.fromButt, 2), n(g.fromTip, 2), n(g.spacing, 2), g.index ? n(g.height, 2) : ''], gw));

  h(t.tables.taper);
  const tw = [4, 8, 8, 8, 8, 9, 9, 8, 8, 8];
  out.push(row(['#', t.tables.x, t.tables.fromTip, t.tables.ux, t.tables.uy, t.tables.angle, t.tables.diameter, t.tables.height, t.tables.radius, t.tables.width], tw));
  for (const r of result.design.rows)
    out.push(row([String(r.index), n(r.x), n(r.fromTip), n(r.ux), n(r.uy), n(r.angle, 3), n(r.diameter, 2), n(r.height, 2), n(r.radius, 2), n(r.width, 2)], tw));

  for (const load of result.loads) {
    h(`${t.tables.loaded}: ${n(load.lineTension, 4)} N, ${n(load.lineAngle, 2)}°`);
    const lw = [4, 8, 8, 8, 8, 8, 11, 10, 9];
    out.push(row(['#', t.tables.x, t.tables.fromTip, t.tables.ux, t.tables.uy, t.tables.angle, t.tables.moment, t.tables.stress, t.tables.diameter], lw));
    for (const r of load.rows) out.push(row([String(r.index), n(r.x), n(r.fromTip), n(r.ux), n(r.uy), n(r.angle, 2), n(r.moment), n(r.stress, 2), n(r.diameter, 3)], lw));
    out.push(`  ${t.results.sigmaMax}: ${n(load.sigmaMax, 1)} N/mm², ${t.results.sigmaMaxAt(n(doc.design.rodLength - load.sigmaMaxAt, 1))}`);
  }

  h(t.tables.jig);
  out.push(t.tables.jigHelp);
  const jw = [6, 11, 9, 9, 10, 9, 9];
  out.push(row([t.tables.screw, 'mm', t.tables.depth, t.tables.diameter, t.tables.inch, t.tables.depth, t.tables.diameter], jw));
  for (const j of result.jig) out.push(row([String(j.index), n(j.z, 3), n(j.h, 3), n(j.d, 3), n(j.zInch, 3), n(j.hInch, 3), n(j.dInch, 3)], jw));

  return out.join('\n') + '\n';
}
