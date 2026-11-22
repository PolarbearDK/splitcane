/**
 * Form state: every input is kept as the text the user typed, so half-typed
 * numbers ("1,") don't get rewritten. Parsing accepts Danish decimal commas.
 */
import type { DesignParams, ModelInput, TaperPoint } from './engine/types';
import { DESIGN_KEYS, type RodDocument } from './io/document';
import type { Strings } from './i18n/strings';

export type FieldKey = keyof DesignParams | 'loadTension' | 'loadAngle';

export interface FormState {
  name: string;
  notes: string;
  fields: Record<FieldKey, string>;
  guideText: string;
  taperText: string;
}

const fmt = (n: number) => (Number.isFinite(n) ? String(Math.round(n * 1e6) / 1e6) : '');

export function formFromDocument(doc: RodDocument): FormState {
  const fields = {} as Record<FieldKey, string>;
  for (const k of DESIGN_KEYS) fields[k] = fmt(doc.design[k]);
  fields.loadTension = fmt(doc.load?.lineTension ?? doc.design.lineTension);
  fields.loadAngle = fmt(doc.load?.lineAngle ?? doc.design.lineAngle);
  return {
    name: doc.name,
    notes: doc.notes ?? '',
    fields,
    guideText: (doc.guidePositions ?? []).map(fmt).join('\n'),
    taperText: (doc.taper ?? []).map((p) => `${fmt(p.x)}\t${fmt(p.d)}`).join('\n'),
  };
}

export function parseNumber(text: string): number {
  const t = text.trim().replace(/\s/g, '');
  if (t === '') return NaN;
  // "1,6" -> 1.6 (Danish); "1.6" stays
  const normal = /^-?\d*,\d+$/.test(t) ? t.replace(',', '.') : t;
  return /^-?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(normal) ? Number(normal) : NaN;
}

function splitPair(line: string): string[] {
  const t = line.trim();
  if (/[\s;]/.test(t)) return t.split(/[\s;]+/).filter(Boolean);
  return t.split(',');
}

export function parseGuideText(text: string): number[] | null {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const nums = lines.map(parseNumber);
  return nums.every(Number.isFinite) ? nums : null;
}

export function parseTaperText(text: string): TaperPoint[] | null {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const out: TaperPoint[] = [];
  for (const line of lines) {
    const parts = splitPair(line).map(parseNumber);
    if (parts.length < 2 || !Number.isFinite(parts[0]) || !Number.isFinite(parts[1])) return null;
    out.push({ x: parts[0], d: parts[1] });
  }
  return out;
}

type Rule = (v: number, all: Record<FieldKey, number>) => string | null;

function rules(t: Strings['validation']): Partial<Record<FieldKey, Rule[]>> {
  const integer: Rule = (v) => (Number.isInteger(v) ? null : t.integer);
  const min = (m: number): Rule => (v) => (v >= m ? null : t.min(m));
  const max = (m: number): Rule => (v) => (v <= m ? null : t.max(m));
  const positive: Rule = (v) => (v > 0 ? null : t.positive);
  const nonNeg: Rule = (v) => (v >= 0 ? null : t.nonNegative);
  return {
    sides: [integer, min(3), max(24)],
    guideCount: [integer, min(3), max(14)],
    elementCount: [integer, min(29), max(119)],
    rodLength: [positive],
    handleLength: [positive, (v, a) => (v < a.rodLength ? null : t.lessThanLength)],
    firstGuideDistance: [positive, (v, a) => (a.handleLength + v < a.rodLength ? null : t.handlePlusGuide)],
    tipDiameter: [nonNeg],
    guideSpacingRatio: [nonNeg],
    topGuideHeight: [nonNeg],
    bottomGuideHeight: [nonNeg],
    elasticModulus: [positive],
    density: [positive],
    lineTension: [positive],
    lineAngle: [positive, max(179)],
    tipAngle: [positive, (v, a) => (v < a.lineAngle ? null : t.tipBelowLine)],
    spiralParameter: [min(-89), max(89)],
    ferruleLength: [nonNeg],
    ferruleClearance: [nonNeg],
    jigScrewSpacing: [positive],
    loadTension: [positive],
    loadAngle: [positive, max(179)],
  };
}

export interface Validated {
  errors: Partial<Record<FieldKey | 'guides' | 'taper', string>>;
  input: ModelInput | null;
  document: RodDocument | null;
}

export function validate(form: FormState, t: Strings): Validated {
  const values = {} as Record<FieldKey, number>;
  const errors: Validated['errors'] = {};
  for (const k of Object.keys(form.fields) as FieldKey[]) {
    values[k] = parseNumber(form.fields[k]);
    if (!Number.isFinite(values[k])) errors[k] = t.validation.number;
  }
  const r = rules(t.validation);
  for (const k of Object.keys(r) as FieldKey[]) {
    if (errors[k]) continue;
    for (const rule of r[k]!) {
      const msg = rule(values[k], values);
      if (msg) {
        errors[k] = msg;
        break;
      }
    }
  }
  const design = {} as DesignParams;
  for (const k of DESIGN_KEYS) design[k] = values[k];

  let guidePositions: number[] | undefined;
  if (values.guideSpacingRatio < 0.01 && !errors.guideSpacingRatio) {
    const g = parseGuideText(form.guideText);
    if (!g || g.length !== values.guideCount) errors.guides = t.validation.guideList(values.guideCount || 0);
    else guidePositions = g;
  }
  let taper: TaperPoint[] | undefined;
  if (values.tipDiameter < 0.0001 && !errors.tipDiameter) {
    const p = parseTaperText(form.taperText);
    if (!p) errors.taper = t.validation.taperList;
    else taper = p;
  }
  if (Object.keys(errors).length) return { errors, input: null, document: null };

  const load = { lineTension: values.loadTension, lineAngle: values.loadAngle };
  const input: ModelInput = { design, guidePositions, taper, load };
  const document: RodDocument = {
    format: 'stangbygning',
    version: 1,
    name: form.name.trim() || 'stang',
    design,
  };
  if (form.notes.trim()) document.notes = form.notes;
  // Keep custom lists in the file even when they are not in use, so switching back is lossless.
  const g = parseGuideText(form.guideText);
  if (g?.length) document.guidePositions = g;
  const p = parseTaperText(form.taperText);
  if (p?.length) document.taper = p;
  if (load.lineTension !== design.lineTension || load.lineAngle !== design.lineAngle) document.load = load;
  return { errors, input, document };
}
