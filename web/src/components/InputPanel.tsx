import type { ModelResult, TargetCurve } from '../engine/types';
import type { FieldKey, FormState, Validated } from '../form';
import { useI18n } from '../i18n/context';

type UnitKey = 'mm' | 'deg' | 'N' | 'gcm3' | 'Nmm2mod' | '';

/** Field metadata: unit and the variable name in the original Fortran program. */
const META: Record<FieldKey, { unit: UnitKey; fortran: string }> = {
  sides: { unit: '', fortran: 'NKANT' },
  guideCount: { unit: '', fortran: 'NEYE' },
  elementCount: { unit: '', fortran: 'NELE' },
  rodLength: { unit: 'mm', fortran: 'STAL' },
  handleLength: { unit: 'mm', fortran: 'HAND' },
  firstGuideDistance: { unit: 'mm', fortran: 'AFST' },
  tipDiameter: { unit: 'mm', fortran: 'SPIDS' },
  guideSpacingRatio: { unit: '', fortran: 'REYE' },
  bottomGuideHeight: { unit: 'mm', fortran: 'HEY2' },
  topGuideHeight: { unit: 'mm', fortran: 'HEY1' },
  elasticModulus: { unit: 'Nmm2mod', fortran: 'EMOD' },
  density: { unit: 'gcm3', fortran: 'RHO' },
  lineTension: { unit: 'N', fortran: 'NYTRIS' },
  lineAngle: { unit: 'deg', fortran: 'NYVISH' },
  tipAngle: { unit: 'deg', fortran: 'VISP' },
  spiralParameter: { unit: 'deg', fortran: 'ALFA' },
  ferruleLength: { unit: 'mm', fortran: 'FERL' },
  ferruleClearance: { unit: 'mm', fortran: 'AFERL' },
  jigScrewSpacing: { unit: 'mm', fortran: 'AJIG' },
  loadTension: { unit: 'N', fortran: 'NYTRIS' },
  loadAngle: { unit: 'deg', fortran: 'NYVISH' },
};

const SECTIONS: { title: 'rod' | 'guides' | 'material' | 'shape' | 'ferrule'; keys: FieldKey[] }[] = [
  { title: 'rod', keys: ['sides', 'rodLength', 'handleLength', 'tipDiameter', 'elementCount'] },
  { title: 'guides', keys: ['guideCount', 'firstGuideDistance', 'guideSpacingRatio', 'bottomGuideHeight', 'topGuideHeight'] },
  { title: 'material', keys: ['elasticModulus', 'density'] },
  { title: 'shape', keys: ['lineTension', 'lineAngle', 'tipAngle', 'spiralParameter'] },
  { title: 'ferrule', keys: ['ferruleLength', 'ferruleClearance', 'jigScrewSpacing'] },
];

interface Props {
  form: FormState;
  validated: Validated;
  result: ModelResult | null;
  onChange: (form: FormState) => void;
}

export function InputPanel({ form, validated, result, onChange }: Props) {
  const { t } = useI18n();
  const { errors } = validated;
  const setField = (k: FieldKey, v: string) => onChange({ ...form, fields: { ...form.fields, [k]: v } });

  const field = (k: FieldKey) => {
    const meta = META[k];
    const text = t.fields[k];
    const err = errors[k];
    const id = `f-${k}`;
    return (
      <div className={`field${err ? ' has-error' : ''}`} key={k}>
        <label htmlFor={id}>
          {text.label}
          <span className="fortran" title="Fortran">
            {meta.fortran}
          </span>
        </label>
        <div className="input-wrap">
          <input
            id={id}
            inputMode="decimal"
            autoComplete="off"
            spellCheck={false}
            value={form.fields[k]}
            aria-invalid={!!err}
            aria-describedby={`${id}-msg`}
            onChange={(e) => setField(k, e.target.value)}
          />
          {meta.unit && <span className="unit">{t.units[meta.unit]}</span>}
        </div>
        <div id={`${id}-msg`} className={err ? 'msg error' : 'msg'}>
          {err ?? text.help}
        </div>
      </div>
    );
  };

  const ratio = Number(form.fields.guideSpacingRatio.replace(',', '.'));
  const tip = Number(form.fields.tipDiameter.replace(',', '.'));
  const showGuides = Number.isFinite(ratio) && ratio < 0.01;
  const showTaper = Number.isFinite(tip) && tip < 0.0001;
  const loadDiffers = form.fields.loadTension !== form.fields.lineTension || form.fields.loadAngle !== form.fields.lineAngle;

  return (
    <div className="inputs">
      <div className="field">
        <label htmlFor="f-name">{t.file.nameLabel}</label>
        <input id="f-name" value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} />
      </div>

      {SECTIONS.map((s) => (
        <fieldset key={s.title}>
          <legend>{t.sections[s.title]}</legend>
          {s.title === 'shape' && (
            <div className="field curve">
              <label htmlFor="f-curve">{t.curve.label}</label>
              <select
                id="f-curve"
                value={form.curve}
                aria-describedby="f-curve-msg"
                onChange={(e) => onChange({ ...form, curve: e.target.value as TargetCurve })}
              >
                <option value="spiral">{t.curve.spiral}</option>
                <option value="parabola">{t.curve.parabola}</option>
              </select>
              <div id="f-curve-msg" className="msg">
                {form.curve === 'parabola' ? t.curve.parabolaHelp : t.curve.spiralHelp}
              </div>
            </div>
          )}
          <div className="grid">{s.keys.filter((k) => !(k === 'spiralParameter' && form.curve === 'parabola')).map(field)}</div>
          {s.title === 'guides' && showGuides && (
            <div className={`listfield${errors.guides ? ' has-error' : ''}`}>
              <div className="listhead">
                <label htmlFor="f-guides">{t.sections.customGuides}</label>
                {result && (
                  <button
                    type="button"
                    className="link"
                    onClick={() => onChange({ ...form, guideText: result.guides.slice(1).map((g) => g.fromButt.toFixed(1)).join('\n') })}
                  >
                    {t.sections.fillGuides}
                  </button>
                )}
              </div>
              <textarea id="f-guides" rows={6} value={form.guideText} spellCheck={false} onChange={(e) => onChange({ ...form, guideText: e.target.value })} />
              <div className={errors.guides ? 'msg error' : 'msg'}>{errors.guides ?? t.sections.customGuidesHelp}</div>
            </div>
          )}
          {s.title === 'rod' && showTaper && (
            <div className={`listfield${errors.taper ? ' has-error' : ''}`}>
              <label htmlFor="f-taper">{t.sections.customTaper}</label>
              <textarea id="f-taper" rows={8} value={form.taperText} spellCheck={false} placeholder={'0\t7,2\n300\t6,8\n…'} onChange={(e) => onChange({ ...form, taperText: e.target.value })} />
              <div className={errors.taper ? 'msg error' : 'msg'}>{errors.taper ?? t.sections.customTaperHelp}</div>
            </div>
          )}
        </fieldset>
      ))}

      <fieldset className="load">
        <legend>{t.sections.load}</legend>
        <p className="hint">{t.sections.loadHelp}</p>
        <div className="grid">{(['loadTension', 'loadAngle'] as FieldKey[]).map(field)}</div>
        {loadDiffers && (
          <button
            type="button"
            className="link"
            onClick={() => onChange({ ...form, fields: { ...form.fields, loadTension: form.fields.lineTension, loadAngle: form.fields.lineAngle } })}
          >
            {t.sections.resetLoad}
          </button>
        )}
      </fieldset>

      <div className="field">
        <label htmlFor="f-notes">{t.file.notesLabel}</label>
        <textarea id="f-notes" rows={3} value={form.notes} onChange={(e) => onChange({ ...form, notes: e.target.value })} />
      </div>
    </div>
  );
}
