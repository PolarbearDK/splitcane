/** The parabolic target curve (an addition; not in the original program). */
import { describe, expect, it } from 'vitest';
import { RodError } from '../src/engine/errors';
import { runModel } from '../src/engine/model';
import { EXAMPLE_DEFAULT } from '../src/examples';
import { formFromDocument, validate } from '../src/form';
import { STRINGS } from '../src/i18n/strings';
import { parseDocument, serializeDocument } from '../src/io/document';

const design = { ...EXAMPLE_DEFAULT.design, tipAngle: 50 };
const DEG = Math.PI / 180;

describe('parabolic target curve', () => {
  const res = runModel({ design, curve: 'parabola' });
  const { handleLength: HAND, rodLength: STAL, tipAngle } = design;
  const curve = res.ideal.slice(res.nhand);

  it('is reported as a parabola without a centre', () => {
    expect(res.shapeKind).toBe('parabola');
    expect(res.center).toBeNull();
  });

  it('leaves the handle horizontally and reaches the tip angle at the tip', () => {
    expect(curve[0].x).toBeCloseTo(HAND, 9);
    expect(curve[0].y).toBeCloseTo(0, 9);
    expect(curve[0].angle).toBeCloseTo(0, 9);
    expect(curve[curve.length - 1].angle).toBeCloseTo(tipAngle * DEG, 9);
  });

  it('is a parabola with its vertex at the tip', () => {
    // Local frame: origin at the tip, xi along the tip tangent, eta along the normal (towards the inside of the bend)
    const tip = curve[curve.length - 1];
    const b = tipAngle * DEG;
    const local = (p: { x: number; y: number }) => {
      const dx = p.x - tip.x;
      const dy = p.y - tip.y;
      return { xi: dx * Math.cos(b) + dy * Math.sin(b), eta: -dx * Math.sin(b) + dy * Math.cos(b) };
    };
    const h = local(curve[0]);
    const A = h.eta / (h.xi * h.xi);
    expect(A).toBeGreaterThan(0);
    for (const p of curve) {
      const q = local(p);
      expect(q.eta).toBeCloseTo(A * q.xi * q.xi, 6);
      expect(Math.tan(p.angle - b)).toBeCloseTo(2 * A * q.xi, 9);
    }
  });

  it('bends most at the tip: the curvature grows along the rod', () => {
    let last = 0;
    for (let i = 1; i < curve.length; i++) {
      const ds = Math.hypot(curve[i].x - curve[i - 1].x, curve[i].y - curve[i - 1].y);
      const kappa = (curve[i].angle - curve[i - 1].angle) / ds;
      expect(kappa).toBeGreaterThan(last * 0.999);
      last = kappa;
    }
  });

  it('has the rod length (outside the handle) as its arc length', () => {
    let arc = 0;
    for (let i = 1; i < curve.length; i++) arc += Math.hypot(curve[i].x - curve[i - 1].x, curve[i].y - curve[i - 1].y);
    expect(arc).toBeCloseTo(STAL - HAND, 0);
  });

  it('gives a rod that bends close to the parabola under the design load', () => {
    const load = res.loads[0];
    const tip = load.rows[load.rows.length - 1];
    expect(Math.abs(tip.angle - tipAngle)).toBeLessThan(4);
    const ideal = curve[curve.length - 1];
    expect(Math.hypot(load.tip.x - ideal.x, load.tip.y - ideal.y)).toBeLessThan(0.03 * STAL);
  });

  it('tapers towards the tip', () => {
    const d = res.design.rows.filter((r) => r.x >= HAND).map((r) => r.diameter);
    for (let i = 1; i < d.length; i++) expect(d[i]).toBeLessThanOrEqual(d[i - 1] + 1e-9);
  });

  it('needs a tip angle below 90°', () => {
    expect(() => runModel({ design: { ...design, tipAngle: 90, lineAngle: 120 }, curve: 'parabola' })).toThrow(RodError);
    expect(() => runModel({ design: { ...design, tipAngle: 89, lineAngle: 120 }, curve: 'parabola' })).not.toThrow();
  });

  it('is ignored for a measured taper', () => {
    const spiralRes = runModel({ design });
    const taper = spiralRes.design.rows.filter((_, i) => i % 6 === 0).map((r) => ({ x: r.x, d: r.diameter }));
    const custom = runModel({ design: { ...design, tipDiameter: 0 }, taper, curve: 'parabola' });
    expect(custom.shapeKind).toBe('custom');
  });
});

describe('parabola in files and the form', () => {
  it('is always saved as "curve" and read back; a file without it is a spiral', () => {
    const doc = { ...EXAMPLE_DEFAULT, curve: 'parabola' as const };
    const text = serializeDocument(doc);
    expect(JSON.parse(text).curve).toBe('parabola');
    expect(parseDocument(text).curve).toBe('parabola');
    const spiral = serializeDocument({ ...EXAMPLE_DEFAULT, curve: undefined });
    expect(JSON.parse(spiral).curve).toBe('spiral');
    expect(parseDocument(spiral).curve).toBe('spiral');
    const old = JSON.parse(spiral);
    delete old.curve;
    expect(formFromDocument(parseDocument(JSON.stringify(old))).curve).toBe('spiral');
    expect(() => parseDocument(text.replace('"parabola"', '"hyperbola"'))).toThrow(/badValue/);
  });

  it('validates the tip angle and ignores the hidden spiral parameter', () => {
    const t = STRINGS.en;
    const form = { ...formFromDocument(EXAMPLE_DEFAULT), curve: 'parabola' as const };
    form.fields = { ...form.fields, spiralParameter: '', tipAngle: '30' };
    const ok = validate(form, t);
    expect(ok.errors).toEqual({});
    expect(ok.input?.curve).toBe('parabola');
    expect(ok.document?.curve).toBe('parabola');
    expect(validate({ ...form, curve: 'spiral', fields: { ...form.fields, spiralParameter: '70' } }, t).document?.curve).toBe('spiral');

    form.fields = { ...form.fields, tipAngle: '92', lineAngle: '120' };
    expect(validate(form, t).errors.tipAngle).toBe(t.validation.parabolaTipAngle);
    expect(validate({ ...form, curve: 'spiral' }, t).errors.tipAngle).toBeUndefined();
  });
});
