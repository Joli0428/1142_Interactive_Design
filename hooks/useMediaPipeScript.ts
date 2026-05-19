"use client";

import { useEffect, useState } from "react";
import { isMediaPipeHandsAvailable } from "@/lib/mediapipe-script";

/**
 * 偵測 MediaPipe 是否就緒（含從首頁預載、script 已快取但 onLoad 不再觸發的情況）
 */
export function useMediaPipeScript() {
  const [ready, setReady] = useState(() => isMediaPipeHandsAvailable());

  useEffect(() => {
    if (ready) return;

    if (isMediaPipeHandsAvailable()) {
      setReady(true);
      return;
    }

    const poll = window.setInterval(() => {
      if (isMediaPipeHandsAvailable()) {
        setReady(true);
        window.clearInterval(poll);
      }
    }, 80);

    return () => window.clearInterval(poll);
  }, [ready]);

  const onScriptLoad = () => setReady(true);

  return { ready, onScriptLoad };
}
