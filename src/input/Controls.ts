import Phaser from "phaser";

/**
 * Controls
 * - Pollt pro Frame Tastenzustände
 * - Jump: Edge-Flags (jumpDown/jumpUp) + jumpHeld
 * - Unterstützt Touch/Klick als Jump
 * - Schlag (Taste J)
 * Tasten: ←/A, →/D, ↓/SHIFT, ↑/SPACE, J
 */
export class Controls {
  private scene: Phaser.Scene;

  // Bewegung
  left = false;
  right = false;
  crouch = false;

  // Jump
  jumpDown = false;   // nur 1 Frame true
  jumpUp = false;     // nur 1 Frame true
  jumpHeld = false;   // solange gehalten

  // Schlag
  hit = false;

  // Keyboard
  private kb!: Phaser.Input.Keyboard.KeyboardPlugin;
  private cur!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyShift!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;
  private keyJ!: Phaser.Input.Keyboard.Key;

  // Pointer als Jump
  private pointerDown = false;
  private prevHeld = false;

  constructor(scene: Phaser.Scene) { this.scene = scene; }

  create() {
    this.kb = this.scene.input.keyboard!;
    this.cur = this.kb.createCursorKeys();
    this.keyA     = this.kb.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD     = this.kb.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyShift = this.kb.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.keySpace = this.kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyJ     = this.kb.addKey(Phaser.Input.Keyboard.KeyCodes.J);

    // Touch/Klick als Jump
    this.scene.input.on("pointerdown", this.onPointerDown, this);
    this.scene.input.on("pointerup",   this.onPointerUp,   this);
    this.scene.input.on("pointerout",  this.onPointerUp,   this);

    // Cleanup
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scene.input.off("pointerdown", this.onPointerDown, this);
      this.scene.input.off("pointerup",   this.onPointerUp,   this);
      this.scene.input.off("pointerout",  this.onPointerUp,   this);
    });
  }

  private onPointerDown = () => { this.pointerDown = true; };
  private onPointerUp   = () => { this.pointerDown = false; };

  /** Pro Frame aufrufen */
  update(_now: number) {
    this.left   = !!(this.cur.left?.isDown  || this.keyA.isDown);
    this.right  = !!(this.cur.right?.isDown || this.keyD.isDown);
    this.crouch = !!(this.cur.down?.isDown  || this.keyShift.isDown);
    this.hit    =  !!this.keyJ.isDown;

    // Jump (Keys)
    const keyHeld = !!(this.cur.up?.isDown || this.keySpace.isDown);
    const keyJustDown = Phaser.Input.Keyboard.JustDown(this.cur.up)   || Phaser.Input.Keyboard.JustDown(this.keySpace);
    const keyJustUp   = Phaser.Input.Keyboard.JustUp(this.cur.up)     || Phaser.Input.Keyboard.JustUp(this.keySpace);

    // Kombiniert (Keys + Pointer)
    const held = keyHeld || this.pointerDown;
    this.jumpDown = keyJustDown || (!this.prevHeld && held);
    this.jumpUp   = keyJustUp   || ( this.prevHeld && !held);
    this.jumpHeld = held;
    this.prevHeld = held;
  }

  /** Optional global deaktivieren (z. B. im Win-Panel) */
  setEnabled(enabled: boolean) {
    this.scene.input.enabled = enabled;
    if (!enabled) {
      this.pointerDown = false; this.prevHeld = false;
      this.left = this.right = this.crouch = this.hit = false;
      this.jumpDown = this.jumpUp = this.jumpHeld = false;
    }
  }
}

export default Controls;
