// src/services/PlayerProfile.ts
const LS_KEY_NAME = "jumpy.playerName";

export class PlayerProfile {
  static getName(): string {
    const n = localStorage.getItem(LS_KEY_NAME);
    return (n && n.trim()) ? n.trim() : "Player";
  }
  static setName(name: string) {
    localStorage.setItem(LS_KEY_NAME, (name || "").trim() || "Player");
  }
}
