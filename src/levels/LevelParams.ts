export interface LevelParams {
    index: number;
    seed: string;
  
    obstacleCount: number;
    obstacleWidth: number;
  
    // Abstände
    obstacleSpacingBase: number;      // Basisabstand
    obstacleSpacingJitter: number;    // ±Jitter
    minObstacleSpacing: number;       // nie darunter
  
    // Höhe (konstant, kannst du später auch variieren)
    obstacleBaseHeight: number;
  
    startX: number;
    goalOffsetAfterLast: number;
  }
  
  import { OBST, GOAL } from "../constants";
  
  export function difficultyFromIndex(index: number): LevelParams {
    // Skaliert moderat: enger, mehr Pfosten, etwas höhere Basishöhe
    const base = Math.max(OBST.SPACING - index * 10, 140);       // enger bis min 140
    const jitter = Math.min(60 + index * 6, 160);                // mehr Varianz
    const minSpacing = 110;                                      // Sicherheitsuntergrenze
  
    return {
      index,
      seed: `level-${index}-v1`,          // Versionstring halten → ändert das Layout NICHT versehentlich
      obstacleCount: Math.min(OBST.COUNT + index * 2, 80),
      obstacleWidth: OBST.WIDTH,
  
      obstacleSpacingBase: base,
      obstacleSpacingJitter: jitter,
      minObstacleSpacing: minSpacing,
  
      obstacleBaseHeight: OBST.HEIGHT + index * 4,
      startX: OBST.START_X,
      goalOffsetAfterLast: GOAL.OFFSET_AFTER_LAST,
    };
  }
  