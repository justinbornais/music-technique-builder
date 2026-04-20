import {
  accidentals,
  scaleTypes,
} from './noteConversions.js';

const SHARP = accidentals.SHARP;
const FLAT = accidentals.PREFER_FLAT;
const NATURAL = accidentals.NATURAL;

export const RENDER_MODES = {
  KEY_SIGNATURE: 'key-signature',
  ACCIDENTALS: 'accidentals',
};

export const KEY_OPTIONS = [
  { value: 'C', label: 'C', index: 3, spelling: NATURAL, majorKey: 'C', minorKey: 'c' },
  { value: 'C#', label: 'C#', index: 4, spelling: SHARP, majorKey: 'C#', minorKey: 'c#' },
  { value: 'Db', label: 'Db', index: 4, spelling: FLAT, majorKey: 'Db', minorKey: null },
  { value: 'D', label: 'D', index: 5, spelling: NATURAL, majorKey: 'D', minorKey: 'd' },
  { value: 'D#', label: 'D#', index: 6, spelling: SHARP, majorKey: null, minorKey: 'd#' },
  { value: 'Eb', label: 'Eb', index: 6, spelling: FLAT, majorKey: 'Eb', minorKey: 'eb' },
  { value: 'E', label: 'E', index: 7, spelling: NATURAL, majorKey: 'E', minorKey: 'e' },
  { value: 'F', label: 'F', index: 8, spelling: NATURAL, majorKey: 'F', minorKey: 'f' },
  { value: 'F#', label: 'F#', index: 9, spelling: SHARP, majorKey: 'F#', minorKey: 'f#' },
  { value: 'Gb', label: 'Gb', index: 9, spelling: FLAT, majorKey: 'Gb', minorKey: null },
  { value: 'G', label: 'G', index: 10, spelling: NATURAL, majorKey: 'G', minorKey: 'g' },
  { value: 'G#', label: 'G#', index: 11, spelling: SHARP, majorKey: null, minorKey: 'g#' },
  { value: 'Ab', label: 'Ab', index: 11, spelling: FLAT, majorKey: 'Ab', minorKey: 'ab' },
  { value: 'A', label: 'A', index: 0, spelling: NATURAL, majorKey: 'A', minorKey: 'a' },
  { value: 'A#', label: 'A#', index: 1, spelling: SHARP, majorKey: null, minorKey: 'a#' },
  { value: 'Bb', label: 'Bb', index: 1, spelling: FLAT, majorKey: 'Bb', minorKey: 'bb' },
  { value: 'B', label: 'B', index: 2, spelling: NATURAL, majorKey: 'B', minorKey: 'b' },
  { value: 'Cb', label: 'Cb', index: 2, spelling: FLAT, majorKey: 'Cb', minorKey: null },
];

export const TECHNIQUE_TYPES = {
  SCALE: 'scale',
  CONTRARY_MOTION_SCALE: 'contrary-motion-scale',
  CHROMATIC: 'chromatic',
  TRIAD: 'triad',
  FOUR_NOTE_CHORD: 'four-note-chord',
  SEVENTH: 'seventh',
  ARPEGGIO: 'arpeggio',
};

export const HANDS = {
  RIGHT: 'right',
  LEFT: 'left',
  SEPARATE: 'separate',
  TOGETHER: 'together',
};

export const DIRECTIONS = {
  UP: 'up',
  DOWN: 'down',
  BOTH: 'both',
};

export const KEY_ORDERS = {
  CHROMATIC: 'chromatic',
  FIFTHS: 'fifths',
  ACCIDENTALS: 'accidentals',
};

export const CHORD_PRESENTATION = {
  SOLID: 'solid',
  BROKEN: 'broken',
  BOTH: 'both',
  SOLID_WITH_REST: 'solid-with-rest',
};

export const ARPEGGIO_PRESENTATION = {
  ROOT_ONLY: 'root-only',
  ROOT_AND_INVERSIONS: 'root-and-inversions',
};

export const SCALE_OPTIONS = [
  { value: scaleTypes.MAJOR, label: 'Major' },
  { value: scaleTypes.MINOR_N, label: 'Natural Minor' },
  { value: scaleTypes.MINOR_H, label: 'Harmonic Minor' },
  { value: scaleTypes.MINOR_M, label: 'Melodic Minor' },
];

export const TRIAD_OPTIONS = [
  { value: 'major', label: 'Major', intervals: [0, 4, 7] },
  { value: 'minor', label: 'Minor', intervals: [0, 3, 7] },
  { value: 'diminished', label: 'Diminished', intervals: [0, 3, 6] },
  { value: 'augmented', label: 'Augmented', intervals: [0, 4, 8] },
];

export const FOUR_NOTE_CHORD_OPTIONS = TRIAD_OPTIONS;

export const SEVENTH_OPTIONS = [
  { value: 'major7', label: 'Major 7th', intervals: [0, 4, 7, 11] },
  { value: 'dominant7', label: 'Dominant 7th', intervals: [0, 4, 7, 10] },
  { value: 'minor7', label: 'Minor 7th', intervals: [0, 3, 7, 10] },
  { value: 'halfDiminished7', label: 'Half-diminished 7th', intervals: [0, 3, 6, 10] },
  { value: 'diminished7', label: 'Diminished 7th', intervals: [0, 3, 6, 9] },
];

function arpeggioOption(group, option) {
  return {
    ...option,
    value: `${group}-${option.value}`,
    label: group === 'triad' ? `${option.label} Triad` : option.label,
    chordSize: group === 'triad' ? 3 : 4,
  };
}

const TRIAD_ARPEGGIO_OPTIONS = TRIAD_OPTIONS.map((option) => arpeggioOption('triad', option));
const SEVENTH_ARPEGGIO_OPTIONS = SEVENTH_OPTIONS.map((option) => arpeggioOption('seventh', option));
export const ALL_ARPEGGIO_OPTIONS = [
  ...TRIAD_ARPEGGIO_OPTIONS,
  ...SEVENTH_ARPEGGIO_OPTIONS,
];

export const ARPEGGIO_OPTIONS = [
  TRIAD_ARPEGGIO_OPTIONS[0],
  TRIAD_ARPEGGIO_OPTIONS[1],
  ...SEVENTH_ARPEGGIO_OPTIONS,
  // TODO: Implement diminished triad arpeggios before re-enabling.
  // TRIAD_ARPEGGIO_OPTIONS[2],
  // TODO: Implement augmented triad arpeggios before re-enabling.
  // TRIAD_ARPEGGIO_OPTIONS[3],
];

export const DURATION_OPTIONS = [
  { value: 2, label: 'Half notes' },
  { value: 4, label: 'Quarter notes' },
  { value: 8, label: 'Eighth notes' },
  { value: 16, label: 'Sixteenth notes' },
];

const DEFAULT_STAFF_SIZE_MM = 1.7;
export const TECHNIQUES_PER_RENDER_DOCUMENT = 1;
export const DOUBLE_BARLINE_SEPARATOR = ' || ';
export const DEFAULT_TECHNIQUE_ORDER = ['scales', 'contraryMotionScales', 'triads', 'fourNoteChords', 'sevenths', 'arpeggios', 'seventhArpeggios'];

export const DISPLAY_SIZE_OPTIONS = [
  { value: 1, label: 'Default', staffSizeMm: DEFAULT_STAFF_SIZE_MM },
  { value: 1.25, label: '25% larger', staffSizeMm: DEFAULT_STAFF_SIZE_MM * 1.25 },
  { value: 1.5, label: '50% larger', staffSizeMm: DEFAULT_STAFF_SIZE_MM * 1.5 },
];

export const DEFAULT_SETTINGS = {
  technique: TECHNIQUE_TYPES.SCALE,
  key: 'C',
  scaleType: scaleTypes.MAJOR,
  triadQuality: 'major',
  fourNoteChordQuality: 'major',
  seventhQuality: 'dominant7',
  arpeggioQuality: 'triad-major',
  hand: HANDS.RIGHT,
  octaves: 2,
  duration: 8,
  direction: DIRECTIONS.BOTH,
  renderMode: RENDER_MODES.KEY_SIGNATURE,
  displayScale: 1,
  showFingerings: true,
};

export const DEFAULT_COLLECTION_SETTINGS = {
  title: 'Technique Collection',
  hand: HANDS.RIGHT,
  octaves: 2,
  duration: 8,
  direction: DIRECTIONS.BOTH,
  renderMode: RENDER_MODES.KEY_SIGNATURE,
  displayScale: 1,
  showFingerings: true,
  showDetails: false,
  keyOrder: KEY_ORDERS.CHROMATIC,
  pairRelativeKeys: false,
  groupByKey: false,
  includeScales: true,
  includeContraryMotionScales: false,
  includeTriads: false,
  includeFourNoteChords: false,
  includeSevenths: false,
  includeArpeggios: false,
  includeSeventhArpeggios: false,
  triadPresentation: CHORD_PRESENTATION.BOTH,
  fourNoteChordPresentation: CHORD_PRESENTATION.BOTH,
  seventhPresentation: CHORD_PRESENTATION.BOTH,
  arpeggioPresentation: ARPEGGIO_PRESENTATION.ROOT_ONLY,
};

export const HAND_CONFIG = {
  [HANDS.RIGHT]: {
    clef: 'treble',
    baseOctave: 4,
    rootOctave: 4,
    fingeringPosition: 'above',
  },
  [HANDS.LEFT]: {
    clef: 'bass',
    baseOctave: 3,
    rootOctave: 3,
    fingeringPosition: 'below',
  },
};

export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
export const LETTER_BASE_INDEX = {
  A: 0,
  B: 2,
  C: 3,
  D: 5,
  E: 7,
  F: 8,
  G: 10,
};
export const KEY_SIGNATURE_COUNTS = {
  C: 0,
  G: 1,
  D: 2,
  A: 3,
  E: 4,
  B: 5,
  'F#': 6,
  'C#': 7,
  F: -1,
  Bb: -2,
  Eb: -3,
  Ab: -4,
  Db: -5,
  Gb: -6,
  Cb: -7,
  a: 0,
  e: 1,
  b: 2,
  'f#': 3,
  'c#': 4,
  'g#': 5,
  'd#': 6,
  'a#': 7,
  d: -1,
  g: -2,
  c: -3,
  f: -4,
  bb: -5,
  eb: -6,
  ab: -7,
};
export const KEY_SIGNATURE_SHARP_ORDER = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
export const KEY_SIGNATURE_FLAT_ORDER = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];

// Each entry pairs a major key with its relative minor in chromatic root order.
export const CHROMATIC_KEY_PAIRS = [
  { major: 'C',  minor: 'A'  },
  { major: 'C#', minor: 'A#' },
  { major: 'Db', minor: 'Bb' },
  { major: 'D',  minor: 'B'  },
  { major: 'Eb', minor: 'C'  },
  { major: 'E',  minor: 'C#' },
  { major: 'F',  minor: 'D'  },
  { major: 'F#', minor: 'D#' },
  { major: 'Gb', minor: 'Eb' },
  { major: 'G',  minor: 'E'  },
  { major: 'Ab', minor: 'F'  },
  { major: 'A',  minor: 'F#' },
  { major: 'Bb', minor: 'G'  },
  { major: 'B',  minor: 'G#' },
  { major: 'Cb', minor: 'Ab' },
];

// Circle of fifths: each major key followed by its relative minor (0 acc → 7#/7b).
export const FIFTHS_KEY_PAIRS = [
  { major: 'C',  minor: 'A'  },
  { major: 'G',  minor: 'E'  },
  { major: 'D',  minor: 'B'  },
  { major: 'A',  minor: 'F#' },
  { major: 'E',  minor: 'C#' },
  { major: 'B',  minor: 'G#' },
  { major: 'F#', minor: 'D#' },
  { major: 'C#', minor: 'A#' },
  { major: 'F',  minor: 'D'  },
  { major: 'Bb', minor: 'G'  },
  { major: 'Eb', minor: 'C'  },
  { major: 'Ab', minor: 'F'  },
  { major: 'Db', minor: 'Bb' },
  { major: 'Gb', minor: 'Eb' },
  { major: 'Cb', minor: 'Ab' },
];

// Least to most accidentals: C (0), then alternating 1#/1b, 2#/2b, …, 7#/7b.
export const ACCIDENTALS_KEY_PAIRS = [
  { major: 'C',  minor: 'A'  },
  { major: 'G',  minor: 'E'  },
  { major: 'F',  minor: 'D'  },
  { major: 'D',  minor: 'B'  },
  { major: 'Bb', minor: 'G'  },
  { major: 'A',  minor: 'F#' },
  { major: 'Eb', minor: 'C'  },
  { major: 'E',  minor: 'C#' },
  { major: 'Ab', minor: 'F'  },
  { major: 'B',  minor: 'G#' },
  { major: 'Db', minor: 'Bb' },
  { major: 'F#', minor: 'D#' },
  { major: 'Gb', minor: 'Eb' },
  { major: 'C#', minor: 'A#' },
  { major: 'Cb', minor: 'Ab' },
];
