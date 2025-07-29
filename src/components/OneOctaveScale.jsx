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

export default function OneOctaveScale({ scaleKey, scaleType, rightHand, accidental, accidentalChoice }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const width = 960;
    const div = containerRef.current;
    if (!div) return;
  
    div.innerHTML = '';
  
    const renderer = new Renderer(div, Renderer.Backends.SVG);
    renderer.resize(width, 100);
    const context = renderer.getContext();
    context.setFont('Arial', 10, '').setBackgroundFillStyle('#fff');
  
    let clef = rightHand ? "treble" : "bass";

    const stave = new Stave(0, 0, width - 4);
    stave.addClef(clef);
    stave.setEndBarType(Barline.type.END);
    if (accidentalChoice !== accidentalChoice.ACCIDENTALS)
        stave.addKeySignature(getKeySignatureLetter(scaleKey, scaleType === scaleTypes.MAJOR, accidental));
    stave.setContext(context).draw();
  
    const scaleNotes = getScaleNotes(parseInt(scaleKey), scaleType,rightHand, 1, accidental, true, false);
  
    const notes = [...scaleNotes].map((n, i) => {
        let duration = '8';
        if ((i + 1) === scaleNotes.length)
            duration = '4';
        const sn = new StaveNote({ keys: [n.note], duration: duration, clef: clef });
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
  
    const voice = new Voice({ num_beats: notes.length + 1, beat_value: 8 });
    voice.addTickables(notes);
  
    const beams = Beam.generateBeams(notes);
  
    new Formatter().joinVoices([voice]).format([voice], width - 100);
    voice.draw(context, stave);
    beams.forEach(beam => beam.setContext(context).draw());
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
