import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ARPEGGIO_PRESENTATION,
  CHORD_PRESENTATION,
  DEFAULT_COLLECTION_SETTINGS,
  DIRECTIONS,
  DISPLAY_SIZE_OPTIONS,
  DURATION_OPTIONS,
  FOUR_NOTE_CHORD_OPTIONS,
  HANDS,
  KEY_OPTIONS,
  KEY_ORDERS,
  RENDER_MODES,
  SCALE_OPTIONS,
  TRIAD_OPTIONS,
  SEVENTH_OPTIONS,
  ARPEGGIO_OPTIONS,
  TECHNIQUE_TYPES,
  buildTechniqueCollectionDocument,
  collectionEntriesForSettings,
} from '../utilities/techniqueGenerator.js';
import {
  buildRcmPresetSettings,
  isRcmPreset,
  RCM_PRESET_OPTIONS,
} from '../utilities/rcmPresets.js';
import { renderTypstSvgBatch, warmTypstRenderer } from '../utilities/typstRenderer.js';

// ─── Constants ───

const PRESETS = {
  BEGINNER: 'template:beginner',
  INTERMEDIATE: 'template:intermediate',
  ADVANCED: 'template:advanced',
  CUSTOM: 'custom',
};

const templatePresetOptions = [
  { value: PRESETS.BEGINNER, label: 'Beginner' },
  { value: PRESETS.INTERMEDIATE, label: 'Intermediate' },
  { value: PRESETS.ADVANCED, label: 'Advanced' },
];

const handOptions = [
  { value: HANDS.RIGHT, label: 'Right Hand' },
  { value: HANDS.LEFT, label: 'Left Hand' },
  { value: HANDS.SEPARATE, label: 'Hands Separate' },
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
  { value: CHORD_PRESENTATION.SOLID_WITH_REST, label: 'Solid with quarter rest' },
];

const arpeggioPresentationOptions = [
  { value: ARPEGGIO_PRESENTATION.ROOT_ONLY, label: 'Root only' },
  { value: ARPEGGIO_PRESENTATION.ROOT_AND_INVERSIONS, label: 'Root and inversions' },
];

const octaveOptions = [
  { value: 1, label: '1 octave' },
  { value: 2, label: '2 octaves' },
];

const MAX_RESULT_CACHE_ENTRIES = 200;

// Keys up to 2 sharps/flats for beginner
const BEGINNER_MAJOR_KEYS = new Set(['C', 'G', 'F', 'D', 'Bb']);
const BEGINNER_MINOR_KEYS = new Set(['A', 'E', 'D', 'B', 'G']);

// Keys up to 5 sharps/flats for intermediate
const INTERMEDIATE_MAJOR_KEYS = new Set(['C', 'G', 'F', 'D', 'Bb', 'A', 'Eb', 'E', 'Ab', 'B', 'Db']);
const INTERMEDIATE_MINOR_KEYS = new Set(['A', 'E', 'D', 'B', 'G', 'F#', 'C', 'C#', 'F', 'G#', 'Bb']);

function presetToSettings(preset, shared) {
  const base = {
    ...DEFAULT_COLLECTION_SETTINGS,
    ...shared,
  };

  switch (preset) {
    case PRESETS.BEGINNER:
      return {
        ...base,
        title: 'Beginner Technique Collection',
        hand: HANDS.TOGETHER,
        duration: 8,
        octaves: 1,
        includeScales: true,
        includeContraryMotionScales: false,
        includeTriads: true,
        includeFourNoteChords: false,
        includeSevenths: false,
        includeArpeggios: false,
        triadPresentation: CHORD_PRESENTATION.BOTH,
        allowedMajorKeys: BEGINNER_MAJOR_KEYS,
        allowedMinorKeys: BEGINNER_MINOR_KEYS,
        excludeMelodicMinor: true,
      };
    case PRESETS.INTERMEDIATE:
      return {
        ...base,
        title: 'Intermediate Technique Collection',
        includeScales: true,
        includeContraryMotionScales: false,
        includeTriads: true,
        includeFourNoteChords: false,
        includeSevenths: true,
        includeArpeggios: true,
        triadPresentation: CHORD_PRESENTATION.BOTH,
        seventhPresentation: CHORD_PRESENTATION.BOTH,
        arpeggioPresentation: ARPEGGIO_PRESENTATION.ROOT_ONLY,
        allowedMajorKeys: INTERMEDIATE_MAJOR_KEYS,
        allowedMinorKeys: INTERMEDIATE_MINOR_KEYS,
        excludeMelodicMinor: false,
      };
    case PRESETS.ADVANCED:
      return {
        ...base,
        title: 'Advanced Technique Collection',
        includeScales: true,
        includeContraryMotionScales: false,
        includeTriads: true,
        includeFourNoteChords: false,
        includeSevenths: true,
        includeArpeggios: true,
        triadPresentation: CHORD_PRESENTATION.BOTH,
        seventhPresentation: CHORD_PRESENTATION.BOTH,
        arpeggioPresentation: ARPEGGIO_PRESENTATION.ROOT_AND_INVERSIONS,
      };
    default:
      return base;
  }
}

// ─── Icon Components ───

function ChevronIcon({ open }) {
  return (
    <svg
      className={`technique-section-chevron${open ? ' open' : ''}`}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}

function DragIcon() {
  return (
    <svg className="drag-handle" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="5" cy="3" r="1.2" />
      <circle cx="11" cy="3" r="1.2" />
      <circle cx="5" cy="8" r="1.2" />
      <circle cx="11" cy="8" r="1.2" />
      <circle cx="5" cy="13" r="1.2" />
      <circle cx="11" cy="13" r="1.2" />
    </svg>
  );
}

// ─── Reusable Field Components ───

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

const TextField = React.memo(function TextField({ id, label, value, onChange }) {
  return (
    <label className="field field-wide" htmlFor={id}>
      <span>{label}</span>
      <input id={id} value={value} onChange={(event) => onChange(event.target.value)} />
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

// ─── Key Chip Selector ───

const ALL_MAJOR_KEYS = KEY_OPTIONS.filter((k) => k.majorKey).map((k) => k.value);
const ALL_MINOR_KEYS = KEY_OPTIONS.filter((k) => k.minorKey).map((k) => k.value);

const scaleNameOverrides = {
  major: 'Major',
  minor_n: 'Minor Natural',
  minor_h: 'Minor Harmonic',
  minor_m: 'Minor Melodic',
};

function entryOrderLabel(entry) {
  if (entry?.settings?.technique !== TECHNIQUE_TYPES.SCALE) {
    return entry.title;
  }

  const keyLabel = KEY_OPTIONS.find((option) => option.value === entry.settings.key)?.label ?? entry.settings.key;
  const scaleName = scaleNameOverrides[entry.settings.scaleType]
    ?? SCALE_OPTIONS.find((option) => option.value === entry.settings.scaleType)?.label
    ?? 'Scale';

  return `${keyLabel} ${scaleName} Scale`;
}

const KeyChipSelector = React.memo(function KeyChipSelector({ allKeys, selectedKeys, onToggle, onSelectAll, onSelectNone }) {
  return (
    <div>
      <div className="key-chips">
        {allKeys.map((key) => (
          <button
            key={key}
            type="button"
            className={`key-chip${selectedKeys.has(key) ? ' active' : ''}`}
            onClick={() => onToggle(key)}
          >
            {key}
          </button>
        ))}
      </div>
      <div className="key-chip-actions">
        <button type="button" className="key-chip-action" onClick={onSelectAll}>Select All</button>
        <button type="button" className="key-chip-action" onClick={onSelectNone}>Select None</button>
      </div>
    </div>
  );
});

// ─── Technique Section (Custom mode expandable) ───

const CUSTOM_SECTIONS = [
  { id: 'scales', label: 'Scales', settingKey: 'includeScales' },
  { id: 'contraryMotionScales', label: 'Contrary Motion Scales', settingKey: 'includeContraryMotionScales' },
  { id: 'triads', label: 'Triads', settingKey: 'includeTriads' },
  { id: 'fourNoteChords', label: '4 Note Chords', settingKey: 'includeFourNoteChords' },
  { id: 'sevenths', label: '7th Chords', settingKey: 'includeSevenths' },
  { id: 'arpeggios', label: 'Arpeggios', settingKey: 'includeArpeggios' },
  { id: 'seventhArpeggios', label: '7th Chord Arpeggios', settingKey: 'includeSeventhArpeggios' },
];

const SEVENTH_QUALITY_KEY_GROUPS = [
  { value: 'major7', label: 'Major 7th', allKeys: ALL_MAJOR_KEYS },
  { value: 'dominant7', label: 'Dominant 7th', allKeys: ALL_MAJOR_KEYS },
  { value: 'minor7', label: 'Minor 7th', allKeys: ALL_MINOR_KEYS },
  { value: 'halfDiminished7', label: 'Half Diminished 7th', allKeys: ALL_MINOR_KEYS },
  { value: 'diminished7', label: 'Fully Diminished 7th', allKeys: ALL_MINOR_KEYS },
];

function createDefaultSeventhQualityKeySelections() {
  return Object.fromEntries(
    SEVENTH_QUALITY_KEY_GROUPS.map((group) => [group.value, new Set(group.allKeys)]),
  );
}

function sectionCollectionSettings(
  baseSettings,
  sectionId,
  majorKeys,
  minorKeys,
  seventhKeySelections,
) {
  const enabledSettingKey = CUSTOM_SECTIONS.find((section) => section.id === sectionId)?.settingKey;
  return {
    ...baseSettings,
    includeScales: false,
    includeContraryMotionScales: false,
    includeTriads: false,
    includeSevenths: false,
    includeArpeggios: false,
    includeSeventhArpeggios: false,
    allowedMajorKeys: majorKeys,
    allowedMinorKeys: minorKeys,
    allowedSeventhKeysByQuality: sectionId === 'sevenths' ? seventhKeySelections : undefined,
    allowedSeventhArpeggioKeysByQuality: sectionId === 'seventhArpeggios' ? seventhKeySelections : undefined,
    techniqueOrder: [sectionId],
    ...(enabledSettingKey ? { [enabledSettingKey]: true } : {}),
  };
}

function buildCustomPreviewEntries(
  baseSettings,
  sectionOrder,
  customMajorKeys,
  customMinorKeys,
  customSeventhKeysBySection,
) {
  return sectionOrder.flatMap((sectionId) => collectionEntriesForSettings(
    sectionCollectionSettings(
      baseSettings,
      sectionId,
      customMajorKeys[sectionId],
      customMinorKeys[sectionId],
      customSeventhKeysBySection[sectionId],
    ),
  ));
}

function TechniqueSection({
  section,
  enabled,
  expanded,
  onToggle,
  onExpandToggle,
  settings,
  onSettingChange,
  selectedMajorKeys,
  selectedMinorKeys,
  onMajorKeyToggle,
  onMinorKeyToggle,
  onSelectAllMajor,
  onSelectNoneMajor,
  onSelectAllMinor,
  onSelectNoneMinor,
  selectedSeventhKeysByQuality,
  onSeventhQualityKeyToggle,
  onSelectAllSeventhQualityKeys,
  onSelectNoSeventhQualityKeys,
  dragHandlers,
}) {
  return (
    <div
      className={`technique-section${dragHandlers?.isDragging ? ' dragging' : ''}`}
      draggable
      onDragStart={dragHandlers?.onDragStart}
      onDragOver={dragHandlers?.onDragOver}
      onDragEnd={dragHandlers?.onDragEnd}
      onDrop={dragHandlers?.onDrop}
    >
      <div className="technique-section-header">
        <DragIcon />
        <input
          type="checkbox"
          className="technique-section-toggle"
          checked={enabled}
          onChange={(e) => { e.stopPropagation(); onToggle(); }}
        />
        <span className="technique-section-title" onClick={onExpandToggle}>{section.label}</span>
        <span onClick={onExpandToggle}>
          <ChevronIcon open={expanded} />
        </span>
      </div>
      {expanded && (
        <div className="technique-section-body">
          {!['sevenths', 'seventhArpeggios'].includes(section.id) && (
            <>
              <p className="section-label">Major Keys</p>
              <KeyChipSelector
                allKeys={ALL_MAJOR_KEYS}
                selectedKeys={selectedMajorKeys}
                onToggle={onMajorKeyToggle}
                onSelectAll={onSelectAllMajor}
                onSelectNone={onSelectNoneMajor}
              />
              <p className="section-label">Minor Keys</p>
              <KeyChipSelector
                allKeys={ALL_MINOR_KEYS}
                selectedKeys={selectedMinorKeys}
                onToggle={onMinorKeyToggle}
                onSelectAll={onSelectAllMinor}
                onSelectNone={onSelectNoneMinor}
              />
            </>
          )}
          {['sevenths', 'seventhArpeggios'].includes(section.id) && SEVENTH_QUALITY_KEY_GROUPS.map((group) => (
            <div key={group.value}>
              <p className="section-label">{group.label} Keys</p>
              <KeyChipSelector
                allKeys={group.allKeys}
                selectedKeys={selectedSeventhKeysByQuality[group.value]}
                onToggle={(key) => onSeventhQualityKeyToggle(group.value, key)}
                onSelectAll={() => onSelectAllSeventhQualityKeys(group.value)}
                onSelectNone={() => onSelectNoSeventhQualityKeys(group.value)}
              />
            </div>
          ))}
          {section.id === 'triads' && (
            <div className="section-select-row">
              <label>Presentation</label>
              <select
                value={settings.triadPresentation}
                onChange={(e) => onSettingChange('triadPresentation', e.target.value)}
              >
                {chordPresentationOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          )}
          {section.id === 'fourNoteChords' && (
            <div className="section-select-row">
              <label>Presentation</label>
              <select
                value={settings.fourNoteChordPresentation}
                onChange={(e) => onSettingChange('fourNoteChordPresentation', e.target.value)}
              >
                {chordPresentationOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          )}
          {section.id === 'sevenths' && (
            <div className="section-select-row">
              <label>Presentation</label>
              <select
                value={settings.seventhPresentation}
                onChange={(e) => onSettingChange('seventhPresentation', e.target.value)}
              >
                {chordPresentationOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          )}
          {section.id === 'arpeggios' && (
            <div className="section-select-row">
              <label>Presentation</label>
              <select
                value={settings.arpeggioPresentation}
                onChange={(e) => onSettingChange('arpeggioPresentation', e.target.value)}
              >
                {arpeggioPresentationOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          )}
          {section.id === 'seventhArpeggios' && (
            <div className="section-select-row">
              <label>Presentation</label>
              <select
                value={settings.arpeggioPresentation}
                onChange={(e) => onSettingChange('arpeggioPresentation', e.target.value)}
              >
                {arpeggioPresentationOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          )}
          {section.id === 'scales' && (
            <div className="section-select-row">
              <label>Scale octaves</label>
              <select
                value={settings.octaves}
                onChange={(e) => onSettingChange('octaves', Number(e.target.value))}
              >
                {octaveOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Collection Entry (memoized for performance) ───

const CollectionEntry = React.memo(function CollectionEntry({ entry, isRendering }) {
  return (
    <section className="collection-score" aria-label={entry.title}>
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
  );
});

// ─── Main Component ───

export default function TechniqueCollectionBuilder() {
  const [activePreset, setActivePreset] = useState(PRESETS.BEGINNER);
  const [sharedSettings, setSharedSettings] = useState({
    keyOrder: KEY_ORDERS.CHROMATIC,
    renderMode: RENDER_MODES.KEY_SIGNATURE,
    showFingerings: true,
    showDetails: false,
    hand: HANDS.TOGETHER,
    direction: DIRECTIONS.BOTH,
    duration: 8,
    displayScale: 1,
    pairRelativeKeys: false,
    groupByKey: false,
  });
  const [customSettings, setCustomSettings] = useState({
    ...DEFAULT_COLLECTION_SETTINGS,
    includeScales: true,
    includeContraryMotionScales: true,
    includeTriads: true,
    includeFourNoteChords: true,
    includeSevenths: true,
    includeArpeggios: true,
    includeSeventhArpeggios: true,
  });
  const [customSectionOrder, setCustomSectionOrder] = useState(
    CUSTOM_SECTIONS.map((s) => s.id),
  );
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [customMajorKeys, setCustomMajorKeys] = useState({
    scales: new Set(ALL_MAJOR_KEYS),
    contraryMotionScales: new Set(ALL_MAJOR_KEYS),
    triads: new Set(ALL_MAJOR_KEYS),
    fourNoteChords: new Set(ALL_MAJOR_KEYS),
    sevenths: new Set(ALL_MAJOR_KEYS),
    arpeggios: new Set(ALL_MAJOR_KEYS),
    seventhArpeggios: new Set(ALL_MAJOR_KEYS),
  });
  const [customMinorKeys, setCustomMinorKeys] = useState({
    scales: new Set(ALL_MINOR_KEYS),
    contraryMotionScales: new Set(ALL_MINOR_KEYS),
    triads: new Set(ALL_MINOR_KEYS),
    fourNoteChords: new Set(ALL_MINOR_KEYS),
    sevenths: new Set(ALL_MINOR_KEYS),
    arpeggios: new Set(ALL_MINOR_KEYS),
    seventhArpeggios: new Set(ALL_MINOR_KEYS),
  });
  const [customSeventhKeysBySection, setCustomSeventhKeysBySection] = useState({
    sevenths: createDefaultSeventhQualityKeySelections(),
    seventhArpeggios: createDefaultSeventhQualityKeySelections(),
  });

  const [committedSettings, setCommittedSettings] = useState(null);
  const [hasPendingChanges, setHasPendingChanges] = useState(true);
  const [entryResults, setEntryResults] = useState([]);
  const [renderedTechniqueCount, setRenderedTechniqueCount] = useState(0);
  const [isRendering, setIsRendering] = useState(false);
  const renderId = useRef(0);
  const resultCache = useRef(new Map());
  const dragItem = useRef(null);
  const dragEntryItem = useRef(null);
  const [customEntryOrder, setCustomEntryOrder] = useState(null);
  const [showEntryOrder, setShowEntryOrder] = useState(false);
  const isCustomPreset = activePreset === PRESETS.CUSTOM;
  const activeRcmPreset = isRcmPreset(activePreset);

  // Build effective settings from preset + shared
  const pendingSettings = useMemo(() => {
    if (isCustomPreset) {
      return {
        ...DEFAULT_COLLECTION_SETTINGS,
        ...customSettings,
        ...sharedSettings,
        title: customSettings.title || 'Custom Technique Collection',
        techniqueOrder: customSectionOrder,
        allowedSeventhKeysByQuality: customSeventhKeysBySection.sevenths,
        allowedSeventhArpeggioKeysByQuality: customSeventhKeysBySection.seventhArpeggios,
      };
    }

    if (activeRcmPreset) {
      return buildRcmPresetSettings(activePreset, sharedSettings);
    }

    return presetToSettings(activePreset, sharedSettings);
  }, [
    activePreset,
    activeRcmPreset,
    isCustomPreset,
    sharedSettings,
    customSettings,
    customSectionOrder,
    customSeventhKeysBySection,
  ]);

  // Preview entries for custom mode entry reordering
  const previewEntries = useMemo(() => {
    if (!isCustomPreset) return [];
    const enabledSectionIds = customSectionOrder.filter((sectionId) => {
      const section = CUSTOM_SECTIONS.find((candidate) => candidate.id === sectionId);
      return section ? customSettings[section.settingKey] : false;
    });
    return buildCustomPreviewEntries(
      pendingSettings,
      enabledSectionIds,
      customMajorKeys,
      customMinorKeys,
      customSeventhKeysBySection,
    );
  }, [
    isCustomPreset,
    pendingSettings,
    customSectionOrder,
    customSettings,
    customMajorKeys,
    customMinorKeys,
    customSeventhKeysBySection,
  ]);

  // Reset entry order when the set of entries changes
  const entryFingerprint = useMemo(
    () => previewEntries.map((e) => e.title).join('\n'),
    [previewEntries],
  );
  const prevEntryFingerprint = useRef(entryFingerprint);
  useEffect(() => {
    if (entryFingerprint !== prevEntryFingerprint.current) {
      setCustomEntryOrder(null);
      prevEntryFingerprint.current = entryFingerprint;
    }
  }, [entryFingerprint]);

  // Ordered preview entries for display
  const orderedPreviewEntries = useMemo(() => {
    if (!customEntryOrder) return previewEntries.map((e, i) => ({ ...e, originalIndex: i }));
    return customEntryOrder.map((i) => ({ ...previewEntries[i], originalIndex: i }));
  }, [previewEntries, customEntryOrder]);

  const document = useMemo(
    () => committedSettings ? buildTechniqueCollectionDocument(committedSettings) : null,
    [committedSettings],
  );

  const updateShared = useCallback((key, value) => {
    setSharedSettings((c) => ({ ...c, [key]: value }));
    setHasPendingChanges(true);
  }, []);

  const updateCustom = useCallback((key, value) => {
    setCustomSettings((c) => ({ ...c, [key]: value }));
    setHasPendingChanges(true);
  }, []);

  const handlePresetChange = useCallback((preset) => {
    setActivePreset(preset);
    setHasPendingChanges(true);
  }, []);

  const handleGenerate = useCallback(() => {
    if (isCustomPreset) {
      const customEntries = customEntryOrder
        ? customEntryOrder.map((i) => previewEntries[i])
        : previewEntries;
      setCommittedSettings({ ...pendingSettings, customEntries });
    } else {
      setCommittedSettings(pendingSettings);
    }
    setHasPendingChanges(false);
  }, [pendingSettings, isCustomPreset, customEntryOrder, previewEntries]);

  const exportTypst = useCallback(() => {
    if (!document) return;
    const blob = new Blob([document.source], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = `${document.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'technique-collection'}.typ`;
    link.click();
    window.URL.revokeObjectURL(url);
  }, [document]);

  // Drag handlers
  const handleDragStart = useCallback((e, sectionId) => {
    dragItem.current = sectionId;
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e, targetId) => {
    e.preventDefault();
    const sourceId = dragItem.current;
    if (!sourceId || sourceId === targetId) return;
    setCustomSectionOrder((order) => {
      const next = [...order];
      const fromIndex = next.indexOf(sourceId);
      const toIndex = next.indexOf(targetId);
      if (fromIndex === -1 || toIndex === -1) return order;
      next.splice(fromIndex, 1);
      next.splice(toIndex, 0, sourceId);
      return next;
    });
    setHasPendingChanges(true);
  }, []);

  const handleDragEnd = useCallback(() => {
    dragItem.current = null;
  }, []);

  // Entry-level drag handlers for custom mode
  const handleEntryDragStart = useCallback((e, index) => {
    dragEntryItem.current = index;
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleEntryDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleEntryDrop = useCallback((e, targetIndex) => {
    e.preventDefault();
    const sourceIndex = dragEntryItem.current;
    if (sourceIndex === null || sourceIndex === targetIndex) return;
    setCustomEntryOrder((current) => {
      const order = current ?? previewEntries.map((_, i) => i);
      const next = [...order];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    setHasPendingChanges(true);
  }, [previewEntries]);

  const handleEntryDragEnd = useCallback(() => {
    dragEntryItem.current = null;
  }, []);

  const resetEntryOrder = useCallback(() => {
    setCustomEntryOrder(null);
    setHasPendingChanges(true);
  }, []);

  // Key toggling for custom mode  
  const toggleMajorKey = useCallback((sectionId, key) => {
    setCustomMajorKeys((c) => {
      const next = new Set(c[sectionId]);
      if (next.has(key)) next.delete(key); else next.add(key);
      return { ...c, [sectionId]: next };
    });
    setHasPendingChanges(true);
  }, []);

  const toggleMinorKey = useCallback((sectionId, key) => {
    setCustomMinorKeys((c) => {
      const next = new Set(c[sectionId]);
      if (next.has(key)) next.delete(key); else next.add(key);
      return { ...c, [sectionId]: next };
    });
    setHasPendingChanges(true);
  }, []);

  const selectAllMajor = useCallback((sectionId) => {
    setCustomMajorKeys((c) => ({ ...c, [sectionId]: new Set(ALL_MAJOR_KEYS) }));
    setHasPendingChanges(true);
  }, []);

  const selectNoneMajor = useCallback((sectionId) => {
    setCustomMajorKeys((c) => ({ ...c, [sectionId]: new Set() }));
    setHasPendingChanges(true);
  }, []);

  const selectAllMinor = useCallback((sectionId) => {
    setCustomMinorKeys((c) => ({ ...c, [sectionId]: new Set(ALL_MINOR_KEYS) }));
    setHasPendingChanges(true);
  }, []);

  const selectNoneMinor = useCallback((sectionId) => {
    setCustomMinorKeys((c) => ({ ...c, [sectionId]: new Set() }));
    setHasPendingChanges(true);
  }, []);

  const toggleSeventhQualityKey = useCallback((sectionId, quality, key) => {
    setCustomSeventhKeysBySection((current) => {
      const nextSection = { ...current[sectionId] };
      const nextKeys = new Set(nextSection[quality]);
      if (nextKeys.has(key)) nextKeys.delete(key); else nextKeys.add(key);
      nextSection[quality] = nextKeys;
      return { ...current, [sectionId]: nextSection };
    });
    setHasPendingChanges(true);
  }, []);

  const selectAllSeventhQualityKeys = useCallback((sectionId, quality) => {
    const group = SEVENTH_QUALITY_KEY_GROUPS.find((candidate) => candidate.value === quality);
    if (!group) return;
    setCustomSeventhKeysBySection((current) => ({
      ...current,
      [sectionId]: {
        ...current[sectionId],
        [quality]: new Set(group.allKeys),
      },
    }));
    setHasPendingChanges(true);
  }, []);

  const selectNoSeventhQualityKeys = useCallback((sectionId, quality) => {
    setCustomSeventhKeysBySection((current) => ({
      ...current,
      [sectionId]: {
        ...current[sectionId],
        [quality]: new Set(),
      },
    }));
    setHasPendingChanges(true);
  }, []);

  const toggleExpanded = useCallback((sectionId) => {
    setExpandedSections((c) => {
      const next = new Set(c);
      if (next.has(sectionId)) next.delete(sectionId); else next.add(sectionId);
      return next;
    });
  }, []);

  // Cache management
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
      if (progressTimer) window.clearTimeout(progressTimer);
      abortController.abort();
    };
  }, [document]);

  const completedCount = entryResults.reduce(
    (count, entry) => count + (entry.status === 'pending' ? 0 : entry.techniqueCount ?? 1),
    0,
  );
  const visibleCompletedCount = isRendering ? renderedTechniqueCount : completedCount;
  const totalTechniques = document?.techniqueCount ?? 0;
  const progressPercent = totalTechniques > 0 ? Math.round((visibleCompletedCount / totalTechniques) * 100) : 0;

  const displayTitle = committedSettings
    ? document?.title
    : pendingSettings.title || DEFAULT_COLLECTION_SETTINGS.title;

  const orderedSections = customSectionOrder
    .map((id) => CUSTOM_SECTIONS.find((s) => s.id === id))
    .filter(Boolean);

  return (
    <>
      <nav className="top-navbar">
        <div className="navbar-brand">
          <p className="eyebrow">Technique Collection</p>
          <h1>{displayTitle}</h1>
        </div>

        <div className="navbar-presets">
          <div className="navbar-selectors">
            <label className="navbar-select-group" htmlFor="templatePreset">
              <span>Template</span>
              <div className="navbar-select-shell">
                <select
                  id="templatePreset"
                  className="navbar-select"
                  value={!isCustomPreset && !activeRcmPreset ? activePreset : ''}
                  onChange={(event) => event.target.value && handlePresetChange(event.target.value)}
                >
                  <option value="">Choose template</option>
                  {templatePresetOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <label className="navbar-select-group" htmlFor="rcmPreset">
              <span>RCM</span>
              <div className="navbar-select-shell">
                <select
                  id="rcmPreset"
                  className="navbar-select"
                  value={activeRcmPreset ? activePreset : ''}
                  onChange={(event) => event.target.value && handlePresetChange(event.target.value)}
                >
                  <option value="">Choose level</option>
                  {RCM_PRESET_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <button
              type="button"
              className={`navbar-mode-button${isCustomPreset ? ' active' : ''}`}
              onClick={() => handlePresetChange(PRESETS.CUSTOM)}
            >
              Custom
            </button>
          </div>
        </div>

        <div className="navbar-actions">
          <a className="text-link navbar-link" href="/single-technique">Single technique →</a>
          <button
            type="button"
            className="navbar-generate-btn"
            onClick={handleGenerate}
            disabled={!hasPendingChanges}
          >
            {committedSettings === null ? 'Generate' : 'Regenerate'}
          </button>
        </div>
      </nav>

      <main className="technique-shell">
      <section className="workbench" aria-label="Technique collection generator">
        <div className="controls">
          <div className="controls-inner">
            {activeRcmPreset ? (
              <>
                <p className="section-label">Display</p>
                <div className="control-grid compact-grid">
                  <SelectField
                    id="renderMode"
                    label="Notation"
                    value={sharedSettings.renderMode}
                    options={renderModeOptions}
                    onChange={(v) => updateShared('renderMode', v)}
                  />
                  <SelectField
                    id="displayScale"
                    label="Display size"
                    value={sharedSettings.displayScale}
                    options={DISPLAY_SIZE_OPTIONS}
                    onChange={(v) => updateShared('displayScale', Number(v))}
                  />
                </div>

                <div className="toggles">
                  <ToggleField
                    id="fingerings"
                    label="Fingerings"
                    checked={sharedSettings.showFingerings}
                    onChange={(v) => updateShared('showFingerings', v)}
                  />
                  <ToggleField
                    id="showDetails"
                    label="Show details"
                    checked={sharedSettings.showDetails}
                    onChange={(v) => updateShared('showDetails', v)}
                  />
                </div>
              </>
            ) : (
              <>
                <p className="section-label">Settings</p>
                <div className="control-grid">
                  <SelectField
                    id="keyOrder"
                    label="Key order"
                    value={sharedSettings.keyOrder}
                    options={keyOrderOptions}
                    onChange={(v) => updateShared('keyOrder', v)}
                  />
                  <SelectField
                    id="renderMode"
                    label="Notation"
                    value={sharedSettings.renderMode}
                    options={renderModeOptions}
                    onChange={(v) => updateShared('renderMode', v)}
                  />
                  <SelectField
                    id="hand"
                    label="Hand"
                    value={sharedSettings.hand}
                    options={handOptions}
                    onChange={(v) => updateShared('hand', v)}
                  />
                  <SelectField
                    id="direction"
                    label="Direction"
                    value={sharedSettings.direction}
                    options={directionOptions}
                    onChange={(v) => updateShared('direction', v)}
                  />
                  <SelectField
                    id="duration"
                    label="Duration"
                    value={sharedSettings.duration}
                    options={DURATION_OPTIONS}
                    onChange={(v) => updateShared('duration', Number(v))}
                  />
                  <SelectField
                    id="displayScale"
                    label="Display size"
                    value={sharedSettings.displayScale}
                    options={DISPLAY_SIZE_OPTIONS}
                    onChange={(v) => updateShared('displayScale', Number(v))}
                  />
                </div>

                <div className="toggles">
                  <ToggleField
                    id="fingerings"
                    label="Fingerings"
                    checked={sharedSettings.showFingerings}
                    onChange={(v) => updateShared('showFingerings', v)}
                  />
                  <ToggleField
                    id="showDetails"
                    label="Show details"
                    checked={sharedSettings.showDetails}
                    onChange={(v) => updateShared('showDetails', v)}
                  />
                  <ToggleField
                    id="pairRelativeKeys"
                    label="Pair relative keys"
                    checked={sharedSettings.pairRelativeKeys}
                    onChange={(v) => updateShared('pairRelativeKeys', v)}
                  />
                  <ToggleField
                    id="groupByKey"
                    label="Group by key"
                    checked={sharedSettings.groupByKey}
                    onChange={(v) => updateShared('groupByKey', v)}
                  />
                </div>
              </>
            )}

            {/* Custom Mode: Title + Technique Sections */}
            {isCustomPreset && (
              <>
                <hr className="section-divider" />
                <p className="section-label">Collection Title</p>
                <TextField
                  id="collectionTitle"
                  label="Title"
                  value={customSettings.title || ''}
                  onChange={(v) => updateCustom('title', v)}
                />
                <p className="section-label">Techniques</p>
                {orderedSections.map((section) => (
                  <TechniqueSection
                    key={section.id}
                    section={section}
                    enabled={customSettings[section.settingKey]}
                    expanded={expandedSections.has(section.id)}
                    onToggle={() => {
                      updateCustom(section.settingKey, !customSettings[section.settingKey]);
                    }}
                    onExpandToggle={() => toggleExpanded(section.id)}
                    settings={customSettings}
                    onSettingChange={updateCustom}
                    selectedMajorKeys={customMajorKeys[section.id]}
                    selectedMinorKeys={customMinorKeys[section.id]}
                    onMajorKeyToggle={(key) => toggleMajorKey(section.id, key)}
                    onMinorKeyToggle={(key) => toggleMinorKey(section.id, key)}
                    onSelectAllMajor={() => selectAllMajor(section.id)}
                    onSelectNoneMajor={() => selectNoneMajor(section.id)}
                    onSelectAllMinor={() => selectAllMinor(section.id)}
                    onSelectNoneMinor={() => selectNoneMinor(section.id)}
                    selectedSeventhKeysByQuality={customSeventhKeysBySection[section.id] ?? createDefaultSeventhQualityKeySelections()}
                    onSeventhQualityKeyToggle={(quality, key) => toggleSeventhQualityKey(section.id, quality, key)}
                    onSelectAllSeventhQualityKeys={(quality) => selectAllSeventhQualityKeys(section.id, quality)}
                    onSelectNoSeventhQualityKeys={(quality) => selectNoSeventhQualityKeys(section.id, quality)}
                    dragHandlers={{
                      onDragStart: (e) => handleDragStart(e, section.id),
                      onDragOver: handleDragOver,
                      onDrop: (e) => handleDrop(e, section.id),
                      onDragEnd: handleDragEnd,
                      isDragging: dragItem.current === section.id,
                    }}
                  />
                ))}

                {/* Entry-level reordering */}
                {previewEntries.length > 0 && (
                  <>
                    <div className="entry-order-header">
                      <span
                        className="section-label entry-order-toggle"
                        onClick={() => setShowEntryOrder((v) => !v)}
                      >
                        Technique Order ({previewEntries.length})
                        <ChevronIcon open={showEntryOrder} />
                      </span>
                      {customEntryOrder && (
                        <button
                          type="button"
                          className="key-chip-action"
                          onClick={resetEntryOrder}
                        >
                          Reset
                        </button>
                      )}
                    </div>
                    {showEntryOrder && (
                      <div className="entry-order-list">
                        {orderedPreviewEntries.map((entry, index) => (
                          <div
                            key={`${entry.title}-${entry.originalIndex}`}
                            className={`entry-order-item${dragEntryItem.current === index ? ' dragging' : ''}`}
                            draggable
                            onDragStart={(e) => handleEntryDragStart(e, index)}
                            onDragOver={handleEntryDragOver}
                            onDrop={(e) => handleEntryDrop(e, index)}
                            onDragEnd={handleEntryDragEnd}
                          >
                            <DragIcon />
                            <span className="entry-order-index">{index + 1}</span>
                            <span className="entry-order-title">{entryOrderLabel(entry)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* Actions */}
            <div className="action-row">
              <button type="button" onClick={() => window.print()} disabled={isRendering || !committedSettings}>
                Print
              </button>
              <button type="button" onClick={exportTypst} disabled={!committedSettings}>
                Export
              </button>
            </div>
          </div>
        </div>

        <div className="score-pane" aria-live="polite">
          <div className="score-toolbar">
            <span className="render-status">
              {isRendering && <span className="spinner" />}
              {isRendering
                ? `Rendering ${visibleCompletedCount} / ${totalTechniques}`
                : committedSettings
                  ? `${totalTechniques} techniques`
                  : 'Not generated'}
            </span>
            <span>Scorify + Typst WASM</span>
          </div>
          {isRendering && (
            <div className="render-progress">
              <div className="render-progress-bar" style={{ width: `${progressPercent}%` }} />
            </div>
          )}
          {!committedSettings ? (
            <div className="score-output collection-output">
              <p className="empty-output">Choose a template, an RCM level, or custom settings, then click Generate.</p>
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
                <CollectionEntry key={entry.id} entry={entry} isRendering={isRendering} />
              ))}
            </div>
          )}
        </div>
      </section>
      </main>
    </>
  );
}
