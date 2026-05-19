"use client";

import { useEffect, useRef, useState } from "react";
import { pinchDistance, updatePinchState } from "@/lib/conductor/pinch";
import { safeCloseHands } from "@/lib/mediapipe-hands";

type HandLandmark = { x: number; y: number };

export type PinchDetectorState = {
  isPinching: boolean;
  isTracking: boolean;
  /** 鏡像後、與畫面一致的 X（0=左） */
  ratioX: number;
  ratioY: number;
  error: string | null;
};

const INITIAL: PinchDetectorState = {
  isPinching: false,
  isTracking: false,
  ratioX: 0.5,
  ratioY: 0.5,
  error: null,
};

/** 輕量捏合偵測：首頁／教學等不需發聲的場景 */
export function usePinchDetector(mediapipeReady: boolean) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<PinchDetectorState>(INITIAL);
  const isPinchingRef = useRef(false);
  const stopCameraRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!mediapipeReady) return;

    const video = videoRef.current;
    if (!video) return;

    // @ts-expect-error MediaPipe from script tag
    const hands = new window.Hands({
      locateFile: (file: string) => `/mediapipe/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 0,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults((results: { multiHandLandmarks?: HandLandmark[][] }) => {
      const lm = results.multiHandLandmarks?.[0];
      if (!lm || lm.length < 9) {
        if (isPinchingRef.current) {
          isPinchingRef.current = false;
        }
        setState((s) =>
          s.isPinching || s.isTracking
            ? { ...s, isPinching: false, isTracking: false }
            : s
        );
        return;
      }

      const thumb = lm[4]!;
      const index = lm[8]!;
      const dist = pinchDistance(index.x, index.y, thumb.x, thumb.y);
      const pinching = updatePinchState(dist, isPinchingRef.current);
      isPinchingRef.current = pinching;

      const ratioX = 1 - thumb.x;
      const ratioY = thumb.y;

      setState((s) => {
        if (
          s.isPinching === pinching &&
          Math.abs(s.ratioX - ratioX) < 0.01 &&
          Math.abs(s.ratioY - ratioY) < 0.01
        ) {
          return s;
        }
        return {
          ...s,
          isPinching: pinching,
          isTracking: true,
          ratioX,
          ratioY,
        };
      });
    });

    let animationFrameId = 0;
    let stream: MediaStream | null = null;
    let disposed = false;

    const stopCamera = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = 0;
      stream?.getTracks().forEach((t) => t.stop());
      stream = null;
      video.srcObject = null;
    };

    const dispose = () => {
      if (disposed) return;
      disposed = true;
      stopCameraRef.current = null;
      stopCamera();
      safeCloseHands(hands);
      isPinchingRef.current = false;
    };

    stopCameraRef.current = stopCamera;

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 } },
        });
        if (disposed) {
          stream.getTracks().forEach((t) => t.stop());
          stream = null;
          return;
        }
        video.srcObject = stream;
        video.onloadeddata = () => {
          const loop = async () => {
            if (disposed) return;
            if (video.readyState >= 2) {
              await hands.send({ image: video });
            }
            animationFrameId = requestAnimationFrame(loop);
          };
          loop();
        };
        setState((s) => ({ ...s, error: null }));
      } catch {
        setState((s) => ({
          ...s,
          error: "無法啟動相機，請使用滑鼠點擊按鈕",
        }));
      }
    };

    start();

    return () => {
      dispose();
    };
  }, [mediapipeReady]);

  /** 僅釋放相機（導頁前），不關閉 Hands；完整釋放由 effect cleanup 負責 */
  const releaseCamera = () => stopCameraRef.current?.();

  return { ...state, videoRef, releaseCamera };
}

export type PinchZone = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
};

export function isThumbInZone(
  ratioX: number,
  ratioY: number,
  zone: PinchZone
): boolean {
  return (
    ratioX >= zone.xMin &&
    ratioX <= zone.xMax &&
    ratioY >= zone.yMin &&
    ratioY <= zone.yMax
  );
}

/** 主按鈕區（進入劇場／開始指揮） */
export const PINCH_BUTTON_ZONE: PinchZone = {
  xMin: 0.28,
  xMax: 0.72,
  yMin: 0.52,
  yMax: 0.88,
};
