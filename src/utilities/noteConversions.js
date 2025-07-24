import data from "../assets/techniques.json";

export const accidentals = {
    FLAT: -1,
    NATURAL: 0,
    SHARP: 1,
};

/**
 * Get the note name of a given number, using the `techniques.json` object.
 * @param {*} i The index number.
 * @param {*} accidental The accidental. If natural is given for a non-natural note (i.e. A#/Bb), default to sharp.
 * @returns The note name.
 */
export function noteName(i, accidental = accidentals.NATURAL) {
    const names = data.notes[i];

    if (accidental === accidentals.SHARP)
        return names[0];
    else if (accidental === accidentals.FLAT)
        return names[names.length - 1];
    return names[Math.ceil(names.length / 2) - 1];
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

export function getScaleNotes(key, scaleType, clefs) {
    const scale = getScaleObject(key, scaleType);
}