const KEY = "animal-choir-stage-enter";
const AUDIO_KEY = "animal-choir-audio-warmed";

/** 首頁已確認進入（保留使用者手勢，供舞台啟動音訊） */
export function markStageEnter(): void {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {
    /* private mode */
  }
}

export function consumeStageEnter(): boolean {
  try {
    const ok = sessionStorage.getItem(KEY) === "1";
    if (ok) sessionStorage.removeItem(KEY);
    return ok;
  } catch {
    return false;
  }
}

/** 首頁已在使用者手勢下啟動 Tone（舞台可略過再次等待手勢） */
export function markAudioWarmed(): void {
  try {
    sessionStorage.setItem(AUDIO_KEY, "1");
  } catch {
    /* private mode */
  }
}

export function consumeAudioWarmed(): boolean {
  try {
    const ok = sessionStorage.getItem(AUDIO_KEY) === "1";
    if (ok) sessionStorage.removeItem(AUDIO_KEY);
    return ok;
  } catch {
    return false;
  }
}
