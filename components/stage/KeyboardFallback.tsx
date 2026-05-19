"use client";

import type { AnimalId } from "@/lib/conductor/types";
import { ANIMAL_LABELS } from "@/lib/conductor/types";

type Props = {
  activeAnimal: AnimalId;
  onAnimalChange: (id: AnimalId) => void;
  onPinchChange: (pinching: boolean) => void;
  onPitchChange: (ratioY: number) => void;
};

export function KeyboardFallback({
  activeAnimal,
  onAnimalChange,
  onPinchChange,
  onPitchChange,
}: Props) {
  const animals: AnimalId[] = ["frog", "otter", "bird"];

  return (
    <div className="absolute bottom-4 left-4 z-50 max-w-xs rounded-xl border border-zinc-600 bg-zinc-900/90 p-4 text-sm backdrop-blur-md">
      <p className="mb-2 font-bold text-zinc-400">鍵盤備援</p>
      <p className="mb-3 text-zinc-500">
        空白鍵：捏合/放開 · 1/2/3：切換動物 · ↑↓：音高
      </p>
      <div className="flex gap-2">
        {animals.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onAnimalChange(id)}
            className={`rounded-lg px-3 py-1 font-bold ${
              activeAnimal === id
                ? "bg-white text-zinc-900"
                : "bg-zinc-800 text-zinc-400"
            }`}
          >
            {ANIMAL_LABELS[id]}
          </button>
        ))}
      </div>
      <input
        type="range"
        min={0}
        max={100}
        defaultValue={50}
        className="mt-3 w-full"
        onChange={(e) => onPitchChange(Number(e.target.value) / 100)}
        aria-label="音高"
      />
      <button
        type="button"
        className="mt-2 w-full rounded-lg bg-green-600 py-2 font-bold text-white"
        onMouseDown={() => onPinchChange(true)}
        onMouseUp={() => onPinchChange(false)}
        onMouseLeave={() => onPinchChange(false)}
        onTouchStart={() => onPinchChange(true)}
        onTouchEnd={() => onPinchChange(false)}
      >
        按住演奏
      </button>
    </div>
  );
}
