"use client";

import Link from "next/link";

type Props = {
  visible: boolean;
  isPinching: boolean;
  volume: number;
  onVolumeChange: (percent: number) => void;
};

export function StageChrome({
  visible,
  isPinching,
  volume,
  onVolumeChange,
}: Props) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-50 transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <Link
        href="/"
        className="pointer-events-auto absolute left-6 top-6 rounded-full border border-white/15 bg-black/40 px-4 py-2 text-sm text-white/75 backdrop-blur-sm transition hover:text-white"
      >
        離開
      </Link>

      <div className="pointer-events-none absolute left-0 right-0 top-6 flex justify-center px-20">
        <span
          className={`rounded-full px-4 py-1 text-xs tracking-wide backdrop-blur-sm transition-all ${
            isPinching
              ? "border border-amber-400/40 bg-amber-500/15 text-amber-200"
              : "border border-white/10 bg-black/25 text-white/45"
          }`}
        >
          {isPinching ? "演奏中" : "捏合演奏 · 放開休止"}
        </span>
      </div>

      <label className="pointer-events-auto absolute bottom-6 right-6 flex w-32 items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3 py-2 backdrop-blur-sm">
        <span className="sr-only">音量</span>
        <span className="shrink-0 text-[10px] tabular-nums text-white/50">
          {volume}
        </span>
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          className="h-1 min-w-0 flex-1 cursor-pointer accent-amber-400"
          aria-label="音量"
        />
      </label>
    </div>
  );
}
