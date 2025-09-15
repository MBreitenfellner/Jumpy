import Phaser from "phaser";
import { GOAL } from "../constants";

export class CrownSystem {
  private crown!: Phaser.Physics.Arcade.Image;
  followImg?: Phaser.GameObjects.Image;

  constructor(private scene: Phaser.Scene) {}

  create(x: number, groundTop: number) {
    this.crown = this.scene.physics.add.image(x, groundTop - 30, "crown_tex");
    this.crown.setImmovable(true);
    (this.crown.body as Phaser.Physics.Arcade.Body).allowGravity = false;
  }

  bindOverlap(player: Phaser.Types.Physics.Arcade.GameObjectWithBody, onPickup: () => void) {
    this.scene.physics.add.overlap(player, this.crown, () => onPickup(), undefined, this);
  }

  pickup(player: Phaser.GameObjects.Sprite) {
    this.crown.setActive(false).setVisible(false);
    this.followImg = this.scene.add.image(player.x, player.y - GOAL.CROWN_OFFSET_Y, "crown_tex").setDepth(5);
  }

  updateFollow(player: Phaser.GameObjects.Sprite) {
    if (this.followImg) this.followImg.setPosition(player.x, player.y - GOAL.CROWN_OFFSET_Y);
  }

  // ✅ NEU: Krone relativ zum neuen Boden verschieben (nur solange sie noch liegt)
  resize(newGroundTop: number) {
    if (this.followImg) return; // nach Pickup folgt sie dem Spieler – nichts tun
    if (!this.crown?.active) return;
    this.crown.setY(newGroundTop - 30);
    // (Dynamic Body – kein updateFromGameObject nötig)
  }
}
