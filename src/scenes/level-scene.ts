// level-scene.ts
import Phaser from "phaser";
import { LEVELS, type LevelConfig } from "../modes/tennis/level-config";
import { TennisBalls } from "../modes/tennis/tennis-ball";
import { RacketSwing } from "../modes/tennis/racket-swing";

// Optional: aus constants.ts importieren
const DEFAULT_BONUS_PER_BALL_MS = 1000;

export class LevelScene extends Phaser.Scene {
  private levelIndex!: number;
  private cfg!: LevelConfig;

  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private balls?: TennisBalls;
  private swing?: RacketSwing;

  private levelStarted = false;
  private levelTimerMs = 0;
  private bonusMs = 0;

  private uiTextTimer!: Phaser.GameObjects.Text;
  private uiTextBalls!: Phaser.GameObjects.Text;

  constructor() { super({ key: "LevelScene" }); }

  preload() {
    this.load.image("tennisBall", "assets/equipment/tennis-ball.png");
  }
  

  init(data: { levelIndex: number }) {
    this.levelIndex = data.levelIndex ?? 1;
    this.cfg = LEVELS[this.levelIndex];

    if (this.cfg.equipment === "tennis") {
      const count = this.cfg.balls?.length ?? 0;
      if ((this.cfg.maxBalls ?? count) !== count) {
        console.warn(`Level ${this.levelIndex}: maxBalls != balls.length, korrigiere automatisch.`);
        this.cfg.maxBalls = count;
      }
    }
  }

  create() {
    // Welt/Player etc. erstellen …
    // this.player = ...

    // UI
    this.uiTextTimer = this.add.text(
      this.cameras.main.width - 16, 16, "0.000 s",
      { fontFamily: "monospace", fontSize: "16px", color: "#fff" }
    ).setOrigin(1,0).setScrollFactor(0);

    this.uiTextBalls = this.add.text(16, 16, "", {
      fontSize: "16px", color: "#fff",
    }).setScrollFactor(0);

    // Tennis-Modus
    if (this.cfg.equipment === "tennis") {
      this.balls = new TennisBalls(this);
      this.balls.spawnFromConfig(this.cfg);

      this.swing = new RacketSwing(this, this.player);
      this.swing.attachInput();

      this.physics.add.overlap(
        this.swing.getHitbox(),
        this.balls.group,
        (_hitbox, ballGO) => this.onBallHit(ballGO as Phaser.GameObjects.Sprite),
        undefined,
        this
      );

      this.updateBallsUi();
    }

    // Startzustand
    this.levelStarted = false;
    this.levelTimerMs = 0;
    this.bonusMs = 0;

    this.showCountdownAndStart();
  }

  update(_: number, delta: number) {
    if (!this.levelStarted) return;
    this.levelTimerMs += delta;
    this.uiTextTimer.setText(this.formatMs(this.levelTimerMs - this.bonusMs));
  }

  private onBallHit(ball: Phaser.GameObjects.Sprite) {
    if (ball.getData("hit")) return;
    if (!this.swing?.isActive()) return;

    const body = ball.body as Phaser.Physics.Arcade.StaticBody;
    ball.setData("hit", true);
    body.enable = false;

    const bonusPerBall = this.cfg.bonusPerBallMs ?? DEFAULT_BONUS_PER_BALL_MS;
    this.bonusMs += bonusPerBall;

    this.tweens.add({
      targets: ball,
      duration: 120,
      scale: 0,
      alpha: 0,
      onComplete: () => ball.destroy(),
    });

    if (this.balls) {
      this.balls.remaining = Math.max(0, this.balls.remaining - 1);
      this.updateBallsUi();
    }
  }

  private updateBallsUi() {
    if (!this.balls) return;
    const total = this.cfg.balls?.length ?? this.cfg.maxBalls ?? 0;
    const hit = total - this.balls.remaining;
    this.uiTextBalls.setText(`Bälle: ${hit}/${total}`);
  }

  private finishLevelSuccessfully() {
    const grossMs = this.levelTimerMs;
    const netMs   = Math.max(0, this.levelTimerMs - this.bonusMs);
    const ballsTotal = this.cfg.balls?.length ?? 0;
    const ballsHit   = ballsTotal - (this.balls?.remaining ?? 0);

    this.events.emit("LEVEL_FINISH", {
      levelIndex: this.levelIndex,
      grossMs,
      bonusMs: this.bonusMs,
      netMs,
      ballsHit,
      ballsTotal,
      tieBallsHit: ballsHit,
      tieTimestamp: Date.now(),
    });

    // EndDialog / Scene-Wechsel …
  }

  private showCountdownAndStart() {
    const label = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      "3",
      { fontSize: "48px", color: "#fff" }
    ).setOrigin(0.5).setScrollFactor(0);

    const steps = ["3","2","1","GO!"];
    let i = 0;
    const tick = () => {
      label.setText(steps[i++]);
      if (i < steps.length) {
        this.time.delayedCall(750, tick);
      } else {
        this.time.delayedCall(300, () => {
          label.destroy();
          this.levelStarted = true;
        });
      }
    };
    tick();
  }

  private formatMs(ms: number) {
    const s = Math.max(0, ms) / 1000;
    return s.toFixed(3) + " s";
  }
}
