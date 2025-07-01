import { useEffect, useRef, useState } from 'react';
import {
  Annotation,
  Barline,
  Renderer,
  Stave,
  StaveNote,
  Voice,
  Formatter,
  Beam,
} from 'vexflow';

export default function CScale() {
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
  
    const stave = new Stave(0, 0, width - 4);
    stave.addClef('treble');
    stave.setEndBarType(Barline.type.DOUBLE);
    stave.setContext(context).draw();
  
    const ascending = ['c/4', 'd/4', 'e/4', 'f/4', 'g/4', 'a/4', 'b/4', 'c/5'];
    const descending = [...ascending].reverse();
  
    const notes = [...ascending, ...descending].map((note, i) => {
      const sn = new StaveNote({ keys: [note], duration: '8' });
      const fingering = new Annotation("1")
        .setFont("Arial", 12)
        .setVerticalJustification(Annotation.VerticalJustify.TOP);
      sn.addModifier(fingering, 0);
      return sn;
    });
  
    const voice = new Voice({ num_beats: 16, beat_value: 8 });
    voice.addTickables(notes);
  
    const beams = Beam.generateBeams(notes);
  
    new Formatter().joinVoices([voice]).format([voice], width - 50);
    voice.draw(context, stave);
    beams.forEach(beam => beam.setContext(context).draw());
  }, []);

  return (
    <div>
      <h2 style={{ textAlign: "center" }}>C Major</h2>
      <div ref={containerRef} style={{
        maxWidth: '960px',
        margin: '0 auto', // Horizontal centering.
      }} />
    </div>
  );
}
