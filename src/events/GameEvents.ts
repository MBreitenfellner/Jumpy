export const GameEvents = {
    LEVEL_WIN: "level:win",
    LEVEL_FAIL: "level:fail",
    LEVEL_RESTART: "level:restart",
  } as const;
  
  export type GameEventKey = typeof GameEvents[keyof typeof GameEvents];
  