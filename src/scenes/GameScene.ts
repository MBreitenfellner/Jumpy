// src/scenes/GameScene.ts
import Phaser from "phaser";

// Core/World
import { WORLD, GROUND, OBST } from "../constants";
import { Player } from "../entities/Player";
import { Parallax } from "../world/Parallax";
import { Ground } from "../world/Ground";
import { ObstacleSystem } from "../systems/Obstaclesystem";
import { CrownSystem } from "../systems/Crownsystem";
import { bindResize } from "../systems/Resizebinder";
import { ScoreStore } from "../systems/Scorestore";

// Level & Track
import { difficultyFromIndex, type LevelParams } from "../levels/Levelparams";
import { generateObstacleXs } from "../services/Trackgenerator";

// UI & Persistence
import { HUD } from "../ui/Hud";
import { ResultPanel } from "../systems/Resultpanel";
import { LevelManager } from "../systems/Levelmanager";
import { TopInfoBox } from "../ui/Topinfobox";

// Controls & PlayerController
import { Controls } from "../input/Controls";
import { PlayerController } from "../systems/Playercontroller";

// Tennis (optional)
import type { Equipment, LevelConfig } from "../modes/tennis/level-config";
import { LEVELS } from "../modes/tennis/level-config";
import { TennisSystem } from "../systems/Tennissystem";

// Wolken
import { Clouds } from "../world/Clouds";

// Platzhalter (nur falls keine Assets vorhanden)
import {
  makeStickmanFrame, makeStickmanCrouchFrame,
  makeSkyTexture, makeSunTexture, makeHillsTexture, makeForestTexture, makeHousesTexture,
  makeObstacleTexture, makeCrownTexture
} from "../gfx/Placeholders";


export default class GameScene extends Phaser.Scene {
  constructor() { super({ key: "GameScene" }); }

  // Welt
  private parallax!: Parallax;
  private ground!: Ground;
  private obstacles!: ObstacleSystem;
  private crown!: CrownSystem;

  // Player & Steuerung
  private player!: Player;
  private controls!: Controls;
  private playerCtl!: PlayerController;

  // Level
  private hud!: HUD;
  private params!: LevelParams;
  private levelIndex = 1;
  private equipment: Equipment = "none";
  private levelCfg!: LevelConfig;

  // Session/State
  private playerName: string = "Player";
  private autoRun = true;

  private started = false;
  private levelComplete = false;
  private isFailing = false;
  private destroyed = false; // gegen verspätete Callbacks

  // Auto-Jump Assist
  private autoJumpAssistEnabled = false;
  private lastAutoJumpAt = -1e9; // ms Cooldown

  // Tennis
  private tennis?: TennisSystem;
  private tennisTotal = 0;
  private tennisHit = 0;

  // Top UI + Timer
  private topBox!: TopInfoBox;
  private levelStartTs: number | null = null;

  // Clouds
  private clouds!: Clouds;

  // ---------- Lifecycle ----------

  init(data: { levelIndex?: number; equipment?: Equipment; playerName?: string; autoRun?: boolean; autoJumpAssist?: boolean } = {}) {
    this.destroyed = false;
    this.isFailing = false;
    this.levelComplete = false;
    this.started = false;
    this.levelStartTs = null;

    this.levelIndex = data.levelIndex ?? 1;
    this.equipment  = data.equipment  ?? "none";
    this.playerName = data.playerName ?? (this.registry.get("playerName") as string | undefined) ?? "Player";
    this.autoRun    = data.autoRun ?? true;
    this.autoJumpAssistEnabled = data.autoJumpAssist ?? false;

    // LevelConfig (nur Tennis-relevant)
    this.levelCfg = LEVELS[this.levelIndex] ?? {
      index: this.levelIndex,
      equipment: this.equipment,
      balls: [],
      maxBalls: 0,
      bonusPerBallMs: 1000,
    };
    // Modus aus Menü beibehalten
    this.levelCfg.equipment = this.equipment;

    const cnt = this.levelCfg.balls?.length ?? 0;
    if ((this.levelCfg.maxBalls ?? cnt) !== cnt) this.levelCfg.maxBalls = cnt;
  }

  preload() {
    // Platzhalter – Stickman
    if (!this.textures.exists("stick_idle"))  { makeStickmanFrame(this, "stick_idle",  { leftLegForward: false }); }
    if (!this.textures.exists("stick_run1")) { makeStickmanFrame(this, "stick_run1", { leftLegForward: true  }); }
    if (!this.textures.exists("stick_run2")) { makeStickmanFrame(this, "stick_run2", { leftLegForward: false }); }
    if (!this.textures.exists("stick_crouch1")) { makeStickmanCrouchFrame(this, "stick_crouch1", { variant: 1 }); }
    if (!this.textures.exists("stick_crouch2")) { makeStickmanCrouchFrame(this, "stick_crouch2", { variant: 2 }); }
  
    // Animationen
    if (!this.anims.exists("idle"))   { this.anims.create({ key: "idle",   frames: [{ key: "stick_idle" }], frameRate: 1,  repeat: -1 }); }
    if (!this.anims.exists("run"))    { this.anims.create({ key: "run",    frames: [{ key: "stick_run1" }, { key: "stick_run2" }], frameRate: 12, repeat: -1 }); }
    if (!this.anims.exists("crouch")) { this.anims.create({ key: "crouch", frames: [{ key: "stick_crouch1" }, { key: "stick_crouch2" }], frameRate: 6,  repeat: -1 }); }
  
    makeSkyTexture(this,"sky_grad",512,512,"#bfe9ff","#fefcea");
    makeSunTexture(this,"sun_tex",64);
    makeHillsTexture(this,"hills_far",512,160,0xa5d6a7);
    makeForestTexture(this,"forest_mid",512,180,0x4a6741,0x7bbf74);
    makeHousesTexture(this,"houses_near",512,120);
    
  
    // Hindernis & Krone
    if (!this.textures.exists("obstacle_tex")) { makeObstacleTexture(this, "obstacle_tex", OBST.WIDTH, OBST.HEIGHT); }
    if (!this.textures.exists("crown_tex"))    { makeCrownTexture(this, "crown_tex", 28, 18); }
  
    // Tennis-Assets
    if (!this.textures.exists("tennisBall")) { this.load.image("tennisBall", "assets/equipment/tennis-ball.png"); }
    if (!this.textures.exists("racket"))     { this.load.image("racket",     "assets/equipment/racket.png"); }
  }
  

  create() {
    const { width, height } = this.scale;

    // Strecke/Parameter
    this.params = difficultyFromIndex(this.levelIndex);
    const xs = generateObstacleXs(this.params);
    const crownX = xs[xs.length - 1] + this.params.goalOffsetAfterLast;

    // Weltgrößen
    const worldHeight = Math.max(WORLD.HEIGHT, height);
    const groundTop   = worldHeight - GROUND.THICKNESS;
    const levelWidth  = Math.max(WORLD.WIDTH, crownX + 400);

    // Welt/Kamera begrenzen
    this.physics.world.setBounds(0, 0, levelWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, levelWidth, worldHeight);

    // Parallax / Boden
    this.parallax = new Parallax(this);
    this.parallax.create(this.scale.width, this.scale.height, groundTop);
    this.ground   = new Ground(this);   this.ground.create(levelWidth, groundTop);

    // Player
    this.player = new Player(this, 200, groundTop - 20);
    const pBody = this.player.body as Phaser.Physics.Arcade.Body;
    pBody.setAllowGravity(true);
    pBody.setDragX(1200).setMaxVelocity(300, 1500).setFriction(0, 0).setBounce(0, 0);
    if (this.textures.exists("stick_idle")) this.player.setTexture("stick_idle");
    this.player.setGroundTop(groundTop);
    this.ground.colliderWith(this.player);
    // Faire Hitbox (optional)
    try {
      pBody.setSize(this.player.displayWidth * 0.55, this.player.displayHeight * 0.95, true);
      pBody.setOffset(this.player.displayWidth * 0.225, this.player.displayHeight * 0.05);
    } catch {}

    // Hindernisse & Ziel
    this.obstacles = new ObstacleSystem(this);
    this.obstacles.buildFromTrack(groundTop, this.params, xs);
    this.obstacles.bindCollider(this.player, () => { if (!this.levelComplete) this.handleLevelFail(); });

    this.crown = new CrownSystem(this);
    this.crown.create(crownX, groundTop);
    this.crown.bindOverlap(this.player, () => this.handleLevelWin());

    // HUD & Top-Info-Box
    this.hud = new HUD(this, this.levelIndex);
    this.topBox = new TopInfoBox(this).create(this.levelIndex);

    // Controls + PlayerController
    this.controls = new Controls(this);
    this.controls.create();

    this.playerCtl = new PlayerController(this.player as unknown as Phaser.Physics.Arcade.Sprite, this.controls as any)
      .setAutoRun(this.autoRun)
      .setEnabled(true);

    // Saftigerer Sprung + sanfter Aufstieg
    this.playerCtl.setAssist({
      jumpVel: -860,   // stärker negativ = höher
      gravUp: 120,     // kleiner = höher
      gravDown: 1650,  // so lassen; ggf. 1500 für längere Airtime
      cutMult: 0.68,   // Jump-Cut weniger aggressiv
      minHoldMs: 120,  // zu kurze Taps nicht zu hart kappen
    });

// Y-Max sicher nicht capen
(this.player.body as Phaser.Physics.Arcade.Body).setMaxVelocity(300, 2200);


    // Tennis (nur wenn Modus 'tennis' aktiv)
    if (this.equipment === "tennis") {
      this.tennisTotal = this.levelCfg.balls?.length ?? (this.levelCfg.maxBalls ?? 0);
      this.tennisHit = 0;

      this.tennis = new TennisSystem(this, this.player, groundTop, this.levelCfg, this.controls);
      this.tennis.onBallReturned = () => {
        this.tennisHit = Math.min(this.tennisTotal, this.tennisHit + 1);
        this.levelMgr?.addBallBonus(this.levelCfg.bonusPerBallMs ?? 1000);
      };
      this.tennis.create();
    }

    // Wolken-Layer (unter der Top-Box)
    const cloudYMin = this.topBox.getBottomY() + 6;
    const cloudYMax = Math.min(this.scale.height * 0.45, cloudYMin + 120);
    this.clouds = new Clouds(this, this.cameras.main);
    this.clouds.create({ yMin: cloudYMin, yMax: cloudYMax, count: 7 });

    // Kamera
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(this.scale.width * 0.6, this.scale.height * 0.5);

    // Resize
    bindResize(this, { parallax: this.parallax, ground: this.ground, obstacles: this.obstacles,
      crown: this.crown, camera: this.cameras.main, player: this.player });

    // Level-Manager
    this.levelMgr = new LevelManager({
      scene: this,
      levelIndex: this.levelIndex,
      hud: this.hud,
      onGoNext: (nextIndex) => this.scene.start("GameScene", {
        levelIndex: nextIndex,
        equipment: this.equipment,          // Modus beibehalten
        playerName: this.playerName,
        autoRun: this.autoRun,
        autoJumpAssist: this.autoJumpAssistEnabled,
      }),
      onBackToMenu: () => this.scene.start("StartScene"),
    });

    // Start erst bei erster Eingabe
    const startOnce = () => {
      if (!this.started) {
        this.started = true;
        this.levelMgr.start();
        this.levelStartTs = this.time.now;
      }
    };
    this.input.keyboard?.once("keydown", startOnce);
    this.input.once("pointerdown", startOnce);

    // „Bestzeiten“-Overlay entsorgen (falls aus anderer Scene noch vorhanden)
    this.cleanupBestzeitenUi();

    // Scene-Cleanup
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroyed = true);
    this.events.once(Phaser.Scenes.Events.DESTROY,  () => this.destroyed = true);
  }

  update(time: number, delta: number) {
    // Hintergrund
    this.parallax.update(this.cameras.main.scrollX);

    if (this.levelComplete) {
      this.crown.updateFollow(this.player);
      return;
    }

    // Controls
    this.controls.update(time);

    // Bodenstatus (bodyArc bevorzugt)
    const bodyArc = (this.player as any).bodyArc as Phaser.Physics.Arcade.Body | undefined;
    const body = bodyArc ?? (this.player.body as Phaser.Physics.Arcade.Body);
    const onGround = body.blocked.down || body.touching.down;

    // 👉 Auto-Jump Assist (vor dem Controller, damit jumpDown im selben Frame greift)
    this.autoJumpAssist(onGround);

    // Bewegung
    if (!this.isFailing && !this.levelComplete) {
      this.playerCtl.update(onGround, time, delta);
    }

    // Animation treiben (geschwindigkeitsbasiert)
    this.drivePlayerAnim(onGround);

    // Tennis
    this.tennis?.update();

    // Wolken
    this.clouds?.update(delta / 1000);

    // Top-Box Zeit
    this.topBox.updateElapsed(this.levelStartTs != null ? (this.time.now - this.levelStartTs) : 0);

    // HUD (falls intern benötigt)
    this.hud.update(0);
  }

  // ---------- Level-Ende ----------

  private handleLevelWin() {
    if (this.levelComplete || this.destroyed) return;
    this.levelComplete = true;

    // Eingaben stoppen
    this.input.enabled = false;

    // Spieler & Systeme einfrieren
    const pBody = this.player.body as Phaser.Physics.Arcade.Body;
    pBody.setVelocity(0, 0);
    pBody.allowGravity = false;
    this.player.tryPlay("idle");

    this.obstacles.disableCollider();
    this.tennis?.destroy();
    this.crown.pickup(this.player);

    // Zeiten
    const grossMs = this.hud.getElapsedMs
      ? this.hud.getElapsedMs()
      : (this.levelStartTs ? (this.time.now - this.levelStartTs) : 0);

    const bonusMs = this.levelMgr.bonusMs;
    const netMs   = Math.max(0, grossMs - bonusMs);

    // Ergebnis registrieren (UI etc.)
    this.levelMgr.win({ ballsHit: this.tennisHit, ballsTotal: this.tennisTotal });

    // Persistenter Score-Eintrag
    ScoreStore.add({
      player: this.playerName,
      equipment: this.equipment === "tennis" ? "tennis" : "none",
      level: this.levelIndex,
      netMs,
      date: Date.now()
    });

    // Ergebnis-Panel & Auto-Advance (immer zu next, Modus & Name mitgeben)
    const goNext = () => {
      if (this.destroyed) return;
      const next = this.levelIndex + 1;
      this.scene.start("GameScene", {
        levelIndex: next,
        equipment: this.equipment,
        playerName: this.playerName,
        autoRun: this.autoRun,
        autoJumpAssist: this.autoJumpAssistEnabled,
      });
    };

    ResultPanel.showWin(
      this,
      { level: this.levelIndex, grossMs, bonusMs, netMs, rank: 0, total: 0 },
      goNext
    );
  }

  private handleLevelFail() {
    if (this.levelComplete || this.isFailing || this.destroyed) return;
    this.isFailing = true;

    // HUD/Timer stoppen
    this.hud?.stop(false);

    // Steuerung/Collider deaktivieren
    this.playerCtl.setEnabled(false);
    this.obstacles.disableCollider();
    this.tennis?.destroy();

    // kleiner Knockback
    const bodyArc = (this.player as any).bodyArc as Phaser.Physics.Arcade.Body | undefined;
    const body = bodyArc ?? (this.player.body as Phaser.Physics.Arcade.Body);
    body.setAcceleration(0, 0).setDrag(1200, 0).setVelocity(-120, -220);
    body.allowGravity = true;
    this.player.tryPlay("idle");

    // Auto-Retry
    this.time.delayedCall(900, () => {
      if (this.destroyed) return;
      this.scene.start("GameScene", {
        levelIndex: this.levelIndex,
        equipment: this.equipment,
        playerName: this.playerName,
        autoRun: this.autoRun,
        autoJumpAssist: this.autoJumpAssistEnabled,
      });
    });
  }

  // ---------- Helpers ----------

  /** Näherung: Apex-Höhe aus jumpVel & gravUp (v^2 / (2g)) */
  private calcJumpApexPx(): number {
    const v = Math.abs((this.playerCtl as any).jumpVel ?? -420);
    const g = Math.max(1, (this.playerCtl as any).gravUp ?? 820);
    return Math.round((v * v) / (2 * g));
  }

  /** Auf-/Abstiegszeiten (für idealen Absprungpunkt) */
  private calcAirTimes(): { tUp: number; tDown: number; tTotal: number } {
    const v = Math.abs((this.playerCtl as any).jumpVel ?? -420);
    const gUp = Math.max(1, (this.playerCtl as any).gravUp ?? 820);
    const apex = this.calcJumpApexPx();
    const gDown = Math.max(1, (this.playerCtl as any).gravDown ?? 1650);
    const tUp = v / gUp;
    const tDown = Math.sqrt((2 * apex) / gDown);
    return { tUp, tDown, tTotal: tUp + tDown };
  }

  private getNextObstacleAhead(): Phaser.GameObjects.Image | null {
    if (!this.obstacles?.group) return null;
    let next: Phaser.GameObjects.Image | null = null;
    let minDx = Number.POSITIVE_INFINITY;
    this.obstacles.group.children.iterate(go => {
      const img = go as Phaser.GameObjects.Image;
      const dx = img.x - this.player.x;
      if (dx > 0 && dx < minDx) { minDx = dx; next = img; }
      return true;
    });
    return next;
  }

  /** Drückt im richtigen Fenster automatisch den Sprung (nur am Boden) */
  private autoJumpAssist(onGround: boolean) {
    if (!this.autoJumpAssistEnabled) return;
    if (!onGround) return;

    const now = this.time.now;
    if (now - this.lastAutoJumpAt < 120) return; // kleiner Cooldown

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const vx = Math.max(1, body.velocity.x);

    const next = this.getNextObstacleAhead();
    if (!next) return;

    // Hindernis-Maße
    const w = next.displayWidth;
    const h = next.displayHeight;

    // Schaffbarkeit prüfen (Höhe + horizontale Reichweite)
    const apex = this.calcJumpApexPx();
    if (h > apex + 8) return; // zu hoch → kein Auto-Jump

    const { tUp, tTotal } = this.calcAirTimes();
    const horizReach = vx * tTotal;     // Distanz, die wir in der Luft schaffen
    const need = w + 16;                // Breite + kleiner Puffer
    if (horizReach < need) return;      // zu breit → kein Auto-Jump

    // Ideal: beim Apex über Hindernis-Mitte sein
    const distToCenter = next.x - this.player.x;
    const ideal = vx * tUp;             // Distanz bis Apex
    const tol = Math.max(12, vx * 0.06);// Toleranzfenster abhängig von Speed

    if (Math.abs(distToCenter - ideal) <= tol) {
      // Sprung in diesem Frame simulieren
      this.controls.jumpDown = true;
      this.controls.jumpHeld = true;    // genug Höhe mitnehmen
      this.lastAutoJumpAt = now;
    }
  }

  private drivePlayerAnim(onGround: boolean) {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const vx = Math.abs(body.velocity.x);

    // Ducken hat Vorrang
    if (onGround && this.controls.crouch) {
      this.player.tryPlay("crouch");
      if (this.player.anims) this.player.anims.timeScale = 1;
      return;
    }

    // Laufen am Boden
    if (onGround && vx > 30) {
      this.player.tryPlay("run");
      const base = 220; // entspricht runSpeed
      const scale = Phaser.Math.Clamp(vx / base, 0.7, 1.6);
      if (this.player.anims) this.player.anims.timeScale = scale;
      return;
    }

    // In der Luft: neutral
    this.player.tryPlay("idle");
    if (this.player.anims) this.player.anims.timeScale = 1;
  }

  private cleanupBestzeitenUi() {
    this.children.getAll().forEach(go => {
      if (go instanceof Phaser.GameObjects.Text) {
        const t = (go as Phaser.GameObjects.Text).text;
        if (typeof t === "string" && t.startsWith("Bestzeiten")) go.destroy();
      }
    });
  }
}
