import * as Tone from "tone";
import { createVoiceBus } from "./audio-bus";
import { VOICE_LEVEL_DB } from "./levels";
import { otterLevelBoostDb, scaleHzForOtter } from "./pitch";
import type { AnimalVoice } from "./types";
const RAMP_S = 0.08;
const VIBRATO_HZ = 6;
/** 高音區降低和聲疊加，避免破音 */
const HIGH_NOTE_HZ = 340;

/** 海獺：sine 口哨 + 低通 + 顫音；高音時減弱五度和聲 */
export function createOtterVoice(): AnimalVoice {
  const bus = createVoiceBus(VOICE_LEVEL_DB.otter);

  const synth = new Tone.Synth({
    oscillator: { type: "sine" },
    envelope: {
      attack: 0.12,
      decay: 0.08,
      sustain: 0.55,
      release: 0.3,
      attackCurve: "cosine",
    },
  });

  const toneFilter = new Tone.Filter({
    frequency: 2400,
    type: "lowpass",
    rolloff: -24,
  });

  const outputGain = new Tone.Volume(0);

  const cooOsc = new Tone.Oscillator({ type: "sine", frequency: 500 });
  const cooGain = new Tone.Volume(-26);
  const cooFilter = new Tone.Filter({
    frequency: 2000,
    type: "lowpass",
  });
  const cooEnv = new Tone.AmplitudeEnvelope({
    attack: 0.14,
    decay: 0.1,
    sustain: 0.5,
    release: 0.28,
  });

  const vibrato = new Tone.LFO({
    frequency: VIBRATO_HZ,
    min: -12,
    max: 12,
    type: "sine",
  });
  vibrato.connect(synth.detune);
  vibrato.start();

  synth.connect(toneFilter);
  toneFilter.connect(outputGain);
  outputGain.connect(bus.input);

  cooOsc.connect(cooGain);
  cooGain.connect(cooFilter);
  cooFilter.connect(cooEnv);
  cooEnv.connect(bus.input);

  let playing = false;

  const setCooFreq = (f: number, time: number) => {
    const fifth = f * Math.pow(2, 7 / 12);
    cooOsc.frequency.setValueAtTime(fifth, time);
    const cooDb = f >= HIGH_NOTE_HZ ? -32 : -26;
    cooGain.volume.setValueAtTime(cooDb, time);
  };

  return {
    attack(frequency: number) {
      const t = Tone.now();
      const hz = scaleHzForOtter(frequency);
      outputGain.volume.setValueAtTime(otterLevelBoostDb(frequency), t);
      synth.frequency.setValueAtTime(hz, t);
      setCooFreq(hz, t);
      synth.triggerAttack(t);
      cooOsc.start(t);
      cooEnv.triggerAttack(t);
      playing = true;
    },

    ramp(frequency: number) {
      if (!playing) return;
      const hz = scaleHzForOtter(frequency);
      outputGain.volume.rampTo(otterLevelBoostDb(frequency), RAMP_S);
      synth.frequency.rampTo(hz, RAMP_S);
      setCooFreq(hz, Tone.now() + RAMP_S);
    },

    release() {
      if (!playing) return;
      synth.triggerRelease();
      cooEnv.triggerRelease();
      cooOsc.stop();
      playing = false;
    },

    dispose() {
      vibrato.stop();
      vibrato.dispose();
      synth.dispose();
      toneFilter.dispose();
      outputGain.dispose();
      cooOsc.dispose();
      cooGain.dispose();
      cooFilter.dispose();
      cooEnv.dispose();
      bus.volume.dispose();
      bus.input.dispose();
    },
  };
}
