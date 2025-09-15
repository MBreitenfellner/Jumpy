export class ResultPanel {
    static showWin(
      scene: Phaser.Scene,
      data: { level: number; grossMs: number; bonusMs: number; netMs: number; rank: number; total: number },
      onContinue: () => void
    ) {
      // draw texts/buttons; bind ENTER/SPACE/Click -> onContinue()
    }
  
    static showFail(scene: Phaser.Scene, level: number, onRetry: () => void) {
      // draw fail banner + key/click to retry -> onRetry()
    }
  
    static clear(scene: Phaser.Scene) {
      // remove any lingering panel objects/listeners if needed
    }
  }
  