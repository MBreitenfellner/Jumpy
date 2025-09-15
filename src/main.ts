import Phaser from "phaser";
import GameScene from "./scenes/Gamescene";
import { StartScene } from "./scenes/Startscene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#87CEEB",
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  physics: {
    default: "arcade",
    arcade: { gravity: { y: 900 } as Phaser.Types.Math.Vector2Like, debug: false },
  },
  dom: { createContainer: true },
  scene: [StartScene, GameScene], // StartScene zuerst!
};

new Phaser.Game(config);
