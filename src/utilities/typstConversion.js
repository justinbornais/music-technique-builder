import { noteName, accidentals } from './noteConversions.js';
import {
  LETTER_BASE_INDEX,
  KEY_SIGNATURE_COUNTS,
  KEY_SIGNATURE_SHARP_ORDER,
  KEY_SIGNATURE_FLAT_ORDER,
} from './techniqueDefinitions.js';

const NATURAL = accidentals.NATURAL;

export function typstEscape(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function typstString(value) {
  return `"${typstEscape(value)}"`;
}

export function typstContent(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]');
}

export function formatDuration(duration) {
  return Number(duration) || 8;
}

export function solidChordDuration(duration) {
  return Math.min(formatDuration(duration), 4);
}

export function finalScaleDuration(duration) {
  return Math.min(formatDuration(duration), 4);
}

export function finalArpeggioDuration(duration) {
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

export function keySignatureAccidentals(key) {
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

export function accidentalForKeySignature(index, letter, keySignature) {
  const actualOffset = pitchOffsetForLetter(index, letter);
  const signatureOffset = keySignature[letter] ?? 0;
  return actualOffset === signatureOffset ? '' : accidentalTokenForOffset(actualOffset);
}

export function accidentalForWrittenPitch(index, letter) {
  const offset = pitchOffsetForLetter(index, letter);
  return offset === 0 ? '' : accidentalTokenForOffset(offset);
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
  if (context.useKeySignature) {
    const letter = note.letter ?? noteName(note.index, NATURAL).charAt(0);
    return formatLetterName(letter, note.octave, context.baseOctave, note.accidental ?? '');
  }

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

export function noteToken(note, context) {
  const duration = formatDuration(note.duration ?? context.duration);
  const name = formatNoteTokenName(note, context);
  const fingering = formatFingering(
    note.fingering,
    context.fingeringPosition,
    context.showFingerings,
  );

  return `${name}${duration}${fingering}`;
}

export function chordToken(notes, fingering, context) {
  const names = notes.map((note) => formatNoteTokenName(note, context));
  const fingers = formatFingering(fingering, context.fingeringPosition, context.showFingerings);
  return `<${names.join(' ')}>${formatDuration(context.duration)}${fingers}`;
}

export function musicLine(tokens, separator = ' ') {
  return tokens.join(separator);
}

export function formatTypstStaves(staves) {
  return staves
    .map((staff) => `(
      clef: ${typstString(staff.clef)},
      fingering-position: ${typstString(staff.fingeringPosition)},
      music: ${typstString(staff.music)},
    )`)
    .join(',\n');
}

export function typstDocument(body, options = {}) {
  const margin = options.compact ? '(x: 7mm, y: 1mm)' : '7mm';

  return `#import "scorify/lib.typ": score

#set page(width: 255mm, height: auto, margin: ${margin})
#set text(size: 10pt)

${body}`;
}
