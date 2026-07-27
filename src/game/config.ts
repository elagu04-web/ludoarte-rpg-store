import Phaser from "phaser";
import { MainScene } from "./scenes/MainScene";

export function createGameConfig(
  parent: HTMLDivElement
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent,
    backgroundColor: "#2d2d44",
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scene: [MainScene],
  };
}
