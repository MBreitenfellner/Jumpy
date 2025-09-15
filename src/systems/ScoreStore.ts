// src/systems/ScoreStore.ts
export type EquipmentMode = "none" | "tennis";
export interface RunRecord {
  player: string;
  equipment: EquipmentMode;
  level: number;        // 1..N
  netMs: number;        // Nettozeit
  date: number;
}

const KEY = "stickrun.scores.v1";

function load(): RunRecord[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}
function save(arr: RunRecord[]) { localStorage.setItem(KEY, JSON.stringify(arr)); }

export const ScoreStore = {
  add(rec: RunRecord) {
    const all = load(); all.push(rec); save(all);
  },

  /** Top N je Level – beste Zeit pro Spieler zählt */
  topByLevel(level: number, equipment: EquipmentMode, n = 5) {
    const all = load().filter(r => r.level === level && r.equipment === equipment);
    const bestPerPlayer = new Map<string, number>();
    for (const r of all) {
      const cur = bestPerPlayer.get(r.player);
      if (cur == null || r.netMs < cur) bestPerPlayer.set(r.player, r.netMs);
    }
    return [...bestPerPlayer.entries()]
      .map(([player, ms]) => ({ player, ms }))
      .sort((a, b) => a.ms - b.ms)
      .slice(0, n);
  },

  /** Kumuliert: Summe der Bestzeiten je Level pro Spieler (nicht alle Runs) */
  cumulativeTop(levels: number[], equipment: EquipmentMode, n = 10) {
    const all = load().filter(r => r.equipment === equipment);
    const best = new Map<string, Map<number, number>>(); // player -> (level -> bestMs)
    for (const r of all) {
      if (!levels.includes(r.level)) continue;
      const mp = best.get(r.player) ?? new Map<number, number>();
      const cur = mp.get(r.level);
      if (cur == null || r.netMs < cur) mp.set(r.level, r.netMs);
      best.set(r.player, mp);
    }
    const rows = [...best.entries()].map(([player, mp]) => {
      let sum = 0;
      for (const lv of levels) { const v = mp.get(lv); if (v != null) sum += v; }
      return { player, sumMs: sum, have: mp.size };
    });
    return rows
      .filter(r => r.sumMs > 0)
      .sort((a, b) => a.sumMs - b.sumMs)
      .slice(0, n);
  },

  /** Nächstes Level für Spieler/Modus (kein Direktstart auf 2/3) */
  nextLevelFor(player: string, equipment: EquipmentMode, maxLevel = 3) {
    const done = new Set(
      load().filter(r => r.player === player && r.equipment === equipment).map(r => r.level)
    );
    for (let lv = 1; lv <= maxLevel; lv++) if (!done.has(lv)) return lv;
    return 1; // alles geschafft → wieder bei 1 starten (oder Wunschverhalten anpassen)
  }
};

export function fmtMs(ms: number) {
  return (ms / 1000).toFixed(3) + " s";
}
