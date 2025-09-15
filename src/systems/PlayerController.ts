// Verzeihender Controller: Auto-Run (optional), Coyote, Jump-Buffer, variabler Sprung
export class PlayerController {
  private enabled = true;
  private autoRun = false;

  // Lauf
  runSpeed = 220;
  accel = 1800;

  // Sprung/Gravitation (tuning)
  jumpVel  = -820;  // höherer Startsprung
  gravUp   = 820;   // sanfter Aufwärtsflug
  gravDown = 1650;  // schnelleres Fallen
  cutMult  = 0.55;  // Jump-Cut (0.45–0.6)

  // Toleranzen
  coyoteMs = 120;
  bufferMs = 140;

  // Anti-Mini-Sprung
  minHoldMs = 200;  // vor Jump-Cut mind. so lange halten
  private jumpStartedAt = -1e9;

  // intern
  private lastOnGroundAt = -1e9;
  private lastJumpPressedAt = -1e9;

  constructor(
    private player: Phaser.Physics.Arcade.Sprite,
    private controls: {
      left: boolean; right: boolean; crouch: boolean; hit: boolean;
      jumpDown: boolean; jumpUp: boolean; jumpHeld: boolean;
    }
  ) {}

  setEnabled(v: boolean) { this.enabled = v; return this; }
  setAutoRun(v: boolean) { this.autoRun = v; return this; }
  setAssist(p: Partial<PlayerController>) { Object.assign(this, p); return this; }

  update(onGround: boolean, timeMs?: number, _dtMs?: number) {
    if (!this.enabled) return;

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const now  = typeof timeMs === "number" ? timeMs : (performance?.now?.() ?? Date.now());

    // Horizontal
    if (this.autoRun) {
      const target = this.runSpeed;
      const dv = target - body.velocity.x;
      const ax = Phaser.Math.Clamp(dv * 8, -this.accel, this.accel);
      body.setAccelerationX(ax);
    } else {
      const dir = (this.controls.right ? 1 : 0) - (this.controls.left ? 1 : 0);
      const target = dir * this.runSpeed;
      const dv = target - body.velocity.x;
      const ax = Phaser.Math.Clamp(dv * 8, -this.accel, this.accel);
      body.setAccelerationX(ax);
    }

    // Ground/Coyote/Buffer
    if (onGround) this.lastOnGroundAt = now;
    if (this.controls.jumpDown) this.lastJumpPressedAt = now;

    const canCoyote = (now - this.lastOnGroundAt) <= this.coyoteMs;
    const buffered  = (now - this.lastJumpPressedAt) <= this.bufferMs;

    // Sprung
    if (buffered && canCoyote) {
      body.setVelocityY(this.jumpVel);
      this.jumpStartedAt = now;
      this.lastJumpPressedAt = -1e9; // Buffer verbraucht
    }

    // Variable Sprunghöhe / Gravitation
    const vy = body.velocity.y;
    if (vy < 0) {
      const heldLongEnough = (now - this.jumpStartedAt) >= this.minHoldMs;
      if (heldLongEnough && this.controls.jumpUp) {
        body.setVelocityY(vy * this.cutMult); // Jump-Cut
      }
      body.setGravityY((this.controls.jumpHeld || !heldLongEnough) ? this.gravUp : this.gravDown);
    } else {
      body.setGravityY(this.gravDown);
    }
  }
}

export default PlayerController;
