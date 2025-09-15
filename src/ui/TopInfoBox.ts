import Phaser from "phaser";

export class TopInfoBox {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private bg!: Phaser.GameObjects.Graphics;
  private txtLevel!: Phaser.GameObjects.Text;
  private txtTime!: Phaser.GameObjects.Text;

  // Layout
  private readonly PAD = 8;
  private readonly BOX_W = 250;
  private readonly BOX_H = 46;
  private readonly R = 10; // radius

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create(levelIndex: number) {
    // Container oben links, HUD-Z-Ebene, nicht mitscrollen
    this.container = this.scene.add.container(this.PAD, this.PAD).setDepth(20).setScrollFactor(0);

    // Background
    this.bg = this.scene.add.graphics();
    this.redrawBg();
    this.container.add(this.bg);

    // Level-Label
    this.txtLevel = this.scene.add.text(this.PAD + 6, this.PAD + 4, `Level ${levelIndex}`, {
      fontFamily: "sans-serif",
      fontSize: "16px",
      color: "#111",
      fontStyle: "bold",
    });
    this.container.add(this.txtLevel);

    // Time rechts ausgerichtet
    this.txtTime = this.scene.add.text(this.BOX_W - this.PAD - 8, this.PAD + 4, "00:00.000", {
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#111",
    }).setOrigin(1, 0);
    this.container.add(this.txtTime);

    return this;
  }

  private redrawBg() {
    this.bg.clear();
    // Shadow
    this.bg.fillStyle(0x000000, 0.18);
    this.bg.fillRoundedRect(2, 2, this.BOX_W, this.BOX_H, this.R);
    // Panel
    this.bg.fillStyle(0xffffff, 0.92);
    this.bg.fillRoundedRect(0, 0, this.BOX_W, this.BOX_H, this.R);
    // Border
    this.bg.lineStyle(1, 0xdddddd, 1);
    this.bg.strokeRoundedRect(0.5, 0.5, this.BOX_W - 1, this.BOX_H - 1, this.R);
  }

  setLevel(index: number) {
    this.txtLevel.setText(`Level ${index}`);
  }

  updateElapsed(ms: number) {
    const t = Math.max(0, Math.floor(ms));
    const s = Math.floor(t / 1000);
    const m = Math.floor(s / 60);
    const ss = (s % 60).toString().padStart(2, "0");
    const mm = m.toString().padStart(2, "0");
    const ms3 = (t % 1000).toString().padStart(3, "0");
    this.txtTime.setText(`${mm}:${ss}.${ms3}`);
  }

  /** Unterkante der Box in Screen-Koordinaten (für Wolken-y-Bereich) */
  getBottomY(): number {
    return this.PAD + this.BOX_H;
  }

  destroy() {
    this.container?.destroy(true);
  }
}
