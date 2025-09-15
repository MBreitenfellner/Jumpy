import type Phaser from "phaser";
import type GameScene from "../scenes/Gamescene";

export interface SportMode {
  preload(scene: GameScene): void;
  create(scene: GameScene): void;
  update(time: number, delta: number): void;
  destroy?(): void;
  hintText(): string;
}
