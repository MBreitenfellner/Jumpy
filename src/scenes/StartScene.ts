import Phaser from "phaser";
import { ScoreStore, fmtMs, type EquipmentMode } from "../systems/ScoreStore";

const LEVEL_COUNT = 3;

class StartScene extends Phaser.Scene {
  constructor() { super({ key: "StartScene" }); }

  private nameInput!: Phaser.GameObjects.DOMElement;
  private equipment: EquipmentMode = "none";
  private autoRun = true;

  private leftText!: Phaser.GameObjects.Text;
  private rightText!: Phaser.GameObjects.Text;
  private nextInfo!: Phaser.GameObjects.Text;

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(0x9ed9f5);

    this.add.text(width/2, 42, "🏃 Stick Run", { fontSize: "42px", color: "#0b2840", fontStyle: "bold" }).setOrigin(0.5);

    // Name
    this.nameInput = this.add.dom(width/2, 110, "input",
      "width:360px;height:36px;font-size:20px;border-radius:8px;padding:6px 10px;", "")
      .setOrigin(0.5);

    // **a-Fix**: Tastaturevents nicht nach Phaser durchreichen
    const htmlInput = this.nameInput.node as HTMLInputElement;
    ["keydown","keyup","keypress"].forEach(ev => htmlInput.addEventListener(ev, e => e.stopPropagation()));
    // Phaser-Captures lockern
    this.input.keyboard?.removeCapture(["A","D","W","S","SPACE","UP","DOWN","LEFT","RIGHT"]);

    // Modus-Toggle
    const btnNone   = this.makeBtn(width/2 - 120, 160, "Ohne Ausrüstung", () => this.setMode("none", btnNone, btnTennis));
    const btnTennis = this.makeBtn(width/2 + 120, 160, "🎾 Tennis",      () => this.setMode("tennis", btnNone, btnTennis));
    this.setActive(btnNone, true);

    // Auto-Run Toggle
    const btnAuto = this.makeBtn(width/2, 200, `Auto-Run: AN`, () => {
      this.autoRun = !this.autoRun;
      (btnAuto.list[1] as Phaser.GameObjects.Text).setText(`Auto-Run: ${this.autoRun ? "AN" : "AUS"}`);
    });

    // Start
    const startBtn = this.makeBtn(width/2, 246, "▶ Start", () => this.startGame());
    startBtn.setScale(1.1);

    this.nextInfo = this.add.text(width/2, 286, "", { fontSize: "18px", color: "#073248" }).setOrigin(0.5);

    // Rankings
    this.leftText  = this.add.text(24, 96, "", {
      fontFamily: "monospace", fontSize: "16px", color: "#ffffff",
      backgroundColor: "rgba(0,0,0,0.35)", padding: { x: 10, y: 10 }
    }).setFixedSize(320, height - 120);

    this.rightText = this.add.text(width - 344, 96, "", {
      fontFamily: "monospace", fontSize: "16px", color: "#ffffff",
      backgroundColor: "rgba(0,0,0,0.35)", padding: { x: 10, y: 10 }
    }).setFixedSize(320, height - 120);

    this.input.keyboard?.on("keyup", () => this.refreshUI());
    this.refreshUI();
  }

  private setMode(mode: EquipmentMode, a: Phaser.GameObjects.Container, b: Phaser.GameObjects.Container) {
    this.equipment = mode; this.setActive(a, true); this.setActive(b, false); this.refreshUI();
  }

  private startGame() {
    const name = (this.nameInput.node as HTMLInputElement).value.trim() || "Player";
    this.registry.set("playerName", name);
    const nextLevel = ScoreStore.nextLevelFor(name, this.equipment, LEVEL_COUNT);
    this.scene.start("GameScene", {
      levelIndex: nextLevel,
      equipment: this.equipment,
      playerName: name,
      autoRun: this.autoRun,
    });
  }

  private refreshUI() {
    const name = (this.nameInput.node as HTMLInputElement).value.trim() || "Player";

    // Links: Top 5 je Level
    let left = "";
    for (let lv = 1; lv <= LEVEL_COUNT; lv++) {
      left += `Level ${lv} — Top 5 (Netto) [${this.equipment}]\n`;
      const top = ScoreStore.topByLevel(lv, this.equipment, 5);
      if (top.length === 0) left += "  (noch keine Einträge)\n";
      top.forEach((r, i) => { left += ` ${i+1}. ${r.player.padEnd(12)} ${fmtMs(r.ms)}\n`; });
      left += "\n";
    }
    this.leftText.setText(left.trimEnd());

    // Rechts: Kumuliert
    const cum = ScoreStore.cumulativeTop([1,2,3], this.equipment, 10);
    let right = `Kumuliert (L1–L${LEVEL_COUNT}) — Top 10 [${this.equipment}]:\n`;
    if (cum.length === 0) right += "  (noch keine Einträge)\n";
    cum.forEach((r, i) => { right += ` ${i+1}. ${r.player.padEnd(12)} ${fmtMs(r.sumMs)}\n`; });
    this.rightText.setText(right);

    const nextLevel = ScoreStore.nextLevelFor(name, this.equipment, LEVEL_COUNT);
    this.nextInfo.setText(`Nächstes Level für ${name} (${this.equipment}): Level ${nextLevel}`);
  }

  // UI-Helpers
  private makeBtn(x: number, y: number, label: string, onClick: () => void) {
    const bg  = this.add.rectangle(0, 0, 200, 36, 0x2b2b2b, 0.85).setStrokeStyle(2, 0x111111).setOrigin(0.5);
    const txt = this.add.text(0, 0, label, { fontSize: "16px", color: "#ffffff" }).setOrigin(0.5);
    const c   = this.add.container(x, y, [bg, txt]).setSize(200, 36).setInteractive({ useHandCursor: true });
    c.on("pointerdown", onClick);
    c.on("pointerover", () => bg.setFillStyle(0x3b3b3b, 0.95));
    c.on("pointerout",  () => bg.setFillStyle(0x2b2b2b, 0.85));
    return c;
  }
  private setActive(c: Phaser.GameObjects.Container, active: boolean) {
    const bg = c.list[0] as Phaser.GameObjects.Rectangle;
    bg.setFillStyle(active ? 0x2faa66 : 0x2b2b2b, active ? 1 : 0.85);
  }
}

export { StartScene };
export default StartScene;
