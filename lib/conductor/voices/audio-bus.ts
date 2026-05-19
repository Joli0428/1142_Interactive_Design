import * as Tone from "tone";

let masterVolume: Tone.Volume | null = null;
let reverb: Tone.Reverb | null = null;

let limiter: Tone.Limiter | null = null;

function getLimiter(): Tone.Limiter {
  if (!limiter) {
    limiter = new Tone.Limiter(-4);
    limiter.connect(getMasterVolume());
  }
  return limiter;
}

export function getMasterVolume(): Tone.Volume {
  if (!masterVolume) {
    masterVolume = new Tone.Volume(0).toDestination();
  }
  return masterVolume;
}

export function getReverb(): Tone.Reverb {
  if (!reverb) {
    reverb = new Tone.Reverb({ decay: 3.0, wet: 0.32 });
    reverb.connect(getLimiter());
  }
  return reverb;
}

/** 各動物輸入匯流：input → level → reverb */
export function createVoiceBus(levelDb: number): {
  input: Tone.Gain;
  volume: Tone.Volume;
} {
  const input = new Tone.Gain(1);
  const volume = new Tone.Volume(levelDb);
  input.connect(volume);
  volume.connect(getReverb());
  return { input, volume };
}

export function setMasterVolumePercent(percent: number): void {
  const p = Math.max(0, Math.min(100, percent));
  const gain = p / 100;
  const db = gain <= 0.001 ? -80 : Tone.gainToDb(gain);
  getMasterVolume().volume.rampTo(db, 0.05);
}

export async function startAudioEngine(): Promise<void> {
  await Tone.start();
  await getReverb().generate();
  setMasterVolumePercent(75);
}

export function disposeAudioEngine(): void {
  reverb?.dispose();
  limiter?.dispose();
  masterVolume?.dispose();
  reverb = null;
  limiter = null;
  masterVolume = null;
}
