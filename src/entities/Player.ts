import Phaser from "phaser";
import { CROUCH, JUMP, MOVE } from "../constants";

export class Player extends Phaser.Physics.Arcade.Sprite {
  jumpsUsed = 0;
  isCrouching = false;

  // vom Scene-Code gesetzt
  private groundTop: number | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "stick_idle");
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setMaxVelocity(MOVE.MAX_VX, 1200);
    body.setDragX(MOVE.DRAG_GROUND_X);

    this.setBodyStanding(); // KEIN play() hier
  }

  /** Scene setzt die aktuelle Bodenoberkante (nach create & bei resize aufrufen) */
  setGroundTop(y: number) {
    this.groundTop = y;
    this.snapFeetToGround();
  }

  /** Füße exakt auf groundTop setzen (ohne Lücke) */
  snapFeetToGround() {
    if (this.groundTop == null) return;
    const b = this.body as Phaser.Physics.Arcade.Body;
    const targetFoot = this.groundTop; // exakt auf Boden
    const delta = targetFoot - b.bottom;
    if (Math.abs(delta) > 0.01) {
      this.setY(this.y + delta);
      b.updateFromGameObject();
      if (b.velocity.y > 0) b.setVelocityY(0);
    }
  }

  /** Animation nur starten, wenn sie existiert und Frames hat */
  tryPlay(key: string) {
    const a = this.scene.anims.get(key);
    if (a && a.frames && a.frames.length > 0) {
      this.anims.play(key, true);
      return true;
    }
    return false;
  }

  // ---- Laufzeit-Klammer gegen „Einsickern“ (nur wenn unter Boden) ----
  preUpdate(t: number, d: number) {
    super.preUpdate(t, d);
    const b = this.body as Phaser.Physics.Arcade.Body;
    if (this.groundTop != null && b.bottom > this.groundTop) {
      this.snapFeetToGround();
    }
  }

  // ---- API ----
  get bodyArc(): Phaser.Physics.Arcade.Body { return this.body as Phaser.Physics.Arcade.Body; }

  onLanded() { this.jumpsUsed = 0; }

  tryJump(): boolean {
    if (this.jumpsUsed >= JUMP.MAX_JUMPS) return false;
    const isSecond = this.jumpsUsed === 1;
    const vy = -JUMP.SPEED * (isSecond ? JUMP.DOUBLE_MULT : 1);
    this.bodyArc.setVelocityY(vy);
    this.jumpsUsed++;
    return true;
  }

  jumpCutIfAscending() {
    if (this.bodyArc.velocity.y < 0) {
      this.bodyArc.setVelocityY(this.bodyArc.velocity.y * JUMP.CUT);
    }
  }

  setCrouch(active: boolean) {
    if (active === this.isCrouching) return;
    this.isCrouching = active;

    if (active) this.setBodyCrouching(); else this.setBodyStanding();

    // Sofort beruhigen & auf Boden snappen
    this.scene.physics.world.step(0);
    this.snapFeetToGround();
  }

  private setBodyStanding()  { this.setBodySizeKeepingFeet(CROUCH.BODY_W, CROUCH.BODY_H_STAND); }
  private setBodyCrouching() { this.setBodySizeKeepingFeet(CROUCH.BODY_W, CROUCH.BODY_H); }

  /**
   * Bodygröße + Offset setzen; danach snapFeetToGround() sorgt für perfekte Bodenlage.
   * WICHTIG: Wir verschieben NIE body.position direkt – nur das Sprite (this.y).
   */
  private setBodySizeKeepingFeet(w: number, h: number) {
    const b = this.bodyArc;
    const offX = Math.round((this.width  - w) / 2);
    const offY = Math.round((this.height - h));
    b.setSize(w, h);
    b.setOffset(offX, offY);
    b.updateFromGameObject();
    b.setVelocityY(0);
  }
}
