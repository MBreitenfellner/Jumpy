// racket-swing.ts
import Phaser from "phaser";

export class RacketSwing {
  private scene: Phaser.Scene;
  private player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private hitbox!: Phaser.Physics.Arcade.Sprite;
  private swinging = false;
  private cooldown = false;
  private readonly SWING_MS = 120;
  private readonly COOLDOWN_MS = 180;

  constructor(scene: Phaser.Scene, player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody) {
    this.scene = scene;
    this.player = player;

    this.hitbox = this.scene.physics.add.sprite(player.x, player.y, undefined as any);
    this.hitbox.body.setAllowGravity(false);
    this.hitbox.setVisible(false);
    (this.hitbox.body as Phaser.Physics.Arcade.Body).setSize(36, 36);
    this.hitbox.setImmovable(true);
    this.hitbox.setActive(false);
    (this.hitbox.body as Phaser.Physics.Arcade.Body).enable = false;
  }

  attachInput() {
    const key = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.scene.input.on("pointerdown", () => this.trySwing());
    key.on("down", () => this.trySwing());
  }

  private trySwing() {
    if (this.cooldown || this.swinging) return;
    this.swinging = true;
    this.cooldown = true;

    const facingRight = this.player.flipX === false;
    const offsetX = facingRight ? 28 : -28;
    this.hitbox.setPosition(this.player.x + offsetX, this.player.y - 6);
    (this.hitbox.body as Phaser.Physics.Arcade.Body).enable = true;
    this.hitbox.setActive(true);

    this.scene.time.delayedCall(this.SWING_MS, () => {
      this.hitbox.setActive(false);
      (this.hitbox.body as Phaser.Physics.Arcade.Body).enable = false;
      this.swinging = false;
    });

    this.scene.time.delayedCall(this.COOLDOWN_MS, () => (this.cooldown = false));
  }

  public getHitbox() { return this.hitbox; }
  public isActive() { return this.swinging; }
}
