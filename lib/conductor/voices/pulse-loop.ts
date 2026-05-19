import * as Tone from "tone";

export type PulseLoopController = {
  start(initialFreq: number): void;
  setFrequency(frequency: number): void;
  stop(): void;
  dispose(): void;
};

/**
 * 管理重複短促叫聲：attack 立刻 play 一次並啟動 Loop，ramp 只更新目標頻率。
 */
export function createPulseLoop(
  playOnce: (frequency: number, time: number) => void,
  intervalSec: number
): PulseLoopController {
  let targetFreq = 440;
  let loop: Tone.Loop | null = null;
  let active = false;

  const stopLoop = () => {
    if (loop) {
      loop.stop();
      loop.dispose();
      loop = null;
    }
    active = false;
  };

  return {
    start(initialFreq: number) {
      targetFreq = initialFreq;
      stopLoop();
      active = true;

      const t = Tone.now();
      playOnce(targetFreq, t);

      loop = new Tone.Loop((time) => {
        if (active) playOnce(targetFreq, time);
      }, intervalSec);
      loop.start(0);
    },

    setFrequency(frequency: number) {
      targetFreq = frequency;
    },

    stop() {
      stopLoop();
    },

    dispose() {
      stopLoop();
    },
  };
}
