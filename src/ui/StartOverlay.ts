import Phaser from "phaser";

type StartOverlayOptions = {
  levelIndex: number;
  onStart: () => void;
};

export class StartOverlay {
  private scene: Phaser.Scene;
  private group!: Phaser.GameObjects.Container;
  private started = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  show(opts: StartOverlayOptions) {
    const { width, height } = this.scene.scale;
    const g = this.scene.add.container(0, 0);
    this.group = g;

    const bg = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.35).setOrigin(0).setScrollFactor(0);
    const title = this.scene.add.text(width/2, height/2 - 30, `Level ${opts.levelIndex}`, {
      fontFamily: "sans-serif", fontSize: "28px", color: "#ffffff"
    }).setOrigin(0.5).setScrollFactor(0);
    const hint = this.scene.add.text(width/2, height/2 + 12, "Leertaste / Klick zum Start", {
      fontFamily: "sans-serif", fontSize: "16px", color: "#dddddd"
    }).setOrigin(0.5).setScrollFactor(0);

    g.add([bg, title, hint]);

    // Resize-Handling
    const onResize = (s: Phaser.Structs.Size) => {
      bg.setSize(s.width, s.height);
      title.setPosition(s.width/2, s.height/2 - 30);
      hint.setPosition(s.width/2, s.height/2 + 12);
    };
    this.scene.scale.on("resize", onResize);
    g.once(Phaser.GameObjects.Events.DESTROY, () => this.scene.scale.off("resize", onResize));

    const startNow = () => {
      if (this.started) return;
      this.started = true;
      g.destroy(true);
      opts.onStart();
    };

    // Eingabe: Space/Enter/Pointer/Bewegungstasten
    const kb = this.scene.input.keyboard!;
    const kSpace = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    const kEnter = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    const kLeft  = kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    const kRight = kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    const kUp    = kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP);

    const onKey = (e: KeyboardEvent) => {
      const code = e.code || "";
      if (code === "Space" || code === "Enter" || code === "ArrowLeft" || code === "ArrowRight" || code === "ArrowUp") {
        startNow();
      }
    };
    kb.on("keydown", onKey);
    this.scene.input.once("pointerdown", startNow);

    g.once(Phaser.GameObjects.Events.DESTROY, () => {
      kb.off("keydown", onKey);
      [kSpace, kEnter, kLeft, kRight, kUp].forEach(k => k.destroy());
    });
  }
}
