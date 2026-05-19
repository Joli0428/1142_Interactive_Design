import * as Tone from "tone";

/** C major pentatonic: C D E G A */
const PENTATONIC_NAMES = ["C", "D", "E", "G", "A"] as const;
const OCTAVES = [3, 4] as const;

export type ScaleNote = {
  name: string;
  label: string;
  frequency: number;
  octave: number;
  solfege: string;
};

const SOLFEGE: Record<string, string> = {
  C: "Do",
  D: "Re",
  E: "Mi",
  G: "Sol",
  A: "La",
};

function buildPentatonicScale(): ScaleNote[] {
  const notes: ScaleNote[] = [];
  for (const octave of OCTAVES) {
    for (const name of PENTATONIC_NAMES) {
      const label = `${name}${octave}`;
      notes.push({
        name,
        label,
        frequency: Tone.Frequency(label).toFrequency(),
        octave,
        solfege: SOLFEGE[name] ?? name,
      });
    }
  }
  return notes;
}

/** 10 notes: C3–A3, C4–A4 (pentatonic, two octaves) */
export const SCALE_NOTES: ScaleNote[] = buildPentatonicScale();

/** 與音階尺、手勢共用：畫面上下留白，避免頂底死區 */
export const PITCH_ZONE_TOP = 0.08;
export const PITCH_ZONE_BOTTOM = 0.92;

export function noteIndexToRatioY(index: number): number {
  const n = SCALE_NOTES.length;
  const t = 1 - (index + 0.5) / n;
  return PITCH_ZONE_TOP + t * (PITCH_ZONE_BOTTOM - PITCH_ZONE_TOP);
}

/** 各音在畫面上的垂直區間（ratioY：0=頂、1=底） */
export function noteZoneRatioY(index: number): { yMin: number; yMax: number } {
  const n = SCALE_NOTES.length;
  const span = PITCH_ZONE_BOTTOM - PITCH_ZONE_TOP;
  const zoneH = span / n;
  const yMax = PITCH_ZONE_BOTTOM - index * zoneH;
  const yMin = yMax - zoneH;
  return { yMin, yMax };
}

/** @deprecated alias */
export const PENTATONIC_NOTES = SCALE_NOTES;

/** Fraction of each zone that must be crossed to switch (0.2 = 20% margin → 60% stable core) */
const ZONE_MARGIN = 0.2;

/** Extra push past boundary before switching (hysteresis) */
const HYSTERESIS_PUSH = 0.12;

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/**
 * ratioY: 0 = top of screen, 1 = bottom — top = high pitch
 * prevIndex: last selected note for hysteresis
 */
export function ratioYToNoteIndex(ratioY: number, prevIndex: number): number {
  const span = PITCH_ZONE_BOTTOM - PITCH_ZONE_TOP;
  const mapped = clamp01((ratioY - PITCH_ZONE_TOP) / span);
  const inverted = clamp01(1 - mapped);
  const n = SCALE_NOTES.length;
  const zoneSize = 1 / n;

  let zone = Math.min(n - 1, Math.floor(inverted / zoneSize));

  if (prevIndex < 0 || prevIndex >= n) {
    return zone;
  }

  const prevStart = prevIndex * zoneSize;
  const prevEnd = (prevIndex + 1) * zoneSize;
  const margin = zoneSize * ZONE_MARGIN;
  const stableStart = prevStart + margin;
  const stableEnd = prevEnd - margin;

  if (inverted >= stableStart && inverted <= stableEnd) {
    return prevIndex;
  }

  if (zone !== prevIndex) {
    if (zone > prevIndex) {
      const boundary = prevEnd + zoneSize * HYSTERESIS_PUSH;
      if (inverted < boundary) return prevIndex;
    } else {
      const boundary = prevStart - zoneSize * HYSTERESIS_PUSH;
      if (inverted > boundary) return prevIndex;
    }
  }

  return zone;
}

export function ratioYToNote(ratioY: number, prevIndex: number): ScaleNote {
  const index = ratioYToNoteIndex(ratioY, prevIndex);
  return SCALE_NOTES[index]!;
}

export function ratioYToFrequency(ratioY: number, prevIndex: number): number {
  return ratioYToNote(ratioY, prevIndex).frequency;
}
