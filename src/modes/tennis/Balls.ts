import Phaser from "phaser";
import type { LevelConfig } from "./level-config";

export class Balls {
  readonly group: Phaser.Physics.Arcade.Group;
  private scene: Phaser.Scene;
  private groundTop: number;
  remaining = 0;

  constructor(scene: Phaser.Scene, groundTop: number) {
    this.scene = scene;
    this.groundTop = groundTop;
    this.group = this.scene.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      maxSize: 32,
      runChildUpdate: false,
    });
  }

  spawnFromConfig(cfg: LevelConfig, reachMin = 70, reachMax = 110) {
    const total = cfg.balls?.length ?? (cfg.maxBalls ?? 0);
    this.remaining = total;

    for (let i = 0; i < total; i++) {
      const x = 260 + i * 140;
      const y = this.groundTop - Phaser.Math.Between(reachMin, reachMax);

      const s = this.group.get(x, y, "tennisBall") as Phaser.Physics.Arcade.Sprite | null;
      if (!s) continue;

      // wiederverwendete Sprites sauber reaktivieren
      s.setActive(true).setVisible(true);
      if (!s.body) this.scene.physics.world.enable(s);

      const body = s.body as Phaser.Physics.Arcade.Body;
      body.enable = true;
      body.reset(x, y);

      // Darstellung + Hitbox zusammenführen
      s.setDisplaySize(18, 18);
      body.setSize(s.displayWidth, s.displayHeight, true);
      // optional runder Hit:
      // body.setCircle(Math.min(s.displayWidth, s.displayHeight) / 2, 0, 0);

      s.setCollideWorldBounds(true);
    }
  }

  clampReachable(minAbove: number, maxAbove: number) {
    const minY = this.groundTop - maxAbove;
    const maxY = this.groundTop - minAbove;

    const children = this.group.getChildren() as Phaser.GameObjects.GameObject[];
    for (const obj of children) {
      const s = obj as Phaser.Physics.Arcade.Sprite;
      if (!s || !s.active) continue;

      const newY = Phaser.Math.Clamp(s.y, minY, maxY);
      s.setY(newY);

      const body = s.body as Phaser.Physics.Arcade.Body | undefined;
      if (body) body.position.y = newY - body.halfHeight;
    }
  }

  cleanupOffscreen(cam: Phaser.Cameras.Scene2D.Camera) {
    const vw = cam.worldView;
    const MARGIN = 120;

    const children = this.group.getChildren() as Phaser.GameObjects.GameObject[];
    const toRemove: Phaser.Physics.Arcade.Sprite[] = [];

    for (const obj of children) {
      const s = obj as Phaser.Physics.Arcade.Sprite;
      if (!s || !s.active) continue;

      const x = (s.body as Phaser.Physics.Arcade.Body | undefined)?.x ?? s.x;
      const y = (s.body as Phaser.Physics.Arcade.Body | undefined)?.y ?? s.y;

      const off =
        x < vw.left - MARGIN ||
        x > vw.right + MARGIN ||
        y > vw.bottom + 600;

      if (off) toRemove.push(s);
    }

    // Pool-freundlich entfernen (keine Zerstörung im Iterator!)
    for (const s of toRemove) {
      const body = s.body as Phaser.Physics.Arcade.Body | undefined;
      if (body) {
        body.enable = false;
        body.reset(-9999, -9999);
      }
      this.group.killAndHide(s);
      s.setActive(false).setVisible(false);

      // Falls du NICHT poolen willst, statt kill&hide:
      // s.destroy(true);
    }
  }
}
