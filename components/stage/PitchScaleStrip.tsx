"use client";

import {
  PITCH_ZONE_BOTTOM,
  PITCH_ZONE_TOP,
  SCALE_NOTES,
  noteZoneRatioY,
} from "@/lib/conductor/scale";

type Props = {
  activeIndex: number;
  isPinching: boolean;
  isTracking?: boolean;
  cursorRatioY?: number;
};

const ZONE_SPAN = PITCH_ZONE_BOTTOM - PITCH_ZONE_TOP;

function ratioYToRailPercent(ratioY: number): number {
  const t = (ratioY - PITCH_ZONE_TOP) / ZONE_SPAN;
  return Math.max(0, Math.min(100, t * 100));
}

function zoneBandStyle(index: number): { top: string; height: string } {
  const { yMin, yMax } = noteZoneRatioY(index);
  const top = ratioYToRailPercent(yMin);
  const height = ratioYToRailPercent(yMax) - top;
  return { top: `${top}%`, height: `${Math.max(height, 0)}%` };
}

export function PitchScaleStrip({
  activeIndex,
  isPinching,
  isTracking = false,
  cursorRatioY = 0.5,
}: Props) {
  const isPreview = isTracking && !isPinching;
  const thumbRailPercent = ratioYToRailPercent(cursorRatioY);

  return (
    <div
      className="stage-pitch-rail pointer-events-none absolute right-2 z-40 w-11 md:right-4 md:w-14"
      style={{
        top: `${PITCH_ZONE_TOP * 100}%`,
        height: `${ZONE_SPAN * 100}%`,
      }}
    >
      <div className="relative h-full w-full">
        {SCALE_NOTES.map((note, i) => {
          const isActive = i === activeIndex;
          const band = zoneBandStyle(i);

          return (
            <div
              key={note.label}
              className="absolute left-0 right-0"
              style={{ top: band.top, height: band.height }}
            >
              <div
                className={`flex h-full items-center justify-center rounded-sm border px-0.5 transition-all duration-150 ${
                  isActive
                    ? isPinching
                      ? "border-amber-400/45 bg-amber-500/18 text-amber-100/95"
                      : isPreview
                        ? "border-amber-400/30 bg-amber-500/8 text-amber-100/80"
                        : "border-white/18 bg-white/6 text-white/85"
                    : "border-white/5 bg-black/12 text-white/22"
                }`}
              >
                <span
                  className={`font-medium tabular-nums tracking-tight ${
                    isActive ? "text-[10px] md:text-xs" : "text-[9px] md:text-[10px]"
                  }`}
                >
                  {note.label}
                </span>
              </div>
            </div>
          );
        })}

        {isTracking && (
          <div
            className="absolute left-0 z-20 w-2 -translate-y-1/2"
            style={{ top: `${thumbRailPercent}%` }}
          >
            <div
              className={`h-1.5 w-1.5 rounded-full border ${
                isPinching
                  ? "border-amber-200/80 bg-amber-400/90 shadow-[0_0_6px_rgba(251,191,36,0.5)]"
                  : "border-amber-300/50 bg-amber-400/40"
              }`}
            />
          </div>
        )}
      </div>
    </div>
  );
}
