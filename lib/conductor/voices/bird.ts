import * as Tone from "tone";
import { createVoiceBus } from "./audio-bus";
import { BIRD_PARAMS } from "./bird-params";
import { VOICE_LEVEL_DB } from "./levels";
import { createPulseLoop } from "./pulse-loop";
import type { AnimalVoice } from "./types";

import { birdSweepSpanHz, scaleHzForBirdCenter } from "./pitch";

function chirpJitter(): number {
  return 0.96 + Math.random() * 0.08;
}

/**
 * 小鳥：正弦 + 平滑頻率掃描 + 柔和 ADSR（不用高 mod FM，避免石頭聲）
 */
export function createBirdVoice(): AnimalVoice {
  const bus = createVoiceBus(VOICE_LEVEL_DB.bird);
  const p = BIRD_PARAMS;

  const osc = new Tone.Oscillator({ type: "sine", frequency: 3000 });

  const env = new Tone.AmplitudeEnvelope({
    attack: p.attack,
    decay: p.decay,
    sustain: p.sustain,
    release: p.chirpDuration * p.releaseRatio,
    attackCurve: "cosine",
    releaseCurve: "cosine",
  });

  const toneFilter = new Tone.Filter({
    frequency: 3400,
    type: "lowpass",
    rolloff: -24,
  });

  osc.connect(env);
  env.connect(toneFilter);
  toneFilter.connect(bus.input);

  osc.start();

  const playChirp = (frequency: number, time: number) => {
    const jitter = chirpJitter();
    const center = scaleHzForBirdCenter(frequency) * jitter;
    const half = (birdSweepSpanHz(center) * jitter) / 2;
    const startFreq = Math.max(400, center - half);
    const endFreq = center + half;
    const dur = p.chirpDuration;

    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + dur);
    env.triggerAttackRelease(dur * 0.85, time);
  };

  const pulse = createPulseLoop(playChirp, p.chirpInterval);

  return {
    attack(frequency: number) {
      pulse.start(frequency);
    },

    ramp(frequency: number) {
      pulse.setFrequency(frequency);
    },

    release() {
      pulse.stop();
    },

    dispose() {
      pulse.dispose();
      osc.stop();
      osc.dispose();
      env.dispose();
      toneFilter.dispose();
      bus.volume.dispose();
      bus.input.dispose();
    },
  };
}
