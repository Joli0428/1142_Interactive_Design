/**
 * 五聲音階頻率（來自 scale.ts）→ 各動物發聲頻率
 */

const SCALE_LO = 130;
const SCALE_HI = 440;

function scaleT(scaleHz: number): number {
  const lo = Math.log2(SCALE_LO);
  const hi = Math.log2(SCALE_HI);
  const t = (Math.log2(Math.max(SCALE_LO, scaleHz)) - lo) / (hi - lo);
  return Math.max(0, Math.min(1, t));
}

/** 青蛙：基頻 = 五聲音階 Hz */
export function scaleHzForFrog(scaleHz: number): number {
  return Math.max(90, scaleHz);
}

export function scaleHzForOtter(scaleHz: number): number {
  return scaleHz;
}

/** 低音區輔助音量（海獺低頻正弦較難聽見） */
export function otterLevelBoostDb(scaleHz: number): number {
  if (scaleHz < 165) return 5;
  if (scaleHz < 220) return 3;
  return 0;
}

/**
 * 小鳥：對數映射到鳥叫音域，避免低音全卡在同一個下限
 * （先前 max(1500, hz×7.2) 會讓 C3–G3 都變 ~1500 Hz）
 */
export function scaleHzForBirdCenter(scaleHz: number): number {
  const t = scaleT(scaleHz);
  const minC = 1050;
  const maxC = 3600;
  return minC + t * (maxC - minC);
}

/** 掃頻跨度隨中心頻率略增，低音也聽得出滑動 */
export function birdSweepSpanHz(centerHz: number): number {
  return Math.min(1000, Math.max(420, centerHz * 0.3));
}

export function frogFilterHz(croakHz: number): number {
  return Math.min(2600, Math.max(550, croakHz * 5.5));
}
