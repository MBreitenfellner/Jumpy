import type { HUD } from "../ui/Hud";
import { Leaderboard, type LeaderboardEntry } from "../services/Leaderboard";
import { PlayerProfile } from "../services/Playerprofile";

export type LevelCtx = {
  scene: Phaser.Scene;
  levelIndex: number;
  hud: HUD;
  onGoNext: (nextIndex: number) => void;
  onBackToMenu?: () => void;
};

export class LevelManager {
  private ctx: LevelCtx;
  private started = false;
  private levelStartTs: number | null = null;
  bonusMs = 0;

  constructor(ctx: LevelCtx) { this.ctx = ctx; }

  start() {
    if (this.started) return;
    this.started = true;
    this.levelStartTs = this.ctx.scene.time.now;
    this.ctx.hud.start();
  }

  addBallBonus(ms: number) { this.bonusMs += ms; }

  win(args: { ballsHit: number; ballsTotal: number }) {
    const grossMs = this.levelStartTs ? (this.ctx.scene.time.now - this.levelStartTs) : 0;
    const netMs = Math.max(0, grossMs - this.bonusMs);

    const entry: LeaderboardEntry = {
      levelIndex: this.ctx.levelIndex,
      name: PlayerProfile.getName(),
      grossMs, bonusMs: this.bonusMs, netMs,
      ballsHit: args.ballsHit, ballsTotal: args.ballsTotal,
      timestamp: Date.now(),
    };
    Leaderboard.saveResult(entry);

    const all = Leaderboard.loadAll().filter(e => e.levelIndex === entry.levelIndex);
    const better = (a: LeaderboardEntry, b: LeaderboardEntry) =>
      (a.netMs < b.netMs) || (a.netMs === b.netMs && a.ballsHit > b.ballsHit) ||
      (a.netMs === b.netMs && a.ballsHit === b.ballsHit && a.timestamp < b.timestamp);
    const rank = 1 + all.filter(e => better(e, entry)).length;

    // HUD stoppen – Panel in ResultPanel anzeigen lassen
    this.ctx.hud.stop(true);
    // UI übernimmt ResultPanel.showWin(...)
  }

  fail() {
    this.ctx.hud.stop(false);
    // UI übernimmt ResultPanel.showFail(...)
  }
}
