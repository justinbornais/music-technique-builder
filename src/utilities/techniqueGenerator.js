import { getScaleNotes, scaleDirection, scaleTypes } from './noteConversions.js';
import {
  ALL_ARPEGGIO_OPTIONS,
  ARPEGGIO_OPTIONS,
  ARPEGGIO_PRESENTATION,
  CHORD_PRESENTATION,
  CHROMATIC_KEY_PAIRS,
  FIFTHS_KEY_PAIRS,
  ACCIDENTALS_KEY_PAIRS,
  DEFAULT_SETTINGS,
  DEFAULT_TECHNIQUE_ORDER,
  DIRECTIONS,
  DISPLAY_SIZE_OPTIONS,
  DOUBLE_BARLINE_SEPARATOR,
  DURATION_OPTIONS,
  FOUR_NOTE_CHORD_OPTIONS,
  HAND_CONFIG,
  HANDS,
  KEY_OPTIONS,
  KEY_ORDERS,
  LETTER_BASE_INDEX,
  LETTERS,
  RENDER_MODES,
  SCALE_OPTIONS,
  SEVENTH_OPTIONS,
  TECHNIQUE_TYPES,
  TECHNIQUES_PER_RENDER_DOCUMENT,
  TRIAD_OPTIONS,
} from './techniqueDefinitions.js';
import { FINGERING_DEFINITIONS, makeArpeggioFingerings } from './fingeringDefinitions.js';
import {
  typstString,
  typstContent,
  typstDocument,
  formatDuration,
  solidChordDuration,
  finalScaleDuration,
  finalArpeggioDuration,
  noteToken,
  chordToken,
  musicLine,
  formatTypstStaves,
  keySignatureAccidentals,
  accidentalForKeySignature,
  accidentalForWrittenPitch,
} from './typstConversion.js';

// Re-export definitions so existing imports from this module continue to work.
export * from './techniqueDefinitions.js';
export { FINGERING_DEFINITIONS } from './fingeringDefinitions.js';

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
const RIGHT_HAND_8VA_MIN_PITCH = pitchFromNote(10, 6);
const SCALE_CLEF_CHANGE_GROUP_SIZE = 4;
const CONTRARY_MOTION_TOP_ASCENDING_SEGMENT_INDEX = 3;
const CONTRARY_MOTION_RIGHT_SEGMENTS = [
  DIRECTIONS.UP,
  DIRECTIONS.UP,
  DIRECTIONS.DOWN,
  DIRECTIONS.UP,
  DIRECTIONS.DOWN,
  DIRECTIONS.UP,
  DIRECTIONS.DOWN,
  DIRECTIONS.DOWN,
];
const CONTRARY_MOTION_LEFT_SEGMENTS = [
  DIRECTIONS.UP,
  DIRECTIONS.DOWN,
  DIRECTIONS.UP,
  DIRECTIONS.UP,
  DIRECTIONS.DOWN,
  DIRECTIONS.DOWN,
  DIRECTIONS.UP,
  DIRECTIONS.DOWN,
];

// ─── Chromatic scale helpers ───

// Ascending chromatic spellings: black keys use sharps
const ASCENDING_CHROMATIC_SPELLINGS = [
  { letter: 'C', accidental: '' },
  { letter: 'C', accidental: '#' },
  { letter: 'D', accidental: '' },
  { letter: 'D', accidental: '#' },
  { letter: 'E', accidental: '' },
  { letter: 'F', accidental: '' },
  { letter: 'F', accidental: '#' },
  { letter: 'G', accidental: '' },
  { letter: 'G', accidental: '#' },
  { letter: 'A', accidental: '' },
  { letter: 'A', accidental: '#' },
  { letter: 'B', accidental: '' },
];

// Descending chromatic spellings: black keys use flats
const DESCENDING_CHROMATIC_SPELLINGS = [
  { letter: 'C', accidental: '' },
  { letter: 'D', accidental: '&' },
  { letter: 'D', accidental: '' },
  { letter: 'E', accidental: '&' },
  { letter: 'E', accidental: '' },
  { letter: 'F', accidental: '' },
  { letter: 'G', accidental: '&' },
  { letter: 'G', accidental: '' },
  { letter: 'A', accidental: '&' },
  { letter: 'A', accidental: '' },
  { letter: 'B', accidental: '&' },
  { letter: 'B', accidental: '' },
];

// Pitch classes that correspond to black keys (C=0)
const CHROMATIC_BLACK_KEY_PCS = new Set([1, 3, 6, 8, 10]);

/**
 * Return the fingering for one note in a chromatic scale.
 * - Black keys always get finger 3.
 * - At white-white adjacencies (E→F, B→C ascending; F→E, C→B descending)
 *   RH uses "1 2" and LH uses "2 1" for the pair.
 * - All other white keys get finger 1.
 */
function chromaticFingeringForNote(pc, prevPc, nextPc, rh, ascending) {
  if (CHROMATIC_BLACK_KEY_PCS.has(pc)) return 3;

  if (ascending) {
    // Second of white-white pair: F following E, or C following B
    if ((prevPc === 4 && pc === 5) || (prevPc === 11 && pc === 0)) return rh ? 2 : 1;
    // First of white-white pair: E before F, or B before C
    if ((pc === 4 && nextPc === 5) || (pc === 11 && nextPc === 0)) return rh ? 1 : 2;
  } else {
    // Descending: second of pair is E after F, or B after C
    if ((prevPc === 5 && pc === 4) || (prevPc === 0 && pc === 11)) return rh ? 1 : 2;
    // First of pair descending: F before E, or C before B
    if ((pc === 5 && nextPc === 4) || (pc === 0 && nextPc === 11)) return rh ? 2 : 1;
  }

  return 1;
}

function generateChromaticAscendingNotes(startPc, startOctave, octaves) {
  const notes = [];
  let octave = startOctave;
  for (let step = 0; step <= octaves * 12; step++) {
    const pc = (startPc + step) % 12;
    if (step > 0 && pc === 0) octave += 1;
    const { letter, accidental } = ASCENDING_CHROMATIC_SPELLINGS[pc];
    notes.push({ pc, letter, accidental, octave, pitch: octave * 12 + pc });
  }
  return notes;
}

function generateChromaticDescendingNotes(startPc, startOctave, octaves) {
  const notes = [];
  let octave = startOctave + octaves;
  for (let step = 0; step <= octaves * 12; step++) {
    const pc = ((startPc - step) % 12 + 12) % 12;
    if (step > 0 && pc === 11) octave -= 1;
    const { letter, accidental } = DESCENDING_CHROMATIC_SPELLINGS[pc];
    notes.push({ pc, letter, accidental, octave, pitch: octave * 12 + pc });
  }
  return notes;
}
function getOption(options, value) {
  return options.find((option) => option.value === value) ?? options[0];
}

function getArpeggioOption(value) {
  return getOption(ALL_ARPEGGIO_OPTIONS, value);
}

function arpeggioOptionForSettings(settings) {
  return settings.brokenChord
    ? getArpeggioOption(settings.arpeggioQuality)
    : getOption(ARPEGGIO_OPTIONS, settings.arpeggioQuality);
}

function getOrderedKeyPairs(keyOrder) {
  if (keyOrder === KEY_ORDERS.FIFTHS) return FIFTHS_KEY_PAIRS;
  if (keyOrder === KEY_ORDERS.ACCIDENTALS) return ACCIDENTALS_KEY_PAIRS;
  return CHROMATIC_KEY_PAIRS;
}

function optionOrderIndex(option, order, isMinorOrder = false) {
  if (order === KEY_ORDERS.CHROMATIC) {
    return KEY_OPTIONS.findIndex((keyOption) => keyOption.value === option.value);
  }

  const pairs = order === KEY_ORDERS.ACCIDENTALS ? ACCIDENTALS_KEY_PAIRS : FIFTHS_KEY_PAIRS;
  const orderList = isMinorOrder ? pairs.map((p) => p.minor) : pairs.map((p) => p.major);
  const index = orderList.indexOf(option.value);
  return index === -1 ? orderList.length : index;
}

function orderKeyOptions(options, order, isMinorOrder = false) {
  return [...options].sort(
    (a, b) => optionOrderIndex(a, order, isMinorOrder) - optionOrderIndex(b, order, isMinorOrder),
  );
}

function isMinorScale(scaleType) {
  return scaleType !== scaleTypes.MAJOR;
}

function isStandardScaleTechnique(settings) {
  return settings.technique === TECHNIQUE_TYPES.SCALE
    || settings.technique === TECHNIQUE_TYPES.CONTRARY_MOTION_SCALE;
}

function isTwoStaffHandMode(hand) {
  return hand === HANDS.SEPARATE || hand === HANDS.TOGETHER;
}

function handModeForSettings(settings) {
  if (settings.technique === TECHNIQUE_TYPES.CONTRARY_MOTION_SCALE) {
    return settings.hand === HANDS.TOGETHER ? HANDS.TOGETHER : HANDS.SEPARATE;
  }

  return settings.hand;
}

function handsForSettings(settings) {
  const handMode = handModeForSettings(settings);
  return isTwoStaffHandMode(handMode) ? [HANDS.RIGHT, HANDS.LEFT] : [handMode];
}

function staffGroupForSettings(settings, staves) {
  if (staves.length < 2) return 'none';
  return handModeForSettings(settings) === HANDS.TOGETHER ? 'grand' : 'none';
}

export function getKeyOptionsForSettings(settings) {
  if (!isStandardScaleTechnique(settings)) {
    return KEY_OPTIONS;
  }

  const isMinor = isMinorScale(settings.scaleType);
  return KEY_OPTIONS.filter((option) => (isMinor ? option.minorKey : option.majorKey));
}

function selectedKeyOption(settings) {
  const options = getKeyOptionsForSettings(settings);
  return options.find((option) => option.value === settings.key) ?? options[0] ?? KEY_OPTIONS[0];
}

function selectedSpelling(settings) {
  return selectedKeyOption(settings).spelling;
}

function shouldUseKeySignature(settings) {
  if (settings.technique === TECHNIQUE_TYPES.CHROMATIC) return false;
  return settings.renderMode === RENDER_MODES.KEY_SIGNATURE;
}

function usesMinorKeySignature(settings) {
  if (isStandardScaleTechnique(settings)) {
    return isMinorScale(settings.scaleType);
  }

  if (settings.technique === TECHNIQUE_TYPES.TRIAD) {
    return settings.triadQuality === 'minor' || settings.triadQuality === 'diminished';
  }

  if (settings.technique === TECHNIQUE_TYPES.FOUR_NOTE_CHORD) {
    return settings.fourNoteChordQuality === 'minor' || settings.fourNoteChordQuality === 'diminished';
  }

  if (settings.technique === TECHNIQUE_TYPES.SEVENTH) {
    return String(settings.seventhQuality).toLowerCase().includes('minor')
      || String(settings.seventhQuality).toLowerCase().includes('diminished');
  }

  if (settings.technique === TECHNIQUE_TYPES.ARPEGGIO) {
    const quality = String(settings.arpeggioQuality).toLowerCase();
    return quality.includes('minor') || quality.includes('diminished');
  }

  return false;
}

function getScaleDirection(direction) {
  if (direction === DIRECTIONS.UP) return scaleDirection.ASCENDING;
  if (direction === DIRECTIONS.DOWN) return scaleDirection.DESCENDING;
  return scaleDirection.BOTH;
}

function techniqueDuration(settings) {
  if (
    settings.technique === TECHNIQUE_TYPES.TRIAD
    || settings.technique === TECHNIQUE_TYPES.FOUR_NOTE_CHORD
    || settings.technique === TECHNIQUE_TYPES.SEVENTH
  ) {
    return solidChordDuration(settings.duration);
  }

  return formatDuration(settings.duration);
}

function clampScaleOctaves(octaves) {
  return Math.min(2, Math.max(1, Number(octaves) || DEFAULT_SETTINGS.octaves));
}

function effectiveOctaves(settings) {
  if (settings.technique === TECHNIQUE_TYPES.CONTRARY_MOTION_SCALE) {
    return 2;
  }

  if (settings.technique === TECHNIQUE_TYPES.SCALE || settings.technique === TECHNIQUE_TYPES.CHROMATIC) {
    return clampScaleOctaves(settings.octaves);
  }

  if (settings.technique === TECHNIQUE_TYPES.ARPEGGIO) {
    return settings.brokenChord ? 1 : 2;
  }

  return 1;
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
  const ascendingLength = effectiveOctaves(settings) * 7 + 1;
  const ascending = Array.from(
    { length: ascendingLength },
    (_, index) => LETTERS[(start + index) % LETTERS.length],
  );

  return withDirection(ascending, settings.direction);
}

function scaleRootOctaveForKey(keyOption, rootOctave) {
  const tonicLetter = keyOption.value.charAt(0).toUpperCase();
  return ['G', 'A', 'B'].includes(tonicLetter) ? rootOctave - 1 : rootOctave;
}

function triadRootOctaveForKey(keyOption, rootOctave) {
  const tonicLetter = keyOption.value.charAt(0).toUpperCase();
  return ['F', 'G', 'A', 'B'].includes(tonicLetter) ? rootOctave - 1 : rootOctave;
}

function seventhRootOctaveForKey(keyOption, handConfig) {
  const tonicLetter = keyOption.value.charAt(0).toUpperCase();
  if (handConfig.clef === HAND_CONFIG[HANDS.LEFT].clef) {
    return handConfig.rootOctave - 1;
  }

  return ['F', 'G', 'A', 'B'].includes(tonicLetter)
    ? handConfig.rootOctave - 1
    : handConfig.rootOctave;
}

function arpeggioRootOctaveForKey(keyOption, handConfig) {
  const tonicLetter = keyOption.value.charAt(0).toUpperCase();
  if (handConfig.clef !== HAND_CONFIG[HANDS.LEFT].clef) {
    return ['F', 'G', 'A', 'B'].includes(tonicLetter)
      ? handConfig.rootOctave - 1
      : handConfig.rootOctave;
  }

  return ['G', 'A', 'B'].includes(tonicLetter)
    ? handConfig.rootOctave - 2
    : handConfig.rootOctave - 1;
}

function ascendingScaleDiatonicNotes(settings, keyOption, rootOctave) {
  const letters = scaleLettersForSettings(
    {
      ...settings,
      direction: DIRECTIONS.UP,
    },
    keyOption,
  );
  let octave = rootOctave;

  return letters.map((letter, index) => {
    const previous = letters[index - 1];
    if (previous === 'B' && letter === 'C') {
      octave += 1;
    }

    return { letter, octave };
  });
}

function scaleDiatonicNotesForSettings(settings, keyOption, rootOctave) {
  const ascending = ascendingScaleDiatonicNotes(settings, keyOption, rootOctave);
  return withDirection(ascending, settings.direction);
}

function scaleNotesWithMetadata(settings, hand, notes, diatonicNotes, handConfig, useKeySignature, options = {}) {
  const { holdLastNote = true } = options;
  const signatureAccidentals = useKeySignature
    ? keySignatureAccidentals(keyForSettings(settings))
    : {};

  return notes.map((note, index) => {
    const parsed = scaleNoteToPitch(note.note);
    const diatonic = diatonicNotes[index];
    const letter = diatonic?.letter ?? null;
    const forceNatural = isDescendingMelodicMinorNaturalIndex(settings, index);
    return {
      ...parsed,
      octave: diatonic?.octave ?? parsed.octave,
      letter,
      accidental: letter
        ? forceNatural
          ? '='
          : useKeySignature
            ? accidentalForKeySignature(parsed.index, letter, signatureAccidentals)
            : accidentalForWrittenPitch(parsed.index, letter)
        : '',
      fingering: note.fingering,
      duration: index === notes.length - 1
        ? holdLastNote ? finalScaleDuration(settings.duration) : formatDuration(settings.duration)
        : formatDuration(settings.duration),
    };
  });
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
  if (Number.isFinite(note.pitch)) {
    return note.pitch;
  }

  if (note.letter) {
    return pitchFromNote(LETTER_BASE_INDEX[note.letter], note.octave);
  }

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

function roundedClefBoundaries(items, pitchForItem, groupSize) {
  const transitions = [];
  let rawActiveClef = 'bass';

  items.forEach((item, index) => {
    const nextClef = clefForLeftHandPitch(pitchForItem(item));
    if (nextClef === rawActiveClef) return;

    transitions.push({ clef: nextClef, index });
    rawActiveClef = nextClef;
  });

  const boundaries = new Map();
  let previousBoundary = 0;
  const lastBoundary = Math.floor((items.length - 1) / groupSize) * groupSize;
  if (lastBoundary <= 0) {
    return boundaries;
  }

  transitions.forEach(({ clef, index }) => {
    let boundary = Math.round(index / groupSize) * groupSize;
    if (clef === 'bass' && boundary < index) {
      boundary = Math.ceil(index / groupSize) * groupSize;
    }
    if (boundary <= 0) {
      boundary = groupSize;
    }
    boundary = Math.min(lastBoundary, boundary);
    if (boundary <= previousBoundary) {
      boundary = previousBoundary + groupSize;
    }

    if (boundary > 0 && boundary < items.length) {
      boundaries.set(boundary, clef);
      previousBoundary = boundary;
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

function arpeggioInversionName(settings, chordSize) {
  const inversion = Number.isInteger(settings.arpeggioInversion)
    ? settings.arpeggioInversion
    : 0;
  return inversionName(inversion, chordSize);
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

function fallbackArpeggioFingering(option, hand) {
  const group = option.chordSize === 4 ? 'seventhArpeggios' : 'triadArpeggios';
  const quality = option.value.replace(/^(triad|seventh)-/, '');
  const definition = FINGERING_DEFINITIONS[group]?.[quality]?.default?.[handKey(hand)]?.standard;
  if (definition) return definition;

  return option.chordSize === 4
    ? hand === HANDS.RIGHT
      ? makeArpeggioFingerings([1, 2, 3, 4], [1, 2, 3, 4], 5)
      : makeArpeggioFingerings([5, 4, 3, 2], [5, 4, 3, 2], 1)
    : hand === HANDS.RIGHT
      ? makeArpeggioFingerings([1, 2, 3], [1, 2, 3], 5)
      : makeArpeggioFingerings([5, 3, 2], [1, 3, 2], 1);
}

function arpeggioFingeringFromDefinition(definition, hand, inversion) {
  const keyedByInversion = definition?.[inversion]?.[handKey(hand)]?.standard;
  if (keyedByInversion) return keyedByInversion;

  const handDefinition = definition?.[handKey(hand)];
  return handDefinition?.[inversion] ?? handDefinition?.standard;
}

function isDescendingMelodicMinorNaturalIndex(settings, index) {
  if (settings.scaleType !== scaleTypes.MINOR_M) return false;

  if (settings.direction === DIRECTIONS.DOWN) {
    return index % 7 === 1 || index % 7 === 2;
  }

  if (settings.direction === DIRECTIONS.BOTH) {
    const ascendingLength = effectiveOctaves(settings) * 7 + 1;
    const descendingIndex = index - ascendingLength;
    return descendingIndex >= 0 && (descendingIndex % 7 === 0 || descendingIndex % 7 === 1);
  }

  return false;
}

function arpeggioFingeringForKey(option, hand, settings) {
  const group = option.chordSize === 4 ? 'seventhArpeggios' : 'triadArpeggios';
  const quality = option.value.replace(/^(triad|seventh)-/, '');
  const key = selectedKeyOption(settings).value;
  const definitions = FINGERING_DEFINITIONS[group]?.[quality];
  const inversion = arpeggioInversionName(settings, option.chordSize);
  const keyDefinition = arpeggioFingeringFromDefinition(definitions?.keys?.[key], hand, inversion);
  if (keyDefinition) return keyDefinition;

  return arpeggioFingeringFromDefinition(definitions?.default, hand, inversion)
    ?? fallbackArpeggioFingering(option, hand);
}

function chordToneLetter(rootLetter, degree) {
  const rootLetterIndex = LETTERS.indexOf(rootLetter);
  return LETTERS[(rootLetterIndex + degree * 2) % LETTERS.length];
}

function chordToneWrittenOctave(rootLetter, rootOctave, degree, positionOctave, wrapsAboveRoot) {
  const rootLetterIndex = LETTERS.indexOf(rootLetter);
  const letterSteps = positionOctave * LETTERS.length
    + degree * 2
    + (wrapsAboveRoot ? LETTERS.length : 0);
  return rootOctave + Math.floor((rootLetterIndex + letterSteps) / LETTERS.length);
}

function spelledInversionChord(rootPitch, intervals, position, rootLetter, rootOctave, settings) {
  const size = intervals.length;
  const positionOctave = Math.floor(position / size);
  const inversion = position % size;
  const useKeySignature = shouldUseKeySignature(settings);
  const signatureAccidentals = useKeySignature
    ? keySignatureAccidentals(keyForSettings(settings))
    : {};
  const degrees = [
    ...Array.from({ length: size - inversion }, (_, index) => inversion + index),
    ...Array.from({ length: inversion }, (_, index) => index),
  ];

  return degrees.map((degree) => {
    const wrapsAboveRoot = degree < inversion;
    const pitch = rootPitch
      + (positionOctave + (wrapsAboveRoot ? 1 : 0)) * 12
      + intervals[degree];
    const sounded = noteFromPitch(pitch);
    const letter = chordToneLetter(rootLetter, degree);
    const octave = chordToneWrittenOctave(
      rootLetter,
      rootOctave,
      degree,
      positionOctave,
      wrapsAboveRoot,
    );

    return {
      ...sounded,
      pitch,
      letter,
      octave,
      accidental: useKeySignature
        ? accidentalForKeySignature(sounded.index, letter, signatureAccidentals)
        : accidentalForWrittenPitch(sounded.index, letter),
    };
  });
}

// For melodic minor, ascending uses raised 6th and 7th; descending reverts to natural minor.
function getScaleNotesForSettings(settings, keyOption, hand, spelling, useKeySignature) {
  const isRightHand = hand === HANDS.RIGHT;
  const octaves = effectiveOctaves(settings);

  if (settings.scaleType === scaleTypes.MINOR_M && settings.direction !== DIRECTIONS.UP) {
    if (settings.direction === DIRECTIONS.DOWN) {
      return getScaleNotes(
        keyOption.index, scaleTypes.MINOR_N, isRightHand,
        octaves, spelling, useKeySignature, false, scaleDirection.DESCENDING,
      );
    }
    // BOTH: ascending melodic minor, then descending natural minor
    const ascNotes = getScaleNotes(
      keyOption.index, scaleTypes.MINOR_M, isRightHand,
      octaves, spelling, useKeySignature, false, scaleDirection.ASCENDING,
    );
    const descNotes = getScaleNotes(
      keyOption.index, scaleTypes.MINOR_N, isRightHand,
      octaves, spelling, useKeySignature, false, scaleDirection.DESCENDING,
    );
    return [...ascNotes, ...descNotes.slice(1)];
  }

  return getScaleNotes(
    keyOption.index, settings.scaleType, isRightHand,
    octaves, spelling, useKeySignature, false, getScaleDirection(settings.direction),
  );
}

function chromaticScaleMusicForHand(settings, hand) {
  const handConfig = HAND_CONFIG[hand];
  const isRightHand = hand === HANDS.RIGHT;
  const keyOption = selectedKeyOption(settings);
  const startPc = pcFromNoteIndex(keyOption.index);
  const startOctave = scaleRootOctaveForKey(keyOption, handConfig.rootOctave);
  const octaves = clampScaleOctaves(settings.octaves);

  const ascRaw = generateChromaticAscendingNotes(startPc, startOctave, octaves);
  const descRaw = generateChromaticDescendingNotes(startPc, startOctave, octaves);

  let notes;
  let isAscMap;

  if (settings.direction === DIRECTIONS.UP) {
    notes = ascRaw;
    isAscMap = notes.map(() => true);
  } else if (settings.direction === DIRECTIONS.DOWN) {
    notes = descRaw;
    isAscMap = notes.map(() => false);
  } else {
    // BOTH: ascending then descending, skip duplicate top note
    notes = [...ascRaw, ...descRaw.slice(1)];
    const ascLen = ascRaw.length;
    isAscMap = notes.map((_, i) => i < ascLen);
  }

  const context = {
    ...handConfig,
    duration: Number(settings.duration),
    showFingerings: settings.showFingerings,
    useKeySignature: false,
  };

  const notesWithMeta = notes.map((note, index) => {
    const prevPc = index > 0 ? notes[index - 1].pc : null;
    const nextPc = index < notes.length - 1 ? notes[index + 1].pc : null;
    const asc = isAscMap[index];
    return {
      ...note,
      fingering: chromaticFingeringForNote(note.pc, prevPc, nextPc, isRightHand, asc),
      duration: index === notes.length - 1
        ? finalScaleDuration(settings.duration)
        : formatDuration(settings.duration),
    };
  });

  const tokens = tokensWithLeftHandClefs(
    notesWithMeta,
    context,
    (note, activeContext) => noteToken(note, activeContext),
    (note) => note.pitch,
    { roundToGroupSize: SCALE_CLEF_CHANGE_GROUP_SIZE },
  );

  return musicLine(tokens);
}

function scaleMusicForHand(settings, hand) {
  const handConfig = HAND_CONFIG[hand];
  const keyOption = selectedKeyOption(settings);
  const spelling = selectedSpelling(settings);
  const useKeySignature = shouldUseKeySignature(settings);
  const notes = getScaleNotesForSettings(settings, keyOption, hand, spelling, useKeySignature);

  const context = {
    ...handConfig,
    spelling,
    duration: Number(settings.duration),
    showFingerings: settings.showFingerings,
    useKeySignature,
  };
  const scaleRootOctave = scaleRootOctaveForKey(keyOption, handConfig.rootOctave);
  const diatonicNotes = scaleDiatonicNotesForSettings(settings, keyOption, scaleRootOctave);
  const scaleNotes = scaleNotesWithMetadata(
    settings,
    hand,
    notes,
    diatonicNotes,
    handConfig,
    useKeySignature,
  );
  const tokens = tokensWithLeftHandClefs(
    scaleNotes,
    context,
    (note, activeContext) => noteToken(note, activeContext),
    pitchForNote,
    { roundToGroupSize: SCALE_CLEF_CHANGE_GROUP_SIZE },
  );

  return musicLine(tokens);
}

function contraryMotionSegmentDirections(hand) {
  return hand === HANDS.RIGHT
    ? CONTRARY_MOTION_RIGHT_SEGMENTS
    : CONTRARY_MOTION_LEFT_SEGMENTS;
}

function contraryMotionLeftHandTokens(scaleNotes, context) {
  const trebleIndexes = scaleNotes
    .map((note, index) => (clefForLeftHandPitch(pitchForNote(note)) === 'treble' ? index : -1))
    .filter((index) => index >= 0);

  if (trebleIndexes.length === 0) {
    return scaleNotes.map((note) => noteToken(note, context));
  }

  const firstTrebleIndex = trebleIndexes[0];
  const lastTrebleIndex = trebleIndexes[trebleIndexes.length - 1];
  const switchToTrebleIndex = Math.floor(firstTrebleIndex / SCALE_CLEF_CHANGE_GROUP_SIZE)
    * SCALE_CLEF_CHANGE_GROUP_SIZE;
  const switchBackToBassIndex = Math.min(
    scaleNotes.length,
    Math.ceil((lastTrebleIndex + 1) / SCALE_CLEF_CHANGE_GROUP_SIZE) * SCALE_CLEF_CHANGE_GROUP_SIZE,
  );
  const tokens = [];
  let activeClef = 'bass';

  scaleNotes.forEach((note, index) => {
    if (index === switchToTrebleIndex && activeClef !== 'treble') {
      tokens.push('treble');
      activeClef = 'treble';
    }
    if (index === switchBackToBassIndex && activeClef !== 'bass') {
      tokens.push('bass');
      activeClef = 'bass';
    }

    tokens.push(noteToken(note, contextForClef(context, activeClef)));
  });

  return tokens;
}

function contraryMotionScaleMusicForHand(settings, hand) {
  const handConfig = HAND_CONFIG[hand];
  const keyOption = selectedKeyOption(settings);
  const spelling = selectedSpelling(settings);
  const useKeySignature = shouldUseKeySignature(settings);
  const baseRootOctave = scaleRootOctaveForKey(keyOption, handConfig.rootOctave);
  const segmentDirections = contraryMotionSegmentDirections(hand);
  const scaleNotes = [];
  let currentTonicOctave = baseRootOctave;

  segmentDirections.forEach((direction, segmentIndex) => {
    const segmentSettings = {
      ...settings,
      technique: TECHNIQUE_TYPES.SCALE,
      octaves: 1,
      direction,
    };
    const segmentRootOctave = direction === DIRECTIONS.UP
      ? currentTonicOctave
      : currentTonicOctave - 1;
    const segmentNotes = getScaleNotesForSettings(
      segmentSettings,
      keyOption,
      hand,
      spelling,
      useKeySignature,
    );
    const segmentDiatonicNotes = scaleDiatonicNotesForSettings(
      segmentSettings,
      keyOption,
      segmentRootOctave,
    );
    const segmentScaleNotes = scaleNotesWithMetadata(
      segmentSettings,
      hand,
      segmentNotes,
      segmentDiatonicNotes,
      handConfig,
      useKeySignature,
      { holdLastNote: false },
    );

    scaleNotes.push(...(segmentIndex === 0
      ? segmentScaleNotes.map((note) => ({ ...note, segmentIndex }))
      : segmentScaleNotes.slice(1).map((note) => ({ ...note, segmentIndex }))));
    currentTonicOctave += direction === DIRECTIONS.UP ? 1 : -1;
  });

  if (scaleNotes.length > 0) {
    scaleNotes[scaleNotes.length - 1] = {
      ...scaleNotes[scaleNotes.length - 1],
      duration: finalScaleDuration(settings.duration),
    };
  }

  const context = {
    ...handConfig,
    spelling,
    duration: Number(settings.duration),
    showFingerings: settings.showFingerings,
    useKeySignature,
  };
  const tokens = hand === HANDS.LEFT
    ? contraryMotionLeftHandTokens(scaleNotes, context)
    : scaleNotes.map((note) => noteToken(note, context));

  return musicLine(tokens);
}

function brokenChordGroupsForHand(settings, hand, option) {
  const handConfig = HAND_CONFIG[hand];
  const quality = option.value.replace(/^(triad|seventh)-/, '');
  const fingeringGroup = option.chordSize === 4 ? 'seventhChords' : 'triads';
  const keyOption = selectedKeyOption(settings);
  const rootLetter = keyOption.value.charAt(0).toUpperCase();
  const rootOctave = option.chordSize === 3
    ? triadRootOctaveForKey(keyOption, handConfig.rootOctave)
    : seventhRootOctaveForKey(keyOption, handConfig);
  const rootPitch = pitchFromNote(keyOption.index, rootOctave);
  const positionCount = option.intervals.length + 1;
  const ascending = Array.from({ length: positionCount }, (_, position) => {
    const notes = spelledInversionChord(
      rootPitch,
      option.intervals,
      position,
      rootLetter,
      rootOctave,
      settings,
    );
    const fingering = chordFingering(fingeringGroup, quality, hand, position, option.intervals.length);

    return {
      notes: notes.map((note, index) => ({
        ...note,
        fingering: fingering[index],
      })),
    };
  });
  const descending = [...ascending].reverse().map((group) => ({
    notes: [...group.notes]
      .reverse()
      .map((note) => ({ ...note })),
  }));

  if (settings.direction === DIRECTIONS.UP) return ascending;
  if (settings.direction === DIRECTIONS.DOWN) return descending;
  return [...ascending, ...descending];
}

function brokenTriadClefForGroup(settings, index) {
  const tonicLetter = selectedKeyOption(settings).value.charAt(0).toUpperCase();
  if (!['C', 'D', 'E'].includes(tonicLetter)) return 'bass';

  if (settings.direction === DIRECTIONS.DOWN) {
    return index === 0 ? 'treble' : 'bass';
  }

  if (settings.direction === DIRECTIONS.BOTH) {
    if (index < 3) return 'bass';
    if (index < 5) return 'treble';
    return 'bass';
  }

  return index >= 3 ? 'treble' : 'bass';
}

function brokenTriadTokens(groups, settings, context) {
  if (context.clef !== HAND_CONFIG[HANDS.LEFT].clef) {
    return groups.map((group) => group.notes.map((note) => noteToken(note, context)).join(' '));
  }

  const tokens = [];
  let activeClef = 'bass';

  groups.forEach((group, index) => {
    const nextClef = brokenTriadClefForGroup(settings, index);
    if (nextClef !== activeClef) {
      tokens.push(nextClef);
      activeClef = nextClef;
    }

    const activeContext = contextForClef(context, activeClef);
    tokens.push(group.notes.map((note) => noteToken(note, activeContext)).join(' '));
  });

  return tokens;
}

function brokenTriadMusicForHand(settings, hand, option) {
  const handConfig = HAND_CONFIG[hand];
  const groups = brokenChordGroupsForHand(settings, hand, option);
  const context = {
    ...handConfig,
    spelling: selectedSpelling(settings),
    duration: Number(settings.duration),
    showFingerings: settings.showFingerings,
    useKeySignature: shouldUseKeySignature(settings),
  };
  const tokens = brokenTriadTokens(groups, settings, context);

  return musicLine(tokens, '  ');
}

function brokenSeventhMusicForHand(settings, hand, option) {
  const handConfig = HAND_CONFIG[hand];
  const groups = brokenChordGroupsForHand(settings, hand, option);
  const context = {
    ...handConfig,
    spelling: selectedSpelling(settings),
    duration: Number(settings.duration),
    showFingerings: settings.showFingerings,
    useKeySignature: shouldUseKeySignature(settings),
  };
  const tokens = groups.map((group) => group.notes.map((note) => noteToken(note, context)).join(' '));

  return musicLine(tokens, '  ');
}

function buildFourNoteChordNotes(rootPitch, rootLetter, rootOctave, intervals, position, settings) {
  const triadNotes = spelledInversionChord(
    rootPitch,
    intervals,
    position,
    rootLetter,
    rootOctave,
    settings,
  );
  return [...triadNotes, noteInWrittenOctave(triadNotes[0], 1)];
}

function fourNoteChordGroupsForHand(settings, hand, option) {
  const handConfig = HAND_CONFIG[hand];
  const keyOption = selectedKeyOption(settings);
  const rootLetter = keyOption.value.charAt(0).toUpperCase();
  const rootOctave = triadRootOctaveForKey(keyOption, handConfig.rootOctave);
  const rootPitch = pitchFromNote(keyOption.index, rootOctave);
  const quality = option.value;
  const positionCount = option.intervals.length + 1;

  const ascending = Array.from({ length: positionCount }, (_, position) => {
    const notes = buildFourNoteChordNotes(
      rootPitch,
      rootLetter,
      rootOctave,
      option.intervals,
      position,
      settings,
    );
    const fingering = chordFingering('fourNoteChords', quality, hand, position, 4);

    return {
      notes: notes.map((note, index) => ({
        ...note,
        fingering: fingering[index],
      })),
      position,
    };
  });
  const descending = [...ascending].reverse().map((group) => ({
    ...group,
    notes: [...group.notes].reverse().map((note) => ({ ...note })),
  }));

  if (settings.direction === DIRECTIONS.UP) return ascending;
  if (settings.direction === DIRECTIONS.DOWN) return descending;
  return [...ascending, ...descending];
}

function brokenFourNoteChordMusicForHand(settings, hand, option) {
  const handConfig = HAND_CONFIG[hand];
  const groups = fourNoteChordGroupsForHand(settings, hand, option);
  const context = {
    ...handConfig,
    spelling: selectedSpelling(settings),
    duration: Number(settings.duration),
    showFingerings: settings.showFingerings,
    useKeySignature: shouldUseKeySignature(settings),
  };
  const tokens = brokenTriadTokens(groups, settings, context);

  return musicLine(tokens, '  ');
}

function fourNoteChordMusicForHand(settings, hand) {
  const handConfig = HAND_CONFIG[hand];
  const option = getOption(FOUR_NOTE_CHORD_OPTIONS, settings.fourNoteChordQuality);

  if (settings.brokenChord) {
    return brokenFourNoteChordMusicForHand(settings, hand, option);
  }

  const spelling = selectedSpelling(settings);
  const keyOption = selectedKeyOption(settings);
  const rootOctave = triadRootOctaveForKey(keyOption, handConfig.rootOctave);
  const rootPitch = pitchFromNote(keyOption.index, rootOctave);
  const rootLetter = keyOption.value.charAt(0).toUpperCase();
  const totalPositions = effectiveOctaves(settings) * option.intervals.length + 1;
  const chords = Array.from({ length: totalPositions }, (_, index) => ({
    notes: buildFourNoteChordNotes(
      rootPitch,
      rootLetter,
      rootOctave,
      option.intervals,
      index,
      settings,
    ),
    position: index,
  }));
  const directed = withDirection(chords, settings.direction);
  const context = {
    ...handConfig,
    spelling,
    duration: settings.solidChordRest ? 4 : solidChordDuration(settings.duration),
    showFingerings: settings.showFingerings,
    useKeySignature: shouldUseKeySignature(settings),
  };

  let tokens;
  if (hand === HANDS.LEFT) {
    tokens = directed.map((chord) => chordToken(
      chord.notes,
      chordFingering('fourNoteChords', settings.fourNoteChordQuality, hand, chord.position, 4),
      context,
    ));
  } else {
    tokens = tokensWithLeftHandClefs(
      directed,
      context,
      (chord, activeContext) => chordToken(
        chord.notes,
        chordFingering('fourNoteChords', settings.fourNoteChordQuality, hand, chord.position, 4),
        activeContext,
      ),
      (chord) => pitchForChord(chord.notes),
    );
  }

  if (settings.solidChordRest) tokens = addRestsAfterChords(tokens);

  return musicLine(tokens);
}

function noteInWrittenOctave(note, octaveOffset) {
  return {
    ...note,
    pitch: note.pitch + octaveOffset * 12,
    octave: note.octave + octaveOffset,
  };
}

function noteInOttavaWrittenOctave(note) {
  return {
    ...note,
    octave: note.octave - 1,
  };
}

function tokensWithRightHandOttava(notes, context) {
  const tokens = [];
  let ottavaTokens = [];

  const flushOttava = () => {
    if (ottavaTokens.length === 0) return;
    tokens.push(`8a{ ${ottavaTokens.join(' ')} }`);
    ottavaTokens = [];
  };

  notes.forEach((note) => {
    const useOttava = note.pitch > RIGHT_HAND_8VA_MIN_PITCH;
    const token = noteToken(useOttava ? noteInOttavaWrittenOctave(note) : note, context);

    if (useOttava) {
      ottavaTokens.push(token);
      return;
    }

    flushOttava();
    tokens.push(token);
  });

  flushOttava();
  return tokens;
}

function buildArpeggioNotes(settings, handConfig, option, octaves, inversion) {
  const keyOption = selectedKeyOption(settings);
  const rootOctave = arpeggioRootOctaveForKey(keyOption, handConfig);
  const rootPitch = pitchFromNote(keyOption.index, rootOctave);
  const rootLetter = keyOption.value.charAt(0).toUpperCase();
  const base = spelledInversionChord(
    rootPitch,
    option.intervals,
    inversion ?? 0,
    rootLetter,
    rootOctave,
    settings,
  );
  const notes = [];

  for (let octave = 0; octave < octaves; octave += 1) {
    base.forEach((note) => notes.push(noteInWrittenOctave(note, octave)));
  }

  notes.push(noteInWrittenOctave(base[0], octaves));
  return notes;
}

function arpeggioMusicForHand(settings, hand) {
  const handConfig = HAND_CONFIG[hand];
  const option = arpeggioOptionForSettings(settings);
  if (settings.brokenChord && option.chordSize === 3) {
    return brokenTriadMusicForHand(settings, hand, option);
  }
  if (settings.brokenChord && option.chordSize === 4) {
    return brokenSeventhMusicForHand(settings, hand, option);
  }

  const spelling = selectedSpelling(settings);
  const octaves = effectiveOctaves(settings);
  const inversion = Number.isInteger(settings.arpeggioInversion)
    ? settings.arpeggioInversion
    : null;
  const notes = buildArpeggioNotes(settings, handConfig, option, octaves, inversion);
  const directed = withDirection(notes, settings.direction);
  const fingering = arpeggioFingeringForKey(option, hand, settings);

  const context = {
    ...handConfig,
    spelling,
    duration: Number(settings.duration),
    showFingerings: settings.showFingerings,
    useKeySignature: shouldUseKeySignature(settings),
  };

  const arpeggioNotes = directed.map((note, index) => {
    const originalIndex = settings.direction === DIRECTIONS.DOWN ? directed.length - index - 1 : index;
    const isFinalRoot = originalIndex === notes.length - 1;
    const isEndingNote = index === directed.length - 1;
    const blockSize = option.chordSize;
    const blockIndex = Math.floor(originalIndex / blockSize);
    const withinBlock = originalIndex % blockSize;
    const pattern = blockIndex === 0 ? fingering.firstOctave : fingering.subsequentOctaves;
    return {
      ...note,
      fingering: isFinalRoot
        ? fingering.finalRoot
        : pattern[withinBlock],
      duration: isEndingNote
        ? finalArpeggioDuration(settings.duration)
        : formatDuration(settings.duration),
    };
  });

  let tokens;
  if (hand === HANDS.LEFT && option.chordSize === 4) {
    tokens = tokensWithLeftHandClefs(
      arpeggioNotes,
      context,
      (note, activeContext) => noteToken(note, activeContext),
      pitchForNote,
      { roundToGroupSize: option.chordSize },
    );
  } else if (hand === HANDS.RIGHT && option.chordSize === 4) {
    tokens = tokensWithRightHandOttava(arpeggioNotes, context);
  } else {
    tokens = arpeggioNotes.map((note) => noteToken(note, context));
  }

  return musicLine(tokens);
}

function addRestsAfterChords(tokens) {
  const result = [];
  for (const t of tokens) {
    result.push(t);
    if (t !== 'treble' && t !== 'bass') result.push('r4');
  }
  return result;
}

function chordMusicForHand(settings, hand, options, quality) {
  const handConfig = HAND_CONFIG[hand];
  const option = getOption(options, quality);
  const spelling = selectedSpelling(settings);
  const keyOption = selectedKeyOption(settings);
  const rootOctave = settings.technique === TECHNIQUE_TYPES.TRIAD
    ? triadRootOctaveForKey(keyOption, handConfig.rootOctave)
    : settings.technique === TECHNIQUE_TYPES.SEVENTH
      ? seventhRootOctaveForKey(keyOption, handConfig)
      : handConfig.rootOctave;
  const rootPitch = pitchFromNote(keyOption.index, rootOctave);
  const rootLetter = keyOption.value.charAt(0).toUpperCase();
  const totalPositions = effectiveOctaves(settings) * option.intervals.length + 1;
  const chords = Array.from({ length: totalPositions }, (_, index) => ({
    notes: spelledInversionChord(
      rootPitch,
      option.intervals,
      index,
      rootLetter,
      rootOctave,
      settings,
    ),
    position: index,
  }));
  const directed = withDirection(chords, settings.direction);
  const context = {
    ...handConfig,
    spelling,
    duration: settings.solidChordRest ? 4 : solidChordDuration(settings.duration),
    showFingerings: settings.showFingerings,
    useKeySignature: shouldUseKeySignature(settings),
  };

  let tokens;
  if (
    hand === HANDS.LEFT
    && [TECHNIQUE_TYPES.TRIAD, TECHNIQUE_TYPES.SEVENTH].includes(settings.technique)
  ) {
    const fingeringGroup = option.intervals.length === 4 ? 'seventhChords' : 'triads';
    tokens = directed.map((chord) => chordToken(
      chord.notes,
      chordFingering(fingeringGroup, quality, hand, chord.position, option.intervals.length),
      context,
    ));
  } else {
    tokens = tokensWithLeftHandClefs(
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
  }

  if (settings.solidChordRest) tokens = addRestsAfterChords(tokens);

  return musicLine(tokens);
}

function musicForHand(settings, hand) {
  if (settings.technique === TECHNIQUE_TYPES.SCALE) {
    return scaleMusicForHand(settings, hand);
  }

  if (settings.technique === TECHNIQUE_TYPES.CONTRARY_MOTION_SCALE) {
    return contraryMotionScaleMusicForHand(settings, hand);
  }

  if (settings.technique === TECHNIQUE_TYPES.CHROMATIC) {
    return chromaticScaleMusicForHand(settings, hand);
  }

  if (settings.technique === TECHNIQUE_TYPES.FOUR_NOTE_CHORD) {
    return fourNoteChordMusicForHand(settings, hand);
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

  if (settings.technique === TECHNIQUE_TYPES.CONTRARY_MOTION_SCALE) {
    return `${getOption(SCALE_OPTIONS, settings.scaleType).label} Contrary Motion Scale`;
  }

  if (settings.technique === TECHNIQUE_TYPES.CHROMATIC) {
    return 'Chromatic Scale';
  }

  if (settings.technique === TECHNIQUE_TYPES.SEVENTH) {
    return getOption(SEVENTH_OPTIONS, settings.seventhQuality).label;
  }

  if (settings.technique === TECHNIQUE_TYPES.FOUR_NOTE_CHORD) {
    return `${getOption(FOUR_NOTE_CHORD_OPTIONS, settings.fourNoteChordQuality).label} 4 Note Chords`;
  }

  if (settings.technique === TECHNIQUE_TYPES.ARPEGGIO) {
    return `${arpeggioOptionForSettings(settings).label} Arpeggio`;
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
  if (usesMinorKeySignature(settings)) {
    return keyOption.minorKey ?? 'C';
  }

  return keyOption.majorKey ?? 'C';
}

function handLabelForSettings(settings) {
  const handMode = handModeForSettings(settings);
  if (handMode === HANDS.TOGETHER) return 'Hands together';
  if (handMode === HANDS.SEPARATE) return 'Hands separate';
  if (handMode === HANDS.RIGHT) return 'Right hand';
  return 'Left hand';
}

function subtitleForSettings(settings) {
  const octaves = effectiveOctaves(settings);
  return `${handLabelForSettings(settings)} | ${octaves} octave${octaves === 1 ? '' : 's'} | ${
    getOption(DURATION_OPTIONS, techniqueDuration(settings)).label
  }`;
}

function staffSizeForSettings(settings) {
  return getOption(DISPLAY_SIZE_OPTIONS, Number(settings.displayScale ?? 1)).staffSizeMm;
}

function stavesForSettings(settings) {
  const hands = handsForSettings(settings);

  return hands.map((hand) => {
    const config = HAND_CONFIG[hand];
    return {
      clef: config.clef,
      music: musicForHand(settings, hand),
      fingeringPosition: config.fingeringPosition,
    };
  });
}

function stavesForSettingsGroup(settingsGroup, options = {}) {
  const first = settingsGroup[0];
  const hands = handsForSettings(first);
  const needsLeftHandClefReset = settingsGroup.some(
    (settings) => settings.technique !== TECHNIQUE_TYPES.ARPEGGIO
      || arpeggioOptionForSettings(settings).chordSize === 4,
  );

  return hands.map((hand) => {
    const config = HAND_CONFIG[hand];
    const separator = options.groupSeparator
      ?? (hand === HANDS.LEFT && needsLeftHandClefReset ? ' | bass ' : ' | ');
    return {
      clef: config.clef,
      music: settingsGroup.map((settings) => musicForHand(settings, hand)).join(separator),
      fingeringPosition: config.fingeringPosition,
    };
  });
}

function scoreCallForSettingsGroup(
  settingsGroup,
  title,
  subtitle,
  options = {},
) {
  const first = settingsGroup[0];
  const staves = settingsGroup.length === 1
    ? stavesForSettings(first)
    : stavesForSettingsGroup(settingsGroup, options);
  const key = keyForSettings(first);
  const systemSpacing = options.compact ? '2mm' : '9mm';

  return `#score(
  title: ${typstString(title)},
  subtitle: ${subtitle ? typstString(subtitle) : 'none'},
  key: ${typstString(key)},
  staff-group: ${typstString(staffGroupForSettings(first, staves))},
  staff-size: ${staffSizeForSettings(first)}mm,
  staff-spacing: 9mm,
  system-spacing: ${systemSpacing},
  width: 235mm,
  measure-numbers: "none",
  staves: (
${formatTypstStaves(staves)},
  ),
)`;
}

function scoreCallForSettings(
  settings,
  title = techniqueLabel(settings),
  subtitle = subtitleForSettings(settings),
  options = {},
) {
  return scoreCallForSettingsGroup([settings], title, subtitle, options);
}

function collectionKeyOptions(settings, order) {
  const isMinor = usesMinorKeySignature(settings);
  const options = isMinor
    ? KEY_OPTIONS.filter((option) => option.minorKey)
    : KEY_OPTIONS.filter((option) => option.majorKey);

  return orderKeyOptions(options, order, isMinor);
}

function inversionLabel(inversion) {
  if (inversion === 1) return 'First Inversion';
  if (inversion === 2) return 'Second Inversion';
  if (inversion === 3) return 'Third Inversion';
  return 'Root Position';
}

function collectionBaseSettings(collectionSettings) {
  return {
    ...DEFAULT_SETTINGS,
    hand: collectionSettings.hand,
    octaves: clampScaleOctaves(collectionSettings.octaves),
    duration: collectionSettings.duration,
    direction: collectionSettings.direction,
    renderMode: collectionSettings.renderMode,
    displayScale: collectionSettings.displayScale,
    showFingerings: collectionSettings.showFingerings,
  };
}

function isKeyAllowed(keyValue, isMinorContext, collectionSettings) {
  if (isMinorContext && collectionSettings.allowedMinorKeys) {
    return collectionSettings.allowedMinorKeys.has(keyValue);
  }
  if (!isMinorContext && collectionSettings.allowedMajorKeys) {
    return collectionSettings.allowedMajorKeys.has(keyValue);
  }
  return true;
}

function addCollectionEntriesForKeys(entries, collectionSettings, settingsTemplate, titleSuffix = '') {
  const keyOptions = collectionKeyOptions(settingsTemplate, collectionSettings.keyOrder);
  const isMinorContext = usesMinorKeySignature(settingsTemplate);
  keyOptions.forEach((keyOption) => {
    if (!isKeyAllowed(keyOption.value, isMinorContext, collectionSettings)) return;
    const settings = {
      ...settingsTemplate,
      key: keyOption.value,
    };
    entries.push({
      settings,
      title: `${techniqueLabel(settings)}${titleSuffix}`,
    });
  });
}

function minorScaleOptionsForCollection(collectionSettings) {
  let minorScaleOptions = SCALE_OPTIONS.filter((o) => isMinorScale(o.value));
  if (collectionSettings.excludeMelodicMinor) {
    minorScaleOptions = minorScaleOptions.filter((o) => o.value !== scaleTypes.MINOR_M);
  }

  return minorScaleOptions;
}

function addMajorScaleEntry(entries, base, keyValue) {
  const settings = {
    ...base,
    technique: TECHNIQUE_TYPES.SCALE,
    scaleType: scaleTypes.MAJOR,
    key: keyValue,
  };
  entries.push({ settings, title: techniqueLabel(settings) });
}

function addMinorScaleEntries(entries, base, keyValue, minorScaleOptions) {
  minorScaleOptions.forEach((scaleOption) => {
    const settings = {
      ...base,
      technique: TECHNIQUE_TYPES.SCALE,
      scaleType: scaleOption.value,
      key: keyValue,
    };
    entries.push({ settings, title: techniqueLabel(settings) });
  });
}

function addScaleEntries(entries, collectionSettings) {
  const base = collectionBaseSettings(collectionSettings);
  const minorScaleOptions = minorScaleOptionsForCollection(collectionSettings);

  if (collectionSettings.pairRelativeKeys) {
    const pairs = getOrderedKeyPairs(collectionSettings.keyOrder);

    pairs.forEach(({ major, minor }) => {
      const majorKeyOpt = KEY_OPTIONS.find((opt) => opt.value === major && opt.majorKey);
      const minorKeyOpt = KEY_OPTIONS.find((opt) => opt.value === minor && opt.minorKey);

      if (majorKeyOpt && isKeyAllowed(major, false, collectionSettings)) {
        addMajorScaleEntry(entries, base, major);
      }
      if (minorKeyOpt && isKeyAllowed(minor, true, collectionSettings)) {
        addMinorScaleEntries(entries, base, minor, minorScaleOptions);
      }
    });
    return;
  }

  if (collectionSettings.keyOrder === KEY_ORDERS.CHROMATIC) {
    KEY_OPTIONS.forEach((keyOption) => {
      if (keyOption.majorKey && isKeyAllowed(keyOption.value, false, collectionSettings)) {
        addMajorScaleEntry(entries, base, keyOption.value);
      }
      if (keyOption.minorKey && isKeyAllowed(keyOption.value, true, collectionSettings)) {
        addMinorScaleEntries(entries, base, keyOption.value, minorScaleOptions);
      }
    });
    return;
  }

  const majorKeyOptions = orderKeyOptions(
    KEY_OPTIONS.filter((option) => option.majorKey),
    collectionSettings.keyOrder,
    false,
  );
  const minorKeyOptions = orderKeyOptions(
    KEY_OPTIONS.filter((option) => option.minorKey),
    collectionSettings.keyOrder,
    true,
  );

  majorKeyOptions.forEach((keyOption) => {
    if (isKeyAllowed(keyOption.value, false, collectionSettings)) {
      addMajorScaleEntry(entries, base, keyOption.value);
    }
  });
  minorKeyOptions.forEach((keyOption) => {
    if (isKeyAllowed(keyOption.value, true, collectionSettings)) {
      addMinorScaleEntries(entries, base, keyOption.value, minorScaleOptions);
    }
  });
}

function addScaleEntriesForRelativePair(entries, collectionSettings, base, pair) {
  const minorScaleOptions = minorScaleOptionsForCollection(collectionSettings);
  const { major, minor } = pair;
  const majorKeyOpt = KEY_OPTIONS.find((opt) => opt.value === major && opt.majorKey);
  const minorKeyOpt = KEY_OPTIONS.find((opt) => opt.value === minor && opt.minorKey);

  if (majorKeyOpt && isKeyAllowed(major, false, collectionSettings)) {
    addMajorScaleEntry(entries, base, major);
  }
  if (minorKeyOpt && isKeyAllowed(minor, true, collectionSettings)) {
    addMinorScaleEntries(entries, base, minor, minorScaleOptions);
  }
}

function addScaleEntriesForKeyOption(entries, collectionSettings, base, keyOption) {
  const minorScaleOptions = minorScaleOptionsForCollection(collectionSettings);
  if (keyOption.majorKey && isKeyAllowed(keyOption.value, false, collectionSettings)) {
    addMajorScaleEntry(entries, base, keyOption.value);
  }
  if (keyOption.minorKey && isKeyAllowed(keyOption.value, true, collectionSettings)) {
    addMinorScaleEntries(entries, base, keyOption.value, minorScaleOptions);
  }
}

function contraryMotionScaleSettings(base, keyValue, scaleType) {
  return {
    ...base,
    technique: TECHNIQUE_TYPES.CONTRARY_MOTION_SCALE,
    key: keyValue,
    scaleType,
  };
}

function addMajorContraryMotionScaleEntry(entries, base, keyValue) {
  const settings = contraryMotionScaleSettings(base, keyValue, scaleTypes.MAJOR);
  entries.push({ settings, title: techniqueLabel(settings) });
}

function addMinorContraryMotionScaleEntries(entries, base, keyValue, minorScaleOptions) {
  minorScaleOptions.forEach((scaleOption) => {
    const settings = contraryMotionScaleSettings(base, keyValue, scaleOption.value);
    entries.push({ settings, title: techniqueLabel(settings) });
  });
}

function addContraryMotionScaleEntries(entries, collectionSettings) {
  const base = {
    ...collectionBaseSettings(collectionSettings),
    hand: isTwoStaffHandMode(collectionSettings.hand) ? collectionSettings.hand : HANDS.SEPARATE,
  };
  const minorScaleOptions = minorScaleOptionsForCollection(collectionSettings);

  if (collectionSettings.pairRelativeKeys) {
    getOrderedKeyPairs(collectionSettings.keyOrder).forEach(({ major, minor }) => {
      const majorKeyOpt = KEY_OPTIONS.find((opt) => opt.value === major && opt.majorKey);
      const minorKeyOpt = KEY_OPTIONS.find((opt) => opt.value === minor && opt.minorKey);

      if (majorKeyOpt && isKeyAllowed(major, false, collectionSettings)) {
        addMajorContraryMotionScaleEntry(entries, base, major);
      }
      if (minorKeyOpt && isKeyAllowed(minor, true, collectionSettings)) {
        addMinorContraryMotionScaleEntries(entries, base, minor, minorScaleOptions);
      }
    });
    return;
  }

  const majorKeyOptions = orderKeyOptions(
    KEY_OPTIONS.filter((option) => option.majorKey),
    collectionSettings.keyOrder,
    false,
  );
  const minorKeyOptions = orderKeyOptions(
    KEY_OPTIONS.filter((option) => option.minorKey),
    collectionSettings.keyOrder,
    true,
  );

  majorKeyOptions.forEach((keyOption) => {
    if (isKeyAllowed(keyOption.value, false, collectionSettings)) {
      addMajorContraryMotionScaleEntry(entries, base, keyOption.value);
    }
  });
  minorKeyOptions.forEach((keyOption) => {
    if (isKeyAllowed(keyOption.value, true, collectionSettings)) {
      addMinorContraryMotionScaleEntries(entries, base, keyOption.value, minorScaleOptions);
    }
  });
}

function triadSolidSettings(base, qualityOption, keyValue, solidChordRest = false) {
  return {
    ...base,
    technique: TECHNIQUE_TYPES.TRIAD,
    triadQuality: qualityOption.value,
    key: keyValue,
    ...(solidChordRest && { solidChordRest: true }),
  };
}

function triadBrokenSettings(base, qualityOption, keyValue) {
  return {
    ...base,
    technique: TECHNIQUE_TYPES.ARPEGGIO,
    arpeggioQuality: `triad-${qualityOption.value}`,
    brokenChord: true,
    key: keyValue,
  };
}

function addTriadEntry(entries, collectionSettings, base, qualityOption, keyValue) {
  const solidChordRest = collectionSettings.triadPresentation === CHORD_PRESENTATION.SOLID_WITH_REST;
  const solid = triadSolidSettings(base, qualityOption, keyValue, solidChordRest);
  const broken = triadBrokenSettings(base, qualityOption, keyValue);

  if (
    collectionSettings.triadPresentation === CHORD_PRESENTATION.SOLID
    || collectionSettings.triadPresentation === CHORD_PRESENTATION.SOLID_WITH_REST
  ) {
    entries.push({ settings: solid, title: techniqueLabel(solid) });
    return;
  }

  if (collectionSettings.triadPresentation === CHORD_PRESENTATION.BROKEN) {
    entries.push({ settings: broken, title: `${techniqueLabel(broken)} - Broken` });
    return;
  }

  entries.push({
    settings: solid,
    settingsGroup: [broken, solid],
    techniqueCount: 2,
    title: techniqueLabel(solid),
    groupSeparator: DOUBLE_BARLINE_SEPARATOR,
  });
}

function isTriadQualityMinorContext(qualityOption) {
  return qualityOption.value === 'minor' || qualityOption.value === 'diminished';
}

function fourNoteChordSolidSettings(base, qualityOption, keyValue, solidChordRest = false) {
  return {
    ...base,
    technique: TECHNIQUE_TYPES.FOUR_NOTE_CHORD,
    fourNoteChordQuality: qualityOption.value,
    key: keyValue,
    ...(solidChordRest && { solidChordRest: true }),
  };
}

function fourNoteChordBrokenSettings(base, qualityOption, keyValue) {
  return {
    ...base,
    technique: TECHNIQUE_TYPES.FOUR_NOTE_CHORD,
    fourNoteChordQuality: qualityOption.value,
    brokenChord: true,
    key: keyValue,
  };
}

function addFourNoteChordEntry(entries, collectionSettings, base, qualityOption, keyValue) {
  const solidChordRest = collectionSettings.fourNoteChordPresentation === CHORD_PRESENTATION.SOLID_WITH_REST;
  const solid = fourNoteChordSolidSettings(base, qualityOption, keyValue, solidChordRest);
  const broken = fourNoteChordBrokenSettings(base, qualityOption, keyValue);

  if (
    collectionSettings.fourNoteChordPresentation === CHORD_PRESENTATION.SOLID
    || collectionSettings.fourNoteChordPresentation === CHORD_PRESENTATION.SOLID_WITH_REST
  ) {
    entries.push({ settings: solid, title: techniqueLabel(solid) });
    return;
  }

  if (collectionSettings.fourNoteChordPresentation === CHORD_PRESENTATION.BROKEN) {
    entries.push({ settings: broken, title: `${techniqueLabel(broken)} - Broken` });
    return;
  }

  entries.push({
    settings: solid,
    settingsGroup: [broken, solid],
    techniqueCount: 2,
    title: techniqueLabel(solid),
    groupSeparator: DOUBLE_BARLINE_SEPARATOR,
  });
}

function addChromaticPairedFourNoteChordEntriesForKeyOption(entries, collectionSettings, base, keyOption) {
  FOUR_NOTE_CHORD_OPTIONS.forEach((qualityOption) => {
    const isMinorContext = isTriadQualityMinorContext(qualityOption);
    if (isMinorContext && !keyOption.minorKey) return;
    if (!isMinorContext && !keyOption.majorKey) return;
    if (!isKeyAllowed(keyOption.value, isMinorContext, collectionSettings)) return;

    addFourNoteChordEntry(entries, collectionSettings, base, qualityOption, keyOption.value);
  });
}

function addFourNoteChordEntries(entries, collectionSettings) {
  if (collectionSettings.pairRelativeKeys) {
    const base = collectionBaseSettings(collectionSettings);
    getOrderedKeyPairs(collectionSettings.keyOrder).forEach(({ major, minor }) => {
      const majorKeyOpt = KEY_OPTIONS.find((opt) => opt.value === major && opt.majorKey);
      const minorKeyOpt = KEY_OPTIONS.find((opt) => opt.value === minor && opt.minorKey);

      FOUR_NOTE_CHORD_OPTIONS.forEach((qualityOption) => {
        const useMinor = isTriadQualityMinorContext(qualityOption);
        const keyValue = useMinor ? minor : major;
        const keyOption = useMinor ? minorKeyOpt : majorKeyOpt;
        if (!keyOption || !isKeyAllowed(keyValue, useMinor, collectionSettings)) return;

        addFourNoteChordEntry(entries, collectionSettings, base, qualityOption, keyValue);
      });
    });
    return;
  }

  if (collectionSettings.keyOrder === KEY_ORDERS.CHROMATIC) {
    const base = collectionBaseSettings(collectionSettings);
    KEY_OPTIONS.forEach((keyOption) => {
      addChromaticPairedFourNoteChordEntriesForKeyOption(entries, collectionSettings, base, keyOption);
    });
    return;
  }

  const base = collectionBaseSettings(collectionSettings);
  FOUR_NOTE_CHORD_OPTIONS.forEach((qualityOption) => {
    const template = {
      ...base,
      technique: TECHNIQUE_TYPES.FOUR_NOTE_CHORD,
      fourNoteChordQuality: qualityOption.value,
    };
    const isMinorContext = usesMinorKeySignature(template);
    const keyOptions = collectionKeyOptions(template, collectionSettings.keyOrder);

    keyOptions.forEach((keyOption) => {
      if (!isKeyAllowed(keyOption.value, isMinorContext, collectionSettings)) return;
      addFourNoteChordEntry(entries, collectionSettings, base, qualityOption, keyOption.value);
    });
  });
}

function addChromaticPairedTriadEntriesForKeyOption(entries, collectionSettings, base, keyOption) {
  TRIAD_OPTIONS.forEach((qualityOption) => {
    const isMinorContext = isTriadQualityMinorContext(qualityOption);
    if (isMinorContext && !keyOption.minorKey) return;
    if (!isMinorContext && !keyOption.majorKey) return;
    if (!isKeyAllowed(keyOption.value, isMinorContext, collectionSettings)) return;

    addTriadEntry(entries, collectionSettings, base, qualityOption, keyOption.value);
  });
}

function addChromaticPairedTriadEntries(entries, collectionSettings) {
  const base = collectionBaseSettings(collectionSettings);
  KEY_OPTIONS.forEach((keyOption) => {
    addChromaticPairedTriadEntriesForKeyOption(entries, collectionSettings, base, keyOption);
  });
}

function addTriadEntries(entries, collectionSettings) {
  if (collectionSettings.pairRelativeKeys) {
    const base = collectionBaseSettings(collectionSettings);
    getOrderedKeyPairs(collectionSettings.keyOrder).forEach(({ major, minor }) => {
      const majorKeyOpt = KEY_OPTIONS.find((opt) => opt.value === major && opt.majorKey);
      const minorKeyOpt = KEY_OPTIONS.find((opt) => opt.value === minor && opt.minorKey);

      TRIAD_OPTIONS.forEach((qualityOption) => {
        const useMinor = isTriadQualityMinorContext(qualityOption);
        const keyValue = useMinor ? minor : major;
        const keyOption = useMinor ? minorKeyOpt : majorKeyOpt;
        if (!keyOption || !isKeyAllowed(keyValue, useMinor, collectionSettings)) return;

        addTriadEntry(entries, collectionSettings, base, qualityOption, keyValue);
      });
    });
    return;
  }

  if (collectionSettings.keyOrder === KEY_ORDERS.CHROMATIC) {
    addChromaticPairedTriadEntries(entries, collectionSettings);
    return;
  }

  const base = collectionBaseSettings(collectionSettings);
  TRIAD_OPTIONS.forEach((qualityOption) => {
    const template = {
      ...base,
      technique: TECHNIQUE_TYPES.TRIAD,
      triadQuality: qualityOption.value,
    };
    const isMinorContext = usesMinorKeySignature(template);
    const keyOptions = collectionKeyOptions(template, collectionSettings.keyOrder);

    keyOptions.forEach((keyOption) => {
      if (!isKeyAllowed(keyOption.value, isMinorContext, collectionSettings)) return;
      addTriadEntry(entries, collectionSettings, base, qualityOption, keyOption.value);
    });
  });
}

function seventhSolidSettings(base, qualityOption, keyValue, solidChordRest = false) {
  return {
    ...base,
    technique: TECHNIQUE_TYPES.SEVENTH,
    seventhQuality: qualityOption.value,
    key: keyValue,
    ...(solidChordRest && { solidChordRest: true }),
  };
}

function seventhBrokenSettings(base, qualityOption, keyValue) {
  return {
    ...base,
    technique: TECHNIQUE_TYPES.ARPEGGIO,
    arpeggioQuality: `seventh-${qualityOption.value}`,
    brokenChord: true,
    key: keyValue,
  };
}

function addSeventhEntry(entries, collectionSettings, base, qualityOption, keyValue) {
  const solidChordRest = collectionSettings.seventhPresentation === CHORD_PRESENTATION.SOLID_WITH_REST;
  const solid = seventhSolidSettings(base, qualityOption, keyValue, solidChordRest);
  const broken = seventhBrokenSettings(base, qualityOption, keyValue);
  const solidLabel = techniqueLabel(solid);

  if (
    collectionSettings.seventhPresentation === CHORD_PRESENTATION.SOLID
    || collectionSettings.seventhPresentation === CHORD_PRESENTATION.SOLID_WITH_REST
  ) {
    entries.push({ settings: solid, title: solidLabel });
    return;
  }

  if (collectionSettings.seventhPresentation === CHORD_PRESENTATION.BROKEN) {
    entries.push({ settings: broken, title: `${solidLabel} - Broken` });
    return;
  }

  entries.push({ settings: broken, title: `${solidLabel} - Broken` });
  entries.push({ settings: solid, title: `${solidLabel} - Solid` });
}

function isSeventhQualityMinorContext(qualityOption) {
  const quality = qualityOption.value.toLowerCase();
  return quality.includes('minor') || quality.includes('diminished');
}

function isSeventhQualityMinorContextValue(qualityValue) {
  const quality = String(qualityValue).toLowerCase();
  return quality.includes('minor') || quality.includes('diminished');
}

function normalizedSelectionSet(value) {
  if (value instanceof Set) return value;
  if (Array.isArray(value)) return new Set(value);
  return null;
}

function seventhQualityKeySelections(collectionSettings, arpeggio = false) {
  const selections = arpeggio
    ? collectionSettings.allowedSeventhArpeggioKeysByQuality
    : collectionSettings.allowedSeventhKeysByQuality;

  return selections && typeof selections === 'object' ? selections : null;
}

function isKeyAllowedForSeventhQuality(keyValue, qualityValue, collectionSettings, arpeggio = false) {
  const selections = seventhQualityKeySelections(collectionSettings, arpeggio);
  const selectedKeys = selections ? normalizedSelectionSet(selections[qualityValue]) : null;
  if (selectedKeys) return selectedKeys.has(keyValue);

  return isKeyAllowed(
    keyValue,
    isSeventhQualityMinorContextValue(qualityValue),
    collectionSettings,
  );
}

function addSeventhEntriesForKeyOption(entries, collectionSettings, base, keyOption) {
  SEVENTH_OPTIONS.forEach((qualityOption) => {
    const isMinorContext = isSeventhQualityMinorContext(qualityOption);
    if (isMinorContext && !keyOption.minorKey) return;
    if (!isMinorContext && !keyOption.majorKey) return;
    if (!isKeyAllowedForSeventhQuality(keyOption.value, qualityOption.value, collectionSettings)) return;

    addSeventhEntry(entries, collectionSettings, base, qualityOption, keyOption.value);
  });
}

function addSeventhEntries(entries, collectionSettings) {
  if (collectionSettings.pairRelativeKeys) {
    const base = collectionBaseSettings(collectionSettings);
    getOrderedKeyPairs(collectionSettings.keyOrder).forEach(({ major, minor }) => {
      const majorKeyOpt = KEY_OPTIONS.find((opt) => opt.value === major && opt.majorKey);
      const minorKeyOpt = KEY_OPTIONS.find((opt) => opt.value === minor && opt.minorKey);

      SEVENTH_OPTIONS.forEach((qualityOption) => {
        const useMinor = isSeventhQualityMinorContext(qualityOption);
        const keyValue = useMinor ? minor : major;
        const keyOption = useMinor ? minorKeyOpt : majorKeyOpt;
        if (
          !keyOption
          || !isKeyAllowedForSeventhQuality(keyValue, qualityOption.value, collectionSettings)
        ) return;

        addSeventhEntry(entries, collectionSettings, base, qualityOption, keyValue);
      });
    });
    return;
  }

  const base = collectionBaseSettings(collectionSettings);
  const allKeyOptionsOrdered = [...KEY_OPTIONS].sort(
    (a, b) => optionOrderIndex(a, collectionSettings.keyOrder, false)
      - optionOrderIndex(b, collectionSettings.keyOrder, false),
  );
  allKeyOptionsOrdered.forEach((keyOption) => {
    addSeventhEntriesForKeyOption(entries, collectionSettings, base, keyOption);
  });
}

function addArpeggioEntry(entries, collectionSettings, option, rootSettings) {
  if (collectionSettings.arpeggioPresentation !== ARPEGGIO_PRESENTATION.ROOT_AND_INVERSIONS) {
    entries.push({ settings: rootSettings, title: techniqueLabel(rootSettings) });
    return;
  }

  const settingsGroup = Array.from({ length: option.chordSize }, (_, inversion) => ({
    ...rootSettings,
    arpeggioInversion: inversion,
  }));

  if (option.chordSize === 4) {
    entries.push({
      settings: rootSettings,
      settingsLines: [settingsGroup.slice(0, 2), settingsGroup.slice(2, 4)],
      techniqueCount: settingsGroup.length,
      title: techniqueLabel(rootSettings),
    });
    return;
  }

  entries.push({
    settings: rootSettings,
    settingsGroup,
    techniqueCount: settingsGroup.length,
    title: techniqueLabel(rootSettings),
  });
}

function arpeggioTemplateForOption(base, option) {
  return {
    ...base,
    technique: TECHNIQUE_TYPES.ARPEGGIO,
    arpeggioQuality: option.value,
    brokenChord: false,
  };
}

function addArpeggioEntryForKey(entries, collectionSettings, template, option, keyValue) {
  addArpeggioEntry(
    entries,
    collectionSettings,
    option,
    {
      ...template,
      key: keyValue,
      arpeggioInversion: null,
    },
  );
}

function triadArpeggioOptionsForCollection() {
  return ARPEGGIO_OPTIONS.filter((option) => option.chordSize === 3);
}

function seventhArpeggioOptionsForCollection(collectionSettings) {
  const selectedQualities = Array.isArray(collectionSettings.allowedSeventhArpeggioQualities)
    ? collectionSettings.allowedSeventhArpeggioQualities
    : null;
  const selectedKeysByQuality = seventhQualityKeySelections(collectionSettings, true);

  return ARPEGGIO_OPTIONS.filter((option) => {
    if (option.chordSize !== 4) return false;
    const qualityValue = option.value.replace(/^seventh-/, '');
    if (selectedKeysByQuality) {
      const selectedKeys = normalizedSelectionSet(selectedKeysByQuality[qualityValue]);
      return selectedKeys ? selectedKeys.size > 0 : false;
    }
    if (!selectedQualities) return true;
    return selectedQualities.includes(qualityValue);
  });
}

function addChromaticPairedArpeggioEntriesForKeyOption(entries, collectionSettings, base, keyOption) {
  triadArpeggioOptionsForCollection().forEach((option) => {
    const template = arpeggioTemplateForOption(base, option);
    const isMinorContext = usesMinorKeySignature(template);
    if (isMinorContext && !keyOption.minorKey) return;
    if (!isMinorContext && !keyOption.majorKey) return;
    if (!isKeyAllowed(keyOption.value, isMinorContext, collectionSettings)) return;

    addArpeggioEntryForKey(entries, collectionSettings, template, option, keyOption.value);
  });
}

function addChromaticPairedArpeggioEntries(entries, collectionSettings) {
  const base = collectionBaseSettings(collectionSettings);

  KEY_OPTIONS.forEach((keyOption) => {
    addChromaticPairedArpeggioEntriesForKeyOption(entries, collectionSettings, base, keyOption);
  });
}

function addChromaticPairedSeventhArpeggioEntriesForKeyOption(entries, collectionSettings, base, keyOption) {
  seventhArpeggioOptionsForCollection(collectionSettings).forEach((option) => {
    const template = arpeggioTemplateForOption(base, option);
    const isMinorContext = usesMinorKeySignature(template);
    if (isMinorContext && !keyOption.minorKey) return;
    if (!isMinorContext && !keyOption.majorKey) return;
    if (
      !isKeyAllowedForSeventhQuality(
        keyOption.value,
        option.value.replace(/^seventh-/, ''),
        collectionSettings,
        true,
      )
    ) return;

    addArpeggioEntryForKey(entries, collectionSettings, template, option, keyOption.value);
  });
}

function addChromaticPairedSeventhArpeggioEntries(entries, collectionSettings) {
  const base = collectionBaseSettings(collectionSettings);

  KEY_OPTIONS.forEach((keyOption) => {
    addChromaticPairedSeventhArpeggioEntriesForKeyOption(entries, collectionSettings, base, keyOption);
  });
}

function addArpeggioEntries(entries, collectionSettings) {
  if (collectionSettings.pairRelativeKeys) {
    const base = collectionBaseSettings(collectionSettings);
    getOrderedKeyPairs(collectionSettings.keyOrder).forEach(({ major, minor }) => {
      const majorKeyOpt = KEY_OPTIONS.find((opt) => opt.value === major && opt.majorKey);
      const minorKeyOpt = KEY_OPTIONS.find((opt) => opt.value === minor && opt.minorKey);

      triadArpeggioOptionsForCollection().forEach((option) => {
        const template = arpeggioTemplateForOption(base, option);
        const useMinor = usesMinorKeySignature(template);
        const keyValue = useMinor ? minor : major;
        const keyOption = useMinor ? minorKeyOpt : majorKeyOpt;
        if (!keyOption || !isKeyAllowed(keyValue, useMinor, collectionSettings)) return;

        addArpeggioEntryForKey(entries, collectionSettings, template, option, keyValue);
      });
    });
    return;
  }

  if (collectionSettings.keyOrder === KEY_ORDERS.CHROMATIC) {
    addChromaticPairedArpeggioEntries(entries, collectionSettings);
    return;
  }

  const base = collectionBaseSettings(collectionSettings);
  triadArpeggioOptionsForCollection().forEach((option) => {
    const template = arpeggioTemplateForOption(base, option);
    const isMinorContext = usesMinorKeySignature(template);
    const keyOptions = collectionKeyOptions(template, collectionSettings.keyOrder);

    keyOptions.forEach((keyOption) => {
      if (!isKeyAllowed(keyOption.value, isMinorContext, collectionSettings)) return;
      addArpeggioEntryForKey(entries, collectionSettings, template, option, keyOption.value);
    });
  });
}

function addSeventhArpeggioEntries(entries, collectionSettings) {
  const options = seventhArpeggioOptionsForCollection(collectionSettings);
  if (options.length === 0) return;

  if (collectionSettings.pairRelativeKeys) {
    const base = collectionBaseSettings(collectionSettings);
    getOrderedKeyPairs(collectionSettings.keyOrder).forEach(({ major, minor }) => {
      const majorKeyOpt = KEY_OPTIONS.find((opt) => opt.value === major && opt.majorKey);
      const minorKeyOpt = KEY_OPTIONS.find((opt) => opt.value === minor && opt.minorKey);

      options.forEach((option) => {
        const template = arpeggioTemplateForOption(base, option);
        const useMinor = usesMinorKeySignature(template);
        const keyValue = useMinor ? minor : major;
        const keyOption = useMinor ? minorKeyOpt : majorKeyOpt;
        if (
          !keyOption
          || !isKeyAllowedForSeventhQuality(
            keyValue,
            option.value.replace(/^seventh-/, ''),
            collectionSettings,
            true,
          )
        ) return;

        addArpeggioEntryForKey(entries, collectionSettings, template, option, keyValue);
      });
    });
    return;
  }

  if (collectionSettings.keyOrder === KEY_ORDERS.CHROMATIC) {
    addChromaticPairedSeventhArpeggioEntries(entries, collectionSettings);
    return;
  }

  const base = collectionBaseSettings(collectionSettings);
  options.forEach((option) => {
    const template = arpeggioTemplateForOption(base, option);
    const isMinorContext = usesMinorKeySignature(template);
    const keyOptions = collectionKeyOptions(template, collectionSettings.keyOrder);

    keyOptions.forEach((keyOption) => {
      if (
        !isKeyAllowedForSeventhQuality(
          keyOption.value,
          option.value.replace(/^seventh-/, ''),
          collectionSettings,
          true,
        )
      ) return;
      addArpeggioEntryForKey(entries, collectionSettings, template, option, keyOption.value);
    });
  });
}

function techniqueOrderForSettings(collectionSettings) {
  const requested = Array.isArray(collectionSettings.techniqueOrder)
    ? collectionSettings.techniqueOrder
    : [];
  const ordered = requested.filter((sectionId) => DEFAULT_TECHNIQUE_ORDER.includes(sectionId));
  const missing = DEFAULT_TECHNIQUE_ORDER.filter((sectionId) => !ordered.includes(sectionId));
  return [...ordered, ...missing];
}

function addEntriesForTechnique(entries, collectionSettings, sectionId) {
  if (sectionId === 'scales' && collectionSettings.includeScales) {
    addScaleEntries(entries, collectionSettings);
  } else if (sectionId === 'contraryMotionScales' && collectionSettings.includeContraryMotionScales) {
    addContraryMotionScaleEntries(entries, collectionSettings);
  } else if (sectionId === 'triads' && collectionSettings.includeTriads) {
    addTriadEntries(entries, collectionSettings);
  } else if (sectionId === 'fourNoteChords' && collectionSettings.includeFourNoteChords) {
    addFourNoteChordEntries(entries, collectionSettings);
  } else if (sectionId === 'sevenths' && collectionSettings.includeSevenths) {
    addSeventhEntries(entries, collectionSettings);
  } else if (sectionId === 'arpeggios' && collectionSettings.includeArpeggios) {
    addArpeggioEntries(entries, collectionSettings);
  } else if (sectionId === 'seventhArpeggios' && collectionSettings.includeSeventhArpeggios) {
    addSeventhArpeggioEntries(entries, collectionSettings);
  }
}

function addEntriesForTechniqueAndRelativePair(entries, collectionSettings, base, sectionId, pair) {
  const { major, minor } = pair;
  const majorKeyOpt = KEY_OPTIONS.find((opt) => opt.value === major && opt.majorKey);
  const minorKeyOpt = KEY_OPTIONS.find((opt) => opt.value === minor && opt.minorKey);

  if (sectionId === 'scales' && collectionSettings.includeScales) {
    addScaleEntriesForRelativePair(entries, collectionSettings, base, pair);
  } else if (sectionId === 'contraryMotionScales' && collectionSettings.includeContraryMotionScales) {
    const minorScaleOptions = minorScaleOptionsForCollection(collectionSettings);
    if (majorKeyOpt && isKeyAllowed(major, false, collectionSettings)) {
      addMajorContraryMotionScaleEntry(entries, { ...base, hand: isTwoStaffHandMode(base.hand) ? base.hand : HANDS.SEPARATE }, major);
    }
    if (minorKeyOpt && isKeyAllowed(minor, true, collectionSettings)) {
      addMinorContraryMotionScaleEntries(entries, { ...base, hand: isTwoStaffHandMode(base.hand) ? base.hand : HANDS.SEPARATE }, minor, minorScaleOptions);
    }
  } else if (sectionId === 'triads' && collectionSettings.includeTriads) {
    TRIAD_OPTIONS.forEach((qualityOption) => {
      const useMinor = isTriadQualityMinorContext(qualityOption);
      const keyValue = useMinor ? minor : major;
      const keyOption = useMinor ? minorKeyOpt : majorKeyOpt;
      if (!keyOption || !isKeyAllowed(keyValue, useMinor, collectionSettings)) return;

      addTriadEntry(entries, collectionSettings, base, qualityOption, keyValue);
    });
  } else if (sectionId === 'fourNoteChords' && collectionSettings.includeFourNoteChords) {
    FOUR_NOTE_CHORD_OPTIONS.forEach((qualityOption) => {
      const useMinor = isTriadQualityMinorContext(qualityOption);
      const keyValue = useMinor ? minor : major;
      const keyOption = useMinor ? minorKeyOpt : majorKeyOpt;
      if (!keyOption || !isKeyAllowed(keyValue, useMinor, collectionSettings)) return;

      addFourNoteChordEntry(entries, collectionSettings, base, qualityOption, keyValue);
    });
  } else if (sectionId === 'sevenths' && collectionSettings.includeSevenths) {
    SEVENTH_OPTIONS.forEach((qualityOption) => {
      const useMinor = isSeventhQualityMinorContext(qualityOption);
      const keyValue = useMinor ? minor : major;
      const keyOption = useMinor ? minorKeyOpt : majorKeyOpt;
      if (
        !keyOption
        || !isKeyAllowedForSeventhQuality(keyValue, qualityOption.value, collectionSettings)
      ) return;

      addSeventhEntry(entries, collectionSettings, base, qualityOption, keyValue);
    });
  } else if (sectionId === 'arpeggios' && collectionSettings.includeArpeggios) {
    triadArpeggioOptionsForCollection().forEach((option) => {
      const template = arpeggioTemplateForOption(base, option);
      const useMinor = usesMinorKeySignature(template);
      const keyValue = useMinor ? minor : major;
      const keyOption = useMinor ? minorKeyOpt : majorKeyOpt;
      if (!keyOption || !isKeyAllowed(keyValue, useMinor, collectionSettings)) return;

      addArpeggioEntryForKey(entries, collectionSettings, template, option, keyValue);
    });
  } else if (sectionId === 'seventhArpeggios' && collectionSettings.includeSeventhArpeggios) {
    seventhArpeggioOptionsForCollection(collectionSettings).forEach((option) => {
      const template = arpeggioTemplateForOption(base, option);
      const useMinor = usesMinorKeySignature(template);
      const keyValue = useMinor ? minor : major;
      const keyOption = useMinor ? minorKeyOpt : majorKeyOpt;
      if (
        !keyOption
        || !isKeyAllowedForSeventhQuality(
          keyValue,
          option.value.replace(/^seventh-/, ''),
          collectionSettings,
          true,
        )
      ) return;

      addArpeggioEntryForKey(entries, collectionSettings, template, option, keyValue);
    });
  }
}

function addEntriesForTechniqueAndKeyOption(entries, collectionSettings, base, sectionId, keyOption) {
  if (sectionId === 'scales' && collectionSettings.includeScales) {
    addScaleEntriesForKeyOption(entries, collectionSettings, base, keyOption);
  } else if (sectionId === 'contraryMotionScales' && collectionSettings.includeContraryMotionScales) {
    const contraryBase = { ...base, hand: isTwoStaffHandMode(base.hand) ? base.hand : HANDS.SEPARATE };
    const minorScaleOptions = minorScaleOptionsForCollection(collectionSettings);
    if (keyOption.majorKey && isKeyAllowed(keyOption.value, false, collectionSettings)) {
      addMajorContraryMotionScaleEntry(entries, contraryBase, keyOption.value);
    }
    if (keyOption.minorKey && isKeyAllowed(keyOption.value, true, collectionSettings)) {
      addMinorContraryMotionScaleEntries(entries, contraryBase, keyOption.value, minorScaleOptions);
    }
  } else if (sectionId === 'triads' && collectionSettings.includeTriads) {
    addChromaticPairedTriadEntriesForKeyOption(entries, collectionSettings, base, keyOption);
  } else if (sectionId === 'fourNoteChords' && collectionSettings.includeFourNoteChords) {
    addChromaticPairedFourNoteChordEntriesForKeyOption(entries, collectionSettings, base, keyOption);
  } else if (sectionId === 'sevenths' && collectionSettings.includeSevenths) {
    addSeventhEntriesForKeyOption(entries, collectionSettings, base, keyOption);
  } else if (sectionId === 'arpeggios' && collectionSettings.includeArpeggios) {
    addChromaticPairedArpeggioEntriesForKeyOption(entries, collectionSettings, base, keyOption);
  } else if (sectionId === 'seventhArpeggios' && collectionSettings.includeSeventhArpeggios) {
    addChromaticPairedSeventhArpeggioEntriesForKeyOption(entries, collectionSettings, base, keyOption);
  }
}

function keyOptionsForKeyGroups(collectionSettings) {
  if (collectionSettings.keyOrder === KEY_ORDERS.CHROMATIC) {
    return KEY_OPTIONS;
  }

  return orderKeyOptions(KEY_OPTIONS, collectionSettings.keyOrder, false);
}

function collectionEntriesGroupedByKey(collectionSettings) {
  const base = collectionBaseSettings(collectionSettings);
  const entries = [];
  const techniqueOrder = techniqueOrderForSettings(collectionSettings);

  if (collectionSettings.pairRelativeKeys) {
    getOrderedKeyPairs(collectionSettings.keyOrder).forEach((pair) => {
      techniqueOrder.forEach((sectionId) => {
        addEntriesForTechniqueAndRelativePair(entries, collectionSettings, base, sectionId, pair);
      });
    });
    return entries;
  }

  keyOptionsForKeyGroups(collectionSettings).forEach((keyOption) => {
    techniqueOrder.forEach((sectionId) => {
      addEntriesForTechniqueAndKeyOption(entries, collectionSettings, base, sectionId, keyOption);
    });
  });

  return entries;
}

export function collectionEntriesForSettings(collectionSettings) {
  if (collectionSettings.customEntries) {
    return collectionSettings.customEntries;
  }

  if (collectionSettings.groupByKey) {
    return collectionEntriesGroupedByKey(collectionSettings);
  }

  const entries = [];
  techniqueOrderForSettings(collectionSettings).forEach((sectionId) => {
    addEntriesForTechnique(entries, collectionSettings, sectionId);
  });
  return entries;
}

function settingsGroupForEntry(entry) {
  return entry.settingsGroup ?? [entry.settings];
}

function settingsLinesForEntry(entry) {
  return entry.settingsLines ?? [settingsGroupForEntry(entry)];
}

function techniqueCountForEntry(entry) {
  return entry.techniqueCount
    ?? settingsLinesForEntry(entry).reduce((count, settingsGroup) => count + settingsGroup.length, 0);
}

function scoreCallForEntry(entry, options = {}) {
  return settingsLinesForEntry(entry)
    .map((settingsGroup, index) => {
      const first = settingsGroup[0];
      return scoreCallForSettingsGroup(
        settingsGroup,
        index === 0 ? entry.title : '',
        index === 0 && options.showDetails ? subtitleForSettings(first) : '',
        { compact: true, groupSeparator: entry.groupSeparator },
      );
    })
    .join('\n\n#v(0.5mm)\n\n');
}

function sourceForEntries(entries, options = {}) {
  return typstDocument(
    entries.map((entry) => scoreCallForEntry(entry, options)).join('\n\n#v(2mm)\n\n'),
    { compact: true },
  );
}

function stableIdForSource(source) {
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = Math.imul(31, hash) + source.charCodeAt(index);
    hash |= 0;
  }

  return `score-${(hash >>> 0).toString(36)}`;
}

export function buildTechniqueDocument(settings) {
  const title = techniqueLabel(settings);

  return {
    title,
    source: typstDocument(scoreCallForSettings(settings, title)),
  };
}

export function buildTechniqueCollectionDocument(collectionSettings) {
  const entries = collectionEntriesForSettings(collectionSettings);
  const renderEntries = [];
  const entryOptions = {
    showDetails: Boolean(collectionSettings.showDetails),
  };
  for (let index = 0; index < entries.length; index += TECHNIQUES_PER_RENDER_DOCUMENT) {
    const chunk = entries.slice(index, index + TECHNIQUES_PER_RENDER_DOCUMENT);
    const source = sourceForEntries(chunk, entryOptions);
    renderEntries.push({
      id: stableIdForSource(source),
      title: chunk.map((entry) => entry.title).join(' / '),
      techniqueCount: chunk.reduce((count, entry) => count + techniqueCountForEntry(entry), 0),
      source,
    });
  }
  const title = collectionSettings.title || DEFAULT_COLLECTION_SETTINGS.title;
  const techniqueCount = entries.reduce((count, entry) => count + techniqueCountForEntry(entry), 0);
  const body = entries.length === 0
    ? `#align(center)[#text(size: 18pt, weight: "bold")[${typstContent(title)}]]

#align(center)[Choose at least one technique family.]`
    : `#align(center)[#text(size: 18pt, weight: "bold")[${typstContent(title)}]]

#v(5mm)

${entries
    .map((entry) => scoreCallForEntry(entry, entryOptions))
    .join('\n\n#v(2mm)\n\n')}`;

  return {
    title,
    entries,
    techniqueCount,
    renderEntries,
    source: typstDocument(body),
  };
}
