import type { AnimalId } from "./types";
import {
  disposeAnimalVoices,
  createAnimalVoices,
} from "./voices/createVoices";
import {
  setMasterVolumePercent,
  startAudioEngine,
} from "./voices/audio-bus";
import type { AnimalVoice } from "./voices/types";

export type { AnimalVoice };

/** @deprecated 使用 AnimalVoice */
export type AnimalSynth = AnimalVoice;

export function createAnimalSynths(): Record<AnimalId, AnimalVoice> {
  return createAnimalVoices();
}

export { setMasterVolumePercent };

export function attackAnimal(
  voice: AnimalVoice,
  frequency: number,
  _animalId?: AnimalId
): void {
  voice.attack(frequency);
}

export function rampAnimal(
  voice: AnimalVoice,
  frequency: number,
  _animalId?: AnimalId
): void {
  voice.ramp(frequency);
}

export function releaseAnimal(voice: AnimalVoice): void {
  voice.release();
}

export async function startAudioContext(): Promise<void> {
  await startAudioEngine();
}

export function disposeAnimalSynths(
  voices: Record<AnimalId, AnimalVoice>
): void {
  disposeAnimalVoices(voices);
}
