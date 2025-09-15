import Phaser from "phaser";

export type InputState = {
  left: boolean;
  right: boolean;
  jumpPressed: boolean; // edge-triggered (buffered)
  hit: boolean;         // hold while key down
};

export class InputRouter {
  private scene: Phaser.Scene;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;
  private keyJ!: Phaser.Input.Keyboard.Key;

  private lastJumpTs = -9999;
  private readonly BUFFER_MS = 120;

  constructor(scene: Phaser.Scene) { this.scene = scene; }

  create() {
    this.cursors = this.scene.input.keyboard!.createCursorKeys();
    this.keyA = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keySpace = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyJ = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.J);
  }

  onAnyKeyOnce(cb: () => void) {
    this.scene.input.keyboard?.once("keydown", cb);
    this.scene.input.once("pointerdown", cb);
    this.keySpace?.on("down", cb);
  }

  read(now: number): InputState {
    // edge detect jump
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.keySpace)) {
      this.lastJumpTs = now;
    }
    const jumpPressed = (now - this.lastJumpTs) <= this.BUFFER_MS;

    return {
      left: !!(this.cursors.left?.isDown || this.keyA?.isDown),
      right: !!(this.cursors.right?.isDown || this.keyD?.isDown),
      jumpPressed,
      hit: !!this.keyJ?.isDown,
    };
  }
}
