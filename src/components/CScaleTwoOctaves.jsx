import { useEffect, useRef, useState } from 'react';
import {
  Annotation,
  Barline,
  Renderer,
  Stave,
  StaveNote,
  ClefNote,
  Voice,
  Formatter,
  Beam,
} from 'vexflow';

export default function CScaleTwoStaves() {
  const containerRef = useRef(null);

  useEffect(() => {
    const width = 960;
    const div = containerRef.current;
    if (!div) return;
  
    div.innerHTML = '';
  
    const renderer = new Renderer(div, Renderer.Backends.SVG);
    renderer.resize(width, 240);
    const context = renderer.getContext();
    context.setFont('Arial', 10, '').setBackgroundFillStyle('#fff');
  
    // Treble Clef.
    const trebleStaff = new Stave(0, 0, width - 4); // Subtract 4 to fit double barline.
    trebleStaff.addClef('treble');
    trebleStaff.setEndBarType(Barline.type.END);
    trebleStaff.setContext(context).draw();
  
    const tascending = ['c/4', 'd/4', 'e/4', 'f/4', 'g/4', 'a/4', 'b/4', 'c/5', 'd/5', 'e/5', 'f/5', 'g/5', 'a/5', 'b/5', 'c/6'];
    const tdescending = [...tascending].reverse();
  
    const trebleNotes = [...tascending, ...tdescending].map((note) => {
      const sn = new StaveNote({ keys: [note], duration: '16' });
      const fingering = new Annotation("1")
        .setFont("Arial", 12)
        .setVerticalJustification(Annotation.VerticalJustify.TOP);
      sn.addModifier(fingering, 0);
      return sn;
    });
  
    const trebleVoice = new Voice({ num_beats: 16, beat_value: 8 });
    trebleVoice.setStrict(false);
    trebleVoice.addTickables(trebleNotes);
  
    const trebleBeams = Beam.generateBeams(trebleNotes);

    // Bass Clef.
    const bassStaff = new Stave(0, 100, width - 4);
    bassStaff.addClef('bass');
    bassStaff.setEndBarType(Barline.type.END);
    bassStaff.setContext(context).draw();
  
    const bassAscending = ['c/3', 'd/3', 'e/3', 'f/3', 'g/3', 'a/3', 'b/3', 'c/4', 'd/4', 'e/4', 'f/4', 'g/4', 'a/4', 'b/4', 'c/5'];
    const bassDescending = [...bassAscending].reverse();
  
    const bassNotes = [];
    [...bassAscending, ...bassDescending].forEach((note, i) => {
      if (i === 8)
        bassNotes.push(new ClefNote('treble', "small"));
      if (i === 22)
        bassNotes.push(new ClefNote('bass', "small"));
      
      const clef = i < 8 || i >= 22 ? "bass" : "treble";
      const sn = new StaveNote({ keys: [note], duration: '16', clef: clef});
      const fingering = new Annotation("1")
        .setFont("Arial", 12)
        .setVerticalJustification(Annotation.VerticalJustify.BOTTOM);
      sn.addModifier(fingering, 0);

      bassNotes.push(sn);
    });
  
    const bassVoice = new Voice({ num_beats: 16, beat_value: 8 });
    bassVoice.setStrict(false);
    bassVoice.addTickables(bassNotes);
  
    const bassBeams = Beam.generateBeams(bassNotes);

    const formatter = new Formatter();
    formatter.joinVoices([trebleVoice]).format([trebleVoice], width - 75);
    formatter.joinVoices([bassVoice]).format([bassVoice], width - 75);

    trebleVoice.draw(context, trebleStaff);
    trebleBeams.forEach((beam) => beam.setContext(context).draw());

    bassVoice.draw(context, bassStaff);
    bassBeams.forEach((beam) => beam.setContext(context).draw());
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
