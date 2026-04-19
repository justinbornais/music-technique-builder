function makeTriadFingerings() {
  return {
    right: {
      rootPosition: [1, 3, 5],
      firstInversion: [1, 2, 5],
      secondInversion: [1, 3, 5],
    },
    left: {
      rootPosition: [5, 3, 1],
      firstInversion: [5, 3, 1],
      secondInversion: [5, 2, 1],
    },
  };
}

export function makeArpeggioFingerings(firstOctave, subsequentOctaves, finalRoot) {
  return {
    firstOctave,
    subsequentOctaves,
    finalRoot,
  };
}

function makeSeventhChordFingerings() {
  return {
    right: {
      rootPosition: [1, 2, 4, 5],
      firstInversion: [1, 2, 4, 5],
      secondInversion: [1, 2, 3, 5],
      thirdInversion: [1, 2, 4, 5],
    },
    left: {
      rootPosition: [5, 4, 2, 1],
      firstInversion: [5, 4, 2, 1],
      secondInversion: [5, 3, 2, 1],
      thirdInversion: [5, 4, 2, 1],
    },
  };
}

function makeTriadArpeggioFingerings() {
  return {
    right: {
      standard: makeArpeggioFingerings([1, 2, 3], [1, 2, 3], 5),
    },
    left: {
      standard: makeArpeggioFingerings([5, 4, 2], [1, 4, 2], 1),
    },
  };
}

function makeSeventhArpeggioFingerings() {
  return {
    right: {
      standard: makeArpeggioFingerings([1, 2, 3, 4], [1, 2, 3, 4], 5),
    },
    left: {
      standard: makeArpeggioFingerings([5, 4, 3, 2], [5, 4, 3, 2], 1),
    },
  };
}

function arpeggioSpec(rightFirst, rightSubsequent, leftFirst, leftSubsequent, rightFinal = 5, leftFinal = 1) {
  return {
    right: {
      standard: makeArpeggioFingerings(rightFirst, rightSubsequent, rightFinal),
    },
    left: {
      standard: makeArpeggioFingerings(leftFirst, leftSubsequent, leftFinal),
    },
  };
}

function triadArpeggioSpec(rootPosition, firstInversion = rootPosition, secondInversion = rootPosition) {
  return {
    rootPosition,
    firstInversion,
    secondInversion,
  };
}

function majorTriadArpeggioKeys() {
  return {
    C: triadArpeggioSpec(
      arpeggioSpec([1, 2, 3], [1, 2, 3], [5, 4, 2], [1, 4, 2]),
      arpeggioSpec([1, 2, 4], [1, 2, 4], [5, 4, 2], [1, 4, 2]),
      arpeggioSpec([1, 2, 4], [1, 2, 4], [5, 3, 2], [1, 3, 2]),
    ),
    'C#': triadArpeggioSpec(
      arpeggioSpec([4, 1, 2], [4, 1, 2], [2, 1, 4], [2, 1, 4], 4, 2),
      arpeggioSpec([1, 2, 4], [1, 2, 4], [5, 4, 2], [1, 4, 2]),
      arpeggioSpec([2, 4, 1], [2, 4, 1], [4, 2, 1], [4, 2, 1], 2, 4),
    ),
    Db: triadArpeggioSpec(
      arpeggioSpec([4, 1, 2], [4, 1, 2], [2, 1, 4], [2, 1, 4], 4, 2),
      arpeggioSpec([1, 2, 4], [1, 2, 4], [5, 4, 2], [1, 4, 2]),
      arpeggioSpec([2, 4, 1], [2, 4, 1], [4, 2, 1], [4, 2, 1], 2, 4),
    ),
    D: triadArpeggioSpec(
      arpeggioSpec([1, 2, 3], [1, 2, 3], [5, 4, 2], [1, 4, 2]),
      arpeggioSpec([4, 1, 2], [4, 1, 2], [3, 2, 1], [3, 2, 1], 4, 3),
      arpeggioSpec([1, 2, 4], [1, 2, 4], [5, 3, 2], [1, 3, 2]),
    ),
    Eb: triadArpeggioSpec(
      arpeggioSpec([4, 1, 2], [4, 1, 2], [2, 1, 4], [2, 1, 4], 4, 2),
      arpeggioSpec([1, 2, 4], [1, 2, 4], [5, 4, 2], [1, 4, 2]),
      arpeggioSpec([2, 4, 1], [2, 4, 1], [4, 2, 1], [4, 2, 1], 2, 4),
    ),
    E: triadArpeggioSpec(
      arpeggioSpec([1, 2, 3], [1, 2, 3], [5, 4, 2], [1, 4, 2]),
      arpeggioSpec([4, 1, 2], [4, 1, 2], [3, 2, 1], [3, 2, 1], 4, 3),
      arpeggioSpec([1, 2, 4], [1, 2, 4], [5, 3, 2], [1, 3, 2]),
    ),
    F: triadArpeggioSpec(
      arpeggioSpec([1, 2, 3], [1, 2, 3], [5, 4, 2], [1, 4, 2]),
      arpeggioSpec([1, 2, 4], [1, 2, 4], [5, 4, 2], [1, 4, 2]),
      arpeggioSpec([1, 2, 4], [1, 2, 4], [5, 3, 2], [1, 3, 2]),
    ),
    'F#': triadArpeggioSpec(
      arpeggioSpec([1, 2, 3], [1, 2, 3], [5, 4, 2], [1, 4, 2]),
      arpeggioSpec([1, 2, 4], [1, 2, 4], [5, 4, 2], [1, 4, 2]),
      arpeggioSpec([1, 2, 4], [1, 2, 4], [5, 3, 2], [1, 3, 2]),
    ),
    Gb: triadArpeggioSpec(
      arpeggioSpec([1, 2, 3], [1, 2, 3], [5, 4, 2], [1, 4, 2]),
      arpeggioSpec([1, 2, 4], [1, 2, 4], [5, 4, 2], [1, 4, 2]),
      arpeggioSpec([1, 2, 4], [1, 2, 4], [5, 3, 2], [1, 3, 2]),
    ),
    G: triadArpeggioSpec(
      arpeggioSpec([1, 2, 3], [1, 2, 3], [5, 4, 2], [1, 4, 2]),
      arpeggioSpec([1, 2, 4], [1, 2, 4], [5, 4, 2], [1, 4, 2]),
      arpeggioSpec([1, 2, 4], [1, 2, 4], [5, 3, 2], [1, 3, 2]),
    ),
    Ab: triadArpeggioSpec(
      arpeggioSpec([4, 1, 2], [4, 1, 2], [2, 1, 4], [2, 1, 4], 4, 2),
      arpeggioSpec([1, 2, 4], [1, 2, 4], [5, 4, 2], [1, 4, 2]),
      arpeggioSpec([2, 4, 1], [2, 4, 1], [4, 2, 1], [4, 2, 1], 2, 4),
    ),
    A: triadArpeggioSpec(
      arpeggioSpec([1, 2, 3], [1, 2, 3], [5, 4, 2], [1, 4, 2]),
      arpeggioSpec([4, 1, 2], [4, 1, 2], [3, 2, 1], [3, 2, 1], 4, 3),
      arpeggioSpec([1, 2, 4], [1, 2, 4], [5, 3, 2], [1, 3, 2]),
    ),
    Bb: triadArpeggioSpec(
      arpeggioSpec([4, 1, 2], [4, 1, 2], [4, 2, 1], [4, 2, 1], 4, 4),
      arpeggioSpec([1, 2, 4], [1, 2, 4], [5, 4, 2], [1, 4, 2]),
      arpeggioSpec([1, 2, 4], [1, 2, 4], [5, 3, 2], [1, 3, 2]),
    ),
    B: triadArpeggioSpec(
      arpeggioSpec([1, 2, 3], [1, 2, 3], [5, 3, 2], [1, 3, 2]),
      arpeggioSpec([2, 3, 1], [2, 3, 1], [3, 2, 1], [3, 2, 1], 2, 3),
      arpeggioSpec([3, 1, 2], [3, 1, 2], [2, 1, 3], [2, 1, 3], 3, 2),
    ),
    Cb: triadArpeggioSpec(
      arpeggioSpec([1, 2, 3], [1, 2, 3], [5, 3, 2], [1, 3, 2]),
      arpeggioSpec([2, 3, 1], [2, 3, 1], [3, 2, 1], [3, 2, 1], 2, 3),
      arpeggioSpec([3, 1, 2], [3, 1, 2], [2, 1, 3], [2, 1, 3], 3, 2),
    ),
  };
}

function minorTriadArpeggioKeys() {
  return {
    C: triadArpeggioSpec(
      arpeggioSpec([1, 2, 3], [1, 2, 3], [5, 4, 2], [1, 4, 2]),
      arpeggioSpec([3, 1, 2], [3, 1, 2], [4, 2, 1], [4, 2, 1], 3, 4),
      arpeggioSpec([1, 2, 4], [1, 2, 4], [5, 3, 2], [1, 3, 2]),
    ),
    'C#': triadArpeggioSpec(
      arpeggioSpec([4, 1, 2], [4, 1, 2], [2, 1, 4], [2, 1, 4], 4, 2),
      arpeggioSpec([1, 2, 4], [1, 2, 4], [5, 4, 2], [1, 4, 2]),
      arpeggioSpec([2, 4, 1], [2, 4, 1], [4, 2, 1], [4, 2, 1], 2, 4),
    ),
    D: triadArpeggioSpec(
      arpeggioSpec([1, 2, 3], [1, 2, 3], [5, 4, 2], [1, 4, 2]),
      arpeggioSpec([1, 2, 4], [1, 2, 4], [5, 4, 2], [1, 4, 2]),
      arpeggioSpec([1, 2, 4], [1, 2, 4], [5, 3, 2], [1, 3, 2]),
    ),
    'D#': triadArpeggioSpec(
      arpeggioSpec([1, 2, 3], [1, 2, 3], [5, 4, 2], [1, 4, 2]),
      arpeggioSpec([1, 2, 4], [1, 2, 4], [5, 4, 2], [1, 4, 2]),
      arpeggioSpec([1, 2, 4], [1, 2, 4], [5, 3, 2], [1, 3, 2]),
    ),
    Eb: triadArpeggioSpec(
      arpeggioSpec([1, 2, 3], [1, 2, 3], [5, 4, 2], [1, 4, 2]),
      arpeggioSpec([1, 2, 4], [1, 2, 4], [5, 4, 2], [1, 4, 2]),
      arpeggioSpec([1, 2, 4], [1, 2, 4], [5, 3, 2], [1, 3, 2]),
    ),
    E: triadArpeggioSpec(
      arpeggioSpec([1, 2, 3], [1, 2, 3], [5, 4, 2], [1, 4, 2]),
      arpeggioSpec([1, 2, 4], [1, 2, 4], [5, 4, 2], [1, 4, 2]),
      arpeggioSpec([1, 2, 4], [1, 2, 4], [5, 3, 2], [1, 3, 2]),
    ),
    F: triadArpeggioSpec(
      arpeggioSpec([1, 2, 3], [1, 2, 3], [5, 4, 2], [1, 4, 2]),
      arpeggioSpec([3, 1, 2], [3, 1, 2], [4, 2, 1], [4, 2, 1], 3, 4),
      arpeggioSpec([1, 2, 4], [1, 2, 4], [5, 3, 2], [1, 3, 2]),
    ),
    'F#': triadArpeggioSpec(
      arpeggioSpec([4, 1, 2], [4, 1, 2], [2, 1, 4], [2, 1, 4], 4, 2),
      arpeggioSpec([1, 2, 4], [1, 2, 4], [5, 4, 2], [1, 4, 2]),
      arpeggioSpec([2, 4, 1], [2, 4, 1], [4, 2, 1], [4, 2, 1], 2, 4),
    ),
    G: triadArpeggioSpec(
      arpeggioSpec([1, 2, 3], [1, 2, 3], [5, 4, 2], [1, 4, 2]),
      arpeggioSpec([3, 1, 2], [3, 1, 2], [4, 2, 1], [4, 2, 1], 3, 4),
      arpeggioSpec([1, 2, 4], [1, 2, 4], [5, 3, 2], [1, 3, 2]),
    ),
    'G#': triadArpeggioSpec(
      arpeggioSpec([4, 1, 2], [4, 1, 2], [2, 1, 4], [2, 1, 4], 4, 2),
      arpeggioSpec([1, 2, 4], [1, 2, 4], [5, 4, 2], [1, 4, 2]),
      arpeggioSpec([2, 4, 1], [2, 4, 1], [4, 2, 1], [4, 2, 1], 2, 4),
    ),
    Ab: triadArpeggioSpec(
      arpeggioSpec([4, 1, 2], [4, 1, 2], [2, 1, 4], [2, 1, 4], 4, 2),
      arpeggioSpec([1, 2, 4], [1, 2, 4], [5, 4, 2], [1, 4, 2]),
      arpeggioSpec([2, 4, 1], [2, 4, 1], [4, 2, 1], [4, 2, 1], 2, 4),
    ),
    A: triadArpeggioSpec(
      arpeggioSpec([1, 2, 3], [1, 2, 3], [5, 4, 2], [1, 4, 2]),
      arpeggioSpec([1, 2, 4], [1, 2, 4], [5, 4, 2], [1, 4, 2]),
      arpeggioSpec([1, 2, 4], [1, 2, 4], [5, 3, 2], [1, 3, 2]),
    ),
    'A#': triadArpeggioSpec(
      arpeggioSpec([2, 3, 1], [2, 3, 1], [3, 2, 1], [3, 2, 1], 2, 3),
      arpeggioSpec([3, 1, 2], [3, 1, 2], [2, 1, 3], [2, 1, 3], 3, 2),
      arpeggioSpec([1, 2, 3], [1, 2, 3], [5, 3, 2], [1, 3, 2]),
    ),
    Bb: triadArpeggioSpec(
      arpeggioSpec([2, 3, 1], [2, 3, 1], [3, 2, 1], [3, 2, 1], 2, 3),
      arpeggioSpec([3, 1, 2], [3, 1, 2], [2, 1, 3], [2, 1, 3], 3, 2),
      arpeggioSpec([1, 2, 3], [1, 2, 3], [5, 3, 2], [1, 3, 2]),
    ),
    B: triadArpeggioSpec(
      arpeggioSpec([1, 2, 3], [1, 2, 3], [5, 4, 2], [1, 4, 2]),
      arpeggioSpec([1, 2, 4], [1, 2, 4], [5, 4, 2], [1, 4, 2]),
      arpeggioSpec([3, 1, 2], [3, 1, 2], [2, 1, 4], [2, 1, 4], 3, 2),
    ),
  };
}

// Fill this section with the finished fingering rules as you settle them.
// Arpeggio entries can use the legacy hand-level shape or an inversion-level
// shape, for example { rootPosition: arpeggioSpec(...), firstInversion: ... }.
// The generator reads these values today, using conservative defaults so the
// page continues to render while the full table is being authored.
export const FINGERING_DEFINITIONS = {
  triads: {
    major: makeTriadFingerings(),
    minor: makeTriadFingerings(),
    diminished: makeTriadFingerings(),
    augmented: makeTriadFingerings(),
  },
  seventhChords: {
    major7: makeSeventhChordFingerings(),
    dominant7: makeSeventhChordFingerings(),
    minor7: makeSeventhChordFingerings(),
    halfDiminished7: makeSeventhChordFingerings(),
    diminished7: makeSeventhChordFingerings(),
  },
  triadArpeggios: {
    major: {
      default: makeTriadArpeggioFingerings(),
      keys: majorTriadArpeggioKeys(),
    },
    minor: {
      default: makeTriadArpeggioFingerings(),
      keys: minorTriadArpeggioKeys(),
    },
    diminished: {
      default: makeTriadArpeggioFingerings(),
      keys: {},
    },
    augmented: {
      default: makeTriadArpeggioFingerings(),
      keys: {},
    },
  },
  seventhArpeggios: {
    major7: {
      default: makeSeventhArpeggioFingerings(),
      keys: {},
    },
    dominant7: {
      default: makeSeventhArpeggioFingerings(),
      keys: {},
    },
    minor7: {
      default: makeSeventhArpeggioFingerings(),
      keys: {},
    },
    halfDiminished7: {
      default: makeSeventhArpeggioFingerings(),
      keys: {},
    },
    diminished7: {
      default: makeSeventhArpeggioFingerings(),
      keys: {},
    },
  },
};
