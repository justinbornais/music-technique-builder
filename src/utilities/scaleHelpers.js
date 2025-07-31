import {
    Accidental,
    Annotation,
    StaveNote,
} from 'vexflow';
import { accidentals } from "../utilities/noteConversions";

export function generateNotes(key, scaleNotes, rh, duration, accidentalChoice) {
    let notes = [];
    const fingeringPos = rh ? Annotation.VerticalJustify.TOP : Annotation.VerticalJustify.BOTTOM;
    const changeClef = !rh && ([...scaleNotes].length > 16) && (key >= 1) && (key < 10);

    [...scaleNotes].forEach((n, i) => {
        let clef = changeClef && (i < 8 || i >= 22) ? "bass" : "treble";
        if (!changeClef)
            clef = rh ? "treble" : "bass";
        
        if ((i + 1) === scaleNotes.length)
            duration = '4';
        
        const sn = new StaveNote({ keys: [n.note], duration: duration, clef: clef });

        const fingering = new Annotation(n.fingering[0])
            .setFont("Arial", 12)
            .setVerticalJustification(fingeringPos);
        sn.addModifier(fingering, 0);
    
        if (accidentalChoice !== accidentalChoice.ACCIDENTALS && n.note.includes('#'))
            sn.addModifier(new Accidental('#'), 0);
        if (accidentalChoice !== accidentalChoice.ACCIDENTALS && n.note.includes('b'))
            sn.addModifier(new Accidental('b'), 0);
    
        notes.push(sn);
    });

    return notes;
}