import { scaleTypes } from './noteConversions.js';
import {
  DEFAULT_COLLECTION_SETTINGS,
  DEFAULT_SETTINGS,
  DIRECTIONS,
  DOUBLE_BARLINE_SEPARATOR,
  HANDS,
  RENDER_MODES,
  TECHNIQUE_TYPES,
} from './techniqueGenerator.js';

const SCALE_LABELS = {
  [scaleTypes.MAJOR]: 'Major',
  [scaleTypes.MINOR_N]: 'Natural Minor',
  [scaleTypes.MINOR_H]: 'Harmonic Minor',
  [scaleTypes.MINOR_M]: 'Melodic Minor',
};

const TRIAD_LABELS = {
  major: 'Major',
  minor: 'Minor',
};

const SEVENTH_LABELS = {
  dominant7: 'Dominant 7th',
  diminished7: 'Diminished 7th',
};

const RCM_PRESET_DEFINITIONS = [
  {
    id: 'rcm:level-1',
    label: 'Level 1',
    title: 'RCM Level 1 Requirements',
    buildEntries: buildLevel1Entries,
  },
  {
    id: 'rcm:level-2',
    label: 'Level 2',
    title: 'RCM Level 2 Requirements',
    buildEntries: buildLevel2Entries,
  },
  {
    id: 'rcm:level-3',
    label: 'Level 3',
    title: 'RCM Level 3 Requirements',
    buildEntries: buildLevel3Entries,
  },
  {
    id: 'rcm:level-4',
    label: 'Level 4',
    title: 'RCM Level 4 Requirements',
    buildEntries: buildLevel4Entries,
  },
  {
    id: 'rcm:level-5',
    label: 'Level 5',
    title: 'RCM Level 5 Requirements',
    buildEntries: buildLevel5Entries,
  },
  {
    id: 'rcm:level-6',
    label: 'Level 6',
    title: 'RCM Level 6 Requirements',
    buildEntries: buildLevel6Entries,
  },
  {
    id: 'rcm:level-7',
    label: 'Level 7',
    title: 'RCM Level 7 Requirements',
    buildEntries: buildLevel7Entries,
  },
  {
    id: 'rcm:level-8',
    label: 'Level 8',
    title: 'RCM Level 8 Requirements',
    buildEntries: buildLevel8Entries,
  },
  {
    id: 'rcm:level-9',
    label: 'Level 9',
    title: 'RCM Level 9 Requirements',
    buildEntries: buildLevel9Entries,
  },
  {
    id: 'rcm:level-10',
    label: 'Level 10',
    title: 'RCM Level 10 Requirements',
    buildEntries: buildLevel10Entries,
  },
];

export const RCM_PRESET_OPTIONS = RCM_PRESET_DEFINITIONS.map(({ id, label }) => ({
  value: id,
  label,
}));

export function isRcmPreset(presetId) {
  return String(presetId).startsWith('rcm:');
}

export function buildRcmPresetSettings(presetId, sharedSettings = {}) {
  const definition = RCM_PRESET_DEFINITIONS.find((candidate) => candidate.id === presetId)
    ?? RCM_PRESET_DEFINITIONS[0];
  const entryDefaults = rcmEntryDefaults(sharedSettings);

  return {
    ...DEFAULT_COLLECTION_SETTINGS,
    title: definition.title,
    renderMode: entryDefaults.renderMode,
    displayScale: entryDefaults.displayScale,
    showFingerings: entryDefaults.showFingerings,
    showDetails: Boolean(sharedSettings.showDetails),
    customEntries: definition.buildEntries(entryDefaults),
  };
}

function rcmEntryDefaults(sharedSettings) {
  return {
    renderMode: sharedSettings.renderMode ?? RENDER_MODES.KEY_SIGNATURE,
    displayScale: sharedSettings.displayScale ?? DEFAULT_SETTINGS.displayScale,
    showFingerings: sharedSettings.showFingerings ?? DEFAULT_SETTINGS.showFingerings,
  };
}

function makeBaseSettings(shared, overrides) {
  return {
    ...DEFAULT_SETTINGS,
    renderMode: shared.renderMode,
    displayScale: shared.displayScale,
    showFingerings: shared.showFingerings,
    direction: DIRECTIONS.BOTH,
    ...overrides,
  };
}

function majorScaleEntries(shared, keys, octaves, hand, duration) {
  return keys.map((key) => singleEntry(
    makeBaseSettings(shared, {
      technique: TECHNIQUE_TYPES.SCALE,
      key,
      scaleType: scaleTypes.MAJOR,
      octaves,
      hand,
      duration,
    }),
    `${key} Major Scale`,
  ));
}

function minorScaleEntries(shared, keys, scaleTypeValues, octaves, hand, duration) {
  return keys.flatMap((key) => scaleTypeValues.map((scaleType) => singleEntry(
    makeBaseSettings(shared, {
      technique: TECHNIQUE_TYPES.SCALE,
      key,
      scaleType,
      octaves,
      hand,
      duration,
    }),
    `${key} ${SCALE_LABELS[scaleType]} Scale`,
  )));
}

function contraryMotionEntries(shared, keysByScaleType, hand, duration) {
  return Object.entries(keysByScaleType).flatMap(([scaleType, keys]) => keys.map((key) => singleEntry(
    makeBaseSettings(shared, {
      technique: TECHNIQUE_TYPES.CONTRARY_MOTION_SCALE,
      key,
      scaleType,
      hand,
      duration,
    }),
    `${key} ${SCALE_LABELS[scaleType]} Contrary Motion Scale`,
  )));
}

function chromaticEntries(shared, keys, octaves, hand, duration) {
  return keys.map((key) => singleEntry(
    makeBaseSettings(shared, {
      technique: TECHNIQUE_TYPES.CHROMATIC,
      key,
      octaves,
      hand,
      duration,
    }),
    `${key} Chromatic Scale`,
  ));
}

function triadEntries(shared, {
  majorKeys,
  minorKeys,
  octaves,
  hand,
  brokenDuration,
  solidDuration,
  solidWithRest,
}) {
  return [
    ...majorKeys.map((key) => groupedTriadEntry(shared, key, 'major', octaves, hand, brokenDuration, solidDuration, solidWithRest)),
    ...minorKeys.map((key) => groupedTriadEntry(shared, key, 'minor', octaves, hand, brokenDuration, solidDuration, solidWithRest)),
  ];
}

function fourNoteChordEntries(shared, {
  majorKeys,
  minorKeys,
  octaves,
  hand,
  brokenDuration,
  solidDuration,
  solidWithRest = false,
  brokenOnly = false,
}) {
  return [
    ...majorKeys.map((key) => chordEntry(shared, {
      key,
      quality: 'major',
      title: `${key} Major 4 Note Chords`,
      octaves,
      hand,
      brokenDuration,
      solidDuration,
      solidWithRest,
      brokenOnly,
      technique: TECHNIQUE_TYPES.FOUR_NOTE_CHORD,
      qualityKey: 'fourNoteChordQuality',
    })),
    ...minorKeys.map((key) => chordEntry(shared, {
      key,
      quality: 'minor',
      title: `${key} Minor 4 Note Chords`,
      octaves,
      hand,
      brokenDuration,
      solidDuration,
      solidWithRest,
      brokenOnly,
      technique: TECHNIQUE_TYPES.FOUR_NOTE_CHORD,
      qualityKey: 'fourNoteChordQuality',
    })),
  ];
}

function seventhChordEntries(shared, {
  dominantKeys,
  diminishedKeys,
  octaves,
  hand,
  brokenDuration,
  solidDuration,
  solidWithRest = false,
}) {
  return [
    ...dominantKeys.flatMap((key) => separatedSeventhEntries(
      shared,
      key,
      'dominant7',
      octaves,
      hand,
      brokenDuration,
      solidDuration,
      solidWithRest,
    )),
    ...diminishedKeys.flatMap((key) => separatedSeventhEntries(
      shared,
      key,
      'diminished7',
      octaves,
      hand,
      brokenDuration,
      solidDuration,
      solidWithRest,
    )),
  ];
}

function triadArpeggioEntries(shared, {
  majorKeys,
  minorKeys,
  octaves,
  hand,
  duration,
  includeInversions,
}) {
  return [
    ...majorKeys.map((key) => arpeggioEntry(shared, {
      key,
      arpeggioQuality: 'triad-major',
      title: `${key} Major Triad Arpeggio`,
      octaves,
      hand,
      duration,
      includeInversions,
    })),
    ...minorKeys.map((key) => arpeggioEntry(shared, {
      key,
      arpeggioQuality: 'triad-minor',
      title: `${key} Minor Triad Arpeggio`,
      octaves,
      hand,
      duration,
      includeInversions,
    })),
  ];
}

function seventhArpeggioEntries(shared, {
  dominantKeys,
  diminishedKeys,
  octaves,
  hand,
  duration,
  includeInversions,
}) {
  return [
    ...dominantKeys.map((key) => arpeggioEntry(shared, {
      key,
      arpeggioQuality: 'seventh-dominant7',
      title: `${key} Dominant 7th Arpeggio`,
      octaves,
      hand,
      duration,
      includeInversions,
    })),
    ...diminishedKeys.map((key) => arpeggioEntry(shared, {
      key,
      arpeggioQuality: 'seventh-diminished7',
      title: `${key} Diminished 7th Arpeggio`,
      octaves,
      hand,
      duration,
      includeInversions,
    })),
  ];
}

function singleEntry(settings, title) {
  return { settings, title };
}

function groupedTriadEntry(shared, key, quality, octaves, hand, brokenDuration, solidDuration, solidWithRest) {
  const title = `${key} ${TRIAD_LABELS[quality]} Triads`;
  const broken = makeBaseSettings(shared, {
    technique: TECHNIQUE_TYPES.ARPEGGIO,
    key,
    arpeggioQuality: `triad-${quality}`,
    brokenChord: true,
    explicitOctaves: octaves,
    hand,
    duration: brokenDuration,
  });
  const solid = makeBaseSettings(shared, {
    technique: TECHNIQUE_TYPES.TRIAD,
    key,
    triadQuality: quality,
    explicitOctaves: octaves,
    hand,
    duration: solidDuration,
    ...(solidWithRest ? { solidChordRest: true } : {}),
  });

  return {
    settings: solid,
    settingsGroup: [broken, solid],
    techniqueCount: 2,
    title,
    groupSeparator: DOUBLE_BARLINE_SEPARATOR,
  };
}

function chordEntry(shared, {
  key,
  quality,
  title,
  octaves,
  hand,
  brokenDuration,
  solidDuration,
  solidWithRest,
  brokenOnly,
  technique,
  qualityKey,
}) {
  const broken = makeBaseSettings(shared, {
    technique,
    key,
    [qualityKey]: quality,
    brokenChord: true,
    explicitOctaves: octaves,
    hand,
    duration: brokenDuration,
  });

  if (brokenOnly) {
    return singleEntry(broken, `${title} - Broken`);
  }

  const solid = makeBaseSettings(shared, {
    technique,
    key,
    [qualityKey]: quality,
    explicitOctaves: octaves,
    hand,
    duration: solidDuration,
    ...(solidWithRest ? { solidChordRest: true } : {}),
  });

  return {
    settings: solid,
    settingsGroup: [broken, solid],
    techniqueCount: 2,
    title,
    groupSeparator: DOUBLE_BARLINE_SEPARATOR,
  };
}

function separatedSeventhEntries(shared, key, quality, octaves, hand, brokenDuration, solidDuration, solidWithRest) {
  const title = `${key} ${SEVENTH_LABELS[quality]}`;
  const broken = makeBaseSettings(shared, {
    technique: TECHNIQUE_TYPES.ARPEGGIO,
    key,
    arpeggioQuality: `seventh-${quality}`,
    brokenChord: true,
    explicitOctaves: octaves,
    hand,
    duration: brokenDuration,
  });
  const solid = makeBaseSettings(shared, {
    technique: TECHNIQUE_TYPES.SEVENTH,
    key,
    seventhQuality: quality,
    explicitOctaves: octaves,
    hand,
    duration: solidDuration,
    ...(solidWithRest ? { solidChordRest: true } : {}),
  });

  return [
    singleEntry(broken, `${title} - Broken`),
    singleEntry(solid, `${title} - Solid`),
  ];
}

function arpeggioEntry(shared, {
  key,
  arpeggioQuality,
  title,
  octaves,
  hand,
  duration,
  includeInversions,
}) {
  const root = makeBaseSettings(shared, {
    technique: TECHNIQUE_TYPES.ARPEGGIO,
    key,
    arpeggioQuality,
    explicitOctaves: octaves,
    hand,
    duration,
  });

  if (!includeInversions) {
    return singleEntry(root, title);
  }

  const chordSize = arpeggioQuality.startsWith('seventh-') ? 4 : 3;
  const inversions = Array.from({ length: chordSize }, (_, arpeggioInversion) => ({
    ...root,
    arpeggioInversion,
  }));

  if (chordSize === 4) {
    return {
      settings: root,
      settingsLines: [inversions.slice(0, 2), inversions.slice(2, 4)],
      techniqueCount: inversions.length,
      title,
    };
  }

  return {
    settings: root,
    settingsGroup: inversions,
    techniqueCount: inversions.length,
    title,
  };
}

function buildLevel1Entries(shared) {
  return [
    ...majorScaleEntries(shared, ['C', 'G', 'F'], 2, HANDS.SEPARATE, 8),
    ...minorScaleEntries(shared, ['A', 'E', 'D'], [scaleTypes.MINOR_N, scaleTypes.MINOR_H], 2, HANDS.SEPARATE, 8),
    ...contraryMotionEntries(shared, { [scaleTypes.MAJOR]: ['C'] }, HANDS.TOGETHER, 8),
    ...chromaticEntries(shared, ['C'], 1, HANDS.SEPARATE, 8),
    ...triadEntries(shared, {
      majorKeys: ['C', 'G', 'F'],
      minorKeys: ['A', 'E', 'D'],
      octaves: 1,
      hand: HANDS.SEPARATE,
      brokenDuration: 8,
      solidDuration: 4,
      solidWithRest: true,
    }),
  ];
}

function buildLevel2Entries(shared) {
  return [
    ...majorScaleEntries(shared, ['G', 'F', 'Bb'], 2, HANDS.SEPARATE, 8),
    ...minorScaleEntries(shared, ['E', 'D', 'G'], [scaleTypes.MINOR_H, scaleTypes.MINOR_M], 2, HANDS.SEPARATE, 8),
    ...contraryMotionEntries(shared, { [scaleTypes.MAJOR]: ['C', 'G'] }, HANDS.TOGETHER, 8),
    ...chromaticEntries(shared, ['G'], 1, HANDS.SEPARATE, 8),
    ...triadEntries(shared, {
      majorKeys: ['G', 'F', 'Bb'],
      minorKeys: ['E', 'D', 'G'],
      octaves: 1,
      hand: HANDS.SEPARATE,
      brokenDuration: 8,
      solidDuration: 4,
      solidWithRest: true,
    }),
  ];
}

function buildLevel3Entries(shared) {
  return [
    ...majorScaleEntries(shared, ['D', 'F', 'Bb'], 2, HANDS.TOGETHER, 8),
    ...minorScaleEntries(shared, ['B', 'D', 'G'], [scaleTypes.MINOR_H, scaleTypes.MINOR_M], 2, HANDS.TOGETHER, 8),
    ...contraryMotionEntries(shared, { [scaleTypes.MAJOR]: ['D'] }, HANDS.TOGETHER, 8),
    ...chromaticEntries(shared, ['D'], 1, HANDS.SEPARATE, 8),
    ...triadEntries(shared, {
      majorKeys: ['D', 'F', 'Bb'],
      minorKeys: ['B', 'D', 'G'],
      octaves: 2,
      hand: HANDS.SEPARATE,
      brokenDuration: 8,
      solidDuration: 4,
      solidWithRest: true,
    }),
  ];
}

function buildLevel4Entries(shared) {
  return [
    ...majorScaleEntries(shared, ['D', 'A', 'Bb', 'Eb'], 2, HANDS.TOGETHER, 8),
    ...minorScaleEntries(shared, ['B', 'G', 'C'], [scaleTypes.MINOR_H, scaleTypes.MINOR_M], 2, HANDS.TOGETHER, 8),
    ...contraryMotionEntries(shared, { [scaleTypes.MINOR_H]: ['C'] }, HANDS.TOGETHER, 8),
    ...chromaticEntries(shared, ['C'], 1, HANDS.SEPARATE, 8),
    ...triadEntries(shared, {
      majorKeys: ['D', 'A', 'Bb', 'Eb'],
      minorKeys: ['B', 'G', 'C'],
      octaves: 2,
      hand: HANDS.TOGETHER,
      brokenDuration: 8,
      solidDuration: 4,
      solidWithRest: true,
    }),
    ...triadArpeggioEntries(shared, {
      majorKeys: ['D', 'A', 'Bb', 'Eb'],
      minorKeys: ['B', 'G', 'C'],
      octaves: 2,
      hand: HANDS.SEPARATE,
      duration: 8,
      includeInversions: false,
    }),
  ];
}

function buildLevel5Entries(shared) {
  return [
    ...majorScaleEntries(shared, ['A', 'E', 'F', 'Ab'], 2, HANDS.TOGETHER, 8),
    ...minorScaleEntries(shared, ['A', 'E', 'F'], [scaleTypes.MINOR_H, scaleTypes.MINOR_M], 2, HANDS.TOGETHER, 8),
    ...contraryMotionEntries(shared, {
      [scaleTypes.MAJOR]: ['A'],
      [scaleTypes.MINOR_H]: ['A'],
    }, HANDS.TOGETHER, 8),
    ...chromaticEntries(shared, ['A', 'F'], 1, HANDS.TOGETHER, 8),
    ...triadEntries(shared, {
      majorKeys: ['A', 'E', 'F', 'Ab'],
      minorKeys: ['A', 'E', 'F'],
      octaves: 2,
      hand: HANDS.TOGETHER,
      brokenDuration: 8,
      solidDuration: 4,
      solidWithRest: false,
    }),
    ...seventhChordEntries(shared, {
      dominantKeys: ['A', 'E', 'F', 'Ab'],
      diminishedKeys: [],
      octaves: 1,
      hand: HANDS.SEPARATE,
      brokenDuration: 8,
      solidDuration: 4,
    }),
    ...triadArpeggioEntries(shared, {
      majorKeys: ['A', 'E', 'F', 'Ab'],
      minorKeys: ['A', 'E', 'F'],
      octaves: 2,
      hand: HANDS.SEPARATE,
      duration: 8,
      includeInversions: false,
    }),
  ];
}

function buildLevel6Entries(shared) {
  return [
    ...majorScaleEntries(shared, ['G', 'E', 'B', 'Bb'], 2, HANDS.TOGETHER, 16),
    ...minorScaleEntries(shared, ['G', 'E', 'B', 'C#'], [scaleTypes.MINOR_H, scaleTypes.MINOR_M], 2, HANDS.TOGETHER, 16),
    ...contraryMotionEntries(shared, {
      [scaleTypes.MAJOR]: ['E'],
      [scaleTypes.MINOR_H]: ['E'],
    }, HANDS.TOGETHER, 16),
    ...chromaticEntries(shared, ['E', 'Db'], 2, HANDS.TOGETHER, 16),
    ...triadEntries(shared, {
      majorKeys: ['G', 'E', 'B', 'Db'],
      minorKeys: ['G', 'E', 'B', 'C#'],
      octaves: 2,
      hand: HANDS.TOGETHER,
      brokenDuration: 8,
      solidDuration: 4,
      solidWithRest: false,
    }),
    ...seventhChordEntries(shared, {
      dominantKeys: ['G', 'E', 'B', 'Db'],
      diminishedKeys: ['G', 'E', 'B', 'C#'],
      octaves: 1,
      hand: HANDS.SEPARATE,
      brokenDuration: 8,
      solidDuration: 4,
    }),
    ...triadArpeggioEntries(shared, {
      majorKeys: ['G', 'E', 'B', 'Db'],
      minorKeys: ['G', 'E', 'B', 'C#'],
      octaves: 2,
      hand: HANDS.SEPARATE,
      duration: 8,
      includeInversions: false,
    }),
    ...seventhArpeggioEntries(shared, {
      dominantKeys: ['G', 'E', 'B', 'Db'],
      diminishedKeys: ['G', 'E', 'B', 'C#'],
      octaves: 2,
      hand: HANDS.SEPARATE,
      duration: 8,
      includeInversions: false,
    }),
  ];
}

function buildLevel7Entries(shared) {
  return [
    ...majorScaleEntries(shared, ['C', 'D', 'F', 'Ab', 'Gb'], 2, HANDS.TOGETHER, 16),
    ...minorScaleEntries(shared, ['C', 'D', 'F', 'G#', 'F#'], [scaleTypes.MINOR_H, scaleTypes.MINOR_M], 2, HANDS.TOGETHER, 16),
    ...contraryMotionEntries(shared, {
      [scaleTypes.MAJOR]: ['D'],
      [scaleTypes.MINOR_H]: ['D'],
    }, HANDS.TOGETHER, 16),
    ...chromaticEntries(shared, ['D', 'Gb'], 2, HANDS.TOGETHER, 16),
    ...fourNoteChordEntries(shared, {
      majorKeys: ['C', 'D', 'F', 'Ab', 'Gb'],
      minorKeys: ['C', 'D', 'F', 'G#', 'F#'],
      octaves: 1,
      hand: HANDS.TOGETHER,
      brokenDuration: 16,
      solidDuration: 4,
      brokenOnly: true,
    }),
    ...seventhChordEntries(shared, {
      dominantKeys: ['C', 'D', 'F', 'Ab', 'Gb'],
      diminishedKeys: ['C', 'D', 'F', 'G#', 'F#'],
      octaves: 1,
      hand: HANDS.TOGETHER,
      brokenDuration: 16,
      solidDuration: 4,
    }),
    ...triadArpeggioEntries(shared, {
      majorKeys: ['C', 'D', 'F', 'Ab', 'Gb'],
      minorKeys: ['C', 'D', 'F', 'G#', 'F#'],
      octaves: 2,
      hand: HANDS.TOGETHER,
      duration: 16,
      includeInversions: true,
    }),
    ...seventhArpeggioEntries(shared, {
      dominantKeys: ['C', 'D', 'F', 'Ab', 'Gb'],
      diminishedKeys: ['C', 'D', 'F', 'G#', 'F#'],
      octaves: 2,
      hand: HANDS.TOGETHER,
      duration: 16,
      includeInversions: false,
    }),
  ];
}

function buildLevel8Entries(shared) {
  return [
    ...majorScaleEntries(shared, ['C', 'D', 'E', 'Bb', 'Eb', 'Gb'], 2, HANDS.TOGETHER, 16),
    ...minorScaleEntries(shared, ['C', 'D', 'E', 'Bb', 'Eb', 'F#'], [scaleTypes.MINOR_H, scaleTypes.MINOR_M], 2, HANDS.TOGETHER, 16),
    ...contraryMotionEntries(shared, {
      [scaleTypes.MAJOR]: ['Eb'],
      [scaleTypes.MINOR_H]: ['Eb'],
    }, HANDS.TOGETHER, 16),
    ...chromaticEntries(shared, ['Eb', 'E'], 2, HANDS.TOGETHER, 16),
    ...fourNoteChordEntries(shared, {
      majorKeys: ['C', 'D', 'E', 'Bb', 'Eb', 'Gb'],
      minorKeys: ['C', 'D', 'E', 'Bb', 'Eb', 'F#'],
      octaves: 1,
      hand: HANDS.TOGETHER,
      brokenDuration: 16,
      solidDuration: 4,
      brokenOnly: true,
    }),
    ...seventhChordEntries(shared, {
      dominantKeys: ['C', 'D', 'E', 'Bb', 'Eb', 'Gb'],
      diminishedKeys: ['C', 'D', 'E', 'Bb', 'Eb', 'F#'],
      octaves: 1,
      hand: HANDS.TOGETHER,
      brokenDuration: 16,
      solidDuration: 4,
    }),
    ...triadArpeggioEntries(shared, {
      majorKeys: ['C', 'D', 'E', 'Bb', 'Eb', 'Gb'],
      minorKeys: ['C', 'D', 'E', 'Bb', 'Eb', 'F#'],
      octaves: 2,
      hand: HANDS.TOGETHER,
      duration: 16,
      includeInversions: true,
    }),
    ...seventhArpeggioEntries(shared, {
      dominantKeys: ['C', 'D', 'E', 'Bb', 'Eb', 'Gb'],
      diminishedKeys: ['C', 'D', 'E', 'Bb', 'Eb', 'F#'],
      octaves: 2,
      hand: HANDS.TOGETHER,
      duration: 16,
      includeInversions: false,
    }),
  ];
}

function buildLevel9Entries(shared) {
  return [
    ...majorScaleEntries(shared, ['C', 'Db', 'D', 'Eb', 'E', 'F'], 2, HANDS.TOGETHER, 16),
    ...minorScaleEntries(shared, ['C', 'C#', 'D', 'Eb', 'E', 'F'], [scaleTypes.MINOR_H, scaleTypes.MINOR_M], 2, HANDS.TOGETHER, 16),
    ...contraryMotionEntries(shared, {
      [scaleTypes.MAJOR]: ['F', 'Db'],
      [scaleTypes.MINOR_H]: ['F', 'C#'],
    }, HANDS.TOGETHER, 16),
    ...chromaticEntries(shared, ['C', 'Db', 'D', 'Eb', 'E', 'F'], 2, HANDS.TOGETHER, 16),
    ...fourNoteChordEntries(shared, {
      majorKeys: ['C', 'Bb', 'D', 'Eb', 'E', 'F'],
      minorKeys: ['C', 'C#', 'D', 'Eb', 'E', 'F'],
      octaves: 1,
      hand: HANDS.TOGETHER,
      brokenDuration: 16,
      solidDuration: 4,
    }),
    ...seventhChordEntries(shared, {
      dominantKeys: ['C', 'Db', 'D', 'Eb', 'E', 'F'],
      diminishedKeys: ['C', 'C#', 'D', 'Eb', 'E', 'F'],
      octaves: 1,
      hand: HANDS.TOGETHER,
      brokenDuration: 16,
      solidDuration: 4,
    }),
    ...triadArpeggioEntries(shared, {
      majorKeys: ['C', 'Db', 'D', 'Eb', 'E', 'F'],
      minorKeys: ['C', 'C#', 'D', 'Eb', 'E', 'F'],
      octaves: 2,
      hand: HANDS.TOGETHER,
      duration: 16,
      includeInversions: true,
    }),
    ...seventhArpeggioEntries(shared, {
      dominantKeys: ['C', 'Db', 'D', 'Eb', 'E', 'F'],
      diminishedKeys: ['C', 'C#', 'D', 'Eb', 'E', 'F'],
      octaves: 2,
      hand: HANDS.TOGETHER,
      duration: 16,
      includeInversions: true,
    }),
  ];
}

function buildLevel10Entries(shared) {
  return [
    ...majorScaleEntries(shared, ['Gb', 'G', 'Ab', 'A', 'Bb', 'B'], 2, HANDS.TOGETHER, 16),
    ...minorScaleEntries(shared, ['F#', 'G', 'G#', 'A', 'Bb', 'B'], [scaleTypes.MINOR_H, scaleTypes.MINOR_M], 2, HANDS.TOGETHER, 16),
    ...chromaticEntries(shared, ['F#', 'G', 'Ab', 'A', 'Bb', 'B'], 2, HANDS.TOGETHER, 16),
    ...fourNoteChordEntries(shared, {
      majorKeys: ['Gb', 'G', 'Ab', 'A', 'Bb', 'B'],
      minorKeys: ['F#', 'G', 'G#', 'A', 'Bb', 'B'],
      octaves: 1,
      hand: HANDS.TOGETHER,
      brokenDuration: 16,
      solidDuration: 4,
    }),
    ...seventhChordEntries(shared, {
      dominantKeys: ['Gb', 'G', 'Ab', 'A', 'Bb', 'B'],
      diminishedKeys: ['F#', 'G', 'G#', 'A', 'Bb', 'B'],
      octaves: 1,
      hand: HANDS.TOGETHER,
      brokenDuration: 16,
      solidDuration: 4,
    }),
    ...triadArpeggioEntries(shared, {
      majorKeys: ['Gb', 'G', 'Ab', 'A', 'Bb', 'B'],
      minorKeys: ['F#', 'G', 'G#', 'A', 'Bb', 'B'],
      octaves: 2,
      hand: HANDS.TOGETHER,
      duration: 16,
      includeInversions: true,
    }),
    ...seventhArpeggioEntries(shared, {
      dominantKeys: ['Gb', 'G', 'Ab', 'A', 'Bb', 'B'],
      diminishedKeys: ['F#', 'G', 'G#', 'A', 'Bb', 'B'],
      octaves: 2,
      hand: HANDS.TOGETHER,
      duration: 16,
      includeInversions: true,
    }),
  ];
}