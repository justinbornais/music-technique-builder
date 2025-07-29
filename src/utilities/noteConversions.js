import data from "../assets/techniques.json";

export const accidentals = {
    FLAT: -2,
    PREFER_FLAT: -1,
    NATURAL: 0,
    SHARP: 1,
};

export const scaleTypes = {
    MAJOR: "major",
    MINOR_N: "minor-natural",
    MINOR_H: "minor-harmonic",
    MINOR_M: "minor-melodic"
};

export const accidentalChoice = {
    ACCIDENTALS: 0,
    KEY_SIGNATURE: 1,
    BOTH: 2
};

export const scaleDirection = {
    ASCENDING: 0,
    DESCENDING: 1,
    BOTH: 2
};

/**
 * Get the note name of a given number, using the `techniques.json` object.
 * @param {*} i The index number.
 * @param {*} accidental The accidental. If natural is given for a non-natural note (i.e. A#/Bb), default to sharp.
 * @returns The note name.
 */
export function noteName(i, accidental = accidentals.NATURAL) {
    const names = data.notes[i];
    if (!names) return 'N/A';

    if (accidental === accidentals.SHARP)
        return names[0];
    else if (accidental === accidentals.FLAT)
        return names[names.length - 1];
    else if (accidental === accidentals.PREFER_FLAT)
        return names.length === 3
            ? names[Math.ceil(names.length / 2) - 1]
            : names[names.length - 1]; 
    return names[Math.ceil(names.length / 2) - 1];
}

/**
 * Get the alphabetical letter representing the major key signature.
 * @param {*} key The note index number.
 * @param {*} major Major or minor (true or false).
 * @param {*} accidental The accidental type for the note.
 * @returns 
 */
export function getKeySignatureLetter(key, major, accidental = accidentals.NATURAL) {
    if (major)
        return noteName(key, accidental);
    key += 3;
    if (key > 11) key -= 12;
    return noteName(key, accidental);
}

/**
 * Get the scale object of a given key signature and scale type, using the `techniques.json` object.
 * @param {*} key The index number representing the key.
 * @param {*} scaleType The scale type.
 * @returns The scale object defined in `techniques.json` for the given key signature and scale type.
 */
export function getScaleObject(key, scaleType) {
    const scale = data.scales[scaleType];
    if (!scale) return null;

    let scaleKey = scale[key];
    if (!scaleKey.hasOwnProperty("RH")) {
        let alias = scale.aliases[key];
        if (!alias) return null;
        if (!alias.length === 2) return null;

        scaleKey = getScaleObject(alias[1], alias[0]);
    }
    return scaleKey;
}

/**
 * Get the notes of a scale in an array for one clef.
 * @param {*} key The key signature of the scale, from 0 to 11.
 * @param {*} scaleType The scale type, according to the `scaleTypes` enum.
 * @param {*} rh Right hand (true or false). 
 * @param {*} octaves The number of octaves (either 1 or 2).
 * @param {*} accidental The type of accidental to use.
 * @param {*} keySignature Whether or not to use a key signature or accidentals or both, according to the `accentalChoice` enum.
 * @param {*} alternateFingerings Whether or not to use alternate fingerings.
 * @param {*} direction Ascending or descending.
 */
export function getScaleNotes(key, scaleType, rh, octaves, accidental = accidentals.NATURAL, keySignature = true, alternateFingerings = false, direction = scaleDirection.BOTH) {
    const scale = getScaleObject(key, scaleType);
    const pattern = data.scales[scaleType]["pattern"];
    let handArray = rh ? scale.RH : scale.LH;
    let notes = [];

    let currentNote = key;
    let currentOctave = 2 + Math.floor((key + 8) / 11); // The note 'C' (or number 3) should skip to the next octave.
    if (rh) currentOctave++;

    for (var j = 0;j < octaves;j++) {
        let extraFingerings = [];
            if (alternateFingerings && j === 0)
                extraFingerings = handArray.alts[0] || [];
        
        let l = rh ? 0 : handArray.primary.length - 1; // Flip index for left hand.
        
        notes.push({
            note: `${noteName(currentNote, accidental)}/${currentOctave}`,
            fingering: [handArray.primary[l], ...extraFingerings]
        });

        for (var i = 0;i < pattern.length; i++) {
            // Flip for the left hand.
            let k = rh ? i : pattern.length - 1 - i;
            let l = rh ? k + 1 : k;

            // Optionally advance to the next octave.
            if (currentNote < 3 && (currentNote + pattern[i]) >= 3)
                currentOctave++;
            
            currentNote += pattern[i];
            if (currentNote > 11)
                currentNote -= 12;

            let extraFingerings = [];
            if (alternateFingerings)
                extraFingerings = handArray.alts[l] || [];

            notes.push({
                note: `${noteName(currentNote, accidental)}/${currentOctave}`,
                fingering: [handArray.primary[l], ...extraFingerings]
            });
        }

        if ((j + 1) < octaves)
            notes.pop();
    }

    if (direction === scaleDirection.BOTH)
        notes = [...notes, ...notes.reverse().slice(1)];
    else if (direction === scaleDirection.DESCENDING)
        notes = notes.reverse();

    return notes;
}