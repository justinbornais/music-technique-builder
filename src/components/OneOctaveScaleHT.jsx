import { useEffect, useRef } from 'react';
import {
  Accidental,
  Annotation,
  Barline,
  Renderer,
  Stave,
  StaveNote,
  StaveConnector,
  Voice,
  Formatter,
  Beam,
} from 'vexflow';
import { scaleTypes, getScaleNotes, accidentals, getKeySignatureLetter, noteName } from '../utilities/noteConversions';
import { generateNotes } from '../utilities/scaleHelpers';

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
    const staveRH = new Stave(20, 0, width - 24);
    staveRH.addClef("treble");
    staveRH.setEndBarType(Barline.type.END);
    if (accidentalChoice !== accidentalChoice.ACCIDENTALS)
        staveRH.addKeySignature(getKeySignatureLetter(scaleKey, scaleType === scaleTypes.MAJOR, accidental));
    staveRH.setContext(context).draw();
  
    const scaleNotesRH = getScaleNotes(parseInt(scaleKey), scaleType, true, 1, accidental, true, false);
    const notesRH = generateNotes(scaleKey, scaleNotesRH, true, "8", accidentalChoice)
  
    const voiceRH = new Voice({ num_beats: notesRH.length + 1, beat_value: 8 });
    voiceRH.addTickables(notesRH);
    const beamsRH = Beam.generateBeams(notesRH);

    // Left hand code.
    const staveLH = new Stave(20, 100, width - 24);
    staveLH.addClef("bass");
    staveLH.setEndBarType(Barline.type.END);
    if (accidentalChoice !== accidentalChoice.ACCIDENTALS)
        staveLH.addKeySignature(getKeySignatureLetter(scaleKey, scaleType === scaleTypes.MAJOR, accidental));
    staveLH.setContext(context).draw();
  
    const scaleNotesLH = getScaleNotes(parseInt(scaleKey), scaleType, false, 1, accidental, true, false);
    const notesLH = generateNotes(scaleKey, scaleNotesLH, false, "8", accidentalChoice);
  
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

    const brace = new StaveConnector(staveRH, staveLH);
    brace.setType(StaveConnector.type.BRACE);
    brace.setContext(context).draw();

    const lineLeft = new StaveConnector(staveRH, staveLH);
    lineLeft.setType(StaveConnector.type.SINGLE_LEFT);
    lineLeft.setContext(context).draw();

    const lineRight = new StaveConnector(staveRH, staveLH);
    lineRight.setType(StaveConnector.type.BOLD_DOUBLE_RIGHT);
    lineRight.setContext(context).draw();
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
