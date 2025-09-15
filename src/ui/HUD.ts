import Phaser from "phaser";
import { Leaderboard } from "../services/Leaderboard";

export class HUD {
  private scene: Phaser.Scene;
  private levelIndex: number;

  private timerText!: Phaser.GameObjects.Text;
  private boardText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;   // 🆕

  private startedAt: number | null = null;
  private running = false;

  constructor(scene: Phaser.Scene, levelIndex: number) {
    this.scene = scene;
    this.levelIndex = levelIndex;

    this.timerText = scene.add.text(0, 0, "0.000 s", {
      fontFamily: "monospace", fontSize: "20px", color: "#111",
      backgroundColor: "#ffff66", padding: { x: 8, y: 4 },
    }).setDepth(1000).setScrollFactor(0);

    this.boardText = scene.add.text(0, 0, "", {
      fontFamily: "monospace", fontSize: "14px", color: "#fff",
      backgroundColor: "#00000088", padding: { x: 8, y: 6 }, align: "left",
    }).setDepth(1000).setScrollFactor(0);

    this.levelText = scene.add.text(0, 0, `Level ${levelIndex}`, {  // 🆕
      fontFamily: "sans-serif", fontSize: "18px", color: "#ffffff",
      backgroundColor: "#00000066", padding: { x: 8, y: 4 },
    }).setDepth(1000).setScrollFactor(0);

    this.reposition();
    this.refreshBoard();

    scene.scale.on("resize", () => this.reposition());
  }

  start() {
    this.startedAt = this.scene.time.now; // ms
    this.running = true;
    this.update(0);
  }

  stop(save: boolean): number | null {
    if (!this.startedAt) return null;
    const elapsed = this.scene.time.now - this.startedAt;
    this.running = false;
    this.startedAt = null;
    if (save) {
      Leaderboard.record(this.levelIndex, elapsed);
      this.refreshBoard();
    }
    this.timerText.setText(`${formatMs(elapsed)}`);
    return elapsed;
  }

  update(_dt: number) {
    if (!this.running || this.startedAt == null) return;
    const elapsed = this.scene.time.now - this.startedAt;
    this.timerText.setText(`${formatMs(elapsed)}`);
  }

  private refreshBoard() {
    const top = Leaderboard.top(this.levelIndex, 5);
    if (top.length === 0) this.boardText.setText(`Bestzeiten L${this.levelIndex}\n— noch keine —`);
    else this.boardText.setText(`Bestzeiten L${this.levelIndex}\n` + top.map((ms,i)=>`#${i+1}  ${formatMs(ms)}`).join("\n"));
  }

  private reposition() {
    const w = this.scene.scale.width;
    const pad = 12;
    this.timerText.setPosition(w - pad, pad).setOrigin(1, 0);          // oben rechts
    this.boardText.setPosition(pad, pad).setOrigin(0, 0);              // oben links
    this.levelText.setPosition(w / 2, pad).setOrigin(0.5, 0);          // 🆕 oben Mitte
  }

  destroy() {
    this.timerText.destroy();
    this.boardText.destroy();
    this.levelText.destroy();
    this.scene.scale.off("resize", this.reposition, this);
  }
}

function formatMs(ms: number): string {
  if (ms >= 60_000) {
    const m = Math.floor(ms / 60_000);
    const s = Math.floor((ms % 60_000) / 1000);
    const ms3 = Math.floor(ms % 1000).toString().padStart(3, "0");
    return `${m}:${s.toString().padStart(2, "0")}.${ms3} s`;
  } else {
    const sec = Math.floor(ms / 1000);
    const ms3 = Math.floor(ms % 1000).toString().padStart(3, "0");
    return `${sec}.${ms3} s`;
  }
}
