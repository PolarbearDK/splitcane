import { useEffect, useMemo, useRef, useState } from 'react';
import { InputPanel } from './components/InputPanel';
import { Results } from './components/Results';
import { RodError } from './engine/errors';
import { runModel } from './engine/model';
import type { ModelResult } from './engine/types';
import { EXAMPLE_CIRCLE, EXAMPLE_DEFAULT, EXAMPLE_SPIRAL } from './examples';
import { formFromDocument, validate, type FormState } from './form';
import { I18nContext } from './i18n/context';
import { STRINGS, type Lang } from './i18n/strings';
import { DocumentError, parseDocument, serializeDocument, type RodDocument } from './io/document';
import { LegacyDatError, parseLegacyDat } from './io/legacyDat';
import { buildReport } from './io/report';

const LS_LANG = 'stangbygning.lang';
const LS_DRAFT = 'stangbygning.draft';

function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function store(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode etc. */
  }
}

function initialLang(): Lang {
  const saved = load<Lang | null>(LS_LANG, null);
  if (saved === 'da' || saved === 'en') return saved;
  return typeof navigator !== 'undefined' && /^(da|nb|nn|no|sv)/i.test(navigator.language) ? 'da' : 'en';
}

function initialForm(): FormState {
  const draft = load<FormState | null>(LS_DRAFT, null);
  if (draft && draft.fields && typeof draft.name === 'string') return { ...formFromDocument(EXAMPLE_SPIRAL), ...draft };
  return formFromDocument(EXAMPLE_SPIRAL);
}

function download(name: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const safeName = (s: string) => s.trim().replace(/[\\/:*?"<>|]+/g, '_') || 'stang';

type Outcome = { ok: true; result: ModelResult } | { ok: false; error: string } | null;

export default function App() {
  const [lang, setLang] = useState<Lang>(initialLang);
  const [form, setForm] = useState<FormState>(initialForm);
  const [message, setMessage] = useState<{ kind: 'info' | 'error'; text: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const lastGood = useRef<ModelResult | null>(null);
  const t = STRINGS[lang];

  useEffect(() => store(LS_LANG, lang), [lang]);
  useEffect(() => store(LS_DRAFT, form), [form]);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const validated = useMemo(() => validate(form, t), [form, t]);

  const outcome: Outcome = useMemo(() => {
    if (!validated.input) return null;
    try {
      return { ok: true, result: runModel(validated.input) };
    } catch (e) {
      if (e instanceof RodError) return { ok: false, error: (t.errors[e.code] ?? t.errors.unknown)(e.params) };
      console.error(e);
      return { ok: false, error: t.errors.unknown({}) };
    }
  }, [validated.input, t]);
  if (outcome?.ok) lastGood.current = outcome.result;
  const shown = outcome?.ok ? outcome.result : lastGood.current;
  const stale = !outcome?.ok;

  /** Keep the test load following the design load until the user changes it. */
  const onChange = (next: FormState) => {
    const f = form.fields;
    const nf = { ...next.fields };
    if (f.loadTension === f.lineTension && nf.loadTension === f.loadTension) nf.loadTension = nf.lineTension;
    if (f.loadAngle === f.lineAngle && nf.loadAngle === f.loadAngle) nf.loadAngle = nf.lineAngle;
    setForm({ ...next, fields: nf });
  };

  const replaceDocument = (doc: RodDocument, info?: string) => {
    lastGood.current = null;
    setForm(formFromDocument(doc));
    setMessage(info ? { kind: 'info', text: info } : null);
  };

  const confirmDiscard = () => window.confirm(t.file.confirmDiscard);

  const onOpenFile = async (file: File) => {
    const text = await file.text();
    const baseName = file.name.replace(/\.[^.]+$/, '');
    const looksJson = /\.json$/i.test(file.name) || text.trimStart().startsWith('{');
    try {
      if (looksJson) replaceDocument(parseDocument(text));
      else replaceDocument(parseLegacyDat(text, baseName), t.file.importedDat);
    } catch (e) {
      if (e instanceof DocumentError) setMessage({ kind: 'error', text: `${t.docErrors[e.code]} ${e.detail}`.trim() });
      else if (e instanceof LegacyDatError) setMessage({ kind: 'error', text: `${t.docErrors.dat} ${e.line}` });
      else setMessage({ kind: 'error', text: String(e) });
    }
  };

  const onSave = () => {
    if (!validated.document) return;
    download(`${safeName(form.name)}.json`, serializeDocument(validated.document), 'application/json');
  };

  const onReport = () => {
    if (!validated.document || !outcome?.ok) return;
    download(`${safeName(form.name)}.txt`, buildReport(validated.document, outcome.result, t, lang), 'text/plain;charset=utf-8');
  };

  const rodLength = validated.input?.design.rodLength ?? Number(form.fields.rodLength.replace(',', '.'));

  return (
    <I18nContext.Provider value={{ lang, t }}>
      <header className="top">
        <div className="brand">
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <path d="M3 29 C 12 26, 22 16, 29 3" />
          </svg>
          <div>
            <h1>{t.appTitle}</h1>
            <p>{t.appSubtitle}</p>
          </div>
        </div>
        <nav className="actions">
          <button type="button" onClick={() => confirmDiscard() && replaceDocument(EXAMPLE_DEFAULT)}>
            {t.file.new}
          </button>
          <button type="button" onClick={() => fileInput.current?.click()} title={t.file.openHint}>
            {t.file.open}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".json,.dat,.DAT,application/json,text/plain"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onOpenFile(f);
              e.target.value = '';
            }}
          />
          <button type="button" onClick={onSave} disabled={!validated.document}>
            {t.file.save}
          </button>
          <button type="button" onClick={onReport} disabled={!outcome?.ok}>
            {t.file.report}
          </button>
          <select
            aria-label={t.file.examples}
            value=""
            onChange={(e) => {
              const v = e.target.value;
              if (!v || !confirmDiscard()) return;
              replaceDocument(v === 'spiral' ? EXAMPLE_SPIRAL : v === 'circle' ? EXAMPLE_CIRCLE : EXAMPLE_DEFAULT);
            }}
          >
            <option value="">{t.file.examples}…</option>
            <option value="spiral">{t.file.exampleSpiral}</option>
            <option value="circle">{t.file.exampleCircle}</option>
            <option value="default">{t.file.exampleDefault}</option>
          </select>
          <div className="lang" role="group" aria-label="Sprog / Language">
            {(['da', 'en'] as Lang[]).map((l) => (
              <button key={l} type="button" aria-pressed={lang === l} className={lang === l ? 'active' : ''} onClick={() => setLang(l)}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </nav>
      </header>

      {message && (
        <div className={`notice banner ${message.kind}`} role={message.kind === 'error' ? 'alert' : 'status'}>
          <span>{message.text}</span>
          <button type="button" className="link" onClick={() => setMessage(null)} aria-label="OK">
            ×
          </button>
        </div>
      )}

      <main className="layout">
        <aside className="panel">
          <InputPanel form={form} validated={validated} result={shown} onChange={onChange} />
        </aside>
        <section className="output">
          {!validated.input && <div className="notice warn">{t.results.fixInputs}</div>}
          {outcome && !outcome.ok && (
            <div className="notice error" role="alert">
              <strong>{t.results.error}:</strong> {outcome.error}
            </div>
          )}
          {shown && Number.isFinite(rodLength) && (
            <div className={stale ? 'stale' : ''}>
              <Results result={shown} rodLength={stale ? shown.xl[shown.xl.length - 1] : rodLength} />
            </div>
          )}
          <footer className="about">
            <h2>{t.about.title}</h2>
            <p>{t.about.body}</p>
            <p>{t.about.legacyNote}</p>
          </footer>
        </section>
      </main>
    </I18nContext.Provider>
  );
}
