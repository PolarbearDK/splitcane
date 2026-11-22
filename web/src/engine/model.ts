/**
 * TypeScript port of the calculation core of STANGBYGNING1 (Viggo Hoppe, 2000-2013):
 *
 *   STANG.F90      main sequence + reference-force iteration (SETREF)
 *   STANGINIT.F90  guide placement, element division, ferrule, ideal bend and taper design
 *   FORCES.F90     line forces on the guides
 *   BMOMENT.F90    bending moment at an element boundary
 *   BEND.F90       large-deflection beam integration
 *   BEAM.F90       incremental loading until each step converges
 *   CALCPLOT.F90   result tables (the QuickWin plots are re-implemented in the UI)
 *
 * The port is deliberately literal: Fortran variable names, 1-based guide arrays,
 * evaluation order, REAL(4) literals (via f32) and the values that uninitialised
 * Fortran locals had (0) are all preserved, so the numbers match the original .OUT files.
 * Deviations are marked with "PORT NOTE".
 */
import { RodError } from './errors';
import { chebud, chepol, f32, fint, nint } from './numerics';
import type {
  DesignParams,
  DesignRow,
  EngineWarning,
  GuideRow,
  JigRow,
  LoadCase,
  LoadResult,
  LoadRow,
  ModelInput,
  ModelResult,
  Point,
  ShapePoint,
} from './types';

/** STANGMOD: NEYX=15, NELX=NEYX*8 */
export const NEYX = 15;
export const NELX = NEYX * 8;

const PIHALV = Math.atan(1.0) * 2.0;
const PI = PIHALV * 2.0;
const RAD = PIHALV / 90.0;
const GRAD = 1.0 / RAD;

/**
 * PORT NOTE: the Fortran arrays were fixed at NELX = 120, which capped the element count at 119 and the
 * measured taper at 120 points. Legacy mode keeps those caps; otherwise both go up to 1000.
 */
export const MAX_ELEMENTS = 1000;
export const MAX_TAPER_POINTS = 1000;
/** The original allowed 14 guides (NEYX = 15); the arrays here have room for EYE_CAP - 2. */
export const MAX_GUIDES = 30;
/** Room for NELE plus the extra elements from the minimum of 3 per guide interval and the ferrule. */
const EL_CAP = 4 * MAX_ELEMENTS + 16;
const EYE_CAP = 64;
/** PORT NOTE: the original iterated without limit in BEAM; we stop instead of hanging the browser. */
const MAX_BEAM_ITERATIONS = 20000;

const rows = (n: number, len: number) => Array.from({ length: n }, () => new Float64Array(len));

/** Module STANGMOD plus the static locals that carry state between calls. */
class State {
  // integers
  NKANT = 0;
  NEYE = 0;
  N1 = 0;
  NHAND = 0;
  NELE = 0;
  NEL = 0;
  LFERL = 0;
  /** ModelInput.legacy: keep the original program's bugs. */
  legacy = false;
  // design parameters
  REYE = 0;
  HEY1 = 0;
  HEY2 = 0;
  EMOD = 0;
  RHO = 0;
  ALFA = 0;
  NYTRIS = 0;
  NYVISH = 0;
  VISP = 0;
  STAL = 0;
  HAND = 0;
  AFST = 0;
  SPIDS = 0;
  AJIG = 0;
  FERL = 0;
  AFERL = 0;
  // derived
  RMIN = 0;
  HIGH = 0;
  BRED = 0;
  DIAM = 0;
  AREAL = 0;
  BIMO = 0;
  XCENTR = 0;
  YCENTR = 0;
  RISH = 0;
  REFF = 0;
  FOLX = 0;
  FOLY = 0;
  FNUX = 0;
  FNUY = 0;
  // arrays (guides 1-based, elements 0-based - same as Fortran)
  ZEYE = new Float64Array(EYE_CAP);
  HH = new Float64Array(EYE_CAP);
  XYE = rows(3, EYE_CAP);
  XYF = rows(3, EYE_CAP);
  XYG = rows(3, EYE_CAP);
  FF = rows(3, EYE_CAP);
  XL = new Float64Array(EL_CAP);
  XD = rows(5, EL_CAP);
  XG = rows(5, EL_CAP);
  XI = rows(3, EL_CAP);
  RR = new Float64Array(EL_CAP);
  CCC = new Float64Array(EL_CAP);
}

// ---------------------------------------------------------------------------
// FORCES.F90
// ---------------------------------------------------------------------------
/** Exported for tests only. */
export function forces(s: Pick<State, 'ZEYE' | 'HH' | 'FF' | 'N1' | 'legacy'>, FNX: number, FNY: number, XYF: Float64Array[]): void {
  const { ZEYE, HH, FF, N1 } = s;
  const TREK = Math.sqrt(FNX * FNX + FNY * FNY);
  let DX = ZEYE[3] - ZEYE[2];
  let DY = HH[3] - HH[2];
  let DD = TREK / Math.sqrt(DX * DX + DY * DY);
  let GX = DD * DX;
  let GY = DD * DY;
  let XK = XYF[1][2];
  let YK = XYF[2][2];
  // PORT NOTE: the original loop ran to N1-1, so the segment from the last guide to the tip-top was
  // never formed: that guide got no force and its share was applied at the tip-top. Fixed unless legacy.
  const JLAST = s.legacy ? N1 - 1 : N1;
  for (let J = 3; J <= JLAST; J++) {
    const K = J - 1;
    const XJ = XYF[1][J];
    const YJ = XYF[2][J];
    DX = XJ - XK;
    DY = YJ - YK;
    DD = TREK / Math.sqrt(DX * DX + DY * DY);
    const FX = DD * DX;
    const FY = DD * DY;
    FF[1][K] = FX - GX;
    FF[2][K] = FY - GY;
    XK = XJ;
    YK = YJ;
    GX = FX;
    GY = FY;
  }
  FF[1][N1] = FNX - GX;
  FF[2][N1] = FNY - GY;
}

// ---------------------------------------------------------------------------
// BMOMENT.F90
// ---------------------------------------------------------------------------
function bmoment(s: State, XYF: Float64Array[], XG: Float64Array[], L: number): number {
  const { ZEYE, FF, XL, N1 } = s;
  const XLL = XL[L];
  const X = XG[1][L];
  const Y = XG[2][L];
  let BM = 0.0;
  for (let M = 2; M <= N1; M++) {
    if (ZEYE[M] < XLL) continue;
    BM = BM - FF[1][M] * (XYF[2][M] - Y) + FF[2][M] * (XYF[1][M] - X);
  }
  return BM;
}

// ---------------------------------------------------------------------------
// BEND.F90
// ---------------------------------------------------------------------------
function bend(s: State): void {
  const { EMOD, BIMO, NHAND, HAND, N1, HH, ZEYE, XYF, XYG, NEL, RR, XL, XG } = s;
  // PORT NOTE: BEND.F90 does not USE STANGMOD, so its LFERL was an uninitialised local (= 0) and the
  // ferrule was never treated as rigid, despite the code meant to do so. Fixed unless legacy.
  const LFERL_LOCAL = s.legacy ? 0 : s.LFERL;
  let S = 0.0;
  let C = 1.0;
  let V = 0.0;
  let X2 = HAND;
  let Y2 = 0.0;
  let IEYE = 2;
  let XL2 = HAND;
  let CAPPA2 = 0.0;
  for (let L = NHAND; L <= NEL; L++) {
    const X1 = X2;
    const Y1 = Y2;
    const XL1 = XL2;
    XL2 = XL[L];
    const DL = XL2 - XL1;
    const BM = bmoment(s, XYF, XG, L);
    XG[3][L] = BM;
    const R = RR[L];
    const WM = BIMO * (R * R * R);
    const CAPPA1 = CAPPA2;
    CAPPA2 = BM / (EMOD * WM * R);
    XG[4][L] = BM / WM;
    if (L <= NHAND) continue;
    const DX = DL;
    let DV: number;
    let DY: number;
    if (BM <= 0.0 || L === LFERL_LOCAL) {
      DV = 0.0;
      DY = 0.0;
    } else {
      const DCAPPA = CAPPA2 - CAPPA1;
      DV = ((CAPPA1 + CAPPA2) * DL) / 2;
      DY = (CAPPA1 / 2 + DCAPPA / 6) * DL * DL;
    }
    X2 = X1 + DX * C - DY * S;
    Y2 = Y1 + DX * S + DY * C;
    V = V + DV;
    S = Math.sin(V);
    C = Math.cos(V);
    XG[0][L] = V;
    XG[1][L] = X2;
    XG[2][L] = Y2;
    if (Math.abs(ZEYE[IEYE] - XL2) < 2.0e-8) {
      XYG[1][IEYE] = X2 - HH[IEYE] * Math.sin(V);
      XYG[2][IEYE] = Y2 + HH[IEYE] * Math.cos(V);
      IEYE = IEYE + 1;
    }
  }
  for (let I = 1; I <= N1; I++) {
    XYF[1][I] = XYG[1][I];
    XYF[2][I] = XYG[2][I];
  }
}

// ---------------------------------------------------------------------------
// STANGINIT.F90
// ---------------------------------------------------------------------------
interface InitResult {
  shapeKind: 'spiral' | 'circle' | 'custom';
  ferrule: { start: number; end: number } | null;
  designRows: DesignRow[];
  mass: number;
  centreOfGravity: number;
  volume: number;
  sigmaMax: number;
  sigmaMaxAt: number;
  jig: JigRow[];
}

function stangInit(s: State, input: ModelInput, warnings: EngineWarning[]): InitResult {
  const { NKANT, NEYE, NELE, STAL, HAND, AFST, SPIDS, REYE, HEY1, HEY2, FERL, AFERL, EMOD, RHO, AJIG } = s;
  const { ZEYE, HH, XYE, XL, XD, XG, XI, RR, CCC } = s;

  if (s.NYVISH <= s.VISP) throw new RodError('lineAngleNotAboveTipAngle', { line: s.NYVISH, tip: s.VISP });

  const RALF = s.ALFA * RAD;
  const RISP = s.VISP * RAD;
  s.RISH = s.NYVISH * RAD;
  const STAN = STAL - HAND;
  const STAM = STAN - AFST;

  const ANKA = PI / NKANT;
  s.HIGH = Math.cos(ANKA);
  s.BRED = Math.sin(ANKA);
  s.DIAM = NKANT % 2 !== 0 ? s.HIGH + 1.0 : s.HIGH * 2;
  s.RMIN = SPIDS / s.DIAM;
  s.AREAL = NKANT * s.HIGH * s.BRED;
  s.FNUX = 0.0;
  s.FNUY = 0.0;
  s.BIMO = (s.AREAL * (6.0 - s.BRED * s.BRED)) / 24;
  s.BRED = s.BRED * 2.0;
  const { HIGH, BRED, DIAM, AREAL, BIMO } = s;

  // --- Guide placement. Tip at X = STAL. ---
  const NN = NEYE - 1;
  const N1 = NEYE + 1;
  s.N1 = N1;
  ZEYE[1] = HAND;
  let X = HAND + AFST;
  ZEYE[2] = X;
  if (REYE < 0.01) {
    // User-defined guide positions
    const pos = input.guidePositions ?? [];
    if (pos.length < NEYE) throw new RodError('guideCount', { expected: NEYE, got: pos.length });
    for (let I = 2; I <= N1; I++) ZEYE[I] = pos[I - 2];
    if (ZEYE[2] < STAL * f32(0.00001)) {
      // "BAGLÆNS INDLÆSNING" - read backwards
      const MM = fint(NEYE / 2) - 1;
      for (let I = 0; I <= MM; I++) {
        const M = 2 + I;
        const N = N1 - I;
        const A = ZEYE[M];
        ZEYE[M] = ZEYE[N];
        ZEYE[N] = A;
      }
    }
    let A = ZEYE[2];
    X = HAND + AFST;
    if (Math.abs(A - X) > f32(0.0001)) throw new RodError('guideFirstPosition', { expected: X, got: A });
    for (let I = 3; I <= N1; I++) {
      const B = ZEYE[I];
      if (A >= B) throw new RodError('guideOrder', { a: A, b: B });
      A = B;
    }
    if (Math.abs(A - STAL) > f32(0.0001)) throw new RodError('guideLastPosition', { expected: STAL, got: A });
  } else if (REYE === 1.0) {
    const A = STAM / NN;
    for (let I = 3; I <= N1; I++) {
      X = X + A;
      ZEYE[I] = X;
    }
  } else {
    const PP = 1.0 / (NEYE - 2);
    const REY = Math.pow(REYE, PP);
    let A = (REYE * STAM * (REY - 1)) / (Math.pow(REY, NN) - 1);
    for (let I = 3; I <= N1; I++) {
      X = X + A;
      ZEYE[I] = X;
      A = A / REY;
    }
  }

  // --- Guide heights, element division and ferrule ---
  const HALVST = STAL / 2;
  const ELENG = STAL / NELE;
  let L = 0;
  let X1 = 0.0;
  XL[0] = 0.0;
  XI[0][0] = 0.0;
  XI[1][0] = 0.0;
  XI[2][0] = 0.0;
  let ferrule: { start: number; end: number } | null = null;
  s.LFERL = 0;
  for (let I = 1; I <= N1; I++) {
    HH[I] = ((ZEYE[I] - ZEYE[2]) * HEY1 + (ZEYE[N1] - ZEYE[I]) * HEY2) / STAM;
    XYE[1][I] = ZEYE[I];
    XYE[2][I] = HH[I];
    X = X1;
    const X2 = ZEYE[I];
    const DXI = X2 - X1;
    let NXI = fint(DXI / ELENG);
    NXI = Math.max(3, NXI);
    const DX = DXI / NXI;
    if (X2 === HAND) s.NHAND = NXI;
    if (X1 < HALVST && X2 >= HALVST) {
      // Place the ferrule
      const SFERL = FERL + 2 * AFERL;
      if (DXI < SFERL) throw new RodError('ferruleTooLong', { needed: SFERL, available: DXI });
      let XF1 = HALVST - FERL / 2;
      let XF2 = HALVST + FERL / 2;
      let DXF1 = XF1 - X1;
      let DXF2 = X2 - XF2;
      if (DXF1 < AFERL) {
        XF1 = X1 + AFERL;
        XF2 = XF1 + FERL;
      } else if (DXF2 < AFERL) {
        // PORT NOTE: the original had `XF2 = X2-FERL; XF1 = XF2-AFERL` (FERL and AFERL swapped),
        // which misplaces every later element boundary so the guides no longer line up with the
        // elements. This is the evidently intended mirror of the branch above.
        XF2 = X2 - AFERL;
        XF1 = XF2 - FERL;
      }
      DXF1 = XF1 - X1;
      DXF2 = X2 - XF2;
      // PORT NOTE: the original had `JFER1 = MAX(1,JFER)` with JFER never assigned, so the stretch from the
      // guide to the ferrule was always one element. Mesh it like the stretch after the ferrule unless legacy.
      const JFER1 = s.legacy ? 1 : Math.max(1, fint(DXF1 / DX));
      const JFER2 = Math.max(1, fint(DXF2 / DX));
      let DXF = DXF1 / JFER1;
      for (let J = 1; J <= JFER1; J++) {
        L = L + 1;
        X = X + DXF;
        XL[L] = X;
      }
      L = L + 1;
      X = X + FERL;
      XL[L] = X;
      s.LFERL = L;
      ferrule = { start: XF1, end: XF2 };
      DXF = DXF2 / JFER2;
      for (let J = 1; J <= JFER2; J++) {
        L = L + 1;
        X = X + DXF;
        XL[L] = X;
      }
    } else {
      for (let J = 1; J <= NXI; J++) {
        L = L + 1;
        X = X + DX;
        XL[L] = X;
      }
    }
    // PORT NOTE: the last boundary of each interval is the guide itself. Built by repeated addition it
    // can land ~1e-13 mm beyond ZEYE(I); the original's results then depended on x87 extended-precision
    // rounding (e.g. whether BMOMENT counts the tip force at the tip element). Snap it exactly.
    X = X2;
    XL[L] = X;
    X1 = X;
    XI[0][L] = 0.0;
    XI[1][L] = X;
    XI[2][L] = 0.0;
  }
  XL[L + 1] = 2 * STAL;
  const NEL = L;
  s.NEL = NEL;
  const NHAND = s.NHAND;
  XYE[1][1] = HAND;
  XYE[2][1] = 0.0;
  for (L = 0; L <= NEL; L++) {
    XD[0][L] = 0.0;
    XG[0][L] = 0.0;
    XD[1][L] = XL[L];
    XG[1][L] = XL[L];
    XI[1][L] = XL[L];
    XD[2][L] = 0.0;
    XG[2][L] = 0.0;
    XI[2][L] = 0.0;
    XI[0][L] = 0.0;
  }

  let shapeKind: InitResult['shapeKind'];
  let SPIRAL = false;
  let CAPPA = 0.0;
  let CALF = 1.0;
  if (SPIDS < f32(0.0001)) {
    // --- Read diameter points and smooth them with Chebyshev polynomials ---
    shapeKind = 'custom';
    const taper = input.taper ?? [];
    const MAXPT = s.legacy ? NELX : MAX_TAPER_POINTS;
    const XX = new Float64Array(MAXPT + 2);
    const YY = new Float64Array(MAXPT + 2);
    let NPT = 0;
    let C = 0.0;
    let FT = 1.0;
    for (const p of taper) {
      if (NPT >= MAXPT) break;
      const B = C;
      C = p.x;
      const D = p.d;
      NPT = NPT + 1;
      if (NPT === 2) FT = C - B >= 0 ? 1.0 : -1.0;
      if (NPT > 2 && FT * (C - B) < 0.0) warnings.push({ code: 'taperCoordinatesOrder', params: { point: NPT, a: B, b: C } });
      XX[NPT] = (2 * C) / STAL - 1.0;
      // The diameter is taken as measured across the corners
      YY[NPT] = D * 0.5;
    }
    // PORT NOTE: a degree-5 fit needs at least 7 points (6 intervals); the original would stop in SOLSYM.
    if (NPT < 7) throw new RodError('taperTooFewPoints', { got: NPT, min: 7 });
    const NGR = 6;
    const NP1 = NPT + 1;
    const NP2 = fint(NPT / 2);
    if (YY[1] < YY[NPT]) {
      warnings.push({ code: 'taperReversed' });
      for (let I = 1; I <= NP2; I++) {
        let A = YY[I];
        YY[I] = YY[NP1 - I];
        YY[NP1 - I] = A;
        A = XX[I];
        XX[I] = XX[NP1 - I];
        XX[NP1 - I] = A;
      }
    }
    if (XX[1] > XX[NPT]) {
      warnings.push({ code: 'taperFromTip' });
      for (let I = 1; I <= NPT; I++) XX[I] = -XX[I];
    }
    const GG = chebud(NGR, NPT, XX, YY, (i) => warnings.push({ code: 'chebyshevRange', params: { point: i } }));
    const TT = new Float64Array(NGR + 2);
    for (let I = 0; I <= NEL; I++) {
      const x = (2 * XL[I]) / STAL - 1.0;
      chepol(NGR, x, TT);
      let R = 0.0;
      for (let J = 1; J <= NGR; J++) R = R + TT[J] * GG[J];
      RR[I] = R;
    }
  } else if (RALF === 0.0) {
    // --- Circular bend, centre straight above the end of the handle ---
    shapeKind = 'circle';
    s.XCENTR = HAND;
    s.YCENTR = STAN / RISP;
    CAPPA = 1.0 / s.YCENTR;
    const DV = RISP / STAN;
    let S = 0.0;
    let C = 1.0;
    L = NHAND;
    for (let I = 2; I <= N1; I++) {
      const ZEY = ZEYE[I];
      // PORT NOTE: the original compared `XL(L) .LE. ZEY` exactly. XL is built by repeated addition,
      // so whether the tip element reached the curve depended on rounding (and on the compiler's
      // x87 extended precision). We use the same 1e-6 tolerance as the spiral branch below.
      while (XL[L] - ZEY <= 1.0e-6) {
        const V = (XL[L] - HAND) * DV;
        S = Math.sin(V);
        C = Math.cos(V);
        XD[0][L] = V;
        XI[0][L] = V;
        XD[1][L] = s.XCENTR + s.YCENTR * S;
        XI[1][L] = XD[1][L];
        XD[2][L] = s.YCENTR - s.YCENTR * C;
        XI[2][L] = XD[2][L];
        L = L + 1;
      }
      const R = s.YCENTR - HH[I];
      XYE[1][I] = s.XCENTR + R * S;
      XYE[2][I] = s.YCENTR - R * C;
    }
  } else {
    // --- Logarithmic spiral bend ---
    shapeKind = 'spiral';
    SPIRAL = true;
    const SALF = Math.sin(RALF);
    CALF = Math.cos(RALF);
    const TALF = Math.tan(RALF);
    const FRA = Math.exp(RISP * TALF);
    // Arc length is (R2-R1)/sin(RALF); R1 = radius of curvature at the tip, R2 at the handle
    const R1 = (STAN * SALF) / (FRA - 1.0);
    const R2 = R1 * FRA;
    s.XCENTR = R2 * SALF + HAND;
    s.YCENTR = R2 * CALF;
    let V = 0.0;
    let Xs = 0.0;
    let Ys = 0.0;
    L = NHAND;
    for (let I = 2; I <= N1; I++) {
      const HEY = HH[I];
      const ZEY = ZEYE[I];
      while (XL[L] - ZEY <= 1.0e-6) {
        const R = R2 - (XL[L] - HAND) * SALF;
        V = -Math.log(R / R2) / TALF;
        XD[0][L] = V;
        XI[0][L] = V;
        const U = RALF - V;
        Xs = s.XCENTR - R * Math.sin(U);
        XD[1][L] = Xs;
        XI[1][L] = Xs;
        Ys = s.YCENTR - R * Math.cos(U);
        XD[2][L] = Ys;
        XI[2][L] = Ys;
        L = L + 1;
      }
      XYE[1][I] = Xs - HEY * Math.sin(V);
      XYE[2][I] = Ys + HEY * Math.cos(V);
    }
  }

  s.FOLX = s.FNUX;
  s.FNUX = s.NYTRIS * Math.cos(s.RISH);
  s.FOLY = s.FNUY;
  s.FNUY = s.NYTRIS * Math.sin(s.RISH);
  const FNX = s.FNUX;
  const FNY = s.FNUY;
  const RMIN = s.RMIN;

  if (RMIN > f32(0.001)) {
    forces(s, FNX, FNY, XYE);
    // Bending moments and the radius needed to give the ideal curvature at every element boundary
    const EMBIMO = EMOD * BIMO;
    const RMIN4 = EMBIMO * (RMIN * RMIN * (RMIN * RMIN));
    let BLIMIT = CAPPA * RMIN4;
    for (L = NHAND; L <= NEL; L++) {
      const Xp = XD[1][L];
      const Yp = XD[2][L];
      const BM = bmoment(s, XYE, XD, L);
      XD[3][L] = BM;
      if (SPIRAL) {
        CAPPA = CALF / Math.sqrt((s.XCENTR - Xp) ** 2 + (s.YCENTR - Yp) ** 2);
        BLIMIT = CAPPA * RMIN4;
      }
      CCC[L] = CAPPA;
      let R: number;
      if (BM < BLIMIT) {
        if (BM < -BLIMIT) throw new RodError('negativeMoment', { element: L });
        R = RMIN;
      } else {
        const WR = BM / CAPPA;
        R = WR / EMBIMO;
        if (R < 0.0) throw new RodError('negativeRadius', { element: L });
        R = Math.sqrt(Math.sqrt(R));
      }
      RR[L] = R;
    }
    // Extrapolate into the handle
    const FAKT = (RR[NHAND] - RR[NHAND + 1]) / (XL[NHAND + 1] - XL[NHAND]);
    for (let I = 0; I <= NHAND - 1; I++) RR[I] = RR[NHAND] + (XL[NHAND] - XL[I]) * FAKT;
    // Smoothing at the tip
    if (RR[NEL] <= RMIN) {
      let K2 = NEL;
      let R = 0.0;
      while (R <= RMIN && K2 > 0) {
        const K1 = K2 - 1;
        const R1 = RR[K1];
        const R2 = RR[K2];
        R = R2 - ((R1 - R2) * (STAL - XL[K2])) / (XL[K2] - XL[K1]);
        K2 = K1;
      }
      const D = STAL - XL[K2];
      const R2 = RR[K2];
      for (let K = K2 + 1; K <= NEL; K++) RR[K] = (RMIN * (XL[K] - XL[K2]) + R2 * (STAL - XL[K])) / D;
    }
  }

  // --- Table for the whole rod: targeted bend curve and thickness ---
  let SIGMAX = 0.0;
  let XIGM = 0.0;
  let A = AREAL * RR[0] * RR[0];
  let Z2 = 0.0;
  let STATM = 0.0;
  let VOL = 0.0;
  const designRows: DesignRow[] = [];
  const pushRow = (I: number, Z: number, R: number) =>
    designRows.push({
      index: I,
      x: Z,
      fromTip: STAL - Z,
      ux: XD[1][I],
      uy: XD[2][I],
      angle: XD[0][I] * GRAD,
      diameter: R * DIAM,
      height: R * HIGH,
      radius: R,
      width: R * BRED,
    });
  pushRow(0, Z2, RR[0]);
  for (let I = 1; I <= NEL; I++) {
    const Z1 = Z2;
    Z2 = XL[I];
    const R = RR[I];
    const BM = XD[3][I];
    const WM = BIMO * (R * R * R);
    const SIGMA = BM / WM;
    XD[4][I] = SIGMA;
    if (SIGMA > SIGMAX) {
      SIGMAX = SIGMA;
      XIGM = XL[I];
    }
    const AR = A;
    A = AREAL * R * R;
    const DL = (Z2 - Z1) * 0.5;
    VOL = VOL + (A + AR) * DL;
    STATM = STATM + (AR * Z1 + A * Z2) * DL;
    pushRow(I, Z2, R);
  }
  const TP = STATM / VOL;
  const WW = VOL * RHO * 0.001;

  // --- Depth of the groove in the planing form (jig) at each adjustment screw ---
  const NJ = fint(STAL / AJIG);
  const jig: JigRow[] = [];
  const FI = 1.0 / 25.4;
  const FD = DIAM / HIGH;
  const FH = FD * FI;
  const pushJig = (j: number, z: number, h: number) =>
    jig.push({ index: j, z, h, d: FD * h, zInch: FI * z, hInch: FI * h, dInch: FH * h });
  pushJig(0, 0.0, RMIN * HIGH);
  let J = NEL;
  for (let I = 1; I <= NJ; I++) {
    const Z = AJIG * I;
    const Xj = STAL - Z;
    while (XL[J] > Xj) J = J - 1;
    const Aj = (XL[J + 1] - Xj) / (XL[J + 1] - XL[J]);
    const R = RR[J] * Aj + RR[J + 1] * (1.0 - Aj);
    pushJig(I, Z, R * HIGH);
  }

  return {
    shapeKind,
    ferrule,
    designRows,
    mass: WW,
    centreOfGravity: TP,
    volume: VOL,
    sigmaMax: SIGMAX,
    sigmaMaxAt: XIGM,
    jig,
  };
}

// ---------------------------------------------------------------------------
// STANG.F90: reference force REFF that deflects the tip 5 % of the rod length (SETREF)
// ---------------------------------------------------------------------------
function referenceForce(s: State): { force: number; iterations: number; target: number } {
  const { N1, NEL, ZEYE, HH, XL, XYF, XYG, XG, STAL } = s;
  for (let I = 1; I <= N1; I++) {
    XYF[1][I] = ZEYE[I];
    XYF[2][I] = HH[I];
  }
  for (let I = 0; I <= NEL; I++) {
    XG[1][I] = XL[I];
    XG[2][I] = 0.0;
  }
  const FNX = 0.0;
  let FNY = 0.01;
  let DFY = STAL;
  const RDEF = STAL * f32(0.05);
  const DYL = STAL * 1.0e-8;
  let ITERA = 0;
  while (Math.abs(DFY) > DYL) {
    ITERA = ITERA + 1;
    const D = XYG[2][N1];
    forces(s, FNX, FNY, XYF);
    bend(s);
    const DY = XYG[2][N1];
    FNY = (FNY * RDEF) / DY;
    DFY = DY - D;
    if (ITERA > 30 || !Number.isFinite(FNY)) throw new RodError('referenceNotConverged', { iterations: ITERA });
  }
  s.REFF = FNY;
  return { force: FNY, iterations: ITERA, target: RDEF };
}

// ---------------------------------------------------------------------------
// BEAM.F90 - apply the change from (FOLX,FOLY) to (FNUX,FNUY) in NTRIN steps
// ---------------------------------------------------------------------------
function beam(s: State): number {
  const { N1, NHAND, NEL, XYF, XYE, XYG, XG, XD } = s;
  const DF = Math.sqrt((s.FNUX - s.FOLX) ** 2 + (s.FNUY - s.FOLY) ** 2);
  const NTRIN = nint(DF / s.REFF) + 1;
  const DBET = 1.0 / NTRIN;
  for (let L = 2; L <= N1; L++) {
    XYF[1][L] = XYE[1][L];
    XYF[2][L] = XYE[2][L];
  }
  for (let L = NHAND; L <= NEL; L++) for (let k = 0; k <= 4; k++) XG[k][L] = XD[k][L];
  let total = 0;
  for (let N = 1; N <= NTRIN; N++) {
    const BETA = N * DBET;
    const BENE = 1.0 - BETA;
    const FNX = BETA * s.FNUX + BENE * s.FOLX;
    const FNY = BETA * s.FNUY + BENE * s.FOLY;
    let DU = 10000.0;
    let GX = XYG[1][N1];
    let GY = XYG[2][N1];
    while (DU > 2.0e-4) {
      forces(s, FNX, FNY, XYG);
      bend(s);
      const HX = XYG[1][N1];
      const HY = XYG[2][N1];
      DU = Math.sqrt((HX - GX) ** 2 + (HY - GY) ** 2);
      GX = HX;
      GY = HY;
      if (++total > MAX_BEAM_ITERATIONS || !Number.isFinite(DU)) throw new RodError('beamNotConverged', { step: N });
    }
  }
  for (let L = NHAND; L <= NEL; L++) for (let k = 0; k <= 4; k++) XD[k][L] = XG[k][L];
  return NTRIN;
}

// ---------------------------------------------------------------------------
// CALCPLOT.F90 (calculation and tables; drawing is done by the UI)
// ---------------------------------------------------------------------------
function calcplot(s: State): LoadResult {
  const steps = beam(s);
  const { NHAND, NEL, N1, XL, RR, XD, XYG, ZEYE, STAL, DIAM, HAND, AFST, HEY1, HEY2 } = s;
  let BMAX = -1.0e20;
  let SIGMAX = 0.0;
  let XIGM = HAND;
  const rowsOut: LoadRow[] = [];
  for (let I = NHAND; I <= NEL; I++) {
    const Z = XL[I];
    BMAX = Math.max(XD[3][I], BMAX);
    const SIGMA = Math.abs(XD[4][I]);
    if (SIGMA > SIGMAX) {
      SIGMAX = SIGMA;
      XIGM = XL[I];
    }
    rowsOut.push({
      index: I,
      x: Z,
      fromTip: STAL - Z,
      ux: XD[1][I],
      uy: XD[2][I],
      angle: XD[0][I] * GRAD,
      moment: XD[3][I],
      stress: XD[4][I],
      diameter: RR[I] * DIAM,
    });
  }
  const shape: ShapePoint[] = [];
  for (let I = 0; I <= NEL; I++) shape.push({ x: XD[1][I], y: XD[2][I], angle: XD[0][I] });
  const guides: Point[] = [];
  const guideFeet: Point[] = [];
  for (let I = 2; I <= N1; I++) {
    guides.push({ x: XYG[1][I], y: XYG[2][I] });
    let best = NHAND;
    for (let L = NHAND; L <= NEL; L++) if (Math.abs(XL[L] - ZEYE[I]) < Math.abs(XL[best] - ZEYE[I])) best = L;
    guideFeet.push({ x: XD[1][best], y: XD[2][best] });
  }
  const TANT = (HEY2 - HEY1) / (STAL - HAND - AFST);
  return {
    lineTension: s.NYTRIS,
    lineAngle: s.NYVISH,
    steps,
    rows: rowsOut,
    sigmaMax: SIGMAX,
    sigmaMaxAt: XIGM,
    momentMax: BMAX,
    shape,
    guides,
    guideFeet,
    lineStart: { x: 0.0, y: XYG[1][2] * TANT + XYG[2][2] },
    tip: { x: XD[1][NEL], y: XD[2][NEL] },
  };
}

/** LASTDIALOG.F90: new line tension and angle; the previous load becomes the starting point. */
function setLoad(s: State, load: LoadCase): void {
  s.NYTRIS = load.lineTension;
  s.NYVISH = load.lineAngle;
  s.RISH = s.NYVISH * RAD;
  s.FOLX = s.FNUX;
  s.FOLY = s.FNUY;
  s.FNUX = s.NYTRIS * Math.cos(s.RISH);
  s.FNUY = s.NYTRIS * Math.sin(s.RISH);
}

/** Clamp the integer inputs as STANG.F90 did after the data dialog (element cap raised unless legacy). */
export function clampDesign(d: DesignParams, legacy = false): DesignParams {
  const maxElements = legacy ? NELX - 1 : MAX_ELEMENTS;
  return {
    ...d,
    sides: Math.max(3, Math.trunc(d.sides)),
    guideCount: Math.max(3, Math.trunc(d.guideCount)),
    elementCount: Math.max(29, Math.min(maxElements, Math.trunc(d.elementCount))),
    spiralParameter: Math.min(89.0, d.spiralParameter),
  };
}

/**
 * Run the full sequence of the original program for one session:
 * data dialog -> STANGINIT -> reference force -> CALCPLOT with the design load,
 * and optionally LASTDIALOG ("Ny last") -> CALCPLOT with another load.
 */
export function runModel(input: ModelInput): ModelResult {
  const d = clampDesign(input.design, input.legacy === true);
  const s = new State();
  s.legacy = input.legacy === true;
  s.NKANT = d.sides;
  s.NEYE = d.guideCount;
  s.NELE = d.elementCount;
  s.STAL = d.rodLength;
  s.HAND = d.handleLength;
  s.AFST = d.firstGuideDistance;
  s.SPIDS = d.tipDiameter;
  s.REYE = d.guideSpacingRatio;
  s.HEY1 = d.topGuideHeight;
  s.HEY2 = d.bottomGuideHeight;
  s.AJIG = d.jigScrewSpacing;
  s.FERL = d.ferruleLength;
  s.AFERL = d.ferruleClearance;
  s.EMOD = d.elasticModulus;
  s.RHO = d.density;
  s.NYTRIS = d.lineTension;
  s.NYVISH = d.lineAngle;
  s.VISP = d.tipAngle;
  s.ALFA = d.spiralParameter;
  if (s.NEYE + 1 >= EYE_CAP) throw new RodError('guideCount', { expected: EYE_CAP - 2, got: s.NEYE });

  const warnings: EngineWarning[] = [];
  const init = stangInit(s, input, warnings);
  const reference = referenceForce(s);
  const loads: LoadResult[] = [calcplot(s)];
  const load = input.load;
  if (load && (load.lineTension !== d.lineTension || load.lineAngle !== d.lineAngle)) {
    setLoad(s, load);
    loads.push(calcplot(s));
  }

  const { N1, NEL, ZEYE, HH, STAL } = s;
  const guides: GuideRow[] = [];
  for (let I = 1; I <= N1; I++) {
    guides.push({
      index: I - 1,
      fromButt: ZEYE[I],
      fromTip: STAL - ZEYE[I],
      spacing: ZEYE[I] - (I === 1 ? 0 : ZEYE[I - 1]),
      height: I === 1 ? 0 : HH[I],
    });
  }
  const ideal: ShapePoint[] = [];
  for (let I = 0; I <= NEL; I++) ideal.push({ x: s.XI[1][I], y: s.XI[2][I], angle: s.XI[0][I] });

  const result: ModelResult = {
    section: { high: s.HIGH, bred: s.BRED, diam: s.DIAM, areal: s.AREAL, bimo: s.BIMO },
    rmin: s.RMIN,
    nhand: s.NHAND,
    nel: NEL,
    lferl: s.LFERL,
    ferrule: init.ferrule,
    xl: Array.from(s.XL.subarray(0, NEL + 1)),
    rr: Array.from(s.RR.subarray(0, NEL + 1)),
    guides,
    shapeKind: init.shapeKind,
    center: init.shapeKind === 'custom' ? null : { x: s.XCENTR, y: s.YCENTR },
    ideal,
    design: {
      rows: init.designRows,
      mass: init.mass,
      centreOfGravity: init.centreOfGravity,
      volume: init.volume,
      sigmaMax: init.sigmaMax,
      sigmaMaxAt: init.sigmaMaxAt,
    },
    jig: init.jig,
    reference: { force: reference.force, iterations: reference.iterations, targetDeflection: reference.target },
    loads,
    warnings,
  };
  const check = [result.design.mass, result.reference.force, ...loads.map((l) => l.tip.x + l.tip.y + l.sigmaMax)];
  if (!check.every(Number.isFinite)) throw new RodError('invalidResult');
  return result;
}
