/** 青蛙合成參數（VCA 脈衝架構） */
export const FROG_PARAMS = {
  pulseRate: 58,
  filterFreq: 1580,
  filterQ: 3.5,
  duration: 0.34,
  pitchDropPercent: 45,
  /** 少量粉紅噪音增加濕潤感，過多會像電子雜音 */
  noiseMix: 0.12,
  croakInterval: 0.4,
  /** LFO → VCA.gain 範圍（避免 0↔1 硬切造成故障嗶聲） */
  vcaMin: 0.38,
  vcaMax: 0.92,
} as const;
