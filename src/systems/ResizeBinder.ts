import Phaser from "phaser";
import { WORLD, GROUND } from "../constants";
import { Parallax } from "../world/Parallax";
import { Ground } from "../world/Ground";
import { ObstacleSystem } from "./Obstaclesystem";
import { CrownSystem } from "./Crownsystem";
import { Player } from "../entities/Player";

type BindArgs = {
  parallax: Parallax;
  ground: Ground;
  obstacles?: ObstacleSystem;
  crown?: CrownSystem;
  camera: Phaser.Cameras.Scene2D.Camera;
  player?: Player;
};

export function bindResize(scene: Phaser.Scene, args: BindArgs) {
  scene.scale.on("resize", (gameSize: Phaser.Structs.Size) => {
    const { width, height } = gameSize;

    // Parallax strecken
    args.parallax.resize(width, height);

    // Welt-/Kamerahöhe aktualisieren
    const newWorldH = Math.max(WORLD.HEIGHT, height);
    const newGroundTop = newWorldH - GROUND.THICKNESS;

    scene.physics.world.setBounds(0, 0, scene.physics.world.bounds.width, newWorldH);
    args.camera.setBounds(0, 0, args.camera.getBounds().width, newWorldH);

    // Boden verschieben
    args.ground.resize(newGroundTop);

    // ✅ Hindernisse & Krone zur neuen Bodenhöhe verschieben
    args.obstacles?.resize(newGroundTop);
    args.crown?.resize(newGroundTop);

    // Spieler ggf. nach oben setzen, falls er unter den Boden geraten wäre
    if (args.player) {
      const pb = args.player.body as Phaser.Physics.Arcade.Body;
      if (pb.bottom > newGroundTop) {
        const h = pb.height ?? args.player.displayHeight;
        args.player.setY(newGroundTop - h - 1);
      }
    }

    args.camera.setDeadzone(width * 0.6, height * 0.5);
  });
}
