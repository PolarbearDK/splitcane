/**
 * The three bugs in the original program that the web version fixes (see web/README.md).
 * Each test checks the corrected behaviour and that `legacy: true` still gives the old one.
 */
import { describe, expect, it } from 'vitest';
import { forces, runModel } from '../src/engine/model';
import type { ModelInput } from '../src/engine/types';
import { EXAMPLE_CIRCLE, EXAMPLE_SPIRAL } from '../src/examples';

const input = (doc: typeof EXAMPLE_SPIRAL, legacy = false): ModelInput => ({
  design: doc.design,
  guidePositions: doc.guidePositions,
  taper: doc.taper,
  load: doc.load,
  legacy,
});

describe('FORCES: every guide gets the line force', () => {
  // Guides 2..5 (N1 = 5 is the tip-top) on a bent polyline; the line leaves the tip-top along FN.
  const N1 = 5;
  const pts = [[0, 0], [0, 0], [100, 0], [200, 10], [280, 40], [340, 90]];
  const T = 2;
  const FN = [T * Math.cos(1.2), T * Math.sin(1.2)];

  const run = (legacy: boolean) => {
    const XYF = [new Float64Array(8), new Float64Array(8), new Float64Array(8)];
    const ZEYE = new Float64Array(8);
    const HH = new Float64Array(8);
    for (let j = 2; j <= N1; j++) {
      XYF[1][j] = ZEYE[j] = pts[j][0];
      XYF[2][j] = HH[j] = pts[j][1];
    }
    const FF = [new Float64Array(8), new Float64Array(8), new Float64Array(8)];
    forces({ ZEYE, HH, FF, N1, legacy }, FN[0], FN[1], XYF);
    return FF;
  };
  const unit = (a: number, b: number) => {
    const dx = pts[b][0] - pts[a][0];
    const dy = pts[b][1] - pts[a][1];
    const d = Math.hypot(dx, dy);
    return [dx / d, dy / d];
  };

  it('gives each guide T * (outgoing - incoming direction)', () => {
    const FF = run(false);
    for (let k = 3; k <= N1 - 1; k++) {
      const inc = unit(k - 1, k);
      const out = unit(k, k + 1);
      expect(FF[1][k]).toBeCloseTo(T * (out[0] - inc[0]), 12);
      expect(FF[2][k]).toBeCloseTo(T * (out[1] - inc[1]), 12);
    }
    const last = unit(N1 - 1, N1);
    expect(FF[1][N1]).toBeCloseTo(FN[0] - T * last[0], 12);
    expect(FF[2][N1]).toBeCloseTo(FN[1] - T * last[1], 12);
  });

  it('legacy: the last guide below the tip-top gets nothing', () => {
    const FF = run(true);
    expect(FF[1][N1 - 1]).toBe(0);
    expect(FF[2][N1 - 1]).toBe(0);
  });

  it('total force is the same either way', () => {
    const a = run(false);
    const b = run(true);
    const sum = (FF: Float64Array[], c: number) => FF[c].reduce((s, v) => s + v, 0);
    expect(sum(a, 1)).toBeCloseTo(sum(b, 1), 12);
    expect(sum(a, 2)).toBeCloseTo(sum(b, 2), 12);
  });
});

describe('BEND: the ferrule is rigid', () => {
  for (const doc of [EXAMPLE_SPIRAL, EXAMPLE_CIRCLE]) {
    it(doc.name, () => {
      const angleChange = (legacy: boolean) => {
        const res = runModel(input(doc, legacy));
        const rows = res.loads[0].rows;
        const end = rows.find((r) => r.index === res.lferl)!;
        const start = rows.find((r) => r.index === res.lferl - 1)!;
        return end.angle - start.angle;
      };
      expect(angleChange(false)).toBe(0);
      expect(Math.abs(angleChange(true))).toBeGreaterThan(0.1);
    });
  }
});

describe('STANGINIT: the stretch below the ferrule is divided into elements', () => {
  // Interval 800..1400 holds the ferrule (centre 1143), leaving ~300 mm below it.
  const doc = {
    ...EXAMPLE_SPIRAL,
    design: { ...EXAMPLE_SPIRAL.design, guideSpacingRatio: 0 },
    guidePositions: [660, 800, 1400, 1700, 1950, 2100, 2200, 2286],
  };
  const longestBelowFerrule = (legacy: boolean) => {
    const res = runModel(input(doc, legacy));
    const xl = res.xl;
    const first = xl.findIndex((x) => Math.abs(x - 800) < 1e-9);
    let longest = 0;
    for (let l = first + 1; l < res.lferl; l++) longest = Math.max(longest, xl[l] - xl[l - 1]);
    return { longest, ferrule: res.ferrule! };
  };

  it('uses elements no longer than the rest of the interval', () => {
    const { longest, ferrule } = longestBelowFerrule(false);
    expect(ferrule.start - 800).toBeGreaterThan(250);
    expect(longest).toBeLessThan((ferrule.start - 800) / 2);
  });

  it('legacy: one long element', () => {
    const { longest, ferrule } = longestBelowFerrule(true);
    expect(longest).toBeCloseTo(ferrule.start - 800, 9);
  });
});
