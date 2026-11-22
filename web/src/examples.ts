import { DEFAULT_DESIGN, newDocument, type RodDocument } from './io/document';

/** Stangbygning1/STANG.DAT - the run in stang.OUT (16 Feb 2013). */
export const EXAMPLE_SPIRAL: RodDocument = newDocument('stang', {
  ...DEFAULT_DESIGN,
  elementCount: 30,
  topGuideHeight: 6,
  bottomGuideHeight: 12,
});

/** Stangbygning1/STANG1.DAT - the run in stang1.OUT (9 Mar 2011). */
export const EXAMPLE_CIRCLE: RodDocument = newDocument('stang1', {
  sides: 6,
  guideCount: 7,
  elementCount: 49,
  elasticModulus: 25000,
  density: 0.9,
  lineTension: 0.5,
  rodLength: 1800,
  handleLength: 300,
  firstGuideDistance: 200,
  tipDiameter: 3,
  guideSpacingRatio: 2,
  topGuideHeight: 8,
  bottomGuideHeight: 20,
  jigScrewSpacing: 152.4,
  ferruleLength: 100,
  ferruleClearance: 10,
  lineAngle: 120,
  tipAngle: 30,
  spiralParameter: 0,
});

export const EXAMPLE_DEFAULT: RodDocument = newDocument('stang');
