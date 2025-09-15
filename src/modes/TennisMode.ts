import Phaser from "phaser";
import type GameScene from "../scenes/Gamescene";
import type { SportMode } from "./Sportmode";

export class TennisMode implements SportMode {
  private scene!: GameScene;
  private balls!: Phaser.Physics.Arcade.Group;
  private racket!: Phaser.GameObjects.Sprite;
  private keyHit!: Phaser.Input.Keyboard.Key;
  private nextBallTime = 0;

  private readonly SPAWN_EVERY_MS = 1800;
  private readonly MAX_LIVE_BALLS = 6;
  private readonly RETURN_SPEED_X = 420;
  private readonly RETURN_SPEED_Y_MIN = -320;
  private readonly RETURN_SPEED_Y_MAX = -120;
  private readonly BALL_SPAWN_MIN_ABOVE_GROUND = 90;
  private readonly BALL_SPAWN_MAX_ABOVE_GROUND = 155;
  private readonly RACKET_OFFSET_RIGHT = { x: 18, y: -6, flipX: false };
  private readonly RACKET_OFFSET_LEFT  = { x: -18, y: -6, flipX: true  };

  preload(scene: GameScene): void {
    scene.load.image("racket", "assets/tennis/racket.png");
    scene.load.image("tennisBall", "assets/tennis/ball.png");
  }

  create(scene: GameScene): void {
    this.scene = scene;
    this.keyHit = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);

    this.racket = this.scene.add.sprite(scene.player.x, scene.player.y, "racket");
    this.racket.setDepth(scene.player.depth + 1);

    this.balls = this.scene.physics.add.group({ classType: Phaser.Physics.Arcade.Sprite, maxSize: 24 });

    this.scene.physics.add.collider(this.balls, this.scene.ground, (ballObj: Phaser.GameObjects.GameObject) => {
      const ball = ballObj as Phaser.Physics.Arcade.Sprite & { _wasHit?: boolean };
      ball.setBounce(0.35).setFriction(1, 1);
    });

    this.scene.physics.add.overlap(this.scene.player, this.balls, (_p, ballObj) => {
      const ball = ballObj as Phaser.Physics.Arcade.Sprite & { _wasHit?: boolean };
      if (!this.isHitPressed()) return;
      if (ball._wasHit) return;
      this.playSwingAnim();
      this.knockBallForward(ball);
      ball._wasHit = true;
    });

    this.scene.physics.world.setBoundsCollision(true, true, true, true);
  }

  update(time: number): void {
    this.positionRacketToPlayer();

    if (time > this.nextBallTime && this.balls.countActive(true) < this.MAX_LIVE_BALLS) {
      this.spawnBallReachable();
      this.nextBallTime = time + this.SPAWN_EVERY_MS;
    }

    this.balls.children.each((child) => {
      const b = child as Phaser.Physics.Arcade.Sprite;
      if (b.x < this.scene.cameras.main.scrollX - 60 || b.y > this.scene.scale.height + 400) b.destroy();
    });
  }

  destroy(): void { this.racket?.destroy(); this.balls?.clear(true, true); }
  hintText(): string { return "Tennis: ←/→ laufen, ↑/SPACE springen, J/SPACE schlagen"; }

  private isHitPressed(): boolean {
    const cursors = this.scene.input.keyboard.createCursorKeys();
    return this.keyHit.isDown || cursors.space?.isDown === true;
  }

  private playSwingAnim() {
    this.scene.tweens.add({ targets: this.racket, angle: this.scene.player.flipX ? -25 : 25, duration: 60, yoyo: true });
  }

  private knockBallForward(ball: Phaser.Physics.Arcade.Sprite) {
    const vx = this.RETURN_SPEED_X;
    const vy = Phaser.Math.Between(this.RETURN_SPEED_Y_MIN, this.RETURN_SPEED_Y_MAX);
    ball.setVelocity(vx, vy).setBounce(0.45).setCollideWorldBounds(true);
    ball.setAngularVelocity(Phaser.Math.Between(-180, -90));
  }

  private spawnBallReachable() {
    const spawnX = Phaser.Math.Clamp(this.scene.player.x + Phaser.Math.Between(40, 120), 64, this.scene.scale.width - 64);
    const minY = this.scene.groundY - this.BALL_SPAWN_MAX_ABOVE_GROUND;
    const maxY = this.scene.groundY - this.BALL_SPAWN_MIN_ABOVE_GROUND;
    const spawnY = Phaser.Math.Between(minY, maxY);

    const ball = this.balls.get(spawnX, spawnY, "tennisBall") as Phaser.Physics.Arcade.Sprite & { _wasHit?: boolean };
    if (!ball) return;

    ball.setActive(true).setVisible(true);
    this.scene.physics.world.enable(ball, Phaser.Physics.Arcade.DYNAMIC_BODY);
    ball.setCircle(Math.min(ball.width, ball.height) / 2);
    ball.setCollideWorldBounds(true);
    ball.setVelocity(Phaser.Math.Between(-20, 20), Phaser.Math.Between(-10, 10));
    ball.setBounce(0.35);
    ball._wasHit = false;
  }

  private positionRacketToPlayer() {
    const off = this.scene.player.flipX ? this.RACKET_OFFSET_LEFT : this.RACKET_OFFSET_RIGHT;
    this.racket.setPosition(this.scene.player.x + off.x, this.scene.player.y + off.y);
    this.racket.setFlipX(off.flipX);
    this.racket.setDepth(this.scene.player.flipX ? this.scene.player.depth - 1 : this.scene.player.depth + 1);
  }
}
