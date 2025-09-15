import type { LevelParams } from "../levels/LevelParams";
import { makeRng } from "./rng";

export function generateObstacleXs(p: LevelParams): number[] {
  const rand = makeRng(p.seed);
  const xs: number[] = [];
  let x = p.startX;

  for (let i = 0; i < p.obstacleCount; i++) {
    if (i === 0) {
      // erster Pfosten am StartX
    } else {
      // jitter ∈ [-J, +J]
      let spacing = p.obstacleSpacingBase + (rand() * 2 - 1) * p.obstacleSpacingJitter;
      spacing = Math.max(p.minObstacleSpacing, Math.round(spacing));
      x += spacing;
    }
    xs.push(x);
  }
  return xs;
}
