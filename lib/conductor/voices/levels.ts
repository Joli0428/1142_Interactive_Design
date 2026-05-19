/**
 * 三動物感知音量平衡（數值愈大愈響）
 * 小鳥高頻連發最醒目；青蛙需足夠突出。
 */
export const VOICE_LEVEL_DB = {
  frog: -3,
  otter: -4,
  bird: -20,
} as const;
