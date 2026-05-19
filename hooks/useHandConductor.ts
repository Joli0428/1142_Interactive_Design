"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ratioXToAnimal } from "@/lib/conductor/animal";
import { pinchDistance, updatePinchState } from "@/lib/conductor/pinch";
import { SCALE_NOTES, ratioYToNoteIndex } from "@/lib/conductor/scale";
import {
  attackAnimal,
  rampAnimal,
  releaseAnimal,
  type AnimalSynth,
} from "@/lib/conductor/synths";
import type { AnimalId } from "@/lib/conductor/types";

export type ConductorState = {
  activeAnimal: AnimalId;
  isPinching: boolean;
  isTracking: boolean;
  noteLabel: string;
  noteIndex: number;
  frequency: number;
  pinchDist: number;
  cursorRatioX: number;
  cursorRatioY: number;
};

type HandLandmark = { x: number; y: number };

export function useHandConductor(synths: Record<AnimalId, AnimalSynth> | null) {
  const [state, setState] = useState<ConductorState>({
    activeAnimal: "otter",
    isPinching: false,
    isTracking: false,
    noteLabel: "C4",
    noteIndex: 5,
    frequency: SCALE_NOTES[5]!.frequency,
    pinchDist: 0.2,
    cursorRatioX: 0.5,
    cursorRatioY: 0.5,
  });

  const currentAnimalRef = useRef<AnimalId>("otter");
  const isPinchingRef = useRef(false);
  const currentlyPlayingRef = useRef<AnimalId | null>(null);
  const smoothCursorRef = useRef({ x: 0, y: 0, isTracking: false });
  const keyboardPinchRef = useRef(false);
  const keyboardRatioYRef = useRef(0.5);
  const keyboardModeRef = useRef(false);
  const lastNoteIndexRef = useRef(5);
  const synthsRef = useRef(synths);
  useEffect(() => {
    synthsRef.current = synths;
  }, [synths]);

  const applyAudio = useCallback(
    (animal: AnimalId, pinching: boolean, frequency: number) => {
      const s = synthsRef.current;
      if (!s) return;
      if (pinching) {
        const chain = s[animal];
        if (currentlyPlayingRef.current !== animal) {
          if (currentlyPlayingRef.current) {
            releaseAnimal(s[currentlyPlayingRef.current]);
          }
          attackAnimal(chain, frequency, animal);
          currentlyPlayingRef.current = animal;
        } else {
          rampAnimal(chain, frequency, animal);
        }
      } else if (currentlyPlayingRef.current) {
        releaseAnimal(s[currentlyPlayingRef.current]);
        currentlyPlayingRef.current = null;
      }
    },
    []
  );

  const processFrame = useCallback(
    (
      landmarks: HandLandmark[][] | undefined,
      canvasW: number,
      canvasH: number
    ): {
      cursorX: number;
      cursorY: number;
      isPinching: boolean;
      isTracking: boolean;
    } => {
      const hasHand =
        landmarks && landmarks.length > 0 && landmarks[0]!.length >= 9;
      const useKeyboard = keyboardModeRef.current && keyboardPinchRef.current;

      if (!hasHand && !useKeyboard) {
        smoothCursorRef.current.isTracking = false;
        if (isPinchingRef.current) {
          isPinchingRef.current = false;
          applyAudio(currentAnimalRef.current, false, 0);
        }
        if (currentlyPlayingRef.current && synthsRef.current) {
          releaseAnimal(synthsRef.current[currentlyPlayingRef.current]);
          currentlyPlayingRef.current = null;
        }
        setState((prev) =>
          prev.isPinching || prev.isTracking
            ? { ...prev, isPinching: false, isTracking: false }
            : prev
        );
        return { cursorX: 0, cursorY: 0, isPinching: false, isTracking: false };
      }

      let ratioX: number;
      let ratioY: number;
      let pinching: boolean;
      let dist = 0.2;
      let cursorX = 0;
      let cursorY = 0;

      if (useKeyboard && !hasHand) {
        const animal = currentAnimalRef.current;
        ratioX =
          animal === "frog" ? 0.8 : animal === "bird" ? 0.15 : 0.5;
        ratioY = keyboardRatioYRef.current;
        pinching = keyboardPinchRef.current;
        cursorX = ratioX * canvasW;
        cursorY = ratioY * canvasH;
      } else {
        const lm = landmarks![0]!;
        // 拇指（4）作為音高／分區錨點；捏合仍用食指–拇指距離判定
        const thumb = lm[4]!;
        const targetX = thumb.x * canvasW;
        const targetY = thumb.y * canvasH;

        if (!smoothCursorRef.current.isTracking) {
          smoothCursorRef.current = { x: targetX, y: targetY, isTracking: true };
        } else {
          smoothCursorRef.current.x += (targetX - smoothCursorRef.current.x) * 0.2;
          smoothCursorRef.current.y += (targetY - smoothCursorRef.current.y) * 0.2;
        }
        cursorX = smoothCursorRef.current.x;
        cursorY = smoothCursorRef.current.y;
        ratioX = cursorX / canvasW;
        ratioY = cursorY / canvasH;
        dist = pinchDistance(lm[8]!.x, lm[8]!.y, lm[4]!.x, lm[4]!.y);
        pinching = updatePinchState(dist, isPinchingRef.current);
      }

      const animal = ratioXToAnimal(ratioX);
      const noteIndex = ratioYToNoteIndex(ratioY, lastNoteIndexRef.current);
      lastNoteIndexRef.current = noteIndex;
      const note = SCALE_NOTES[noteIndex]!;

      isPinchingRef.current = pinching;
      currentAnimalRef.current = animal;

      applyAudio(animal, pinching, note.frequency);

      setState((prev) => {
        if (
          prev.activeAnimal === animal &&
          prev.isPinching === pinching &&
          prev.isTracking === true &&
          prev.noteIndex === noteIndex &&
          Math.abs(prev.pinchDist - dist) < 0.001 &&
          Math.abs(prev.cursorRatioX - ratioX) < 0.004 &&
          Math.abs(prev.cursorRatioY - ratioY) < 0.004
        ) {
          return prev;
        }
        return {
          activeAnimal: animal,
          isPinching: pinching,
          isTracking: true,
          noteLabel: note.label,
          noteIndex,
          frequency: note.frequency,
          pinchDist: dist,
          cursorRatioX: ratioX,
          cursorRatioY: ratioY,
        };
      });

      return {
        cursorX,
        cursorY,
        isPinching: pinching,
        isTracking: true,
      };
    },
    [applyAudio]
  );

  const drawCursor = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      pinching: boolean
    ) => {
      if (x <= 0 && y <= 0) return;

      if (!pinching) {
        const rings = [
          { r: 28, alpha: 0.18, width: 1 },
          { r: 18, alpha: 0.35, width: 1.5 },
          { r: 8, alpha: 0.55, width: 2 },
        ];
        for (const ring of rings) {
          ctx.beginPath();
          ctx.arc(x, y, ring.r, 0, 2 * Math.PI);
          ctx.strokeStyle = `rgba(251, 191, 36, ${ring.alpha})`;
          ctx.lineWidth = ring.width;
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(251, 191, 36, 0.7)";
        ctx.fill();
        return;
      }

      ctx.shadowBlur = 14;
      ctx.shadowColor = "#fbbf24";
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(251, 191, 36, 0.9)";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.stroke();
      ctx.shadowBlur = 0;
    },
    []
  );

  const setKeyboardPinch = useCallback((v: boolean) => {
    keyboardPinchRef.current = v;
    keyboardModeRef.current = true;
  }, []);

  const setKeyboardAnimal = useCallback((id: AnimalId) => {
    keyboardModeRef.current = true;
    currentAnimalRef.current = id;
    setState((s) => ({ ...s, activeAnimal: id }));
  }, []);

  const setKeyboardPitch = useCallback((ratioY: number) => {
    keyboardModeRef.current = true;
    keyboardRatioYRef.current = ratioY;
  }, []);

  const releaseAll = useCallback(() => {
    if (currentlyPlayingRef.current && synthsRef.current) {
      releaseAnimal(synthsRef.current[currentlyPlayingRef.current]);
      currentlyPlayingRef.current = null;
    }
  }, []);

  return {
    state,
    processFrame,
    drawCursor,
    setKeyboardPinch,
    setKeyboardAnimal,
    setKeyboardPitch,
    releaseAll,
  };
}
