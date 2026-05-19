/** 單一動物發聲器（可即時 attack / ramp / release） */
export interface AnimalVoice {
  attack(frequency: number): void;
  ramp(frequency: number): void;
  release(): void;
  dispose(): void;
}
