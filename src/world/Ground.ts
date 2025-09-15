import Phaser from "phaser";
import { GROUND } from "../constants";

export class Ground {
  body!: Phaser.Physics.Arcade.StaticBody;

  constructor(private scene: Phaser.Scene) {}

  create(levelWidth: number, groundTop: number) {
    const rect = this.scene.add.rectangle(
      levelWidth / 2,
      groundTop + GROUND.THICKNESS / 2,
      levelWidth,
      GROUND.THICKNESS,
      0x3b3b3b
    );
    this.scene.physics.add.existing(rect, true);
    this.body = rect.body as Phaser.Physics.Arcade.StaticBody;
    this.body.updateFromGameObject();
    (this.body as any).checkCollision = { up: true, down: false, left: false, right: false };
  }

  colliderWith(player: Phaser.Types.Physics.Arcade.GameObjectWithBody) {
    this.scene.physics.add.collider(player, this.body);
  }

  resize(newGroundTop: number) {
    const rect = this.body.gameObject as Phaser.GameObjects.Rectangle;
    rect.setY(newGroundTop + GROUND.THICKNESS / 2);
    this.body.updateFromGameObject();
  }
}
