// tennis-ball.ts
import Phaser from "phaser";
import type { LevelConfig } from "./level-config";

export class TennisBalls {
  private scene: Phaser.Scene;
  public group!: Phaser.Physics.Arcade.StaticGroup;
  public remaining = 0;

  constructor(scene: Phaser.Scene) { this.scene = scene; }

  spawnFromConfig(cfg: LevelConfig) {
    if (!cfg.balls?.length) return;
    this.group = this.scene.physics.add.staticGroup();

    for (const pos of cfg.balls) {
      const ball = this.scene.add.sprite(pos.x, pos.y, "tennisBall");
      this.scene.physics.add.existing(ball, true); // StaticBody
      (ball.body as Phaser.Physics.Arcade.StaticBody).setCircle(10).updateFromGameObject();
      ball.setDataEnabled();
      ball.setData("hit", false);
      this.group.add(ball);
    }
    this.remaining = cfg.balls.length;
  }
}
