import { useEffect, useRef } from 'react';
import {
  Annotation,
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
    const div = containerRef.current;
    if (!div) return;
  
    div.innerHTML = '';
  
    const renderer = new Renderer(div, Renderer.Backends.SVG);
    renderer.resize(700, 180);
    const context = renderer.getContext();
    context.setFont('Arial', 10, '').setBackgroundFillStyle('#fff');
    const width = 700;
  
    const stave = new Stave(0, 0);
    stave.setWidth(width);
    stave.addClef('treble');
    stave.setContext(context).draw();
  
    const ascending = ['c/4', 'd/4', 'e/4', 'f/4', 'g/4', 'a/4', 'b/4', 'c/5'];
    const descending = [...ascending].reverse();

    console.log(descending);
  
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
      <h2>C Major Scale (Ascending and Descending)</h2>
      <div ref={containerRef} style={{ border: '1px solid #ccc', padding: '1rem' }} />
    </div>
  );
}
