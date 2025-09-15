// src/scenes/MenuScene.ts
import Phaser from "phaser";
import { Leaderboard } from "../services/Leaderboard";

export default class MenuScene extends Phaser.Scene {
  constructor() { super({ key: "MenuScene" }); }

  create() {
    const w = this.scale.width;
    this.add.text(w/2, 40, "🏃‍♂️ Stick Run — Hauptmenü", {
      fontFamily: "sans-serif", fontSize: "28px", color: "#fff",
      backgroundColor: "rgba(0,0,0,0.5)", padding: { x: 10, y: 6 }
    }).setOrigin(0.5,0);

    // Buttons (simpel)
    const start = this.add.text(w/2, 90, "▶ Spiel starten (Level 1)", { fontSize: "20px", color:"#fff", backgroundColor:"#27ae60", padding:{x:8,y:4}})
      .setOrigin(0.5,0).setInteractive({ useHandCursor:true });
    start.on("pointerdown", () => this.scene.start("GameScene", { levelIndex: 1 }));

    // Bestenlisten pro Level
    const colX = [40, this.scale.width/3 + 20, (2*this.scale.width/3) + 20];
    const headerY = 150;

    for (let l=1; l<=3; l++) {
      const top = Leaderboard.topForLevel(l, 5);
      const lines = top.length
        ? [`Level ${l} — Top 5 (Netto):`, ...top.map((e,i)=>`${i+1}. ${e.name}  ${(e.netMs/1000).toFixed(3)} s`)]
        : [`Level ${l} — noch keine Zeiten`];
      this.add.text(colX[(l-1)%3], headerY, lines.join("\n"), {
        fontFamily:"monospace", fontSize:"14px", color:"#fff",
        backgroundColor:"rgba(0,0,0,0.35)", padding:{x:6,y:4}
      });
    }

    // Einfache kumulierte Liste (summe der besten Level-Nettozeiten je Name)
    const byName: Record<string, number> = {};
    for (let l=1; l<=3; l++) {
      const top = Leaderboard.topForLevel(l, 20); // etwas breiter sammeln
      top.forEach(e => {
        byName[e.name] = (byName[e.name] ?? 0) + e.netMs;
      });
    }
    const cumu = Object.entries(byName)
      .map(([name, sumMs]) => ({ name, sumMs }))
      .sort((a,b)=>a.sumMs-b.sumMs)
      .slice(0,10);

    const cumuLines = cumu.length
      ? ["Kumuliert (L1–L3) — Top 10:", ...cumu.map((e,i)=>`${i+1}. ${e.name}  ${(e.sumMs/1000).toFixed(3)} s`)]
      : ["Kumuliert (L1–L3): noch keine Daten"];

    this.add.text(40, headerY + 180, cumuLines.join("\n"), {
      fontFamily:"monospace", fontSize:"14px", color:"#fff",
      backgroundColor:"rgba(0,0,0,0.35)", padding:{x:6,y:4}
    });
  }
}
