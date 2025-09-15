import type { Player } from "../entities/Player";
import type { Controls } from "../input/Controls";
import type { LevelConfig } from "../modes/tennis/level-config";
import { Balls } from "../modes/tennis/Balls";
import { Racket } from "../modes/tennis/Racket";
import { ClayCourtRenderer } from "../modes/tennis/ClayCourtRenderer";
import { HitResolver } from "../modes/tennis/HitResolver";
import { TennisUi } from "../modes/tennis/Ui";

export class TennisSystem {
  constructor(
    private scene: Phaser.Scene,
    private player: Player,
    private groundTop: number,
    private cfg: LevelConfig,
    private controls: Controls,             // 🆕 Controls rein
  ) {}

  private court?: ClayCourtRenderer;
  private balls?: Balls;
  private racket?: Racket;
  private ui?: TennisUi;
  private resolver = new HitResolver(420, -320, -120);

  onBallReturned?: () => void;

  preload() { /* optional assets */ }

  create() {
    this.court = new ClayCourtRenderer(this.scene);
    this.court.drawFullWidth(this.groundTop);

    this.balls = new Balls(this.scene, this.groundTop);
    this.balls.spawnFromConfig(this.cfg, 70, 110);

    this.racket = new Racket(this.scene, this.player);
    this.racket.create().setScale(0.2);

    this.ui = new TennisUi(this.scene);
    this.ui.setTotals(0, this.cfg.balls?.length ?? (this.cfg.maxBalls ?? 0));

    this.scene.physics.add.overlap(this.player, this.balls.group, (_p, ballGO) => {
      if (!this.controls.hit) return;                    // 🆕 lesen aus Controls
      this.resolver.apply(ballGO as Phaser.GameObjects.Sprite);
      this.racket?.swing();
      this.onBallReturned?.();
    });
  }

  update() {
    this.racket?.follow();
    this.balls?.cleanupOffscreen(this.scene.cameras.main);
  }

  destroy() { this.ui?.destroy(); this.racket?.destroy(); }
}
