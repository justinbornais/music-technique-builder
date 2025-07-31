import { useEffect, useRef } from 'react';
import {
  Barline,
  Renderer,
  Stave,
  Voice,
  Formatter,
  Beam,
} from 'vexflow';
import { scaleTypes, getScaleNotes, accidentals, getKeySignatureLetter, noteName } from '../utilities/noteConversions';
import { generateNotes } from '../utilities/scaleHelpers';

export default function OneOctaveScale({ scaleKey, scaleType, rightHand, accidental, accidentalChoice }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const width = 960;
    const div = containerRef.current;
    if (!div) return;
  
    div.innerHTML = '';
  
    const renderer = new Renderer(div, Renderer.Backends.SVG);
    renderer.resize(width, 120);
    const context = renderer.getContext();
    context.setBackgroundFillStyle('#fff');
  
    let clef = rightHand ? "treble" : "bass";

    const stave = new Stave(0, rightHand ? 0 : -10, width - 4);
    stave.addClef(clef);
    stave.setEndBarType(Barline.type.END);
    if (accidentalChoice !== accidentalChoice.ACCIDENTALS)
        stave.addKeySignature(getKeySignatureLetter(scaleKey, scaleType === scaleTypes.MAJOR, accidental));
    stave.setContext(context).draw();
  
    const scaleNotes = getScaleNotes(parseInt(scaleKey), scaleType, rightHand, 1, accidental, true, false);
    const notes = generateNotes(scaleKey, scaleNotes, rightHand, '8', accidentalChoice);
  
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
