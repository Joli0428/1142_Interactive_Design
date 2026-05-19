import type { AnimalId } from "../types";
import { createBirdVoice } from "./bird";
import { createFrogVoice } from "./frog";
import { createOtterVoice } from "./otter";
import type { AnimalVoice } from "./types";

export function createAnimalVoices(): Record<AnimalId, AnimalVoice> {
  return {
    frog: createFrogVoice(),
    otter: createOtterVoice(),
    bird: createBirdVoice(),
  };
}

export function disposeAnimalVoices(
  voices: Record<AnimalId, AnimalVoice>
): void {
  (Object.keys(voices) as AnimalId[]).forEach((id) => {
    voices[id].dispose();
  });
}
