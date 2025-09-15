import Phaser from "phaser";

export function snapPlayerToGround(player: Phaser.GameObjects.GameObject, groundTop: number) {
  const body = (player as any).body as Phaser.Physics.Arcade.Body;
  body.updateFromGameObject?.();

  const bodyHeight = body?.height ?? (player as any).displayHeight ?? 0;
  const y = groundTop - bodyHeight - 1;
  (player as any).setY(y);

  // sofortige Separierung
  (player.scene.physics.world as Phaser.Physics.Arcade.World).step(0);
}
