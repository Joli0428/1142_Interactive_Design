/** MediaPipe Hands 實例（由 script 注入） */
export type MediaPipeHands = {
  close: () => void;
};

/** 安全關閉 Hands，避免重複 close 導致 WASM BindingError */
export function safeCloseHands(hands: MediaPipeHands | null | undefined): void {
  if (!hands) return;
  try {
    hands.close();
  } catch {
    /* instance already deleted */
  }
}
