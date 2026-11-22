/**
 * Input/output types for the rod engine.
 *
 * Each design field notes the original Fortran variable from STANGMOD/STANG.F90,
 * so the port can be traced back to the original source.
 */

export interface DesignParams {
  /** NKANT - number of sides (splits) in the cane, e.g. 6 for a hexagonal rod. */
  sides: number;
  /** NEYE - number of guides (eyes), excluding the handle. */
  guideCount: number;
  /** NELE - approximate number of beam elements along the rod. */
  elementCount: number;
  /** STAL - total rod length, mm. */
  rodLength: number;
  /** HAND - handle length, mm. */
  handleLength: number;
  /** AFST - distance from top of handle to the lowest guide, mm. */
  firstGuideDistance: number;
  /** SPIDS - minimum (tip) diameter, mm. 0 = use the custom taper table. */
  tipDiameter: number;
  /** REYE - ratio between the largest (lowest) and smallest (top) guide spacing. 0 = custom guide positions. */
  guideSpacingRatio: number;
  /** HEY1 - height of the top guide (at the tip), mm. */
  topGuideHeight: number;
  /** HEY2 - height of the lowest guide (near the handle), mm. */
  bottomGuideHeight: number;
  /** AJIG - distance between the adjustment screws in the planing form (jig), mm. */
  jigScrewSpacing: number;
  /** FERL - ferrule length, mm. */
  ferruleLength: number;
  /** AFERL - minimum distance between a guide and the ferrule, mm. */
  ferruleClearance: number;
  /** EMOD - modulus of elasticity, N/mm². */
  elasticModulus: number;
  /** RHO - density, g/cm³. */
  density: number;
  /** NYTRIS - line tension the rod is designed for, N. */
  lineTension: number;
  /** NYVISH - angle between line and handle, degrees (about 90). */
  lineAngle: number;
  /** VISP - angle between the rod tangent at the tip and the handle at full load, degrees (about 60). */
  tipAngle: number;
  /** ALFA - spiral parameter, degrees. 0 = circular bend, larger = stiffer rod. */
  spiralParameter: number;
}

export interface TaperPoint {
  /** Position along the rod, mm. */
  x: number;
  /** Diameter measured across the corners, mm. */
  d: number;
}

export interface LoadCase {
  /** Line tension, N. */
  lineTension: number;
  /** Angle between line and handle, degrees. */
  lineAngle: number;
}

export interface ModelInput {
  design: DesignParams;
  /** Guide positions from the butt end, mm (NEYE values). Used when guideSpacingRatio = 0. */
  guidePositions?: number[];
  /** Diameter points along the rod. Used when tipDiameter = 0. */
  taper?: TaperPoint[];
  /** Load to test the rod with after it has been designed. Omit to use the design load only. */
  load?: LoadCase;
}

export interface Point {
  x: number;
  y: number;
}

export interface ShapePoint extends Point {
  /** Tangent angle, radians. */
  angle: number;
}

export interface GuideRow {
  /** 0 = top of handle, 1 = lowest guide ... NEYE = tip-top. */
  index: number;
  fromButt: number;
  fromTip: number;
  /** Distance from the previous guide (or handle). */
  spacing: number;
  /** Guide height above the rod surface (line clearance), mm. */
  height: number;
}

export interface DesignRow {
  index: number;
  x: number;
  fromTip: number;
  ux: number;
  uy: number;
  /** degrees */
  angle: number;
  diameter: number;
  height: number;
  radius: number;
  width: number;
}

export interface JigRow {
  index: number;
  /** distance from the tip, mm */
  z: number;
  /** depth of the groove (centre-to-flat), mm */
  h: number;
  /** diameter at this point, mm */
  d: number;
  zInch: number;
  hInch: number;
  dInch: number;
}

export interface LoadRow {
  index: number;
  x: number;
  fromTip: number;
  ux: number;
  uy: number;
  /** degrees */
  angle: number;
  /** N·mm */
  moment: number;
  /** N/mm² */
  stress: number;
  diameter: number;
}

export interface LoadResult {
  lineTension: number;
  lineAngle: number;
  /** Number of load increments used (NTRIN). */
  steps: number;
  rows: LoadRow[];
  sigmaMax: number;
  sigmaMaxAt: number;
  momentMax: number;
  /** Deflected rod axis, index 0..NEL (XD). */
  shape: ShapePoint[];
  /** Deflected guide positions (XYG), one per guide. */
  guides: Point[];
  /** Points on the rod axis where each guide is mounted. */
  guideFeet: Point[];
  /** Start of the line at x = 0 (the reel side), as drawn in the original plot. */
  lineStart: Point;
  /** Tip deflection. */
  tip: Point;
}

export type WarningCode =
  | 'taperCoordinatesOrder'
  | 'taperIncreasing'
  | 'taperReversed'
  | 'taperFromTip'
  | 'chebyshevRange';

export interface EngineWarning {
  code: WarningCode;
  params?: Record<string, number>;
}

export interface ModelResult {
  /** Cross-section constants for outer radius 1. */
  section: {
    high: number;
    /** Width of one flat (2·sin(π/n)) */
    bred: number;
    diam: number;
    areal: number;
    bimo: number;
  };
  rmin: number;
  nhand: number;
  nel: number;
  /** Element index of the ferrule (LFERL), 0 if none. */
  lferl: number;
  ferrule: { start: number; end: number } | null;
  /** Element boundaries XL(0..NEL), mm. */
  xl: number[];
  /** Radius (to corners) at each element boundary RR(0..NEL), mm. */
  rr: number[];
  guides: GuideRow[];
  shapeKind: 'spiral' | 'circle' | 'custom';
  center: Point | null;
  /** Ideal (targeted) bend curve XI(0..NEL). */
  ideal: ShapePoint[];
  design: {
    rows: DesignRow[];
    mass: number;
    centreOfGravity: number;
    volume: number;
    sigmaMax: number;
    sigmaMaxAt: number;
  };
  jig: JigRow[];
  reference: { force: number; iterations: number; targetDeflection: number };
  /** [design load, applied load (if given and different)] */
  loads: LoadResult[];
  warnings: EngineWarning[];
}
