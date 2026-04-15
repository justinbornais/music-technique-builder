import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ARPEGGIO_PRESENTATION,
  CHORD_PRESENTATION,
  DEFAULT_COLLECTION_SETTINGS,
  DIRECTIONS,
  DISPLAY_SIZE_OPTIONS,
  DURATION_OPTIONS,
  HANDS,
  KEY_ORDERS,
  RENDER_MODES,
  buildTechniqueCollectionDocument,
} from '../utilities/techniqueGenerator.js';
import { renderTypstSvgBatch, warmTypstRenderer } from '../utilities/typstRenderer.js';

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
  { value: KEY_ORDERS.ACCIDENTALS, label: 'Fewest to most accidentals' },
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

const MAX_RESULT_CACHE_ENTRIES = 200;

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
  const [pendingSettings, setPendingSettings] = useState(DEFAULT_COLLECTION_SETTINGS);
  const [committedSettings, setCommittedSettings] = useState(null);
  const [hasPendingChanges, setHasPendingChanges] = useState(true);
  const [entryResults, setEntryResults] = useState([]);
  const [renderedTechniqueCount, setRenderedTechniqueCount] = useState(0);
  const [isRendering, setIsRendering] = useState(false);
  const renderId = useRef(0);
  const resultCache = useRef(new Map());

  const document = useMemo(
    () => committedSettings ? buildTechniqueCollectionDocument(committedSettings) : null,
    [committedSettings],
  );

  function updateSetting(key, value) {
    setPendingSettings((current) => ({
      ...current,
      [key]: value,
    }));
    setHasPendingChanges(true);
  }

  function handleGenerate() {
    setCommittedSettings(pendingSettings);
    setHasPendingChanges(false);
  }

  function exportTypst() {
    if (!document) return;
    const blob = new Blob([document.source], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = `${document.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'technique-collection'}.typ`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  function cacheResult(result) {
    if (resultCache.current.has(result.id)) {
      resultCache.current.delete(result.id);
    }

    resultCache.current.set(result.id, result);
    if (resultCache.current.size > MAX_RESULT_CACHE_ENTRIES) {
      resultCache.current.delete(resultCache.current.keys().next().value);
    }
  }

  useEffect(() => {
    void warmTypstRenderer({ main: false, workers: true });
  }, []);

  useEffect(() => {
    if (!document) {
      setEntryResults([]);
      setRenderedTechniqueCount(0);
      setIsRendering(false);
      return undefined;
    }

    const id = renderId.current + 1;
    renderId.current = id;

    const visibleResults = document.renderEntries.map((entry) => (
      resultCache.current.get(entry.id) ?? {
        id: entry.id,
        title: entry.title,
        techniqueCount: entry.techniqueCount,
        svg: '',
        error: '',
        status: 'pending',
      }
    ));
    const activeResults = new Map(visibleResults.map((entry) => [entry.id, entry]));
    const entriesToRender = document.renderEntries.filter((entry) => !resultCache.current.has(entry.id));
    const cachedTechniqueCount = visibleResults.reduce(
      (count, entry) => count + (entry.status === 'pending' ? 0 : entry.techniqueCount ?? 1),
      0,
    );

    setEntryResults(visibleResults);
    setRenderedTechniqueCount(cachedTechniqueCount);
    setIsRendering(entriesToRender.length > 0);

    if (document.entries.length === 0) {
      setIsRendering(false);
      return undefined;
    }

    if (entriesToRender.length === 0) {
      return undefined;
    }

    const abortController = new AbortController();
    let completedTechniqueCount = cachedTechniqueCount;
    let progressTimer = 0;

    function flushRenderProgress() {
      if (progressTimer) {
        window.clearTimeout(progressTimer);
        progressTimer = 0;
      }

      setRenderedTechniqueCount(completedTechniqueCount);
    }

    function scheduleProgressFlush() {
      if (progressTimer) return;
      progressTimer = window.setTimeout(flushRenderProgress, 80);
    }

    const timer = window.setTimeout(async () => {
      try {
        await renderTypstSvgBatch(entriesToRender, {
          signal: abortController.signal,
          onResult: (_, result) => {
            if (renderId.current !== id) return;

            const rendered = {
              id: result.id,
              title: result.title,
              techniqueCount: result.techniqueCount,
              svg: result.svg,
              error: result.error,
              status: result.status,
            };
            activeResults.set(result.id, rendered);
            cacheResult(rendered);
            completedTechniqueCount += result.techniqueCount ?? 1;
            scheduleProgressFlush();
          },
        });

        if (renderId.current === id) {
          flushRenderProgress();
          setEntryResults(document.renderEntries.map((entry) => activeResults.get(entry.id) ?? {
            id: entry.id,
            title: entry.title,
            techniqueCount: entry.techniqueCount,
            svg: '',
            error: '',
            status: 'pending',
          }));
          setIsRendering(false);
        }
      } catch (nextError) {
        if (nextError?.name === 'AbortError' || renderId.current !== id) return;

        flushRenderProgress();
        setEntryResults((current) => current.map((entry) => (
          entry.status === 'pending' && entriesToRender.some((nextEntry) => nextEntry.id === entry.id)
            ? (() => {
              const rendered = {
                ...entry,
                error: nextError instanceof Error ? nextError.message : String(nextError),
                status: 'error',
              };
              cacheResult(rendered);
              return rendered;
            })()
            : entry
        )));
        setIsRendering(false);
      }
    }, 120);

    return () => {
      window.clearTimeout(timer);
      if (progressTimer) {
        window.clearTimeout(progressTimer);
      }
      abortController.abort();
    };
  }, [document]);

  const completedCount = entryResults.reduce(
    (count, entry) => count + (entry.status === 'pending' ? 0 : entry.techniqueCount ?? 1),
    0,
  );
  const visibleCompletedCount = isRendering ? renderedTechniqueCount : completedCount;

  return (
    <main className="technique-shell">
      <section className="workbench" aria-label="Technique collection generator">
        <div className="controls">
          <div className="brandline">
            <p className="eyebrow">Technique Collection Generator</p>
            <h1>{committedSettings ? document.title : (pendingSettings.title || DEFAULT_COLLECTION_SETTINGS.title)}</h1>
            <a className="text-link" href="/single-technique">
              Single technique
            </a>
          </div>

          <div className="control-grid">
            <TextField
              id="collectionTitle"
              label="Title"
              value={pendingSettings.title}
              onChange={(value) => updateSetting('title', value)}
            />
            <SelectField
              id="keyOrder"
              label="Key order"
              value={pendingSettings.keyOrder}
              options={keyOrderOptions}
              onChange={(value) => updateSetting('keyOrder', value)}
            />
            <SelectField
              id="hand"
              label="Hand"
              value={pendingSettings.hand}
              options={handOptions}
              onChange={(value) => updateSetting('hand', value)}
            />
            <SelectField
              id="direction"
              label="Direction"
              value={pendingSettings.direction}
              options={directionOptions}
              onChange={(value) => updateSetting('direction', value)}
            />
            <SelectField
              id="duration"
              label="Duration"
              value={pendingSettings.duration}
              options={DURATION_OPTIONS}
              onChange={(value) => updateSetting('duration', Number(value))}
            />
            <SelectField
              id="renderMode"
              label="Notation"
              value={pendingSettings.renderMode}
              options={renderModeOptions}
              onChange={(value) => updateSetting('renderMode', value)}
            />
            <SelectField
              id="displayScale"
              label="Display size"
              value={pendingSettings.displayScale}
              options={DISPLAY_SIZE_OPTIONS}
              onChange={(value) => updateSetting('displayScale', Number(value))}
            />
            {pendingSettings.includeScales && (
              <SelectField
                id="octaves"
                label="Scale octaves"
                value={pendingSettings.octaves}
                options={octaveOptions}
                onChange={(value) => updateSetting('octaves', Number(value))}
              />
            )}
          </div>

          <div className="toggles section-toggles">
            <ToggleField
              id="pairRelativeKeys"
              label="Pair relative keys"
              checked={pendingSettings.pairRelativeKeys}
              onChange={(value) => updateSetting('pairRelativeKeys', value)}
            />
            <ToggleField
              id="includeScales"
              label="Scales"
              checked={pendingSettings.includeScales}
              onChange={(value) => updateSetting('includeScales', value)}
            />
            <ToggleField
              id="includeTriads"
              label="Triads"
              checked={pendingSettings.includeTriads}
              onChange={(value) => updateSetting('includeTriads', value)}
            />
            <ToggleField
              id="includeSevenths"
              label="7th chords"
              checked={pendingSettings.includeSevenths}
              onChange={(value) => updateSetting('includeSevenths', value)}
            />
            <ToggleField
              id="includeArpeggios"
              label="Arpeggios"
              checked={pendingSettings.includeArpeggios}
              onChange={(value) => updateSetting('includeArpeggios', value)}
            />
            <ToggleField
              id="fingerings"
              label="Fingerings"
              checked={pendingSettings.showFingerings}
              onChange={(value) => updateSetting('showFingerings', value)}
            />
            <ToggleField
              id="showDetails"
              label="Show details"
              checked={pendingSettings.showDetails}
              onChange={(value) => updateSetting('showDetails', value)}
            />
          </div>

          <div className="control-grid compact-grid">
            {pendingSettings.includeTriads && (
              <SelectField
                id="triadPresentation"
                label="Triads"
                value={pendingSettings.triadPresentation}
                options={chordPresentationOptions}
                onChange={(value) => updateSetting('triadPresentation', value)}
              />
            )}
            {pendingSettings.includeSevenths && (
              <SelectField
                id="seventhPresentation"
                label="7th chords"
                value={pendingSettings.seventhPresentation}
                options={chordPresentationOptions}
                onChange={(value) => updateSetting('seventhPresentation', value)}
              />
            )}
            {pendingSettings.includeArpeggios && (
              <SelectField
                id="arpeggioPresentation"
                label="Arpeggios"
                value={pendingSettings.arpeggioPresentation}
                options={arpeggioPresentationOptions}
                onChange={(value) => updateSetting('arpeggioPresentation', value)}
              />
            )}
          </div>

          <div className="action-row">
            <button type="button" onClick={() => window.print()} disabled={isRendering || !committedSettings}>
              Print
            </button>
            <button type="button" onClick={exportTypst} disabled={!committedSettings}>
              Export Typst
            </button>
            <button type="button" onClick={handleGenerate} disabled={!hasPendingChanges}>
              {committedSettings === null ? 'Generate' : 'Regenerate'}
            </button>
          </div>
        </div>

        <div className="score-pane" aria-live="polite">
          <div className="score-toolbar">
            <span>
              {isRendering
                ? `Rendering ${visibleCompletedCount}/${document?.techniqueCount ?? 0}`
                : committedSettings
                  ? `${document.techniqueCount} techniques`
                  : 'Not generated'}
            </span>
            <span>Scorify + Typst WASM</span>
          </div>
          {!committedSettings ? (
            <div className="score-output collection-output">
              <p className="empty-output">Configure your settings and click Generate.</p>
            </div>
          ) : (
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
                  {isRendering && entry.status !== 'pending' && !entry.error && !entry.svg && (
                    <div className="score-placeholder">Rendered {entry.title}</div>
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
          )}
        </div>
      </section>
    </main>
  );
}
