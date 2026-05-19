import * as Tone from "tone";
import type { AnimalId } from "./types";

export type AnimalSynth = {
  lead: Tone.Synth;
  harmony: Tone.Synth;
};

/** 各動物感知音量補償（方波偏響、正弦偏輕） */
const ANIMAL_LEVEL_DB: Record<AnimalId, number> = {
  frog: -12,
  otter: -6,
  bird: 4,
};

/** 和聲層再略降，避免兩個 voice 疊加過響 */
const HARMONY_OFFSET_DB = -9;

let masterVolume: Tone.Volume | null = null;
let reverb: Tone.Reverb | null = null;

function getMasterVolume(): Tone.Volume {
  if (!masterVolume) {
    masterVolume = new Tone.Volume(0).toDestination();
  }
  return masterVolume;
}

function getReverb(): Tone.Reverb {
  if (!reverb) {
    reverb = new Tone.Reverb({ decay: 2.5, wet: 0.26 });
    reverb.connect(getMasterVolume());
  }
  return reverb;
}

type OscType = "sine" | "triangle" | "square";

function createVoice(
  type: OscType,
  levelDb: number,
  filterOptions?: { frequency: number; type: Tone.FilterOptions["type"] }
): Tone.Synth {
  const gain = new Tone.Volume(levelDb);
  const synth = new Tone.Synth({
    oscillator: { type },
    envelope: { attack: 0.08, release: 0.25 },
  });
  if (filterOptions) {
    const filter = new Tone.Filter(filterOptions.frequency, filterOptions.type);
    synth.connect(filter);
    filter.connect(gain);
  } else {
    synth.connect(gain);
  }
  gain.connect(getReverb());
  return synth;
}

export function createAnimalSynths(): Record<AnimalId, AnimalSynth> {
  return {
    frog: {
      lead: createVoice("square", ANIMAL_LEVEL_DB.frog, {
        frequency: 1400,
        type: "lowpass",
      }),
      harmony: createVoice(
        "square",
        ANIMAL_LEVEL_DB.frog + HARMONY_OFFSET_DB,
        { frequency: 1400, type: "lowpass" }
      ),
    },
    otter: {
      lead: createVoice("triangle", ANIMAL_LEVEL_DB.otter, {
        frequency: 2200,
        type: "lowpass",
      }),
      harmony: createVoice(
        "triangle",
        ANIMAL_LEVEL_DB.otter + HARMONY_OFFSET_DB,
        { frequency: 2200, type: "lowpass" }
      ),
    },
    bird: {
      lead: createVoice("sine", ANIMAL_LEVEL_DB.bird, {
        frequency: 5200,
        type: "lowpass",
      }),
      harmony: createVoice(
        "triangle",
        ANIMAL_LEVEL_DB.bird + HARMONY_OFFSET_DB,
        { frequency: 5200, type: "lowpass" }
      ),
    },
  };
}

/** 0–100 → 主音量（0 為靜音） */
export function setMasterVolumePercent(percent: number): void {
  const p = Math.max(0, Math.min(100, percent));
  const gain = p / 100;
  const db = gain <= 0.001 ? -80 : Tone.gainToDb(gain);
  getMasterVolume().volume.rampTo(db, 0.05);
}

function harmonyFreq(root: number): number {
  return root * Math.pow(2, 4 / 12);
}

export function attackAnimal(chain: AnimalSynth, frequency: number): void {
  chain.lead.triggerAttack(frequency);
  chain.harmony.triggerAttack(harmonyFreq(frequency));
}

export function rampAnimal(chain: AnimalSynth, frequency: number): void {
  chain.lead.frequency.rampTo(frequency, 0.05);
  chain.harmony.frequency.rampTo(harmonyFreq(frequency), 0.05);
}

export function releaseAnimal(chain: AnimalSynth): void {
  chain.lead.triggerRelease();
  chain.harmony.triggerRelease();
}

export async function startAudioContext(): Promise<void> {
  await Tone.start();
  await getReverb().generate();
  setMasterVolumePercent(75);
}

export function disposeAnimalSynths(
  synths: Record<AnimalId, AnimalSynth>
): void {
  (Object.keys(synths) as AnimalId[]).forEach((id) => {
    synths[id].lead.dispose();
    synths[id].harmony.dispose();
  });
}
