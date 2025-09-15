export class ClayCourtRenderer {
    private scene: Phaser.Scene;
    constructor(scene: Phaser.Scene) { this.scene = scene; }
  
    drawFullWidth(groundTop: number) {
      const w = this.scene.physics.world.bounds.width;
      const h = this.scene.physics.world.bounds.height - groundTop;
  
      const CLAY_FILL = 0xC24E2A, CLAY_NOISE = 0xA84323, LINE_COLOR = 0xffffff;
  
      const gFill = this.scene.add.graphics().setDepth(1);
      gFill.fillStyle(CLAY_FILL, 1).fillRect(0, groundTop, w, h);
  
      const gNoise = this.scene.add.graphics().setDepth(2);
      gNoise.lineStyle(1, CLAY_NOISE, 0.15);
      for (let x = 0; x < w; x += 48) {
        const y1 = groundTop + 4 + ((x / 48) % 2) * 6;
        const y2 = groundTop + h - 6 - ((x / 48) % 2) * 6;
        gNoise.lineBetween(x, y1, x + 48, y1 + 8);
        gNoise.lineBetween(x, y2, x + 48, y2 - 8);
      }
  
      const gLine = this.scene.add.graphics().setDepth(3);
      const topY = groundTop + 6, courtH = Math.max(42, h - 12), padX = 40;
      gLine.lineStyle(2, LINE_COLOR, 1);
      gLine.lineBetween(0, topY, w, topY);
      gLine.lineBetween(0, topY + courtH, w, topY + courtH);
      const s1 = topY + courtH / 3, s2 = topY + (2 * courtH) / 3;
      gLine.lineBetween(padX, s1, w - padX, s1);
      gLine.lineBetween(padX, s2, w - padX, s2);
      gLine.lineBetween(padX, topY, padX, topY + courtH);
      gLine.lineBetween(w - padX, topY, w - padX, topY + courtH);
      const netY = topY + courtH / 2;
      const gNet = this.scene.add.graphics().setDepth(4);
      gNet.lineStyle(3, 0x333333, 1).lineBetween(0, netY, w, netY);
    }
  }
  