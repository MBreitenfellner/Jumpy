// src/world/Parallax.ts
import Phaser from "phaser";

/** Parallax-Hintergrund + statische Häuser + Zeppelin mit Vereinslogo */
export class Parallax {
  private scene: Phaser.Scene;

  private sky!: Phaser.GameObjects.Image;
  private sun!: Phaser.GameObjects.Image;

  private hillsFar!: Phaser.GameObjects.TileSprite;
  private forestMid!: Phaser.GameObjects.TileSprite;

  // Häuser bleiben statisch am Bildschirm (kein Scrollen)
  private housesNear!: Phaser.GameObjects.TileSprite;

  // Zeppelin (Container mit Rumpf + Logo)
  private zep?: Phaser.GameObjects.Container;
  private zepBody?: Phaser.GameObjects.Image;
  private zepLogo?: Phaser.GameObjects.Image;
  private zepProp?: Phaser.GameObjects.Rectangle;
  private zepDir: 1 | -1 = 1;
  private zepSpeed = 26; // px/s
  private zepPhase = 0;

  // Zeit/Viewport
  private lastTime = 0;
  private viewW = 0;
  private viewH = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** Erzeugt alle Layer. `groundTop` = Oberkante Boden (Weltkoordinate). */
  create(viewW: number, viewH: number, groundTop: number) {
    this.viewW = viewW;
    this.viewH = viewH;

    // --- HUD-fixierter Hintergrund ---
    this.sky = this.scene.add
      .image(0, 0, "sky_grad")
      .setOrigin(0, 0)
      .setDisplaySize(viewW, viewH)
      .setScrollFactor(0)
      .setDepth(-100);

    this.sun = this.scene.add
      .image(viewW * 0.78, viewH * 0.18, "sun_tex")
      .setScrollFactor(0)
      .setDepth(-90);

    // --- Parallax-Layer (scrollen mit Welt) ---
    const width = Math.max(viewW * 3, 2048);

    // unten am Boden ausrichten -> nichts verschwindet mehr unter der Straße
    this.hillsFar = this.scene.add
      .tileSprite(0, groundTop - 6, width, 120, "hills_far")
      .setOrigin(0, 1)
      .setDepth(-85);

    this.forestMid = this.scene.add
      .tileSprite(0, groundTop - 4, width, 140, "forest_mid")
      .setOrigin(0, 1)
      .setDepth(-80)
      .setAlpha(0.98);

    // --- Häuser: statisch am Bildschirm, auf Höhe der Straßenkante (groundTop) ---
    this.housesNear = this.scene.add
      .tileSprite(0, groundTop - 2, Math.max(viewW * 2, 1024), 120, "houses_near")
      .setOrigin(0, 1)
      .setDepth(-70)
      .setScrollFactor(0);

    // --- Zeppelin vorbereiten ---
    this.ensureZeppelinTextures(); // generiert Platzhalter, falls nicht vorhanden

    const body = this.scene.add.image(0, 0, "zeppelin_body");
    const logo = this.scene.add.image(36, -4, "club_logo").setDisplaySize(68, 36);
    // kleiner Propeller (rotierender Balken hinten)
    const prop = this.scene.add.rectangle(-92, -2, 18, 3, 0x3a4b5a);

    this.zepBody = body;
    this.zepLogo = logo;
    this.zepProp = prop;

    this.zep = this.scene.add
      .container(-200, viewH * 0.2, [body, logo, prop])
      .setDepth(-40) // VOR den Wolken, aber hinter HUD
      .setScrollFactor(0);

    this.spawnZeppelin();
    this.lastTime = this.scene.time.now;
  }

  /** Parallax & Zeppelin animieren. `scrollX` = Kamerascroll. */
  update(scrollX: number) {
    // Parallax
    this.hillsFar.tilePositionX  = scrollX * 0.18;
    this.forestMid.tilePositionX = scrollX * 0.35;
    // Häuser bleiben statisch → kein Update

    // Sonne „atmet“
    const t = this.scene.time.now * 0.0015;
    this.sun.setScale(1 + Math.sin(t) * 0.02);

    // Zeppelin
    if (!this.zep) return;
    const now = this.scene.time.now;
    const dt = Math.min(0.05, Math.max(0, (now - this.lastTime) / 1000));
    this.lastTime = now;

    this.zep.x += this.zepDir * this.zepSpeed * dt;

    // leichtes Bobbing + minimale Neigung
    this.zepPhase += dt * 1.6;
    const targetY = this.viewH * 0.16;
    const bob = Math.sin(this.zepPhase) * 6;
    this.zep.y += ((targetY + bob) - this.zep.y) * 0.08;
    if (this.zepBody) this.zepBody.setRotation(Math.sin(this.zepPhase) * 0.03);
    if (this.zepProp) this.zepProp.rotation += dt * (this.zepDir === 1 ? 14 : -14);

    // außerhalb? → neu spawnen (Richtungswechsel)
    const margin = 160;
    if (this.zepDir === 1 && this.zep.x > this.viewW + margin) this.spawnZeppelin(-1);
    else if (this.zepDir === -1 && this.zep.x < -margin) this.spawnZeppelin(1);
  }

  // ---------------- intern ----------------

  /** Platzhalter-Texturen für Zeppelin & Vereinslogo erstellen (falls fehlen). */
  private ensureZeppelinTextures() {
    const tx = this.scene.textures;

    if (!tx.exists("zeppelin_body")) {
      const W = 220, H = 74;
      const c = tx.createCanvas("zeppelin_body", W, H);
      const ctx = c.getContext();

      // Rumpf (helles Blau mit leichtem Verlauf)
      const grd = ctx.createLinearGradient(0, 0, 0, H);
      grd.addColorStop(0, "#d9edff");
      grd.addColorStop(1, "#c5e1ff");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.ellipse(W * 0.5, H * 0.5, W * 0.45, H * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();

      // Kontur
      ctx.strokeStyle = "rgba(30,40,50,0.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(W * 0.5, H * 0.5, W * 0.45, H * 0.32, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Heckflosse
      ctx.fillStyle = "#b7d6f5";
      ctx.beginPath();
      ctx.moveTo(W * 0.12, H * 0.5);
      ctx.lineTo(W * 0.04, H * 0.42);
      ctx.lineTo(W * 0.04, H * 0.58);
      ctx.closePath();
      ctx.fill();

      // Gondel (sichtbarer, dunkler mit Fenstern)
      const gx = W * 0.52, gy = H * 0.64, gw = 48, gh = 12;
      ctx.fillStyle = "#344452";
      ctx.fillRect(gx, gy, gw, gh);
      // Aufhängeseile
      ctx.strokeStyle = "rgba(30,40,50,0.6)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(gx + 6, gy);  ctx.lineTo(gx + 10, gy - 10);
      ctx.moveTo(gx + gw - 6, gy); ctx.lineTo(gx + gw - 10, gy - 10);
      ctx.stroke();
      // Fenster
      ctx.fillStyle = "#e7f2ff";
      ctx.fillRect(gx + 10, gy + 3, 8, 6);
      ctx.fillRect(gx + 22, gy + 3, 8, 6);
      ctx.fillRect(gx + 34, gy + 3, 8, 6);

      c.refresh();
    }

    if (!tx.exists("club_logo")) {
      const W = 96, H = 56;
      const c = tx.createCanvas("club_logo", W, H);
      const ctx = c.getContext();

      // runde Plakette
      const r = 10;
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#1f7a54";
      ctx.lineWidth = 2;
      ctx.beginPath();
      this.roundRectPath(ctx, 1, 1, W - 2, H - 2, r);
      ctx.fill();
      ctx.stroke();

      // kleiner Tennisball
      ctx.fillStyle = "#ffd54f";
      ctx.beginPath();
      ctx.arc(W * 0.18, H * 0.5, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#e0b93a";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(W * 0.18, H * 0.5, 7, -0.8, 2.3);
      ctx.stroke();

      // Vereinskürzel
      ctx.fillStyle = "#1f2937";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("TV BW", W * 0.62, H * 0.50);

      c.refresh();
    }
  }

  private roundRectPath(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number
  ) {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
  }

  /** Richtung, Startposition, Speed & Logo-Ausrichtung neu setzen. */
  private spawnZeppelin(dir?: 1 | -1) {
    if (!this.zep || !this.zepBody || !this.zepLogo || !this.zepProp) return;

    this.zepDir = dir ?? (Math.random() < 0.5 ? 1 : -1);
    this.zepSpeed = Phaser.Math.Between(22, 32);
    this.zepPhase = 0;

    const margin = 160;
    const startX = this.zepDir === 1 ? -margin : this.viewW + margin;
    const y = Phaser.Math.Between(Math.floor(this.viewH * 0.12), Math.floor(this.viewH * 0.26));
    this.zep.setPosition(startX, y);

    // Körper spiegeln, Logo lesbar halten, Propeller hinten
    this.zepBody.setFlipX(this.zepDir === -1);
    this.zepLogo.setFlipX(false);
    this.zepLogo.setPosition(this.zepDir === 1 ? 36 : -36, -4);
    this.zepProp.setPosition(this.zepDir === 1 ? -92 : 92, -2);
  }
}

// sowohl Named- als auch Default-Export
export default Parallax;
