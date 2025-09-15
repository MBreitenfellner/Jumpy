import Phaser from "phaser";

type Cloud = Phaser.GameObjects.Image & {
  __boost?: number; // Zusatzfaktor für "schneller als Kamera"
  __drift?: number; // Grunddrift in px/s
  __scale?: number;
};

export class Clouds {
  private scene: Phaser.Scene;
  private cam: Phaser.Cameras.Scene2D.Camera;
  private group!: Phaser.GameObjects.Group;
  private prevScrollX = 0;

  // Y-Bereich (Screen-Koordinaten, da Layer optisch unter der UI-Box sitzen soll)
  private yMin = 60;
  private yMax = 180;

  // Anzahl Wolken
  private count = 7;

  constructor(scene: Phaser.Scene, cam: Phaser.Cameras.Scene2D.Camera) {
    this.scene = scene;
    this.cam = cam;
  }

  create(opts?: { yMin?: number; yMax?: number; count?: number }) {
    if (opts?.yMin !== undefined) this.yMin = opts.yMin;
    if (opts?.yMax !== undefined) this.yMax = opts.yMax;
    if (opts?.count !== undefined) this.count = opts.count;

    this.ensureCloudTexture();

    this.group = this.scene.add.group({ classType: Phaser.GameObjects.Image });
    const w = this.scene.scale.width;

    for (let i = 0; i < this.count; i++) {
      const x = this.cam.scrollX + Phaser.Math.Between(0, w + 300);
      const y = Phaser.Math.Between(this.yMin, this.yMax);
      const img = this.scene.add.image(x, y, "cloud_tex") as Cloud;
      img.setDepth(6).setScrollFactor(1, 0); // Welt-x, aber fixiertes y relativ zum Screen wirkt "leicht schwebend"
      const sc = Phaser.Math.FloatBetween(0.7, 1.4);
      img.setScale(sc).setAlpha(0.9);
      img.__scale = sc;
      img.__boost = Phaser.Math.FloatBetween(0.12, 0.28);  // wie viel schneller als Kamera
      img.__drift = Phaser.Math.Between(20, 40);           // Grunddrift px/s
      this.group.add(img);
    }

    this.prevScrollX = this.cam.scrollX;
  }

  update(dtSec: number) {
    const dxCam = this.cam.scrollX - this.prevScrollX;
    this.prevScrollX = this.cam.scrollX;

    const camLeft = this.cam.scrollX;
    const camRight = camLeft + this.scene.scale.width;

    this.group.children.iterate((cGO) => {
      const c = cGO as Cloud;
      const boost = c.__boost ?? 0.2;
      const drift = c.__drift ?? 30;

      // Wolken sollen nach links ziehen:
      // - Kamera bewegt sich nach rechts: Standard-Parallax -> alles scheinbar nach links (dxCam)
      // - Wir geben eine EXTRA-Linkskomponente: dxCam * boost + drift * dt
      c.x -= dxCam * (1 + boost) + drift * dtSec;

      // Recycle: wenn weit links raus → nach rechts hinter die Kamera verschieben
      if (c.x < camLeft - 120) {
        c.x = camRight + Phaser.Math.Between(60, 220);
        c.y = Phaser.Math.Between(this.yMin, this.yMax);
        c.__boost = Phaser.Math.FloatBetween(0.12, 0.28);
        c.__drift = Phaser.Math.Between(20, 40);
      }
      return true;
    });
  }

  private ensureCloudTexture() {
    if (this.scene.textures.exists("cloud_tex")) return;
    const g = this.scene.add.graphics({ x: 0, y: 0 });

    const W = 160, H = 90;
    g.fillStyle(0xffffff, 1);
    // simple puffy cloud aus Kreisen
    g.fillCircle(40, 55, 22);
    g.fillCircle(65, 40, 28);
    g.fillCircle(95, 50, 30);
    g.fillCircle(120, 58, 22);
    // Basis
    g.fillRoundedRect(30, 55, 100, 30, 14);

    g.generateTexture("cloud_tex", W, H);
    g.destroy();
  }

  destroy() {
    this.group?.destroy(true);
  }
}
