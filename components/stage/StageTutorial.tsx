"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { HandCursorOverlay } from "@/components/stage/HandCursorOverlay";
import { PINCH_BUTTON_ZONE, isThumbInZone } from "@/hooks/usePinchDetector";

const ANIMALS = ["frog", "otter", "bird"] as const;

const GESTURES = [
  { key: "pinch", title: "捏合", desc: "拇指與食指靠近 — 開始演唱" },
  { key: "release", title: "放開", desc: "手指分開 — 停止發聲" },
  { key: "vertical", title: "上下", desc: "拇指高低 — 在五聲音階選音高（10 音）" },
  { key: "horizontal", title: "左右", desc: "拇指左右 — 切換青蛙、海獺、小鳥" },
] as const;

export type TutorialPinch = {
  isPinching: boolean;
  isTracking: boolean;
  ratioX: number;
  ratioY: number;
};

type Props = {
  onDismiss: () => void;
  pinch: TutorialPinch;
};

export function StageTutorial({ onDismiss, pinch }: Props) {
  const prevPinchRef = useRef(false);

  const displayX = 1 - pinch.ratioX;
  const overButton =
    pinch.isPinching &&
    isThumbInZone(displayX, pinch.ratioY, PINCH_BUTTON_ZONE);

  useEffect(() => {
    const rising = pinch.isPinching && !prevPinchRef.current;
    if (rising && isThumbInZone(displayX, pinch.ratioY, PINCH_BUTTON_ZONE)) {
      onDismiss();
    }
    prevPinchRef.current = pinch.isPinching;
  }, [pinch.isPinching, displayX, pinch.ratioY, onDismiss]);

  return (
    <div className="absolute inset-0 z-[60] flex flex-col overflow-hidden bg-[#050508]">
      <TutorialBackdrop />

      <TutorialContent overButton={overButton} onDismiss={onDismiss} />
      <div className="stage-curtain-frame pointer-events-none absolute inset-0 z-10 opacity-80" />

      <HandCursorOverlay
        ratioX={displayX}
        ratioY={pinch.ratioY}
        visible={pinch.isTracking}
        pinching={pinch.isPinching}
      />
    </div>
  );
}

function TutorialContent({
  overButton,
  onDismiss,
}: {
  overButton: boolean;
  onDismiss: () => void;
}) {
  return (
    <div className="relative z-20 flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-8 md:px-10">
      <div className="tutorial-panel w-full max-w-5xl rounded-3xl border border-white/12 bg-black/55 p-8 shadow-[0_32px_100px_rgba(0,0,0,0.65)] backdrop-blur-xl md:p-12">
        <p className="mb-2 text-center font-serif text-xs tracking-[0.4em] text-amber-200/75">
          QUICK GUIDE
        </p>
        <h3 className="mb-10 text-center font-serif text-3xl font-bold text-white md:text-4xl">
          指揮速成
        </h3>

        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {GESTURES.map((g, i) => (
            <GestureCard key={g.key} index={i + 1} title={g.title} desc={g.desc} />
          ))}
        </div>

        <div className="flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={onDismiss}
            className={`rounded-full border px-14 py-4 text-lg font-bold transition-all duration-300 ${
              overButton
                ? "scale-105 border-amber-100 bg-amber-50 text-zinc-900 shadow-[0_0_64px_rgba(251,191,36,0.55)]"
                : "border-amber-200/50 bg-amber-100 text-zinc-900 shadow-[0_0_40px_rgba(251,191,36,0.3)] hover:scale-[1.02]"
            }`}
          >
            開始指揮
          </button>
          <p className="text-center text-xs tracking-wide text-white/40">
            拇指移到按鈕上方捏合，或點擊開始
          </p>
        </div>
      </div>
    </div>
  );
}

function TutorialBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 flex">
      {ANIMALS.map((id) => (
        <div key={id} className="relative min-w-0 flex-1">
          <Image
            src={`/images/${id}-close.png`}
            alt=""
            fill
            className="object-cover object-center opacity-35 brightness-90"
            sizes="34vw"
          />
        </div>
      ))}
      <TutorialBackdropOverlay />
    </div>
  );
}

function TutorialBackdropOverlay() {
  return (
    <>
      <div className="absolute inset-0 bg-black/45" />
      <div className="home-edge-vignette absolute inset-0" />
    </>
  );
}

function GestureCard({
  index,
  title,
  desc,
}: {
  index: number;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 md:p-6">
      <span className="mb-3 inline-block font-serif text-2xl text-amber-300/90">
        {String(index).padStart(2, "0")}
      </span>
      <h4 className="mb-2 font-serif text-xl font-semibold text-white">{title}</h4>
      <p className="text-sm leading-relaxed text-white/60">{desc}</p>
    </div>
  );
}
