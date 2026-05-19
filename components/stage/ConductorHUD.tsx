"use client";

import { ANIMAL_LABELS, type AnimalId } from "@/lib/conductor/types";

type Props = {
  noteLabel: string;
  frequency: number;
  pinchDistance: number;
  isPinching: boolean;
  activeAnimal: AnimalId;
  showHud: boolean;
};

export function ConductorHUD({
  noteLabel,
  frequency,
  pinchDistance,
  isPinching,
  activeAnimal,
  showHud,
}: Props) {
  if (!showHud) return null;

  const pinchPercent = Math.max(0, Math.min(100, (1 - pinchDistance / 0.15) * 100));

  return (
    <div className="absolute right-4 top-8 z-50 rounded-xl border border-zinc-700/80 bg-zinc-900/80 p-4 font-mono text-xs text-zinc-300 backdrop-blur-md">
      <p>
        <span className="text-zinc-500">音名 </span>
        {noteLabel}
      </p>
      <p>
        <span className="text-zinc-500">頻率 </span>
        {frequency.toFixed(1)} Hz
      </p>
      <p>
        <span className="text-zinc-500">捏合 </span>
        {isPinching ? "演奏中" : "放開"} ({pinchPercent.toFixed(0)}%)
      </p>
      <p>
        <span className="text-zinc-500">動物 </span>
        {ANIMAL_LABELS[activeAnimal]}
      </p>
    </div>
  );
}
