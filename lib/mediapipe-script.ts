/** MediaPipe Hands 是否已透過 script 注入可用 */
export function isMediaPipeHandsAvailable(): boolean {
  return typeof window !== "undefined" && "Hands" in window;
}
