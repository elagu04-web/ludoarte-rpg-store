import Phaser from "phaser";
import { ExteriorScene } from "./scenes/ExteriorScene";
import { GroundFloorScene } from "./scenes/GroundFloorScene";
import { StoreScene } from "./scenes/StoreScene";
import { EstacionamientoScene } from "./scenes/EstacionamientoScene";
import { BathroomScene } from "./scenes/BathroomScene";

export function createGameConfig(
  parent: HTMLDivElement
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    width: 1536,
    height: 1024,
    parent,
    backgroundColor: "#2d2d44",
    pixelArt: true,
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scene: [ExteriorScene, GroundFloorScene, StoreScene, EstacionamientoScene, BathroomScene],
  };
}
