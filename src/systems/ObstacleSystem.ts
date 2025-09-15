// src/systems/ObstacleSystem.ts
import Phaser from "phaser";
import type { LevelParams } from "../levels/LevelParams";

export interface ObstacleBuildOpts {
  /** Maximale Hindernishöhe (px). Alles darüber wird gekappt. */
  maxHeight?: number;
  /** Optional: Faktor für Breiten (z. B. 0.9 für Level 1) */
  widthScale?: number;
}

export class ObstacleSystem {
  group!: Phaser.Physics.Arcade.StaticGroup;
  collider?: Phaser.Physics.Arcade.Collider;

  constructor(private scene: Phaser.Scene) {}

  /**
   * Erzeugt Hindernisse an den X-Positionen aus xs.
   * Größe pro Hindernis variiert; Höhe kann via opts.maxHeight gekappt werden.
   */
  buildFromTrack(groundTop: number, p: LevelParams, xs: number[], opts: ObstacleBuildOpts = {}) {
    this.group = this.scene.physics.add.staticGroup();

    // Fallback-Ranges aus Basiswerten ableiten, falls im LevelParam nicht vorhanden
    const wMin0 = (p as any).obstacleMinWidth  ?? Math.max(8, Math.round(p.obstacleWidth * 0.6));
    const wMax0 = (p as any).obstacleMaxWidth  ?? Math.max(wMin0 + 2, Math.round(p.obstacleWidth * 1.6));
    const hMin0 = (p as any).obstacleMinHeight ?? Math.max(8, Math.round(p.obstacleBaseHeight * 0.7));
    const hMax0 = (p as any).obstacleMaxHeight ?? Math.max(hMin0 + 2, Math.round(p.obstacleBaseHeight * 1.3));

    const wScale = opts.widthScale ?? 1;
    const hCap   = opts.maxHeight ?? Number.POSITIVE_INFINITY;

    for (let i = 0; i < xs.length; i++) {
      // zufällige Größe innerhalb der Grenzen
      const wRaw = Phaser.Math.Between(wMin0, wMax0);
      let   hRaw = Phaser.Math.Between(hMin0, hMax0) + (i % 5 === 0 ? 8 : 0);

      // weiche Kappung nach oben
      let w = Math.max(8, Math.round(wRaw * wScale));
      let h = Math.min(hRaw, Math.max(12, Math.floor(hCap)));

      // Position so, dass das Hindernis mit der Unterkante auf dem Boden sitzt
      const x = xs[i];
      const y = groundTop - h / 2;

      // Sprite skalieren
      const img = this.scene.add.image(x, y, "obstacle_tex");
      img.setDisplaySize(w, h);

      // StaticBody exakt auf Bildgröße
      const body = this.scene.physics.add.existing(img, true) as Phaser.GameObjects.Image & {
        body: Phaser.Physics.Arcade.StaticBody;
      };
      body.body.setSize(w, h);
      body.body.updateFromGameObject();

      this.group.add(img);
    }
  }

  bindCollider(player: Phaser.Types.Physics.Arcade.GameObjectWithBody, onHit: () => void) {
    this.collider = this.scene.physics.add.collider(player, this.group, onHit, undefined, this);
  }

  disableCollider() {
    if (this.collider) this.collider.active = false;
  }

  /** Hindernisse an neue Bodenhöhe anpassen (z. B. nach Resize) */
  resize(newGroundTop: number) {
    this.group.children.iterate(go => {
      const img = go as Phaser.GameObjects.Image;
      const h = img.displayHeight;
      img.setY(newGroundTop - h / 2);

      const body = img.body as Phaser.Physics.Arcade.StaticBody | null;
      if (body) {
        body.setSize(img.displayWidth, img.displayHeight);
        body.updateFromGameObject(); // wichtig bei StaticBody
      }
      return true;
    });
  }
}
