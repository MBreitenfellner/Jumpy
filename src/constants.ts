export const WORLD = {
    WIDTH: 3200,
    HEIGHT: 600,
  };
  
  export const PHYS = {
    GRAVITY_Y: 900, // nur Info – du hast das bereits in main.ts gesetzt
  };
  
  export const GROUND = { THICKNESS: 80 };

  export const MOVE = {
    ACCEL_X: 400,
    MAX_VX: 60,
    DRAG_GROUND_X: 200,
    DRAG_AIR_X: 10000,
  };
  
  export const JUMP = {
    SPEED: 420,          // 1. Sprunggeschwindigkeit
    DOUBLE_MULT: 1.35,   // 2. Sprung ist höher: 1.35x
    CUT: 0.5,            // „Jump Cut“ beim Loslassen
    MAX_JUMPS: 2,
  };
  
  export const CROUCH = {
    BODY_W: 20,
    BODY_H_STAND: 60,  // Höhe deiner Stand-Frames
    BODY_H: 42,        // Höhe deiner Crouch-Frames
    SPEED_MULT: 0.7,
  };
  
  
  export const OBST = {
    COUNT: 10,          // Anzahl Hindernisse
    START_X: 600,       // erste Hürde
    SPACING: 280,       // Abstand zwischen Hürden
    WIDTH: 30,          // Breite der Hürden
    HEIGHT: 150,         // Höhe der Hürden (du kannst auch variieren)
    MIN_WIDTH: 20, // neu: schmalstes Hindernis
    MAX_WIDTH: 80, // neu: breitestes Hindernis
    MIN_HEIGHT: 40,
    MAX_HEIGHT: 150,
  };
  
  export const GOAL = {
    OFFSET_AFTER_LAST: 220, // wie weit hinter der letzten Hürde die Krone steht
    CROWN_OFFSET_Y: 38,     // Krone sitzt so viele Pixel über dem Sprite-Mittelpunkt
  };
  
  export const DEFAULT_BONUS_PER_BALL_MS = 1000;
