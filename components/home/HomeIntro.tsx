"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { HandCursorOverlay } from "@/components/stage/HandCursorOverlay";
import { useMediaPipeScript } from "@/hooks/useMediaPipeScript";
import {
  PINCH_BUTTON_ZONE,
  isThumbInZone,
  usePinchDetector,
} from "@/hooks/usePinchDetector";
import { startAudioContext } from "@/lib/conductor/synths";
import { markAudioWarmed, markStageEnter } from "@/lib/stage-enter";

const ANIMALS = ["frog", "otter", "bird"] as const;
const FLOAT_NOTES = ["♪", "♫", "♩", "♪", "♫"];

export function HomeIntro() {
  const router = useRouter();
  const [phase, setPhase] = useState(0);
  const { ready: mediapipeReady, onScriptLoad } = useMediaPipeScript();
  const pinch = usePinchDetector(mediapipeReady);
  const { releaseCamera } = pinch;
  const prevPinchRef = useRef(false);

  const overButton =
    pinch.isPinching &&
    isThumbInZone(pinch.ratioX, pinch.ratioY, PINCH_BUTTON_ZONE);

  const goStage = useCallback(async () => {
    markStageEnter();
    releaseCamera();
    try {
      await startAudioContext();
      markAudioWarmed();
    } catch {
      /* 舞台會再提示點擊啟動 */
    }
    // 短暫等待相機釋放，再導向舞台（Hands 由首頁 unmount 單次關閉）
    await new Promise((r) => setTimeout(r, 80));
    router.push("/stage");
  }, [router, releaseCamera]);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 1100),
      setTimeout(() => setPhase(3), 1900),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const rising = pinch.isPinching && !prevPinchRef.current;
    if (rising && isThumbInZone(pinch.ratioX, pinch.ratioY, PINCH_BUTTON_ZONE)) {
      goStage();
    }
    prevPinchRef.current = pinch.isPinching;
  }, [pinch.isPinching, pinch.ratioX, pinch.ratioY, goStage]);

  return (
    <main className="home-page relative flex h-screen w-screen flex-col items-center justify-center overflow-hidden select-none text-white">
      <Script
        src="/mediapipe/hands.js"
        crossOrigin="anonymous"
        onLoad={onScriptLoad}
      />
      <video
        ref={pinch.videoRef}
        autoPlay
        playsInline
        muted
        className="pointer-events-none absolute h-0 w-0 opacity-0"
      />

      <HomeBackdrop phase={phase} />
      <TheaterLightBeams phase={phase} />
      <IntroContent
        phase={phase}
        overButton={overButton}
        pinchReady={mediapipeReady}
        onEnter={goStage}
      />

      <HandCursorOverlay
        ratioX={pinch.ratioX}
        ratioY={pinch.ratioY}
        visible={pinch.isTracking}
        pinching={pinch.isPinching}
      />
    </main>
  );
}

function TheaterLightBeams({ phase }: { phase: number }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-[12] transition-opacity duration-[2s] ${
        phase >= 1 ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="home-light-beam home-light-beam-left" />
      <div className="home-light-beam home-light-beam-center" />
      <div className="home-light-beam home-light-beam-right" />
    </div>
  );
}

function IntroContent({
  phase,
  overButton,
  pinchReady,
  onEnter,
}: {
  phase: number;
  overButton: boolean;
  pinchReady: boolean;
  onEnter: () => void;
}) {
  return (
    <div className="relative z-30 flex flex-col items-center px-6 text-center">
      <p
        className={`mb-3 font-serif text-sm tracking-[0.45em] text-amber-200/95 [text-shadow:0_1px_12px_rgba(0,0,0,0.9)] transition-all duration-1000 ${
          phase >= 1 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        INTERACTIVE INSTALLATION
      </p>
      <h1
        className={`mb-5 font-serif text-4xl font-bold tracking-wide text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.95),0_0_40px_rgba(0,0,0,0.6)] transition-all duration-1000 delay-100 md:text-6xl ${
          phase >= 2 ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        }`}
      >
        動物合唱團指揮
      </h1>
      <p
        className={`mb-10 max-w-lg text-base leading-relaxed text-white/95 [text-shadow:0_1px_10px_rgba(0,0,0,0.85)] transition-all duration-1000 delay-200 md:text-lg ${
          phase >= 2 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        劇場的燈亮了。走上指揮台，讓合唱團為你開唱。
      </p>

      <button
        type="button"
        onClick={onEnter}
        className={`home-cta relative rounded-full border px-12 py-4 font-bold transition-all duration-300 ${
          phase >= 3
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-8 scale-95 opacity-0"
        } ${
          overButton
            ? "scale-105 border-amber-100 bg-amber-50 text-zinc-900 shadow-[0_0_72px_rgba(251,191,36,0.65)]"
            : "border-amber-200/60 bg-amber-100 text-zinc-900 shadow-[0_0_56px_rgba(251,191,36,0.45)]"
        }`}
      >
        進入劇場
      </button>

      <p
        className={`mt-8 text-xs tracking-wide text-white/75 [text-shadow:0_1px_8px_rgba(0,0,0,0.8)] transition-opacity duration-1000 ${
          phase >= 3 && pinchReady ? "opacity-100" : "opacity-0"
        }`}
      >
        拇指移到按鈕上方捏合，或點擊進入
      </p>
    </div>
  );
}

function HomeBackdrop({ phase }: { phase: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex bg-[#0a0a10]">
      {ANIMALS.map((id, i) => (
        <AnimalColumn key={id} id={id} delay={i * 0.15} lit={phase >= 1} />
      ))}
      <CurtainTop phase={phase} />
      <FloatNotes phase={phase} />
      <Spotlights phase={phase} />
      <div className="home-backdrop-dim absolute inset-0 z-[13]" />
      <div className="home-center-scrim absolute inset-0 z-[14]" />
      <div className="home-edge-vignette absolute inset-0 z-[15]" />
      <div className="home-scrim absolute inset-0 z-[15]" />
    </div>
  );
}

function CurtainTop({ phase }: { phase: number }) {
  return (
    <div
      className={`absolute inset-x-0 top-0 z-10 h-[18vh] transition-opacity duration-[2s] ${
        phase >= 1 ? "opacity-90" : "opacity-0"
      }`}
      style={{
        background:
          "linear-gradient(180deg, rgba(92,16,24,0.55) 0%, rgba(42,6,9,0.25) 60%, transparent 100%)",
      }}
    />
  );
}

function FloatNotes({ phase }: { phase: number }) {
  return (
    <>
      {FLOAT_NOTES.map((n, i) => (
        <span
          key={i}
          className={`home-float-note absolute z-20 text-2xl text-amber-200/40 md:text-3xl ${
            phase >= 2 ? "opacity-100" : "opacity-0"
          }`}
          style={{
            left: `${12 + i * 18}%`,
            top: `${18 + (i % 3) * 12}%`,
            animationDelay: `${i * 0.7}s`,
          }}
        >
          {n}
        </span>
      ))}
    </>
  );
}

function Spotlights({ phase }: { phase: number }) {
  return (
    <>
      <div
        className={`home-spotlight home-spotlight-left absolute inset-y-0 left-0 z-10 w-1/3 transition-opacity duration-[2s] ${
          phase >= 1 ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`home-spotlight absolute inset-y-0 left-1/3 z-10 w-1/3 transition-opacity duration-[2s] delay-150 ${
          phase >= 1 ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`home-spotlight home-spotlight-right absolute inset-y-0 right-0 z-10 w-1/3 transition-opacity duration-[2s] delay-300 ${
          phase >= 1 ? "opacity-100" : "opacity-0"
        }`}
      />
    </>
  );
}

function AnimalColumn({
  id,
  delay,
  lit,
}: {
  id: (typeof ANIMALS)[number];
  delay: number;
  lit: boolean;
}) {
  return (
    <div
      className="relative min-w-0 flex-1 overflow-hidden"
      style={{ transitionDelay: `${delay}s` }}
    >
      <Image
        src={`/images/${id}-close.png`}
        alt=""
        fill
        className={`object-cover object-center transition-all duration-[1.8s] ease-out ${
          lit
            ? "scale-100 opacity-90 brightness-[0.78] saturate-90"
            : "scale-[1.02] opacity-45 brightness-[0.55]"
        }`}
        sizes="34vw"
        priority={id === "otter"}
      />
    </div>
  );
}
