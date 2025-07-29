import { useEffect, useRef } from 'react';
import {
  Accidental,
  Annotation,
  Barline,
  Renderer,
  Stave,
  StaveNote,
  Voice,
  Formatter,
  Beam,
} from 'vexflow';
import { scaleTypes, getScaleNotes, accidentals, getKeySignatureLetter, noteName } from '../utilities/noteConversions';

export default function OneOctaveScaleHT({ scaleKey, scaleType, accidental, accidentalChoice }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const width = 960;
    const div = containerRef.current;
    if (!div) return;
  
    div.innerHTML = '';
  
    const renderer = new Renderer(div, Renderer.Backends.SVG);
    renderer.resize(width, 220);
    const context = renderer.getContext();
    context.setFont('Arial', 10, '').setBackgroundFillStyle('#fff');

    // Right hand code.
    const staveRH = new Stave(0, 0, width - 4);
    staveRH.addClef("treble");
    staveRH.setEndBarType(Barline.type.END);
    if (accidentalChoice !== accidentalChoice.ACCIDENTALS)
        staveRH.addKeySignature(getKeySignatureLetter(scaleKey, scaleType === scaleTypes.MAJOR, accidental));
    staveRH.setContext(context).draw();
  
    const scaleNotesRH = getScaleNotes(parseInt(scaleKey), scaleType, true, 1, accidental, true, false);
  
    const notesRH = [...scaleNotesRH].map((n, i) => {
        let duration = '8';
        if ((i + 1) === scaleNotesRH.length)
            duration = '4';
        const sn = new StaveNote({ keys: [n.note], duration: duration, clef: "treble" });
        const fingering = new Annotation(n.fingering[0])
            .setFont("Arial", 12)
            .setVerticalJustification(Annotation.VerticalJustify.TOP);
        sn.addModifier(fingering, 0);

        if (accidentalChoice !== accidentalChoice.ACCIDENTALS && n.note.includes('#'))
            sn.addModifier(new Accidental('#'), 0);
        if (accidentalChoice !== accidentalChoice.ACCIDENTALS && n.note.includes('b'))
            sn.addModifier(new Accidental('b'), 0);
        return sn;
    });
  
    const voiceRH = new Voice({ num_beats: notesRH.length + 1, beat_value: 8 });
    voiceRH.addTickables(notesRH);
    const beamsRH = Beam.generateBeams(notesRH);

    // Left hand code.
    const staveLH = new Stave(0, 100, width - 4);
    staveLH.addClef("bass");
    staveLH.setEndBarType(Barline.type.END);
    if (accidentalChoice !== accidentalChoice.ACCIDENTALS)
        staveLH.addKeySignature(getKeySignatureLetter(scaleKey, scaleType === scaleTypes.MAJOR, accidental));
    staveLH.setContext(context).draw();
  
    const scaleNotesLH = getScaleNotes(parseInt(scaleKey), scaleType, false, 1, accidental, true, false);
  
    const notesLH = [...scaleNotesLH].map((n, i) => {
        let duration = '8';
        if ((i + 1) === scaleNotesLH.length)
            duration = '4';
        const sn = new StaveNote({ keys: [n.note], duration: duration, clef: "bass" });
        const fingering = new Annotation(n.fingering[0])
            .setFont("Arial", 12)
            .setVerticalJustification(Annotation.VerticalJustify.BOTTOM);
        sn.addModifier(fingering, 0);

        if (accidentalChoice !== accidentalChoice.ACCIDENTALS && n.note.includes('#'))
            sn.addModifier(new Accidental('#'), 0);
        if (accidentalChoice !== accidentalChoice.ACCIDENTALS && n.note.includes('b'))
            sn.addModifier(new Accidental('b'), 0);
        return sn;
    });
  
    const voiceLH = new Voice({ num_beats: notesLH.length + 1, beat_value: 8 });
    voiceLH.addTickables(notesLH);
    const beamsLH = Beam.generateBeams(notesLH);

    const formatter = new Formatter();
    formatter.joinVoices([voiceRH]);
    formatter.joinVoices([voiceLH]);
    formatter.format([voiceRH, voiceLH], width - 100);

    voiceRH.draw(context, staveRH);
    voiceLH.draw(context, staveLH);
    beamsRH.forEach(beam => beam.setContext(context).draw());
    beamsLH.forEach(beam => beam.setContext(context).draw());
  }, []);

  return (
    <div>
      <h2 style={{ textAlign: "center" }}>{`${noteName(scaleKey, accidental)} Major`}</h2>
      <div ref={containerRef} style={{
        maxWidth: '960px',
        margin: '0 auto', // Horizontal centering.
      }} />
    </div>
  );
}
