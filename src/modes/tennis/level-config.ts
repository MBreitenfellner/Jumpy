// level-config.ts
export type Equipment = "none" | "tennis";

export interface LevelConfig {
  index: number;
  equipment: Equipment;
  balls?: { x: number; y: number }[];
  maxBalls?: number;           // sollte == balls.length sein
  bonusPerBallMs?: number;     // optional; Default 1000
}

export const LEVELS: Record<number, LevelConfig> = {
  1: {
    index: 1,
    equipment: "tennis",
    balls: [
      { x: 520, y: 340 },
      { x: 840, y: 320 },
    ],
    maxBalls: 2,
    bonusPerBallMs: 1000,
  },
  2: {
    index: 2,
    equipment: "tennis",
    balls: [
      { x: 480, y: 340 },
      { x: 760, y: 300 },
      { x: 1040, y: 280 },
      { x: 1280, y: 330 },
    ],
    maxBalls: 4,
    bonusPerBallMs: 1000,
  },
};
