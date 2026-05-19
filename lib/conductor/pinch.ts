export const PINCH_ON = 0.06;
export const PINCH_OFF = 0.09;

/** Hysteresis: pinch to start, release to stop */
export function updatePinchState(
  distance: number,
  wasPinching: boolean
): boolean {
  if (wasPinching) {
    return distance < PINCH_OFF;
  }
  return distance < PINCH_ON;
}

export function pinchDistance(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.sqrt(dx * dx + dy * dy);
}
