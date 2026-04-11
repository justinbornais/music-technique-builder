import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ARPEGGIO_OPTIONS,
  DEFAULT_SETTINGS,
  DIRECTIONS,
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
import { renderTypstSvg } from '../utilities/typstRenderer.js';

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

function NumberField({ id, label, value, min, max, onChange }) {
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
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

export default function TechniqueBuilder() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');
  const [isRendering, setIsRendering] = useState(true);
  const renderId = useRef(0);

  const keyOptions = useMemo(() => getKeyOptionsForSettings(settings), [
    settings.technique,
    settings.scaleType,
  ]);
  const document = useMemo(() => buildTechniqueDocument(settings), [settings]);

  function updateSetting(key, value) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  }

  useEffect(() => {
    if (keyOptions.some((option) => option.value === settings.key)) return;
    updateSetting('key', keyOptions[0]?.value ?? DEFAULT_SETTINGS.key);
  }, [keyOptions, settings.key]);

  useEffect(() => {
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
  }, [document.source]);

  return (
    <main className="technique-shell">
      <section className="workbench" aria-label="Technique builder">
        <div className="controls">
          <div className="brandline">
            <p className="eyebrow">Technique Builder</p>
            <h1>{document.title}</h1>
          </div>

          <div className="control-grid">
            <SelectField
              id="technique"
              label="Technique"
              value={settings.technique}
              options={techniqueOptions}
              onChange={(value) => updateSetting('technique', value)}
            />
            <SelectField
              id="key"
              label="Key"
              value={settings.key}
              options={keyOptions}
              onChange={(value) => updateSetting('key', value)}
            />
            {settings.technique === TECHNIQUE_TYPES.SCALE && (
              <SelectField
                id="scaleType"
                label="Scale"
                value={settings.scaleType}
                options={SCALE_OPTIONS}
                onChange={(value) => updateSetting('scaleType', value)}
              />
            )}
            {settings.technique === TECHNIQUE_TYPES.TRIAD && (
              <SelectField
                id="triadQuality"
                label="Triad"
                value={settings.triadQuality}
                options={TRIAD_OPTIONS}
                onChange={(value) => updateSetting('triadQuality', value)}
              />
            )}
            {settings.technique === TECHNIQUE_TYPES.SEVENTH && (
              <SelectField
                id="seventhQuality"
                label="7th Chord"
                value={settings.seventhQuality}
                options={SEVENTH_OPTIONS}
                onChange={(value) => updateSetting('seventhQuality', value)}
              />
            )}
            {settings.technique === TECHNIQUE_TYPES.ARPEGGIO && (
              <SelectField
                id="arpeggioQuality"
                label="Arpeggio"
                value={settings.arpeggioQuality}
                options={ARPEGGIO_OPTIONS}
                onChange={(value) => updateSetting('arpeggioQuality', value)}
              />
            )}
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
            <NumberField
              id="octaves"
              label="Octaves"
              min={1}
              max={4}
              value={settings.octaves}
              onChange={(value) => updateSetting('octaves', Math.min(4, Math.max(1, value)))}
            />
          </div>

          <div className="toggles">
            <ToggleField
              id="fingerings"
              label="Fingerings"
              checked={settings.showFingerings}
              onChange={(value) => updateSetting('showFingerings', value)}
            />
          </div>
        </div>

        <div className="score-pane" aria-live="polite">
          <div className="score-toolbar">
            <span>{isRendering ? 'Rendering with Typst' : 'Ready'}</span>
            <span>Scorify + Typst WASM</span>
          </div>
          {error && (
            <pre className="error-output">{error}</pre>
          )}
          {!error && (
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
