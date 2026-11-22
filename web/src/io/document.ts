/**
 * The JSON file format that replaces the old .DAT files.
 *
 * {
 *   "format": "splitcane", "version": 1,
 *   "name": "...", "notes": "...",
 *   "design": { ...DesignParams },
 *   "curve": "parabola",               // optional target bend curve; default "spiral" (circle when spiralParameter = 0)
 *   "guidePositions": [ ... ],        // only used when design.guideSpacingRatio = 0
 *   "taper": [ { "x": 0, "d": 6.4 } ], // only used when design.tipDiameter = 0
 *   "load": { "lineTension": 0.3, "lineAngle": 100 } // optional test load
 * }
 */
import type { DesignParams, LoadCase, ModelInput, TaperPoint } from '../engine/types';

export const FORMAT_ID = 'splitcane';
/** Written by the first web version; still accepted when opening a file. */
const OLD_FORMAT_IDS = ['stangbygning'];
export const FORMAT_VERSION = 1;

export interface RodDocument extends ModelInput {
  format: typeof FORMAT_ID;
  version: number;
  name: string;
  notes?: string;
}

export const DESIGN_KEYS: (keyof DesignParams)[] = [
  'sides',
  'guideCount',
  'elementCount',
  'rodLength',
  'handleLength',
  'firstGuideDistance',
  'tipDiameter',
  'guideSpacingRatio',
  'topGuideHeight',
  'bottomGuideHeight',
  'jigScrewSpacing',
  'ferruleLength',
  'ferruleClearance',
  'elasticModulus',
  'density',
  'lineTension',
  'lineAngle',
  'tipAngle',
  'spiralParameter',
];

/** Default values from STANG.F90 (used when no input file existed). */
export const DEFAULT_DESIGN: DesignParams = {
  sides: 6,
  guideCount: 8,
  elementCount: 200,
  elasticModulus: 25000,
  density: 1.1,
  lineTension: 0.2,
  rodLength: 2286,
  handleLength: 260,
  firstGuideDistance: 400,
  tipDiameter: 1.6,
  guideSpacingRatio: 3.3,
  topGuideHeight: 5,
  bottomGuideHeight: 8,
  jigScrewSpacing: 127,
  ferruleLength: 80,
  ferruleClearance: 15,
  lineAngle: 95,
  tipAngle: 60,
  spiralParameter: 70,
};

export function newDocument(name = 'stang', design: DesignParams = DEFAULT_DESIGN): RodDocument {
  return { format: FORMAT_ID, version: FORMAT_VERSION, name, design: { ...design } };
}

export class DocumentError extends Error {
  constructor(
    readonly code: 'notJson' | 'wrongFormat' | 'newerVersion' | 'missingField' | 'badValue',
    readonly detail = '',
  ) {
    super(`${code}${detail ? `: ${detail}` : ''}`);
  }
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export function parseDocument(text: string): RodDocument {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new DocumentError('notJson');
  }
  if (!raw || typeof raw !== 'object') throw new DocumentError('wrongFormat');
  const o = raw as Record<string, unknown>;
  if (o.format !== FORMAT_ID && !OLD_FORMAT_IDS.includes(o.format as string)) throw new DocumentError('wrongFormat');
  if (!isNum(o.version) || o.version > FORMAT_VERSION) throw new DocumentError('newerVersion', String(o.version));
  const d = o.design as Record<string, unknown> | undefined;
  if (!d || typeof d !== 'object') throw new DocumentError('missingField', 'design');
  const design = {} as DesignParams;
  for (const k of DESIGN_KEYS) {
    if (!isNum(d[k])) throw new DocumentError('missingField', `design.${k}`);
    design[k] = d[k] as number;
  }
  const doc: RodDocument = {
    format: FORMAT_ID,
    version: FORMAT_VERSION,
    name: typeof o.name === 'string' ? o.name : 'stang',
    design,
  };
  if (typeof o.notes === 'string' && o.notes) doc.notes = o.notes;
  if (o.guidePositions !== undefined) {
    if (!Array.isArray(o.guidePositions) || !o.guidePositions.every(isNum)) throw new DocumentError('badValue', 'guidePositions');
    doc.guidePositions = o.guidePositions as number[];
  }
  if (o.taper !== undefined) {
    if (!Array.isArray(o.taper)) throw new DocumentError('badValue', 'taper');
    doc.taper = (o.taper as unknown[]).map((p, i) => {
      const q = p as Record<string, unknown>;
      if (!q || !isNum(q.x) || !isNum(q.d)) throw new DocumentError('badValue', `taper[${i}]`);
      return { x: q.x, d: q.d } as TaperPoint;
    });
  }
  if (o.curve !== undefined) {
    if (o.curve !== 'spiral' && o.curve !== 'parabola') throw new DocumentError('badValue', 'curve');
    if (o.curve === 'parabola') doc.curve = 'parabola';
  }
  if (o.load !== undefined) {
    const l = o.load as Record<string, unknown>;
    if (!l || !isNum(l.lineTension) || !isNum(l.lineAngle)) throw new DocumentError('badValue', 'load');
    doc.load = { lineTension: l.lineTension, lineAngle: l.lineAngle } as LoadCase;
  }
  return doc;
}

export function serializeDocument(doc: RodDocument): string {
  const out: Record<string, unknown> = {
    format: FORMAT_ID,
    version: FORMAT_VERSION,
    name: doc.name,
  };
  if (doc.notes) out.notes = doc.notes;
  const design: Record<string, number> = {};
  for (const k of DESIGN_KEYS) design[k] = doc.design[k];
  out.design = design;
  if (doc.curve === 'parabola') out.curve = 'parabola';
  if (doc.guidePositions?.length) out.guidePositions = doc.guidePositions;
  if (doc.taper?.length) out.taper = doc.taper;
  if (doc.load) out.load = doc.load;
  return JSON.stringify(out, null, 2) + '\n';
}
