import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { RodError } from '../src/engine/errors';
import { runModel } from '../src/engine/model';
import { DocumentError, newDocument, parseDocument, serializeDocument } from '../src/io/document';
import { parseLegacyDat } from '../src/io/legacyDat';

const fixture = (name: string) => readFileSync(fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url)), 'utf8');

describe('legacy .DAT import', () => {
  it('reads the header lines and ignores the rewritten tables', () => {
    const doc = parseLegacyDat(fixture('STANG.DAT.txt'));
    expect(doc.design).toMatchObject({ sides: 6, guideCount: 8, elementCount: 30, rodLength: 2286, guideSpacingRatio: 3.3, topGuideHeight: 6, bottomGuideHeight: 12, spiralParameter: 70 });
    expect(doc.guidePositions).toBeUndefined();
    expect(doc.taper).toBeUndefined();
  });

  it('reads custom guide positions and the taper table when REYE = 0 and SPIDS = 0', () => {
    const text = fixture('STANG.DAT.txt')
      .replace('2286.0 ,   260.0 ,   400.0 ,     1.6 ,', '2286.0 ,   260.0 ,   400.0 ,     0.0 ,')
      .replace('     3.3 ,     6.0 ,', '     0.0 ,     6.0 ,');
    const doc = parseLegacyDat(text);
    expect(doc.guidePositions).toEqual([660, 1050.3, 1370.2, 1632.4, 1847.3, 2023.4, 2167.7, 2286]);
    expect(doc.taper!.length).toBe(33);
    expect(doc.taper![0]).toEqual({ x: 0, d: 6.4 });
  });
});

describe('JSON documents', () => {
  it('round-trips', () => {
    const doc = parseLegacyDat(fixture('STANG1.DAT.txt'), 'stang1');
    doc.load = { lineTension: 0.4, lineAngle: 110 };
    doc.notes = 'test';
    expect(parseDocument(serializeDocument(doc))).toEqual(doc);
  });

  it('rejects other files', () => {
    expect(() => parseDocument('nope')).toThrow(DocumentError);
    expect(() => parseDocument('{"format":"other"}')).toThrow(DocumentError);
    expect(() => parseDocument('{"format":"stangbygning","version":1,"design":{"sides":6}}')).toThrow(/missingField/);
  });
});

describe('engine features beyond the reference files', () => {
  it('runs with the program defaults and a second load', () => {
    const doc = newDocument();
    const res = runModel({ ...doc, load: { lineTension: 0.4, lineAngle: 100 } });
    expect(res.loads).toHaveLength(2);
    expect(res.loads[1].tip.y).toBeGreaterThan(res.loads[0].tip.y);
  });

  it('accepts custom guide positions (REYE = 0)', () => {
    const base = parseLegacyDat(fixture('STANG.DAT.txt'));
    const auto = runModel(base);
    const custom = runModel({ ...base, design: { ...base.design, guideSpacingRatio: 0 }, guidePositions: auto.guides.slice(1).map((g) => g.fromButt) });
    expect(custom.loads[0].tip.x).toBeCloseTo(auto.loads[0].tip.x, 6);
  });

  it('designs from a measured taper (SPIDS = 0)', () => {
    const base = parseLegacyDat(fixture('STANG.DAT.txt'));
    const taper = [0, 300, 600, 900, 1200, 1500, 1800, 2100, 2286].map((x) => ({ x, d: 7.5 - (x / 2286) * 5.6 }));
    const res = runModel({ ...base, design: { ...base.design, tipDiameter: 0 }, taper });
    expect(res.shapeKind).toBe('custom');
    expect(res.rr[0]).toBeCloseTo(3.75, 2);
    expect(res.loads[0].tip.y).toBeGreaterThan(0);
  });

  it('reports a ferrule that does not fit between two guides', () => {
    const base = parseLegacyDat(fixture('STANG.DAT.txt'));
    expect(() => runModel({ ...base, design: { ...base.design, ferruleLength: 400 } })).toThrow(RodError);
  });

  it('keeps guides on element boundaries when the ferrule is pushed down from the upper guide', () => {
    const base = parseLegacyDat(fixture('STANG.DAT.txt'));
    // Middle of the rod is 1143; the guide at 1160 forces the 80 mm ferrule (centred 1103..1183) down.
    const guidePositions = [660, 900, 1160, 1400, 1700, 1950, 2150, 2286];
    const res = runModel({ ...base, design: { ...base.design, guideSpacingRatio: 0 }, guidePositions });
    expect(res.ferrule!.end).toBeCloseTo(1160 - 15, 9);
    expect(res.ferrule!.start).toBeCloseTo(1160 - 15 - 80, 9);
    for (const g of res.guides) expect(res.xl.some((x) => Math.abs(x - g.fromButt) < 1e-9)).toBe(true);
  });
});
