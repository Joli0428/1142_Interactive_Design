import * as Tone from "tone";
import { createVoiceBus } from "./audio-bus";
import { FROG_PARAMS } from "./frog-params";
import { frogFilterHz, scaleHzForFrog } from "./pitch";
import { VOICE_LEVEL_DB } from "./levels";
import { createPulseLoop } from "./pulse-loop";
import type { AnimalVoice } from "./types";

const MAKEUP_DB = 0;

function croakJitter(): number {
  return 0.95 + Math.random() * 0.1;
}

/**
 * 青蛙：鋸齒 → VCA ← LFO；基頻 = 五聲音階 Hz，濾波器隨音高追蹤
 */
export function createFrogVoice(): AnimalVoice {
  const bus = createVoiceBus(VOICE_LEVEL_DB.frog);
  const p = FROG_PARAMS;

  const carrier = new Tone.Oscillator({
    frequency: 180,
    type: "sawtooth",
  });

  const vca = new Tone.Gain(0);

  const pulseLfo = new Tone.LFO({
    frequency: p.pulseRate,
    type: "sine",
    min: p.vcaMin,
    max: p.vcaMax,
  });
  pulseLfo.connect(vca.gain);

  const filter = new Tone.Filter({
    type: "bandpass",
    frequency: p.filterFreq,
    Q: p.filterQ,
  });

  const env = new Tone.AmplitudeEnvelope({
    attack: 0.012,
    decay: p.duration,
    sustain: 0,
    release: 0.06,
    attackCurve: "cosine",
    releaseCurve: "cosine",
  });

  const noise = new Tone.Noise({ type: "pink" });
  const noiseGain = new Tone.Gain(p.noiseMix);
  const makeup = new Tone.Volume(MAKEUP_DB);

  carrier.connect(vca);
  noise.connect(noiseGain);
  noiseGain.connect(vca);
  vca.connect(filter);
  filter.connect(env);
  env.connect(makeup);
  makeup.connect(bus.input);

  carrier.start();
  noise.start();
  pulseLfo.start();

  const playCroak = (scaleHz: number, time: number) => {
    const jitter = croakJitter();
    const baseFreq = scaleHzForFrog(scaleHz) * jitter;
    const pulseRate = p.pulseRate * jitter;
    const duration = p.duration;
    const endFreq = baseFreq * (1 - p.pitchDropPercent / 100);
    const resonance = frogFilterHz(baseFreq);

    pulseLfo.frequency.setValueAtTime(pulseRate, time);
    filter.frequency.setValueAtTime(resonance, time);
    filter.Q.setValueAtTime(p.filterQ, time);

    carrier.frequency.setValueAtTime(baseFreq * 1.12, time);
    carrier.frequency.exponentialRampToValueAtTime(
      Math.max(80, endFreq),
      time + 0.1
    );
    env.triggerAttackRelease(duration, time);
  };

  const pulse = createPulseLoop(playCroak, p.croakInterval);

  return {
    attack(scaleHz: number) {
      pulse.start(scaleHz);
    },

    ramp(scaleHz: number) {
      pulse.setFrequency(scaleHz);
    },

    release() {
      pulse.stop();
    },

    dispose() {
      pulse.dispose();
      carrier.stop();
      noise.stop();
      pulseLfo.stop();
      carrier.dispose();
      vca.dispose();
      pulseLfo.dispose();
      filter.dispose();
      env.dispose();
      makeup.dispose();
      noise.dispose();
      noiseGain.dispose();
      bus.volume.dispose();
      bus.input.dispose();
    },
  };
}
