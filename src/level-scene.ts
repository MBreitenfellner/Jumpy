// level-scene.ts (Ausschnitt)
import { LEVELS, type LevelConfig } from "../level-config";
import { TennisBalls } from "../tennis-ball";
import { RacketSwing } from "../racket-swing";


const BONUS_PER_BALL_MS = 1000;

export class LevelScene extends Phaser.Scene {
  private levelIndex!: number;
  private cfg!: LevelConfig;

  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private balls?: TennisBalls;
  private swing?: RacketSwing;

  private levelTimerMs = 0;
  private bonusMs = 0;

  private uiTextTimer!: Phaser.GameObjects.Text;
  private uiTextBalls!: Phaser.GameObjects.Text;

  constructor() { super({ key: "LevelScene" }); }

  init(data: { levelIndex: number }) {
    this.levelIndex = data.levelIndex ?? 1;
    this.cfg = LEVELS[this.levelIndex];
  }

  create() {
    // … Welt, Boden, Obstacles, Player etc. aufbauen …
    // this.player = …;

    // UI
    this.uiTextTimer = this.add.text( this.cameras.main.width - 16, 16, "0.000 s", {
      fontSize: "16px", color: "#fff",
    }).setOrigin(1,0).setScrollFactor(0);

    this.uiTextBalls = this.add.text(16, 16, "", {
      fontSize: "16px", color: "#fff",
    }).setScrollFactor(0);

    // Tennis-Modus?
    if (this.cfg.equipment === "tennis") {
      this.balls = new TennisBalls(this);
      this.balls.spawnFromConfig(this.cfg);

      this.swing = new RacketSwing(this, this.player);
      this.swing.attachInput();

      // Overlap: Hitbox ↔︎ Balls
      this.physics.add.overlap(
        this.swing.getHitbox(),
        this.balls.group,
        (_hitbox, ballGO) => this.onBallHit(ballGO as Phaser.GameObjects.Sprite),
        undefined,
        this
      );

      // UI initial
      this.updateBallsUi();
    }

    // Timer starten (bei dir ggf. erst nach "Start"-Trigger)
    this.levelTimerMs = 0;
    this.bonusMs = 0;
  }

  update(time: number, delta: number) {
    // Wenn du einen separaten Startzustand willst, hier stoppen bis "GO"
    this.levelTimerMs += delta;
    this.uiTextTimer.setText(((this.levelTimerMs - this.bonusMs) / 1000).toFixed(3) + " s");
  }

  private onBallHit(ball: Phaser.GameObjects.Sprite) {
    if (ball.getData("hit")) return;         // Mehrfach-Overlap verhindern
    ball.setData("hit", true);

    // Bonuszeit gutschreiben
    this.bonusMs += BONUS_PER_BALL_MS;

    // Ball entfernen (statisch: zuerst aus StaticGroup nehmen)
    const body = ball.body as Phaser.Physics.Arcade.StaticBody;
    body.enable = false;
    ball.disableInteractive?.();
    ball.setVisible(false);
    ball.destroy();

    // Sound/FX optional:
    // this.sound.play("ballHitSfx");
    // Partikel o. ä.

    if (this.balls) {
      this.balls.remaining = Math.max(0, this.balls.remaining - 1);
      this.updateBallsUi();
    }
  }

  private updateBallsUi() {
    if (!this.balls) return;
    this.uiTextBalls.setText(`Bälle: ${this.balls.remaining}/${this.cfg.maxBalls}`);
  }

  // Beim Levelende die *vergleichbare* Zeit melden:
  // -> "Nettozeit" = gemessene Zeit MINUS Bonus (weil Bonus ja Zeit „schenkt“)
  //    So bleibt die Bestenliste fair & reproduzierbar, da Anzahl/Position fix sind.
  private finishLevelSuccessfully() {
    const grossMs = this.levelTimerMs;
    const netMs = Math.max(0, this.levelTimerMs - this.bonusMs);

    this.events.emit("LEVEL_FINISH", {
      levelIndex: this.levelIndex,
      grossMs,
      bonusMs: this.bonusMs,
      netMs,
      ballsHit: (this.cfg.balls?.length ?? 0) - (this.balls?.remaining ?? 0),
      ballsTotal: this.cfg.balls?.length ?? 0,
    });

    // … EndDialog anzeigen, Szene wechseln, etc.
  }
}
