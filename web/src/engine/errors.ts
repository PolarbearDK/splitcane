/**
 * Every place where the original Fortran program did `STOP` becomes a RodError.
 * The UI translates the code into Danish/English.
 */
export type RodErrorCode =
  | 'lineAngleNotAboveTipAngle'
  | 'parabolaTipAngle'
  | 'guideFirstPosition'
  | 'guideOrder'
  | 'guideLastPosition'
  | 'guideCount'
  | 'ferruleTooLong'
  | 'negativeMoment'
  | 'negativeRadius'
  | 'chebyshevSingular'
  | 'taperTooFewPoints'
  | 'referenceNotConverged'
  | 'beamNotConverged'
  | 'invalidResult';

export class RodError extends Error {
  readonly code: RodErrorCode;
  readonly params: Record<string, number>;

  constructor(code: RodErrorCode, params: Record<string, number> = {}) {
    super(`${code} ${JSON.stringify(params)}`);
    this.name = 'RodError';
    this.code = code;
    this.params = params;
  }
}
