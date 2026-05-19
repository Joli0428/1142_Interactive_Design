"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import Link from "next/link";
import { AnimalDisplay } from "@/components/stage/AnimalDisplay";
import { ConductorHUD } from "@/components/stage/ConductorHUD";
import { KeyboardFallback } from "@/components/stage/KeyboardFallback";
import { NoteParticles } from "@/components/stage/NoteParticles";
import { PitchScaleStrip } from "@/components/stage/PitchScaleStrip";
import { StageChrome } from "@/components/stage/StageChrome";
import { StageTutorial } from "@/components/stage/StageTutorial";
import { useHandConductor } from "@/hooks/useHandConductor";
import { useMediaPipeScript } from "@/hooks/useMediaPipeScript";
import { consumeAudioWarmed, consumeStageEnter } from "@/lib/stage-enter";
import { safeCloseHands } from "@/lib/mediapipe-hands";
import {
  createAnimalSynths,
  disposeAnimalSynths,
  setMasterVolumePercent,
  startAudioContext,
  type AnimalSynth,
} from "@/lib/conductor/synths";
import type { AnimalId } from "@/lib/conductor/types";

const IDLE_MS = 90_000;
const CHROME_HIDE_MS = 4_000;
export default function Stage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const synthsRef = useRef<Record<AnimalId, AnimalSynth> | null>(null);
  const lastActivityRef = useRef(0);
  const lowFpsCountRef = useRef(0);
  const bootStartedRef = useRef(false);

  const [synths, setSynths] = useState<Record<AnimalId, AnimalSynth> | null>(null);
  const { ready: isMediaPipeLoaded, onScriptLoad } = useMediaPipeScript();
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [bootNeedsTap, setBootNeedsTap] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showHud, setShowHud] = useState(false);
  const [showChrome, setShowChrome] = useState(true);
  const [useLowQuality, setUseLowQuality] = useState(false);
  const [animalCenterX, setAnimalCenterX] = useState(600);
  const [volume, setVolume] = useState(75);
  const [fromHome] = useState(() => consumeStageEnter());

  const {
    state,
    processFrame,
    drawCursor,
    setKeyboardPinch,
    setKeyboardAnimal,
    setKeyboardPitch,
    releaseAll,
  } = useHandConductor(synths);

  useEffect(() => {
    lastActivityRef.current = Date.now();
  }, []);

  const touchActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowChrome(true);
  }, []);

  const handleStart = useCallback(async () => {
    if (bootStartedRef.current) return;
    bootStartedRef.current = true;
    setBootNeedsTap(false);
    try {
      consumeAudioWarmed();
      await startAudioContext();
      const created = createAnimalSynths();
      synthsRef.current = created;
      setSynths(created);
      setIsAudioReady(true);
    } catch (err) {
      console.error("音訊啟動失敗：", err);
      bootStartedRef.current = false;
      setBootNeedsTap(true);
    }
  }, []);

  useEffect(() => {
    if (!fromHome || isAudioReady) return;
    void handleStart();
  }, [fromHome, isAudioReady, handleStart]);

  useEffect(() => {
    if (!fromHome || isAudioReady) return;
    const t = window.setTimeout(() => {
      if (!isAudioReady) setBootNeedsTap(true);
    }, 6000);
    return () => window.clearTimeout(t);
  }, [fromHome, isAudioReady]);

  useEffect(() => {
    if (state.isPinching) {
      touchActivity();
    }
  }, [state.isPinching, touchActivity]);

  useEffect(() => {
    if (!isAudioReady) return;
    const hide = () => {
      if (Date.now() - lastActivityRef.current > CHROME_HIDE_MS) {
        setShowChrome(false);
      }
    };
    const id = setInterval(hide, 500);
    return () => clearInterval(id);
  }, [isAudioReady]);

  useEffect(() => {
    if (!isAudioReady) return;
    const onKeyDown = (e: KeyboardEvent) => {
      touchActivity();
      if (e.key === "h" || e.key === "H") {
        setShowHud((v) => !v);
      }
      if (e.code === "Space") {
        e.preventDefault();
        setKeyboardPinch(true);
      }
      if (e.key === "1") setKeyboardAnimal("frog");
      if (e.key === "2") setKeyboardAnimal("otter");
      if (e.key === "3") setKeyboardAnimal("bird");
      if (e.key === "ArrowUp") setKeyboardPitch(0.2);
      if (e.key === "ArrowDown") setKeyboardPitch(0.8);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setKeyboardPinch(false);
        releaseAll();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [
    isAudioReady,
    setKeyboardPinch,
    setKeyboardAnimal,
    setKeyboardPitch,
    releaseAll,
    touchActivity,
  ]);

  useEffect(() => {
    if (!isMediaPipeLoaded || !isAudioReady) return;

    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement?.getContext("2d");
    if (!videoElement || !canvasElement || !canvasCtx) return;

    // @ts-expect-error MediaPipe loaded via script tag
    const hands = new window.Hands({
      locateFile: (file: string) => `/mediapipe/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 0,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults((results: { multiHandLandmarks?: { x: number; y: number }[][] }) => {
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      const frame = processFrame(
        results.multiHandLandmarks,
        canvasElement.width,
        canvasElement.height
      );
      if (frame.isTracking && (frame.cursorX > 0 || frame.cursorY > 0)) {
        drawCursor(canvasCtx, frame.cursorX, frame.cursorY, frame.isPinching);
      }
      canvasCtx.restore();
    });

    let animationFrameId = 0;
    let lastFrameTime = performance.now();
    let stream: MediaStream | null = null;
    let disposed = false;

    const startCameraAndDetection = async () => {
      try {
        setCameraError(null);
        stream = await navigator.mediaDevices.getUserMedia({
          video: useLowQuality
            ? { width: { ideal: 640 }, height: { ideal: 480 } }
            : { width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (disposed) {
          stream.getTracks().forEach((t) => t.stop());
          stream = null;
          return;
        }
        videoElement.srcObject = stream;
        videoElement.onloadeddata = () => {
          canvasElement.width = videoElement.videoWidth;
          canvasElement.height = videoElement.videoHeight;
          const detectFrame = async (now: number) => {
            if (disposed) return;
            const dt = now - lastFrameTime;
            lastFrameTime = now;
            if (dt > 50) {
              lowFpsCountRef.current += 1;
              if (lowFpsCountRef.current > 30 && !useLowQuality) {
                setUseLowQuality(true);
              }
            } else {
              lowFpsCountRef.current = Math.max(0, lowFpsCountRef.current - 1);
            }
            if (videoElement.readyState >= 2) {
              await hands.send({ image: videoElement });
            }
            animationFrameId = requestAnimationFrame(detectFrame);
          };
          detectFrame(performance.now());
        };
      } catch (err) {
        console.error("相機啟動失敗：", err);
        setCameraError(
          "無法啟動相機。請確認已授予權限，或使用鍵盤備援。"
        );
      }
    };

    startCameraAndDetection();

    return () => {
      disposed = true;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      stream?.getTracks().forEach((t) => t.stop());
      stream = null;
      videoElement.srcObject = null;
      safeCloseHands(hands);
      releaseAll();
      if (synthsRef.current) {
        disposeAnimalSynths(synthsRef.current);
        synthsRef.current = null;
      }
    };
  }, [
    isMediaPipeLoaded,
    isAudioReady,
    processFrame,
    drawCursor,
    releaseAll,
    useLowQuality,
  ]);

  useEffect(() => {
    if (!isAudioReady) return;
    const interval = setInterval(() => {
      if (Date.now() - lastActivityRef.current > IDLE_MS) {
        setShowChrome(true);
        releaseAll();
        lastActivityRef.current = Date.now();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [isAudioReady, releaseAll]);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      const xByAnimal: Record<AnimalId, number> = {
        frog: w * (1 / 6),
        otter: w * 0.5,
        bird: w * (5 / 6),
      };
      setAnimalCenterX(xByAnimal[state.activeAnimal]);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [state.activeAnimal]);

  const handleVolumeChange = useCallback((percent: number) => {
    setVolume(percent);
    setMasterVolumePercent(percent);
    touchActivity();
  }, [touchActivity]);

  return (
    <main
      className="stage-backdrop relative h-screen w-screen overflow-hidden bg-[#050508] font-sans text-white select-none"
      onPointerDown={touchActivity}
      onPointerMove={touchActivity}
    >
      <Script
        src="/mediapipe/hands.js"
        crossOrigin="anonymous"
        onLoad={onScriptLoad}
      />

      {!isAudioReady && (
        <>
          <AnimalDisplay activeAnimal="otter" isPinching={false} />
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/35">
            <p className="mb-6 font-serif text-lg text-white/85 [text-shadow:0_1px_12px_rgba(0,0,0,0.9)]">
              {fromHome
                ? "正在踏上指揮台…"
                : !isMediaPipeLoaded
                  ? "正在載入手勢辨識…"
                  : "正在踏上指揮台…"}
            </p>
            {((!fromHome && isMediaPipeLoaded) || bootNeedsTap) && (
              <button
                type="button"
                onClick={() => void handleStart()}
                className="rounded-full border border-amber-200/50 bg-amber-100 px-10 py-3 font-bold text-zinc-900 shadow-[0_0_40px_rgba(251,191,36,0.3)]"
              >
                踏上指揮台
              </button>
            )}
          </div>
        </>
      )}

      {isAudioReady && (
        <>
          <AnimalDisplay
            activeAnimal={state.activeAnimal}
            isPinching={state.isPinching}
          />
          <PitchScaleStrip
            activeIndex={state.noteIndex}
            isPinching={state.isPinching}
            isTracking={state.isTracking}
            cursorRatioY={state.cursorRatioY}
          />
          <NoteParticles
            isPinching={state.isPinching}
            activeAnimalX={animalCenterX}
          />
          <ConductorHUD
            noteLabel={state.noteLabel}
            frequency={state.frequency}
            pinchDistance={state.pinchDist}
            isPinching={state.isPinching}
            activeAnimal={state.activeAnimal}
            showHud={showHud}
          />

          <StageChrome
            visible={showChrome && !showTutorial}
            isPinching={state.isPinching}
            volume={volume}
            onVolumeChange={handleVolumeChange}
          />

          {cameraError && (
            <div className="absolute left-1/2 top-32 z-50 max-w-md -translate-x-1/2 rounded-lg border border-red-400/30 bg-black/80 p-4 text-center text-sm text-red-200">
              <p>{cameraError}</p>
              <button
                type="button"
                className="mt-3 text-amber-300 underline"
                onClick={() => window.location.reload()}
              >
                重試
              </button>
            </div>
          )}

          {showTutorial && (
            <StageTutorial
              onDismiss={() => setShowTutorial(false)}
              pinch={{
                isPinching: state.isPinching,
                isTracking: state.isTracking,
                ratioX: state.cursorRatioX,
                ratioY: state.cursorRatioY,
              }}
            />
          )}

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 h-full w-full scale-x-[-1] object-cover opacity-0"
          />
          <canvas
            ref={canvasRef}
            className="pointer-events-none absolute inset-0 z-30 h-full w-full scale-x-[-1] object-cover"
          />

          {cameraError && (
            <KeyboardFallback
              activeAnimal={state.activeAnimal}
              onAnimalChange={setKeyboardAnimal}
              onPinchChange={(p) => {
                setKeyboardPinch(p);
                if (!p) releaseAll();
              }}
              onPitchChange={setKeyboardPitch}
            />
          )}
        </>
      )}
    </main>
  );
}
