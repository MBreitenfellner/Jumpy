export class HitResolver {
    constructor(private vx = 420, private vyMin = -320, private vyMax = -120) {}
  
    apply(ball: Phaser.GameObjects.Sprite) {
      // ensure dynamic body
      const anyBody: any = ball.body;
      if (anyBody && anyBody instanceof Phaser.Physics.Arcade.StaticBody) {
        ball.scene.physics.world.disable(ball);
        ball.scene.physics.world.enable(ball, Phaser.Physics.Arcade.DYNAMIC_BODY);
      }
      const body = ball.body as Phaser.Physics.Arcade.Body;
      if (!body) return;
  
      body.setAllowGravity(true);
      body.setVelocity(this.vx, Phaser.Math.Between(this.vyMin, this.vyMax));
      body.setBounce(0.45, 0.45);
      body.setCollideWorldBounds(true);
      body.setAngularVelocity(Phaser.Math.Between(-180, -90));
    }
  }
  