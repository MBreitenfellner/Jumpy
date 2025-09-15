import type { Player } from "../../entities/Player";

export class Racket {
  private scene: Phaser.Scene;
  private player: Player;
  private sprite?: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, player: Player) { this.scene = scene; this.player = player; }

  create() {
    this.sprite = this.scene.add.sprite(this.player.x, this.player.y, "racket")
      .setDepth((this.player.depth ?? 0) + 1)
      .setVisible(true);
    return this;
  }

  setScale(v: number) { this.sprite?.setScale(v); }

  follow() {
    if (!this.sprite) return;
    const offX = this.player.flipX ? -18 : 18;
    const offY = -6;
    this.sprite.setPosition(this.player.x + offX, this.player.y + offY);
    this.sprite.setFlipX(this.player.flipX);
    this.sprite.setDepth(this.player.flipX ? (this.player.depth ?? 0) - 1 : (this.player.depth ?? 0) + 1);
  }

  swing() {
    if (!this.sprite) return;
    this.scene.tweens.add({ targets: this.sprite, angle: this.player.flipX ? -25 : 25, duration: 60, yoyo: true });
  }

  destroy() { this.sprite?.destroy(); }
}
