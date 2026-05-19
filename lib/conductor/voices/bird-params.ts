/** 小鳥啾叫參數（正弦 + 頻率掃描 + 柔和包絡） */
export const BIRD_PARAMS = {
  /** 單聲長度（秒），50–100ms 偏麻雀 */
  chirpDuration: 0.09,
  /** 連發間隔（秒），0.12–0.2 典型「啾、啾、啾」 */
  chirpInterval: 0.16,
  /** 掃頻跨度由 pitch.birdSweepSpanHz 依中心頻率計算 */
  attack: 0.01,
  decay: 0.02,
  sustain: 0.55,
  /** release ≈ duration * ratio */
  releaseRatio: 0.58,
} as const;
