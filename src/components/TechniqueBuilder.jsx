import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ARPEGGIO_OPTIONS,
  DEFAULT_SETTINGS,
  DIRECTIONS,
  DISPLAY_SIZE_OPTIONS,
  DURATION_OPTIONS,
  HANDS,
  RENDER_MODES,
  SCALE_OPTIONS,
  SEVENTH_OPTIONS,
  TECHNIQUE_TYPES,
  TRIAD_OPTIONS,
  buildTechniqueDocument,
  getKeyOptionsForSettings,
} from '../utilities/techniqueGenerator.js';
import { renderTypstSvg, warmTypstRenderer } from '../utilities/typstRenderer.js';

const techniqueOptions = [
  { value: TECHNIQUE_TYPES.SCALE, label: 'Scales' },
  { value: TECHNIQUE_TYPES.TRIAD, label: 'Triads' },
  { value: TECHNIQUE_TYPES.SEVENTH, label: '7th Chords' },
  { value: TECHNIQUE_TYPES.ARPEGGIO, label: 'Arpeggios' },
];

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

const octaveOptions = [
  { value: 1, label: '1 octave' },
  { value: 2, label: '2 octaves' },
];

const SelectField = React.memo(function SelectField({ id, label, value, options, onChange }) {
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
});

const ToggleField = React.memo(function ToggleField({ id, label, checked, onChange }) {
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
});

export default function TechniqueBuilder() {
  const [pendingSettings, setPendingSettings] = useState(DEFAULT_SETTINGS);
  const [committedSettings, setCommittedSettings] = useState(null);
  const [hasPendingChanges, setHasPendingChanges] = useState(true);
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');
  const [isRendering, setIsRendering] = useState(false);
  const renderId = useRef(0);

  const keyOptions = useMemo(() => getKeyOptionsForSettings(pendingSettings), [
    pendingSettings.technique,
    pendingSettings.scaleType,
  ]);
  const document = useMemo(
    () => committedSettings ? buildTechniqueDocument(committedSettings) : null,
    [committedSettings],
  );

  const updateSetting = useCallback((key, value) => {
    setPendingSettings((current) => ({
      ...current,
      [key]: value,
    }));
    setHasPendingChanges(true);
  }, []);

  const handleGenerate = useCallback(() => {
    setCommittedSettings(pendingSettings);
    setHasPendingChanges(false);
  }, [pendingSettings]);

  useEffect(() => {
    void warmTypstRenderer();
  }, []);

  useEffect(() => {
    if (keyOptions.some((option) => option.value === pendingSettings.key)) return;
    updateSetting('key', keyOptions[0]?.value ?? DEFAULT_SETTINGS.key);
  }, [keyOptions, pendingSettings.key]);

  useEffect(() => {
    if (!document) return;

    const id = renderId.current + 1;
    renderId.current = id;
    setIsRendering(true);
    setError('');

    const timer = window.setTimeout(async () => {
      try {
        const nextSvg = await renderTypstSvg(document.source);
        if (renderId.current === id) {
          setSvg(nextSvg);
          setIsRendering(false);
        }
      } catch (nextError) {
        if (renderId.current === id) {
          setError(nextError instanceof Error ? nextError.message : String(nextError));
          setIsRendering(false);
        }
      }
    }, 120);

    return () => window.clearTimeout(timer);
  }, [document]);

  return (
    <main className="technique-shell">
      <section className="workbench" aria-label="Technique builder">
        <div className="controls">
          <div className="brandline">
            <p className="eyebrow">Single Technique</p>
            <h1>{document?.title ?? 'Technique Builder'}</h1>
            <a className="text-link" href="/">
              Technique collection
            </a>
          </div>

          <div className="control-grid">
            <SelectField
              id="technique"
              label="Technique"
              value={pendingSettings.technique}
              options={techniqueOptions}
              onChange={(value) => updateSetting('technique', value)}
            />
            <SelectField
              id="key"
              label="Key"
              value={pendingSettings.key}
              options={keyOptions}
              onChange={(value) => updateSetting('key', value)}
            />
            {pendingSettings.technique === TECHNIQUE_TYPES.SCALE && (
              <SelectField
                id="scaleType"
                label="Scale"
                value={pendingSettings.scaleType}
                options={SCALE_OPTIONS}
                onChange={(value) => updateSetting('scaleType', value)}
              />
            )}
            {pendingSettings.technique === TECHNIQUE_TYPES.TRIAD && (
              <SelectField
                id="triadQuality"
                label="Triad"
                value={pendingSettings.triadQuality}
                options={TRIAD_OPTIONS}
                onChange={(value) => updateSetting('triadQuality', value)}
              />
            )}
            {pendingSettings.technique === TECHNIQUE_TYPES.SEVENTH && (
              <SelectField
                id="seventhQuality"
                label="7th Chord"
                value={pendingSettings.seventhQuality}
                options={SEVENTH_OPTIONS}
                onChange={(value) => updateSetting('seventhQuality', value)}
              />
            )}
            {pendingSettings.technique === TECHNIQUE_TYPES.ARPEGGIO && (
              <SelectField
                id="arpeggioQuality"
                label="Arpeggio"
                value={pendingSettings.arpeggioQuality}
                options={ARPEGGIO_OPTIONS}
                onChange={(value) => updateSetting('arpeggioQuality', value)}
              />
            )}
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
            {pendingSettings.technique === TECHNIQUE_TYPES.SCALE && (
              <SelectField
                id="octaves"
                label="Octaves"
                value={pendingSettings.octaves}
                options={octaveOptions}
                onChange={(value) => updateSetting('octaves', Number(value))}
              />
            )}
          </div>

          <div className="toggles">
            <ToggleField
              id="fingerings"
              label="Fingerings"
              checked={pendingSettings.showFingerings}
              onChange={(value) => updateSetting('showFingerings', value)}
            />
          </div>

          <div className="action-row">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!hasPendingChanges}
            >
              {committedSettings === null ? 'Generate' : 'Regenerate'}
            </button>
          </div>
        </div>

        <div className="score-pane" aria-live="polite">
          <div className="score-toolbar">
            <span>{committedSettings === null ? 'Not generated' : isRendering ? 'Rendering with Typst' : 'Ready'}</span>
            <span>Scorify + Typst WASM</span>
          </div>
          {committedSettings === null && (
            <div className="score-output">
              <div className="score-placeholder">Configure your settings and click Generate.</div>
            </div>
          )}
          {committedSettings !== null && error && (
            <pre className="error-output">{error}</pre>
          )}
          {committedSettings !== null && !error && (
            <div
              className={`score-output${isRendering ? ' is-rendering' : ''}`}
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          )}
        </div>
      </section>
    </main>
  );
}
