/**
 * Numerical helpers ported from CHEPOL.F90, CHEBUD.F90 and SOLSYM.F90.
 *
 * Arrays keep the Fortran 1-based indexing (index 0 unused) so the code
 * can be compared line by line with the original.
 */
import { RodError } from './errors';

/** Fortran REAL(4) literal used in a REAL(8) expression, e.g. `STAL*0.05`. */
export const f32 = Math.fround;

/** Fortran INT(): truncation toward zero. */
export const fint = Math.trunc;

/** Fortran NINT(): round half away from zero. */
export function nint(x: number): number {
  return x < 0 ? -Math.round(-x) : Math.round(x);
}

/** CHEPOL: Chebyshev polynomials T0..T(ngr) at x, stored in tt[1..ngr+1]. */
export function chepol(ngr: number, x: number, tt: Float64Array): void {
  const n = ngr + 1;
  tt[1] = 1.0;
  tt[2] = x;
  for (let j = 3; j <= n; j++) tt[j] = 2 * x * tt[j - 1] - tt[j - 2];
}

/**
 * SOLSYM: solve a symmetric system by LDL decomposition (single right-hand side, INV = false).
 * aa is [row][col], 1-based. Returns the solution x[1..nn]. Throws if singular.
 */
export function solsym(aa: Float64Array[], ff: Float64Array, nn: number): Float64Array {
  for (let i = 1; i <= nn; i++) {
    for (let j = i; j <= nn; j++) {
      let a = 0.0;
      for (let k = 1; k <= i - 1; k++) a = a + (aa[k][i] * aa[k][j]) / aa[k][k];
      if (j === i) {
        const dabso = Math.abs(a) + Math.abs(aa[i][i]);
        a = aa[i][i] - a;
        aa[i][i] = a;
        if (Math.abs(a) / dabso < 1e-12) throw new RodError('chebyshevSingular', { line: i });
      } else {
        aa[i][j] = aa[i][j] - a;
      }
    }
  }
  const x = new Float64Array(nn + 1);
  for (let i = 1; i <= nn; i++) {
    x[i] = ff[i];
    let a = 0.0;
    for (let k = 1; k <= i - 1; k++) a = a + (aa[k][i] * x[k]) / aa[k][k];
    x[i] = x[i] - a;
  }
  for (let i = nn; i > 0; i--) {
    let a = 0.0;
    for (let j = i + 1; j <= nn; j++) a = a + aa[i][j] * x[j];
    x[i] = (x[i] - a) / aa[i][i];
  }
  return x;
}

/**
 * CHEBUD: least-squares smoothing of (xx, yy) with Chebyshev polynomials,
 * weighted with 1/sqrt(1-x²) (midpoint rule). ngr = polynomial degree + 1.
 * Returns coefficients hh[1..ngr]. `onRangeWarning` is called where the original printed
 * "DX ELLER X UDENFOR OMRÅDE" and continued.
 */
export function chebud(
  ngr: number,
  npt: number,
  xx: Float64Array,
  yy: Float64Array,
  onRangeWarning: (i: number) => void,
): Float64Array {
  const NGRAD = 8;
  const aa = Array.from({ length: NGRAD + 1 }, () => new Float64Array(NGRAD + 1));
  const ff = new Float64Array(NGRAD + 1);
  const tt = new Float64Array(NGRAD + 2);
  let xj = xx[1];
  let yj = yy[1];
  for (let i = 2; i <= npt; i++) {
    const xi = xj;
    const yi = yj;
    xj = xx[i];
    yj = yy[i];
    let dx = xj - xi;
    const x = (xj + xi) / 2;
    const y = (yj + yi) / 2;
    if (dx <= 0 || Math.abs(x) >= 1.0) onRangeWarning(i);
    dx = dx / Math.sqrt(1.0 - x * x);
    chepol(ngr, x, tt);
    for (let j = 1; j <= ngr; j++) {
      const t = tt[j] * dx;
      for (let k = 1; k <= ngr; k++) aa[j][k] = aa[j][k] + t * tt[k];
      ff[j] = ff[j] + t * y;
    }
  }
  return solsym(aa, ff, ngr);
}
