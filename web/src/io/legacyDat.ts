/**
 * Import of the original .DAT files (Fortran list-directed input, read by STANG.F90/STANGINIT.F90):
 *
 *   NKANT, NEYE, NELE
 *   EMOD, RHO, NYTRIS
 *   STAL, HAND, AFST, SPIDS
 *   REYE, HEY1, HEY2, AJIG, FERL, AFERL
 *   NYVISH, VISP, ALFA
 *   [NEYE guide positions, one per line - read only if REYE = 0]
 *   [x, diameter pairs - read only if SPIDS = 0]
 *
 * The program rewrote the file after each run, adding the computed guide positions and
 * an "x, diameter" table. Those lines are ignored unless REYE/SPIDS = 0, as in the original.
 */
import type { DesignParams, TaperPoint } from '../engine/types';
import { newDocument, type RodDocument } from './document';

export class LegacyDatError extends Error {
  constructor(readonly line: number) {
    super(`Cannot read line ${line} of the .DAT file`);
  }
}

function numbersOf(line: string): number[] {
  return line
    .split(/[\s,]+/)
    .filter((t) => t.length > 0)
    .map(Number)
    .filter((n) => Number.isFinite(n));
}

export function parseLegacyDat(text: string, name = 'stang'): RodDocument {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/);
  let li = 0;
  const take = (count: number): number[] => {
    while (li < lines.length) {
      const nums = numbersOf(lines[li]);
      li++;
      if (nums.length === 0) continue;
      if (nums.length < count) throw new LegacyDatError(li);
      return nums;
    }
    throw new LegacyDatError(li + 1);
  };
  const [nkant, neye, nele] = take(3);
  const [emod, rho, nytris] = take(3);
  const [stal, hand, afst, spids] = take(4);
  const [reye, hey1, hey2, ajig, ferl, aferl] = take(6);
  const [nyvish, visp, alfa] = take(3);
  const design: DesignParams = {
    sides: nkant,
    guideCount: neye,
    elementCount: nele,
    elasticModulus: emod,
    density: rho,
    lineTension: nytris,
    rodLength: stal,
    handleLength: hand,
    firstGuideDistance: afst,
    tipDiameter: spids,
    guideSpacingRatio: reye,
    topGuideHeight: hey1,
    bottomGuideHeight: hey2,
    jigScrewSpacing: ajig,
    ferruleLength: ferl,
    ferruleClearance: aferl,
    lineAngle: nyvish,
    tipAngle: visp,
    spiralParameter: alfa,
  };
  const doc: RodDocument = { ...newDocument(name, design), curve: 'spiral' }; // the Fortran program only had the spiral
  if (reye < 0.01) {
    const pos: number[] = [];
    for (let i = 0; i < Math.trunc(neye); i++) pos.push(take(1)[0]);
    doc.guidePositions = pos;
  }
  if (spids < 0.0001) {
    const taper: TaperPoint[] = [];
    for (; li < lines.length; li++) {
      const nums = numbersOf(lines[li]);
      // Lines with a single number are the guide positions the program wrote back; skip them.
      if (nums.length >= 2) taper.push({ x: nums[0], d: nums[1] });
    }
    doc.taper = taper;
  }
  return doc;
}
