import Phaser from "phaser";
import { BasePlayerScene } from "./BasePlayerScene";

export class ExteriorScene extends BasePlayerScene {
  private doorZone!: Phaser.Geom.Rectangle;

  constructor() {
    super("ExteriorScene");
  }

  create() {
    this.cameras.main.setBackgroundColor("#8fb8de"); // cielo/calle

    this.add
      .text(400, 24, "Epico Atlantida - Fachada", {
        fontSize: "20px",
        color: "#1a1a1a",
      })
      .setOrigin(0.5);

    this.createPlayer(400, 450);

    // Fachada del edificio, con un hueco central para la puerta
    this.addObstacle(160, 100, 320, 100, 0x8a8a8a); // pared izquierda
    this.addObstacle(640, 100, 320, 100, 0x8a8a8a); // pared derecha

    this.doorZone = this.addZoneMarker(400, 100, 160, 100, 0xd9a441);

    this.add
      .text(400, 100, "Entrada", {
        fontSize: "16px",
        color: "#1a1a1a",
      })
      .setOrigin(0.5);
  }

  protected onSceneUpdate() {
    if (Phaser.Geom.Rectangle.Overlaps(this.player.getBounds(), this.doorZone)) {
      this.scene.start("GroundFloorScene");
    }
  }
}
