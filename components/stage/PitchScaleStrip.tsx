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
      className="stage-pitch-rail pointer-events-none absolute right-2 z-[45] w-12 md:right-4 md:w-[3.75rem]"
      style={{
        top: `${PITCH_ZONE_TOP * 100}%`,
        height: `${ZONE_SPAN * 100}%`,
      }}
    >
      <div className="stage-pitch-rail-panel relative h-full w-full rounded-l-md py-1 pl-1">
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
                      ? "border-amber-400/65 bg-amber-500/28 text-amber-50 shadow-[0_0_12px_rgba(251,191,36,0.2)]"
                      : isPreview
                        ? "border-amber-400/45 bg-amber-500/14 text-amber-100"
                        : "border-white/25 bg-white/10 text-white"
                    : "border-white/8 bg-black/25 text-white/38"
                }`}
              >
                <span
                  className={`font-medium tabular-nums tracking-tight [text-shadow:0_1px_6px_rgba(0,0,0,0.85)] ${
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
              className={`h-2 w-2 rounded-full border-2 ${
                isPinching
                  ? "border-amber-100 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.65)]"
                  : "border-amber-300/70 bg-amber-400/55"
              }`}
            />
          </div>
        )}
      </div>
    </div>
  );
}
