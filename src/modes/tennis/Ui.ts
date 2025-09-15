export class TennisUi {
    private scene: Phaser.Scene;
    private text?: Phaser.GameObjects.Text;
  
    constructor(scene: Phaser.Scene) { this.scene = scene; }
  
    setTotals(hit: number, total: number) {
      if (!this.text) {
        this.text = this.scene.add.text(8, 6 + 28, "", { fontSize: "16px", color: "#fff" }).setScrollFactor(0).setDepth(10);
      }
      this.text.setText(`Bälle: ${hit}/${total}`);
    }
  
    destroy() { this.text?.destroy(); }
  }
  