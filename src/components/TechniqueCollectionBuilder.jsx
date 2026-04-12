import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ARPEGGIO_PRESENTATION,
  CHORD_PRESENTATION,
  DEFAULT_COLLECTION_SETTINGS,
  DIRECTIONS,
  DURATION_OPTIONS,
  HANDS,
  KEY_ORDERS,
  RENDER_MODES,
  buildTechniqueCollectionDocument,
} from '../utilities/techniqueGenerator.js';
import { renderTypstSvgBatch } from '../utilities/typstRenderer.js';

const handOptions = [
  { value: HANDS.RIGHT, label: 'Right Hand' },
  { value: HANDS.LEFT, label: 'Left Hand' },
  { value: HANDS.TOGETHER, label: 'Hands Together' },
];

const directionOptions = [
  { value: DIRECTIONS.BOTH, label: 'Up and Down' },
  { value: DIRECTIONS.UP, label: 'Ascending' },
  { value: DIRECTIONS.DOWN, label: 'Descending' },
];

const renderModeOptions = [
  { value: RENDER_MODES.KEY_SIGNATURE, label: 'Key signature' },
  { value: RENDER_MODES.ACCIDENTALS, label: 'Accidentals' },
];

const keyOrderOptions = [
  { value: KEY_ORDERS.CHROMATIC, label: 'Chromatic from C' },
  { value: KEY_ORDERS.FIFTHS, label: 'Circle of fifths' },
];

const chordPresentationOptions = [
  { value: CHORD_PRESENTATION.BOTH, label: 'Solid and broken' },
  { value: CHORD_PRESENTATION.SOLID, label: 'Solid only' },
  { value: CHORD_PRESENTATION.BROKEN, label: 'Broken only' },
];

const arpeggioPresentationOptions = [
  { value: ARPEGGIO_PRESENTATION.ROOT_ONLY, label: 'Root only' },
  { value: ARPEGGIO_PRESENTATION.ROOT_AND_INVERSIONS, label: 'Root and inversions' },
];

const octaveOptions = [
  { value: 1, label: '1 octave' },
  { value: 2, label: '2 octaves' },
];

function SelectField({ id, label, value, options, onChange }) {
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextField({ id, label, value, onChange }) {
  return (
    <label className="field field-wide" htmlFor={id}>
      <span>{label}</span>
      <input id={id} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function ToggleField({ id, label, checked, onChange }) {
  return (
    <label className="toggle" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

export default function TechniqueCollectionBuilder() {
  const [settings, setSettings] = useState(DEFAULT_COLLECTION_SETTINGS);
  const [entryResults, setEntryResults] = useState([]);
  const [isRendering, setIsRendering] = useState(true);
  const renderId = useRef(0);
  const resultCache = useRef(new Map());

  const document = useMemo(() => buildTechniqueCollectionDocument(settings), [settings]);

  function updateSetting(key, value) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function exportTypst() {
    const blob = new Blob([document.source], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = `${document.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'technique-collection'}.typ`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  useEffect(() => {
    const id = renderId.current + 1;
    renderId.current = id;

    const visibleResults = document.entries.map((entry) => (
      resultCache.current.get(entry.id) ?? {
        id: entry.id,
        title: entry.title,
        svg: '',
        error: '',
        status: 'pending',
      }
    ));
    const entriesToRender = document.entries.filter((entry) => !resultCache.current.has(entry.id));

    setEntryResults(visibleResults);
    setIsRendering(entriesToRender.length > 0);

    if (document.entries.length === 0) {
      setIsRendering(false);
      return undefined;
    }

    if (entriesToRender.length === 0) {
      return undefined;
    }

    const abortController = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        await renderTypstSvgBatch(entriesToRender, {
          signal: abortController.signal,
          onResult: (_, result) => {
            if (renderId.current !== id) return;

            const rendered = {
              id: result.id,
              title: result.title,
              svg: result.svg,
              error: result.error,
              status: result.status,
            };
            resultCache.current.set(result.id, rendered);

            setEntryResults((current) => current.map((entry) => (
              entry.id === result.id
                ? {
                  ...entry,
                  svg: result.svg,
                  error: result.error,
                  status: result.status,
                }
                : entry
            )));
          },
        });

        if (renderId.current === id) {
          setIsRendering(false);
        }
      } catch (nextError) {
        if (nextError?.name === 'AbortError' || renderId.current !== id) return;

        setEntryResults((current) => current.map((entry) => (
          entry.status === 'pending' && entriesToRender.some((nextEntry) => nextEntry.id === entry.id)
            ? (() => {
              const rendered = {
                ...entry,
                error: nextError instanceof Error ? nextError.message : String(nextError),
                status: 'error',
              };
              resultCache.current.set(entry.id, rendered);
              return rendered;
            })()
            : entry
        )));
        setIsRendering(false);
      }
    }, 120);

    return () => {
      window.clearTimeout(timer);
      abortController.abort();
    };
  }, [document.entries]);

  const completedCount = entryResults.filter((entry) => entry.status !== 'pending').length;

  return (
    <main className="technique-shell">
      <section className="workbench" aria-label="Technique collection generator">
        <div className="controls">
          <div className="brandline">
            <p className="eyebrow">Technique Collection Generator</p>
            <h1>{document.title}</h1>
            <a className="text-link" href="/single-technique">
              Single technique
            </a>
          </div>

          <div className="control-grid">
            <TextField
              id="collectionTitle"
              label="Title"
              value={settings.title}
              onChange={(value) => updateSetting('title', value)}
            />
            <SelectField
              id="keyOrder"
              label="Key order"
              value={settings.keyOrder}
              options={keyOrderOptions}
              onChange={(value) => updateSetting('keyOrder', value)}
            />
            <SelectField
              id="hand"
              label="Hand"
              value={settings.hand}
              options={handOptions}
              onChange={(value) => updateSetting('hand', value)}
            />
            <SelectField
              id="direction"
              label="Direction"
              value={settings.direction}
              options={directionOptions}
              onChange={(value) => updateSetting('direction', value)}
            />
            <SelectField
              id="duration"
              label="Duration"
              value={settings.duration}
              options={DURATION_OPTIONS}
              onChange={(value) => updateSetting('duration', Number(value))}
            />
            <SelectField
              id="renderMode"
              label="Notation"
              value={settings.renderMode}
              options={renderModeOptions}
              onChange={(value) => updateSetting('renderMode', value)}
            />
            {settings.includeScales && (
              <SelectField
                id="octaves"
                label="Scale octaves"
                value={settings.octaves}
                options={octaveOptions}
                onChange={(value) => updateSetting('octaves', Number(value))}
              />
            )}
          </div>

          <div className="toggles section-toggles">
            <ToggleField
              id="includeScales"
              label="Scales"
              checked={settings.includeScales}
              onChange={(value) => updateSetting('includeScales', value)}
            />
            <ToggleField
              id="includeTriads"
              label="Triads"
              checked={settings.includeTriads}
              onChange={(value) => updateSetting('includeTriads', value)}
            />
            <ToggleField
              id="includeSevenths"
              label="7th chords"
              checked={settings.includeSevenths}
              onChange={(value) => updateSetting('includeSevenths', value)}
            />
            <ToggleField
              id="includeArpeggios"
              label="Arpeggios"
              checked={settings.includeArpeggios}
              onChange={(value) => updateSetting('includeArpeggios', value)}
            />
            <ToggleField
              id="fingerings"
              label="Fingerings"
              checked={settings.showFingerings}
              onChange={(value) => updateSetting('showFingerings', value)}
            />
          </div>

          <div className="control-grid compact-grid">
            {settings.includeTriads && (
              <SelectField
                id="triadPresentation"
                label="Triads"
                value={settings.triadPresentation}
                options={chordPresentationOptions}
                onChange={(value) => updateSetting('triadPresentation', value)}
              />
            )}
            {settings.includeSevenths && (
              <SelectField
                id="seventhPresentation"
                label="7th chords"
                value={settings.seventhPresentation}
                options={chordPresentationOptions}
                onChange={(value) => updateSetting('seventhPresentation', value)}
              />
            )}
            {settings.includeArpeggios && (
              <SelectField
                id="arpeggioPresentation"
                label="Arpeggios"
                value={settings.arpeggioPresentation}
                options={arpeggioPresentationOptions}
                onChange={(value) => updateSetting('arpeggioPresentation', value)}
              />
            )}
          </div>

          <div className="action-row">
            <button type="button" onClick={() => window.print()} disabled={isRendering}>
              Print
            </button>
            <button type="button" onClick={exportTypst}>
              Export Typst
            </button>
          </div>
        </div>

        <div className="score-pane" aria-live="polite">
          <div className="score-toolbar">
            <span>
              {isRendering
                ? `Rendering ${completedCount}/${document.entries.length}`
                : `${document.entries.length} techniques`}
            </span>
            <span>Scorify + Typst WASM</span>
          </div>
          <div className={`score-output collection-output${isRendering ? ' is-rendering' : ''}`}>
            {document.entries.length === 0 && (
              <p className="empty-output">Choose at least one technique family.</p>
            )}
            {document.entries.length > 0 && (
              <div className="collection-heading">
                <h2>{document.title}</h2>
              </div>
            )}
            {entryResults.map((entry) => (
              <section className="collection-score" key={entry.id} aria-label={entry.title}>
                {entry.status === 'pending' && (
                  <div className="score-placeholder">Rendering {entry.title}</div>
                )}
                {entry.error && (
                  <pre className="error-output inline-error">{entry.error}</pre>
                )}
                {entry.svg && (
                  <div dangerouslySetInnerHTML={{ __html: entry.svg }} />
                )}
              </section>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
