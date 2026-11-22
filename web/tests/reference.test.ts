/**
 * Compares the TypeScript engine with output files produced by the original
 * Fortran program (Stangbygning1/stang.OUT and stang1.OUT, copied to fixtures as UTF-8).
 * Tolerances are half a unit in the last printed digit, plus a little slack.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { runModel } from '../src/engine/model';
import { parseLegacyDat } from '../src/io/legacyDat';

const fixture = (name: string) => readFileSync(fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url)), 'utf8');

interface Reference {
  guides: { index: number; fromButt: number; fromTip: number }[];
  xl: Map<number, number>;
  design: { index: number; x: number; ux: number; uy: number; angle: number; diameter: number; height: number }[];
  mass: number;
  cg: number;
  volume: number;
  jig: { index: number; z: number; h: number; d: number }[];
  reff: number;
  load: { index: number; x: number; ux: number; uy: number; angle: number; moment: number; stress: number; diameter: number }[];
  sigmaMax: number;
  sigmaMaxAt: number;
}

const NUM = String.raw`(-?[\d.]+(?:[DE][+-]?\d+)?)`;
const num = (s: string) => Number(s.replace('D', 'E'));

function parseOut(text: string): Reference {
  const lines = text.split('\n');
  const ref: Reference = { guides: [], xl: new Map(), design: [], mass: NaN, cg: NaN, volume: NaN, jig: [], reff: NaN, load: [], sigmaMax: NaN, sigmaMaxAt: NaN };
  let section: 'head' | 'guides' | 'xl' | 'design' | 'jig' | 'load' = 'head';
  for (const line of lines) {
    if (line.includes('PLACERING AF HÅNDTAGET')) section = 'guides';
    else if (/^\s+(UDEN|MED) FERULE/.test(line)) section = 'xl';
    else if (line.includes('TILSTRÆBT UDBØJNINGSKURVE')) section = 'design';
    else if (line.includes('STILLESKRUE NR.0')) section = 'jig';
    else if (line.includes('VIRKELIG UDBØJNINGSKURVE')) section = 'load';

    let m: RegExpMatchArray | null;
    if (section === 'guides' && (m = line.match(new RegExp(String.raw`^\s*(-?\d+)\s+${NUM}\s+${NUM}\s*$`)))) {
      ref.guides.push({ index: Number(m[1]), fromButt: num(m[2]), fromTip: num(m[3]) });
    } else if (section === 'xl' && (m = line.match(new RegExp(String.raw`^\s+(\d+)\s+${NUM}\s*$`)))) {
      ref.xl.set(Number(m[1]), num(m[2]));
    } else if (section === 'design' && (m = line.match(new RegExp(String.raw`^\s*(\d+) X=\s*${NUM},\s*${NUM} Ux=\s*${NUM} Uy=\s*${NUM} Vinkel=\s*${NUM} Diameter=\s*${NUM} Højde=\s*${NUM}`)))) {
      ref.design.push({ index: Number(m[1]), x: num(m[2]), ux: num(m[4]), uy: num(m[5]), angle: num(m[6]), diameter: num(m[7]), height: num(m[8]) });
    } else if ((m = line.match(new RegExp(String.raw`MASSE=\s*${NUM}G, TYNGDEPUNKT=\s*${NUM} VOLUMEN=\s*${NUM}`)))) {
      ref.mass = num(m[1]);
      ref.cg = num(m[2]);
      ref.volume = num(m[3]);
    } else if (section === 'jig' && (m = line.match(new RegExp(String.raw`^\s*(\d+)\s+${NUM},\s+${NUM},\s+${NUM},`)))) {
      ref.jig.push({ index: Number(m[1]), z: num(m[2]), h: num(m[3]), d: num(m[4]) });
    } else if ((m = line.match(new RegExp(String.raw`stang:reff=\s*${NUM}`)))) {
      ref.reff = num(m[1]);
    } else if (section === 'load' && (m = line.match(new RegExp(String.raw`^\s*(\d+) X=\s*${NUM},\s*${NUM} Ux=\s*${NUM} Uy=\s*${NUM} Vinkel=\s*${NUM} Bøjmoment=\s*${NUM} Spænding=\s*${NUM} Diameter=\s*${NUM}`)))) {
      ref.load.push({ index: Number(m[1]), x: num(m[2]), ux: num(m[4]), uy: num(m[5]), angle: num(m[6]), moment: num(m[7]), stress: num(m[8]), diameter: num(m[9]) });
    } else if ((m = line.match(new RegExp(String.raw`Afstand fra håndtagsenden\s*${NUM} SIGMAX=\s*${NUM}`)))) {
      ref.sigmaMaxAt = num(m[1]);
      ref.sigmaMax = num(m[2]);
    }
  }
  return ref;
}

const cases = [
  { name: 'stang (spiral, ALFA=70)', dat: 'STANG.DAT.txt', out: 'stang.OUT.txt' },
  { name: 'stang1 (circle, ALFA=0)', dat: 'STANG1.DAT.txt', out: 'stang1.OUT.txt' },
];

for (const c of cases) {
  describe(c.name, () => {
    const ref = parseOut(fixture(c.out));
    const doc = parseLegacyDat(fixture(c.dat));
    const res = runModel({ ...doc, legacy: true });
    const load = res.loads[0];

    it('parsed the reference file', () => {
      expect(ref.guides.length).toBeGreaterThan(5);
      expect(ref.xl.size).toBeGreaterThan(25);
      expect(ref.design.length).toBe(res.nel + 1);
      expect(ref.jig.length).toBe(res.jig.length);
      expect(ref.load.length).toBe(res.nel - res.nhand + 1);
    });

    it('places the guides', () => {
      for (const g of ref.guides) {
        if (g.index < 0) continue;
        const row = res.guides[g.index];
        expect(row.fromButt).toBeCloseTo(g.fromButt, 2);
        expect(row.fromTip).toBeCloseTo(g.fromTip, 2);
      }
    });

    it('divides the rod into elements', () => {
      expect(ref.xl.size).toBe(res.nel);
      for (const [i, x] of ref.xl) expect(res.xl[i]).toBeCloseTo(x, 8);
    });

    it('designs the taper along the ideal curve', () => {
      for (const r of ref.design) {
        const row = res.design.rows[r.index];
        expect(row.x).toBeCloseTo(r.x, 1);
        expect(Math.abs(row.ux - r.ux)).toBeLessThan(0.051);
        expect(Math.abs(row.uy - r.uy)).toBeLessThan(0.051);
        expect(Math.abs(row.angle - r.angle)).toBeLessThan(0.00051);
        expect(Math.abs(row.diameter - r.diameter)).toBeLessThan(0.0051);
        expect(Math.abs(row.height - r.height)).toBeLessThan(0.0051);
      }
    });

    it('computes mass, centre of gravity and volume', () => {
      expect(Math.abs(res.design.mass - ref.mass)).toBeLessThan(0.0051);
      expect(Math.abs(res.design.centreOfGravity - ref.cg)).toBeLessThan(0.0051);
      // relative: VOLUMEN is a sum of ~45 products printed with F12.1
      expect(Math.abs(res.design.volume - ref.volume) / ref.volume).toBeLessThan(1e-5);
    });

    it('computes the planing form (jig) settings', () => {
      for (const j of ref.jig) {
        const row = res.jig[j.index];
        expect(Math.abs(row.z - j.z)).toBeLessThan(0.0005);
        expect(Math.abs(row.h - j.h)).toBeLessThan(0.0005);
        expect(Math.abs(row.d - j.d)).toBeLessThan(0.0005);
      }
    });

    it('finds the reference force', () => {
      // The SETREF loop stops when the tip moves less than 1e-8·STAL between iterations.
      expect(Math.abs(res.reference.force - ref.reff) / ref.reff).toBeLessThan(1e-5);
    });

    it('computes the deflection under the design load', () => {
      for (const r of ref.load) {
        const row = load.rows.find((x) => x.index === r.index)!;
        expect(Math.abs(row.ux - r.ux)).toBeLessThan(0.051);
        expect(Math.abs(row.uy - r.uy)).toBeLessThan(0.051);
        expect(Math.abs(row.angle - r.angle)).toBeLessThan(0.0051);
        expect(Math.abs(row.moment - r.moment)).toBeLessThan(0.051);
        expect(Math.abs(row.stress - r.stress)).toBeLessThan(0.0051);
        expect(Math.abs(row.diameter - r.diameter)).toBeLessThan(0.00051);
      }
      expect(Math.abs(load.sigmaMax - ref.sigmaMax)).toBeLessThan(0.051);
      expect(load.sigmaMaxAt).toBeCloseTo(ref.sigmaMaxAt, 1);
    });
  });
}
