// src/services/Leaderboard.ts
import { PlayerProfile } from "./Playerprofile"; // ⬅️ wichtig: für den Spielernamen

export type LeaderboardEntry = {
  levelIndex: number;
  name: string;
  grossMs: number;
  bonusMs: number;
  netMs: number;
  ballsHit: number;
  ballsTotal: number;
  timestamp: number;
};

const LS_KEY = "jumpy.leaderboard.v1";

export class Leaderboard {
  static loadAll(): LeaderboardEntry[] {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as LeaderboardEntry[]) : [];
    } catch {
      // Falls JSON korrupt ist: Speicher leeren und leere Liste zurückgeben
      try { localStorage.removeItem(LS_KEY); } catch {}
      return [];
    }
  }

  static saveAll(entries: LeaderboardEntry[]) {
    localStorage.setItem(LS_KEY, JSON.stringify(entries));
  }

  static saveResult(entry: LeaderboardEntry) {
    const all = this.loadAll();
    all.push(entry);
    this.saveAll(all);
  }

  static topForLevel(levelIndex: number, limit = 5): LeaderboardEntry[] {
    const all = this.loadAll().filter(e => e.levelIndex === levelIndex);
    // Sortierung: Nettozeit ↑, dann BallsHit ↓, dann ältester zuerst
    all.sort((a, b) => {
      if (a.netMs !== b.netMs) return a.netMs - b.netMs;
      if (a.ballsHit !== b.ballsHit) return b.ballsHit - a.ballsHit;
      return a.timestamp - b.timestamp;
    });
    return all.slice(0, limit);
  }

  // Alias für bestehenden Code (z. B. HUD.refreshBoard)
  static top(levelIndex: number, limit = 5) {
    return this.topForLevel(levelIndex, limit);
  }

  /** ✅ Backwards-Compat: alte Aufrufe wie Leaderboard.record(levelIndex, elapsedMs) */
  static record(levelIndex: number, elapsedMs: number) {
    const name = PlayerProfile.getName?.() ?? "Player";
    this.saveResult({
      levelIndex,
      name,
      grossMs: elapsedMs,
      bonusMs: 0,
      netMs: elapsedMs,
      ballsHit: 0,
      ballsTotal: 0,
      timestamp: Date.now(),
    });
  }
}
