// src/gfx/Placeholders.ts
import Phaser from "phaser";

/** Sky: vertikaler Farbverlauf */
export function makeSkyTexture(scene: Phaser.Scene, key: string, w = 512, h = 512, top = "#bfe9ff", bottom = "#fefcea") {
  if (scene.textures.exists(key)) return;
  const canvas = scene.textures.createCanvas(key, w, h);
  const ctx = canvas.getContext();
  const grd = ctx.createLinearGradient(0, 0, 0, h);
  grd.addColorStop(0, top); grd.addColorStop(1, bottom);
  ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h);
  canvas.refresh();
}

/** Sonne mit weichem Rand */
export function makeSunTexture(scene: Phaser.Scene, key: string, r = 64, fill = "rgba(255,215,102,1)") {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  g.fillStyle(0xffd766, 1);
  g.fillCircle(r, r, r * 0.85);
  g.lineStyle(0, 0, 0);
  const texKey = key + "_tmp"; g.generateTexture(texKey, r * 2, r * 2); g.destroy();
  const s = scene.textures.get(texKey).getSourceImage() as HTMLCanvasElement;
  const cv = scene.textures.createCanvas(key, s.width, s.height); const ctx = cv.getContext();
  ctx.save(); ctx.shadowColor = "rgba(255,220,120,0.85)"; ctx.shadowBlur = r * 0.65; ctx.drawImage(s, 0, 0); ctx.restore();
  cv.refresh(); scene.textures.remove(texKey);
}

/** Weiche Hügel (nahtlos kachelbar) */
export function makeHillsTexture(scene: Phaser.Scene, key: string, w = 512, h = 160, color = 0x91c788) {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  g.fillStyle(color, 1);
  g.beginPath();
  g.moveTo(0, h);
  // Hügelkurven
  const n = 5;
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = t * w;
    const y = h - 20 - Math.sin(t * Math.PI * 2) * 18 - Math.sin(t * Math.PI * 4) * 8;
    g.lineTo(x, y);
  }
  g.lineTo(w, h); g.closePath(); g.fillPath();
  g.generateTexture(key, w, h); g.destroy();
}

/** Wald-Silhouette (nahtlos kachelbar) */
export function makeForestTexture(scene: Phaser.Scene, key: string, w = 512, h = 180, trunk = 0x4a6741, leaf = 0x6fae6b) {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  g.fillStyle(leaf, 1);

  const rand = (min:number,max:number)=>min+Math.random()*(max-min);
  // mehrere „Baumgruppen“
  for (let x = -40; x < w + 40; x += 48) {
    const base = h - rand(28, 54);
    const wid  = rand(28, 46);
    const hei  = rand(40, 88);
    // Blätter
    g.fillEllipse(x, base, wid * 1.2, hei * 0.6);
    g.fillEllipse(x + wid * 0.2, base - hei * 0.25, wid, hei * 0.7);
    g.fillEllipse(x - wid * 0.25, base - hei * 0.18, wid * 0.9, hei * 0.6);
  }
  // Stamm-Silhouetten
  g.fillStyle(trunk, 1);
  for (let x = -40; x < w + 40; x += 48) {
    const th = 10 + Math.random() * 24;
    const tw = 4 + Math.random() * 2;
    g.fillRect(x - tw / 2, h - th, tw, th);
  }
  // Bodenstreifen
  g.fillStyle(trunk, 1);
  g.fillRect(0, h - 6, w, 6);

  g.generateTexture(key, w, h); g.destroy();
}

/** Häuserzeile (nahtlos kachelbar) */
export function makeHousesTexture(scene: Phaser.Scene, key: string, w = 512, h = 120) {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  const roofs = [0xe57373, 0xffb74d, 0x64b5f6, 0x81c784, 0xba68c8];

  let x = 0;
  while (x < w) {
    const bw = Phaser.Math.Between(44, 66);
    const bh = Phaser.Math.Between(48, 86);
    const baseY = h - 6;
    // Hauskörper
    g.fillStyle(0xffffff, 1);
    g.fillRect(x + 4, baseY - bh, bw - 8, bh);
    // Dach
    g.fillStyle(roofs[Phaser.Math.Between(0, roofs.length - 1)], 1);
    g.beginPath();
    g.moveTo(x + 2, baseY - bh);
    g.lineTo(x + bw / 2, baseY - bh - Phaser.Math.Between(12, 20));
    g.lineTo(x + bw - 2, baseY - bh);
    g.closePath(); g.fillPath();
    // Fenster
    g.fillStyle(0xeeeeee, 1);
    const cols = 2, rows = 2;
    for (let cx = 0; cx < cols; cx++) for (let ry = 0; ry < rows; ry++) {
      const wx = x + 10 + cx * ((bw - 20) / (cols)) + 2;
      const wy = baseY - bh + 12 + ry * ((bh - 24) / (rows + 0.3));
      g.fillRect(wx, wy, 10, 12);
    }
    x += bw + Phaser.Math.Between(6, 12);
  }
  // Bodenlinie
  g.fillStyle(0x9e9e9e, 1); g.fillRect(0, h - 4, w, 4);

  g.generateTexture(key, w, h); g.destroy();
}

/** Fallbacks wie gehabt */
export function makeParallaxTexture(scene: Phaser.Scene, key: string, w: number, h: number, c1: number, _c2: number) {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics(); g.fillStyle(c1, 1); g.fillRect(0, 0, w, h);
  g.generateTexture(key, w, h); g.destroy();
}
export function makeStickmanFrame(
  scene: Phaser.Scene,
  key: string,
  opts: { leftLegForward?: boolean } = {}
) {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  const W = 48, H = 56;
  const c = 0x1f2937; // dunkelgrau
  g.lineStyle(4, c, 1);

  // Kopf
  const hx = 24, hy = 12, hr = 8;
  g.strokeCircle(hx, hy, hr);

  // Rumpf
  const neckY = hy + hr;
  const hipY  = 36;
  g.lineBetween(hx, neckY, hx, hipY);

  // Arme (leicht laufend)
  g.lineBetween(hx, 20, hx - 12, 28);
  g.lineBetween(hx, 20, hx + 14, 26);

  // Beine (lauf-Variante)
  const fwd = opts.leftLegForward ?? false;
  if (fwd) {
    g.lineBetween(hx, hipY, hx - 10, 50); // links vor
    g.lineBetween(hx, hipY, hx + 6, 44);  // rechts zurück
  } else {
    g.lineBetween(hx, hipY, hx + 10, 50); // rechts vor
    g.lineBetween(hx, hipY, hx - 6, 44);  // links zurück
  }

  g.generateTexture(key, W, H);
  g.destroy();
}

export function makeStickmanCrouchFrame(
  scene: Phaser.Scene,
  key: string,
  opts: { variant?: 1 | 2 } = {}
) {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  const W = 48, H = 48;
  const c = 0x1f2937;
  g.lineStyle(4, c, 1);

  // Kopf näher am Körper
  const hx = 24, hy = 14, hr = 8;
  g.strokeCircle(hx, hy, hr);

  // kurzer Rumpf
  const neckY = hy + hr - 2;
  const hipY  = 30;
  g.lineBetween(hx, neckY, hx, hipY);

  // Arme nach vorne (Balance)
  g.lineBetween(hx, 22, hx + 12, 28);
  g.lineBetween(hx, 22, hx - 10, 30);

  // angewinkelte Beine
  const v = opts.variant ?? 1;
  if (v === 1) {
    g.lineBetween(hx, hipY, hx - 10, 38);
    g.lineBetween(hx - 10, 38, hx - 2, 44);
    g.lineBetween(hx, hipY, hx + 12, 38);
    g.lineBetween(hx + 12, 38, hx + 4, 44);
  } else {
    g.lineBetween(hx, hipY, hx + 10, 38);
    g.lineBetween(hx + 10, 38, hx + 2, 44);
    g.lineBetween(hx, hipY, hx - 12, 38);
    g.lineBetween(hx - 12, 38, hx - 4, 44);
  }

  g.generateTexture(key, W, H);
  g.destroy();
}

export function makeObstacleTexture(scene: Phaser.Scene, key: string, w: number, h: number) {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();

  // Grundkörper
  const base = 0x2f3b46;      // dunkles Blau-Grau
  const stripe = 0xffc107;    // Warn-Gelb
  g.fillStyle(base, 1);
  g.fillRect(0, 0, w, h);

  // Diagonale Warnstreifen
  const sW = 12;
  for (let i = -h; i < w + h; i += sW * 2) {
    g.fillStyle(stripe, 1);
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i + sW, 0);
    g.lineTo(i - h + sW, h);
    g.lineTo(i - h, h);
    g.closePath();
    g.fillPath();
  }

  // Rote "Zacken" am oberen Rand (Gefahr-Kante)
  const spikeW = 10, spikeH = 8, top = 8;
  g.fillStyle(0xe53935, 1);
  for (let x = 0; x < w; x += spikeW) {
    g.beginPath();
    g.moveTo(x, top);
    g.lineTo(x + spikeW * 0.5, top - spikeH);
    g.lineTo(x + spikeW, top);
    g.closePath();
    g.fillPath();
  }

  // Leichte Kontur
  g.lineStyle(2, 0x000000, 0.25);
  g.strokeRect(1, 1, w - 2, h - 2);

  g.generateTexture(key, w, h);
  g.destroy();
}

export function makeCrownTexture(scene: Phaser.Scene, key: string, w = 28, h = 18) {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics(); g.fillStyle(0xffd54f, 1);
  g.beginPath(); g.moveTo(0, h); g.lineTo(w * 0.25, h * 0.35); g.lineTo(w * 0.5, h);
  g.lineTo(w * 0.75, h * 0.35); g.lineTo(w, h); g.closePath(); g.fillPath();
  g.generateTexture(key, w, h); g.destroy();
}
