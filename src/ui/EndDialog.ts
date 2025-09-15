import Phaser from "phaser";

type EndDialogOptions = {
  title: string;
  question?: string;
  onYes: () => void;
  onNo?: () => void;
};

export class EndDialog {
  private scene: Phaser.Scene;
  private group!: Phaser.GameObjects.Container;
  private keyHandler?: (e: KeyboardEvent) => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  show(opts: EndDialogOptions) {
    const { width, height } = this.scene.scale;

    this.group = this.scene.add.container(0, 0);

    const bg = this.scene.add
      .rectangle(0, 0, width, height, 0x000000, 0.55)
      .setOrigin(0)
      .setScrollFactor(0);
    this.group.add(bg);

    const panelW = 360, panelH = 180;
    const panel = this.scene.add
      .rectangle(width/2, height/2, panelW, panelH, 0x111111, 0.95)
      .setStrokeStyle(2, 0xffffff, 0.15)
      .setScrollFactor(0);
    this.group.add(panel);

    const title = this.scene.add
      .text(width/2, height/2 - 50, opts.title, { fontFamily: "sans-serif", fontSize: "22px", color: "#ffffff" })
      .setOrigin(0.5)
      .setScrollFactor(0);
    this.group.add(title);

    const question = this.scene.add
      .text(width/2, height/2 - 15, opts.question ?? "Möchtest du das Level nochmal wiederholen?",
        { fontFamily: "sans-serif", fontSize: "16px", color: "#dddddd" })
      .setOrigin(0.5)
      .setScrollFactor(0);
    this.group.add(question);

    const btnYes = this.scene.add
      .text(width/2 - 70, height/2 + 35, "Ja", { fontFamily: "sans-serif", fontSize: "18px", color: "#b6ff9b" })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    const btnNo = this.scene.add
      .text(width/2 + 70, height/2 + 35, "Nein", { fontFamily: "sans-serif", fontSize: "18px", color: "#ffb6b6" })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    this.group.add(btnYes);
    this.group.add(btnNo);

    const cleanup = () => this.destroy();

    btnYes.on("pointerdown", () => { cleanup(); opts.onYes(); });
    btnNo.on("pointerdown",  () => { cleanup(); opts.onNo?.(); });

    this.keyHandler = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "enter" || k === "y") { cleanup(); opts.onYes(); }
      if (k === "escape" || k === "n") { cleanup(); opts.onNo?.(); }
    };
    this.scene.input.keyboard?.on("keydown", this.keyHandler);
  }

  destroy() {
    if (this.keyHandler) this.scene.input.keyboard?.off("keydown", this.keyHandler);
    this.group?.destroy(true);
  }
}
