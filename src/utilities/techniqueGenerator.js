import {
  accidentals,
  getScaleNotes,
  noteName,
  scaleDirection,
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
  TRIAD: 'triad',
  SEVENTH: 'seventh',
  ARPEGGIO: 'arpeggio',
};

export const HANDS = {
  RIGHT: 'right',
  LEFT: 'left',
  TOGETHER: 'together',
};

export const DIRECTIONS = {
  UP: 'up',
  DOWN: 'down',
  BOTH: 'both',
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

export const SEVENTH_OPTIONS = [
  { value: 'major7', label: 'Major 7th', intervals: [0, 4, 7, 11] },
  { value: 'dominant7', label: 'Dominant 7th', intervals: [0, 4, 7, 10] },
  { value: 'minor7', label: 'Minor 7th', intervals: [0, 3, 7, 10] },
  { value: 'halfDiminished7', label: 'Half-diminished 7th', intervals: [0, 3, 6, 10] },
  { value: 'diminished7', label: 'Diminished 7th', intervals: [0, 3, 6, 9] },
];

export const ARPEGGIO_OPTIONS = [
  ...TRIAD_OPTIONS.map((option) => ({
    ...option,
    value: `triad-${option.value}`,
    label: `${option.label} Triad`,
    chordSize: 3,
  })),
  ...SEVENTH_OPTIONS.map((option) => ({
    ...option,
    value: `seventh-${option.value}`,
    label: option.label,
    chordSize: 4,
  })),
];

export const DURATION_OPTIONS = [
  { value: 2, label: 'Half notes' },
  { value: 4, label: 'Quarter notes' },
  { value: 8, label: 'Eighth notes' },
  { value: 16, label: 'Sixteenth notes' },
];

// Fill this section with the finished fingering rules as you settle them.
// The generator reads these values today, using conservative defaults so the
// page continues to render while the full table is being authored.
export const FINGERING_DEFINITIONS = {
  triads: {
    major: makeTriadFingerings(),
    minor: makeTriadFingerings(),
    diminished: makeTriadFingerings(),
    augmented: makeTriadFingerings(),
  },
  seventhChords: {
    major7: makeSeventhChordFingerings(),
    dominant7: makeSeventhChordFingerings(),
    minor7: makeSeventhChordFingerings(),
    halfDiminished7: makeSeventhChordFingerings(),
    diminished7: makeSeventhChordFingerings(),
  },
  triadArpeggios: {
    major: makeTriadArpeggioFingerings(),
    minor: makeTriadArpeggioFingerings(),
    diminished: makeTriadArpeggioFingerings(),
    augmented: makeTriadArpeggioFingerings(),
  },
  seventhArpeggios: {
    major7: makeSeventhArpeggioFingerings(),
    dominant7: makeSeventhArpeggioFingerings(),
    minor7: makeSeventhArpeggioFingerings(),
    halfDiminished7: makeSeventhArpeggioFingerings(),
    diminished7: makeSeventhArpeggioFingerings(),
  },
};

export const DEFAULT_SETTINGS = {
  technique: TECHNIQUE_TYPES.SCALE,
  key: 'C',
  scaleType: scaleTypes.MAJOR,
  triadQuality: 'major',
  seventhQuality: 'dominant7',
  arpeggioQuality: 'triad-major',
  hand: HANDS.RIGHT,
  octaves: 2,
  duration: 8,
  direction: DIRECTIONS.BOTH,
  renderMode: RENDER_MODES.KEY_SIGNATURE,
  showFingerings: true,
};

const HAND_CONFIG = {
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

const pcFromNoteIndex = (index) => (index - 3 + 12) % 12;
const noteIndexFromPc = (pc) => (pc + 3) % 12;

function pitchFromNote(index, octave) {
  return octave * 12 + pcFromNoteIndex(index);
}

function noteFromPitch(pitch) {
  const pc = ((pitch % 12) + 12) % 12;
  return {
    index: noteIndexFromPc(pc),
    octave: Math.floor(pitch / 12),
  };
}

const LEFT_HAND_TREBLE_MIN_PITCH = pitchFromNote(5, 4);
const SCALE_CLEF_CHANGE_GROUP_SIZE = 4;
const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const LETTER_BASE_INDEX = {
  A: 0,
  B: 2,
  C: 3,
  D: 5,
  E: 7,
  F: 8,
  G: 10,
};
const KEY_SIGNATURE_COUNTS = {
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
const KEY_SIGNATURE_SHARP_ORDER = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
const KEY_SIGNATURE_FLAT_ORDER = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];

function makeTriadFingerings() {
  return {
    right: {
      rootPosition: [1, 3, 5],
      firstInversion: [1, 2, 5],
      secondInversion: [1, 3, 5],
    },
    left: {
      rootPosition: [5, 3, 1],
      firstInversion: [5, 3, 1],
      secondInversion: [5, 2, 1],
    },
  };
}

function makeSeventhChordFingerings() {
  return {
    right: {
      rootPosition: [1, 2, 3, 5],
      firstInversion: [1, 2, 3, 5],
      secondInversion: [1, 2, 3, 5],
      thirdInversion: [1, 2, 3, 5],
    },
    left: {
      rootPosition: [5, 3, 2, 1],
      firstInversion: [5, 3, 2, 1],
      secondInversion: [5, 3, 2, 1],
      thirdInversion: [5, 3, 2, 1],
    },
  };
}

function makeTriadArpeggioFingerings() {
  return {
    right: {
      withoutInversions: { pattern: [1, 2, 3], finalRoot: 5 },
      withInversions: {
        rootPosition: { pattern: [1, 2, 3], finalRoot: 5 },
        firstInversion: { pattern: [1, 2, 4], finalRoot: 5 },
        secondInversion: { pattern: [1, 3, 5], finalRoot: 5 },
      },
    },
    left: {
      withoutInversions: { pattern: [5, 3, 2], finalRoot: 1 },
      withInversions: {
        rootPosition: { pattern: [5, 3, 2], finalRoot: 1 },
        firstInversion: { pattern: [5, 3, 1], finalRoot: 1 },
        secondInversion: { pattern: [5, 2, 1], finalRoot: 1 },
      },
    },
  };
}

function makeSeventhArpeggioFingerings() {
  return {
    right: {
      withoutInversions: { pattern: [1, 2, 3, 4], finalRoot: 5 },
      withInversions: {
        rootPosition: { pattern: [1, 2, 3, 4], finalRoot: 5 },
        firstInversion: { pattern: [1, 2, 3, 5], finalRoot: 5 },
        secondInversion: { pattern: [1, 2, 4, 5], finalRoot: 5 },
        thirdInversion: { pattern: [1, 2, 3, 5], finalRoot: 5 },
      },
    },
    left: {
      withoutInversions: { pattern: [5, 4, 3, 2], finalRoot: 1 },
      withInversions: {
        rootPosition: { pattern: [5, 4, 3, 2], finalRoot: 1 },
        firstInversion: { pattern: [5, 3, 2, 1], finalRoot: 1 },
        secondInversion: { pattern: [5, 4, 2, 1], finalRoot: 1 },
        thirdInversion: { pattern: [5, 3, 2, 1], finalRoot: 1 },
      },
    },
  };
}

function getOption(options, value) {
  return options.find((option) => option.value === value) ?? options[0];
}

function isMinorScale(scaleType) {
  return scaleType !== scaleTypes.MAJOR;
}

export function getKeyOptionsForSettings(settings) {
  if (settings.technique !== TECHNIQUE_TYPES.SCALE) {
    return KEY_OPTIONS;
  }

  const isMinor = isMinorScale(settings.scaleType);
  return KEY_OPTIONS.filter((option) => (isMinor ? option.minorKey : option.majorKey));
}

function selectedKeyOption(settings) {
  const options = getKeyOptionsForSettings(settings);
  return options.find((option) => option.value === settings.key) ?? options[0] ?? KEY_OPTIONS[0];
}

function selectedRoot(settings) {
  return selectedKeyOption(settings).index;
}

function selectedSpelling(settings) {
  return selectedKeyOption(settings).spelling;
}

function shouldUseKeySignature(settings) {
  return settings.renderMode === RENDER_MODES.KEY_SIGNATURE;
}

function getScaleDirection(direction) {
  if (direction === DIRECTIONS.UP) return scaleDirection.ASCENDING;
  if (direction === DIRECTIONS.DOWN) return scaleDirection.DESCENDING;
  return scaleDirection.BOTH;
}

function typstEscape(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function typstString(value) {
  return `"${typstEscape(value)}"`;
}

function formatDuration(duration) {
  return Number(duration) || 8;
}

function finalScaleDuration(duration) {
  return Math.min(formatDuration(duration), 4);
}

function formatAccidental(note) {
  const accidental = note.slice(1);
  return accidental
    .replace(/x/g, '##')
    .replace(/#/g, '#')
    .replace(/bb/g, '&&')
    .replace(/b/g, '&');
}

function keySignatureAccidentals(key) {
  const count = KEY_SIGNATURE_COUNTS[key] ?? 0;
  const accidentalsByLetter = {};

  if (count > 0) {
    KEY_SIGNATURE_SHARP_ORDER.slice(0, count).forEach((letter) => {
      accidentalsByLetter[letter] = 1;
    });
  } else if (count < 0) {
    KEY_SIGNATURE_FLAT_ORDER.slice(0, Math.abs(count)).forEach((letter) => {
      accidentalsByLetter[letter] = -1;
    });
  }

  return accidentalsByLetter;
}

function pitchOffsetForLetter(index, letter) {
  let offset = index - LETTER_BASE_INDEX[letter];
  while (offset > 6) offset -= 12;
  while (offset < -6) offset += 12;
  return offset;
}

function accidentalTokenForOffset(offset) {
  if (offset === 2) return '##';
  if (offset === 1) return '#';
  if (offset === 0) return '=';
  if (offset === -1) return '&';
  if (offset === -2) return '&&';
  return '';
}

function accidentalForKeySignature(index, letter, keySignature) {
  const actualOffset = pitchOffsetForLetter(index, letter);
  const signatureOffset = keySignature[letter] ?? 0;
  return actualOffset === signatureOffset ? '' : accidentalTokenForOffset(actualOffset);
}

function formatNoteName(index, octave, spelling, baseOctave) {
  const named = noteName(index, spelling);
  const letter = named.charAt(0).toLowerCase();
  const accidental = formatAccidental(named);
  const octaveShift = octave - baseOctave;
  const octaveMarks =
    octaveShift > 0 ? "'".repeat(octaveShift) : ','.repeat(Math.abs(octaveShift));

  return `${letter}${accidental}${octaveMarks}`;
}

function formatLetterName(letter, octave, baseOctave, accidental = '') {
  const octaveShift = octave - baseOctave;
  const octaveMarks =
    octaveShift > 0 ? "'".repeat(octaveShift) : ','.repeat(Math.abs(octaveShift));

  return `${letter.toLowerCase()}${accidental}${octaveMarks}`;
}

function formatNoteTokenName(note, context) {
  if (note.letter) {
    return formatLetterName(note.letter, note.octave, context.baseOctave, note.accidental);
  }

  return formatNoteName(note.index, note.octave, context.spelling, context.baseOctave);
}

function formatFingering(fingering, position, showFingerings) {
  if (!showFingerings || fingering == null) return '';
  const values = Array.isArray(fingering) ? fingering : [fingering];
  const body = values.join(' ');
  return position === 'below' ? `n_[${body}]` : `n[${body}]`;
}

function noteToken(note, context) {
  const duration = formatDuration(note.duration ?? context.duration);
  const name = formatNoteTokenName(note, context);
  const fingering = formatFingering(
    note.fingering,
    context.fingeringPosition,
    context.showFingerings,
  );

  return `${name}${duration}${fingering}`;
}

function chordToken(notes, fingering, context) {
  const names = notes.map((note) => formatNoteTokenName(note, context));
  const fingers = formatFingering(fingering, context.fingeringPosition, context.showFingerings);
  return `<${names.join(' ')}>${formatDuration(context.duration)}${fingers}`;
}

function withDirection(items, direction) {
  if (direction === DIRECTIONS.DOWN) {
    return [...items].reverse();
  }

  if (direction === DIRECTIONS.BOTH) {
    return [...items, ...[...items].reverse().slice(1)];
  }

  return items;
}

function scaleLettersForSettings(settings, keyOption) {
  const tonicLetter = keyOption.value.charAt(0).toUpperCase();
  const start = LETTERS.indexOf(tonicLetter);
  const ascendingLength = Number(settings.octaves) * 7 + 1;
  const ascending = Array.from(
    { length: ascendingLength },
    (_, index) => LETTERS[(start + index) % LETTERS.length],
  );

  return withDirection(ascending, settings.direction);
}

function parseLegacyScaleNote(note) {
  const [name, octave] = note.split('/');
  const normalized = name.replace(/b/g, '&');

  return {
    name: normalized,
    octave: Number(octave),
  };
}

function scaleNoteToPitch(note) {
  const parsed = parseLegacyScaleNote(note);
  const letter = parsed.name.charAt(0).toUpperCase();
  const baseByLetter = {
    A: 0,
    B: 2,
    C: 3,
    D: 5,
    E: 7,
    F: 8,
    G: 10,
  };

  let index = baseByLetter[letter] ?? 3;
  const accidental = parsed.name.slice(1);
  for (const char of accidental) {
    if (char === '#') index += 1;
    if (char === '&') index -= 1;
    if (char === 'x') index += 2;
  }

  let octave = parsed.octave;
  while (index < 0) {
    index += 12;
  }
  while (index > 11) {
    index -= 12;
  }

  return { index, octave };
}

function pitchForNote(note) {
  return pitchFromNote(note.index, note.octave);
}

function pitchForChord(chord) {
  return Math.max(...chord.map(pitchForNote));
}

function clefForLeftHandPitch(pitch) {
  return pitch >= LEFT_HAND_TREBLE_MIN_PITCH ? 'treble' : 'bass';
}

function contextForClef(context, clef) {
  return {
    ...context,
    baseOctave: clef === 'treble' ? HAND_CONFIG[HANDS.RIGHT].baseOctave : HAND_CONFIG[HANDS.LEFT].baseOctave,
  };
}

function musicLine(tokens) {
  return tokens.join(' ');
}

function roundedClefBoundaries(items, pitchForItem, groupSize) {
  const boundaries = new Map();
  let activeClef = 'bass';

  items.forEach((item, index) => {
    const nextClef = clefForLeftHandPitch(pitchForItem(item));
    if (nextClef === activeClef) return;

    let boundary = Math.round(index / groupSize) * groupSize;
    boundary = Math.max(groupSize, Math.min(items.length - groupSize, boundary));

    if (boundary > 0 && boundary < items.length) {
      boundaries.set(boundary, nextClef);
      activeClef = nextClef;
    }
  });

  return boundaries;
}

function tokensWithLeftHandClefs(items, context, tokenForItem, pitchForItem, options = {}) {
  if (context.clef !== 'bass') {
    return items.map((item) => tokenForItem(item, context));
  }

  const tokens = [];
  let activeClef = 'bass';
  const roundedBoundaries = options.roundToGroupSize
    ? roundedClefBoundaries(items, pitchForItem, options.roundToGroupSize)
    : null;

  items.forEach((item, index) => {
    const nextClef = roundedBoundaries
      ? roundedBoundaries.get(index) ?? activeClef
      : clefForLeftHandPitch(pitchForItem(item));
    if (nextClef !== activeClef) {
      tokens.push(nextClef);
      activeClef = nextClef;
    }

    tokens.push(tokenForItem(item, contextForClef(context, activeClef)));
  });

  return tokens;
}

function handKey(hand) {
  return hand === HANDS.RIGHT ? 'right' : 'left';
}

function inversionName(position, chordSize) {
  const inversion = position % chordSize;
  if (inversion === 1) return 'firstInversion';
  if (inversion === 2) return 'secondInversion';
  if (inversion === 3) return 'thirdInversion';
  return 'rootPosition';
}

function chordFingering(group, quality, hand, position, chordSize) {
  const definition = FINGERING_DEFINITIONS[group]?.[quality]?.[handKey(hand)];
  const named = definition?.[inversionName(position, chordSize)];
  if (named) return named;

  return hand === HANDS.RIGHT
    ? chordSize === 4
      ? [1, 2, 3, 5]
      : [1, 3, 5]
    : chordSize === 4
      ? [5, 3, 2, 1]
      : [5, 3, 1];
}

function arpeggioFingering(option, hand) {
  const group = option.chordSize === 4 ? 'seventhArpeggios' : 'triadArpeggios';
  const quality = option.value.replace(/^(triad|seventh)-/, '');
  const definition = FINGERING_DEFINITIONS[group]?.[quality]?.[handKey(hand)]?.withoutInversions;
  if (definition) return definition;

  return {
    pattern: option.chordSize === 4
      ? hand === HANDS.RIGHT
        ? [1, 2, 3, 4]
        : [5, 4, 3, 2]
      : hand === HANDS.RIGHT
        ? [1, 2, 3]
        : [5, 3, 2],
    finalRoot: hand === HANDS.RIGHT ? 5 : 1,
  };
}

function scaleMusicForHand(settings, hand) {
  const handConfig = HAND_CONFIG[hand];
  const keyOption = selectedKeyOption(settings);
  const spelling = selectedSpelling(settings);
  const notes = getScaleNotes(
    keyOption.index,
    settings.scaleType,
    hand === HANDS.RIGHT,
    Number(settings.octaves),
    spelling,
    shouldUseKeySignature(settings),
    false,
    getScaleDirection(settings.direction),
  );

  const context = {
    ...handConfig,
    spelling,
    duration: Number(settings.duration),
    showFingerings: settings.showFingerings,
  };
  const useKeySignature = shouldUseKeySignature(settings);
  const diatonicLetters = useKeySignature
    ? scaleLettersForSettings(settings, keyOption)
    : [];
  const signatureAccidentals = useKeySignature
    ? keySignatureAccidentals(keyForSettings(settings))
    : {};

  const scaleNotes = notes.map((note, index) => {
    const parsed = scaleNoteToPitch(note.note);
    const letter = diatonicLetters[index];
    return {
      ...parsed,
      letter,
      accidental: letter ? accidentalForKeySignature(parsed.index, letter, signatureAccidentals) : '',
      fingering: note.fingering,
      duration: index === notes.length - 1
        ? finalScaleDuration(settings.duration)
        : formatDuration(settings.duration),
    };
  });
  const tokens = tokensWithLeftHandClefs(
    scaleNotes,
    context,
    (note, activeContext) => noteToken(note, activeContext),
    pitchForNote,
    { roundToGroupSize: SCALE_CLEF_CHANGE_GROUP_SIZE },
  );

  return musicLine(tokens);
}

function buildChordPitches(root, intervals, rootOctave, octaves, includeFinalRoot = false) {
  const rootPitch = pitchFromNote(root, rootOctave);
  const pitches = [];

  for (let octave = 0; octave < octaves; octave += 1) {
    intervals.forEach((interval) => pitches.push(rootPitch + octave * 12 + interval));
  }

  if (includeFinalRoot) {
    pitches.push(rootPitch + octaves * 12);
  }

  return pitches.map(noteFromPitch);
}

function arpeggioMusicForHand(settings, hand) {
  const handConfig = HAND_CONFIG[hand];
  const option = getOption(ARPEGGIO_OPTIONS, settings.arpeggioQuality);
  const spelling = selectedSpelling(settings);
  const notes = buildChordPitches(
    selectedRoot(settings),
    option.intervals,
    handConfig.rootOctave,
    Number(settings.octaves),
    true,
  );
  const directed = withDirection(notes, settings.direction);
  const fingering = arpeggioFingering(option, hand);

  const context = {
    ...handConfig,
    spelling,
    duration: Number(settings.duration),
    showFingerings: settings.showFingerings,
  };

  const arpeggioNotes = directed.map((note, index) => {
    const originalIndex = settings.direction === DIRECTIONS.DOWN ? directed.length - index - 1 : index;
    const isFinalRoot = originalIndex === notes.length - 1;
    return {
      ...note,
      fingering: isFinalRoot
        ? fingering.finalRoot
        : fingering.pattern[originalIndex % fingering.pattern.length],
    };
  });
  const tokens = tokensWithLeftHandClefs(
    arpeggioNotes,
    context,
    (note, activeContext) => noteToken(note, activeContext),
    pitchForNote,
  );

  return musicLine(tokens);
}

function inversionChord(rootPitch, intervals, position) {
  const size = intervals.length;
  const octave = Math.floor(position / size);
  const inversion = position % size;
  const lower = intervals.slice(inversion).map((interval) => rootPitch + octave * 12 + interval);
  const upper = intervals.slice(0, inversion).map((interval) => rootPitch + (octave + 1) * 12 + interval);
  return [...lower, ...upper].map(noteFromPitch);
}

function chordMusicForHand(settings, hand, options, quality) {
  const handConfig = HAND_CONFIG[hand];
  const option = getOption(options, quality);
  const spelling = selectedSpelling(settings);
  const rootPitch = pitchFromNote(selectedRoot(settings), handConfig.rootOctave);
  const totalPositions = Number(settings.octaves) * option.intervals.length + 1;
  const chords = Array.from({ length: totalPositions }, (_, index) => ({
    notes: inversionChord(rootPitch, option.intervals, index),
    position: index,
  }));
  const directed = withDirection(chords, settings.direction);
  const context = {
    ...handConfig,
    spelling,
    duration: Number(settings.duration),
    showFingerings: settings.showFingerings,
  };

  const tokens = tokensWithLeftHandClefs(
    directed,
    context,
    (chord, activeContext) => chordToken(
      chord.notes,
      chordFingering(
        option.intervals.length === 4 ? 'seventhChords' : 'triads',
        quality,
        hand,
        chord.position,
        option.intervals.length,
      ),
      activeContext,
    ),
    (chord) => pitchForChord(chord.notes),
  );
  return musicLine(tokens);
}

function musicForHand(settings, hand) {
  if (settings.technique === TECHNIQUE_TYPES.SCALE) {
    return scaleMusicForHand(settings, hand);
  }

  if (settings.technique === TECHNIQUE_TYPES.ARPEGGIO) {
    return arpeggioMusicForHand(settings, hand);
  }

  if (settings.technique === TECHNIQUE_TYPES.SEVENTH) {
    return chordMusicForHand(settings, hand, SEVENTH_OPTIONS, settings.seventhQuality);
  }

  return chordMusicForHand(settings, hand, TRIAD_OPTIONS, settings.triadQuality);
}

function qualityLabel(settings) {
  if (settings.technique === TECHNIQUE_TYPES.SCALE) {
    return getOption(SCALE_OPTIONS, settings.scaleType).label;
  }

  if (settings.technique === TECHNIQUE_TYPES.SEVENTH) {
    return getOption(SEVENTH_OPTIONS, settings.seventhQuality).label;
  }

  if (settings.technique === TECHNIQUE_TYPES.ARPEGGIO) {
    return `${getOption(ARPEGGIO_OPTIONS, settings.arpeggioQuality).label} Arpeggio`;
  }

  return `${getOption(TRIAD_OPTIONS, settings.triadQuality).label} Triads`;
}

function techniqueLabel(settings) {
  const root = selectedKeyOption(settings).label;
  return `${root} ${qualityLabel(settings)}`;
}

function keyForSettings(settings) {
  if (!shouldUseKeySignature(settings)) {
    return 'C';
  }

  const keyOption = selectedKeyOption(settings);
  if (settings.technique === TECHNIQUE_TYPES.SCALE && isMinorScale(settings.scaleType)) {
    return keyOption.minorKey ?? 'C';
  }

  return keyOption.majorKey ?? 'C';
}

function stavesForSettings(settings) {
  const hands = settings.hand === HANDS.TOGETHER ? [HANDS.RIGHT, HANDS.LEFT] : [settings.hand];

  return hands.map((hand) => {
    const config = HAND_CONFIG[hand];
    return {
      clef: config.clef,
      music: musicForHand(settings, hand),
      fingeringPosition: config.fingeringPosition,
    };
  });
}

function formatTypstStaves(staves) {
  return staves
    .map((staff) => `(
      clef: ${typstString(staff.clef)},
      fingering-position: ${typstString(staff.fingeringPosition)},
      music: ${typstString(staff.music)},
    )`)
    .join(',\n');
}

export function buildTechniqueDocument(settings) {
  const staves = stavesForSettings(settings);
  const title = techniqueLabel(settings);
  const handLabel = settings.hand === HANDS.TOGETHER
    ? 'Hands together'
    : settings.hand === HANDS.RIGHT
      ? 'Right hand'
      : 'Left hand';
  const subtitle = `${handLabel} | ${settings.octaves} octave${Number(settings.octaves) === 1 ? '' : 's'} | ${
    getOption(DURATION_OPTIONS, Number(settings.duration)).label
  }`;
  const key = keyForSettings(settings);

  return {
    title,
    source: `#import "scorify/lib.typ": score

#set page(width: 255mm, height: auto, margin: 7mm)
#set text(size: 10pt)

#score(
  title: ${typstString(title)},
  subtitle: ${typstString(subtitle)},
  key: ${typstString(key)},
  staff-group: ${typstString(staves.length > 1 ? 'grand' : 'none')},
  staff-size: 1.7mm,
  staff-spacing: 9mm,
  system-spacing: 9mm,
  width: 235mm,
  measure-numbers: "none",
  staves: (
${formatTypstStaves(staves)},
  ),
)`,
  };
}
