import Phaser from "phaser";
import { BasePlayerScene } from "./BasePlayerScene";

export class GroundFloorScene extends BasePlayerScene {
  private stairsZone!: Phaser.Geom.Rectangle;
  private exitZone!: Phaser.Geom.Rectangle;

  constructor() {
    super("GroundFloorScene");
  }

  create() {
    this.cameras.main.setBackgroundColor("#d8c9a3"); // piso interior

    this.add
      .text(400, 24, "Planta Baja", {
        fontSize: "20px",
        color: "#1a1a1a",
      })
      .setOrigin(0.5);

    this.createPlayer(400, 520);

    // Zona de mesas (todavia no interactiva, la agregamos en un paso futuro)
    this.addObstacle(200, 300, 220, 140, 0xa9895f);
    this.add
      .text(200, 300, "Zona de mesas\n(proximamente)", {
        fontSize: "14px",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5);

    this.stairsZone = this.addZoneMarker(680, 110, 160, 100, 0xb0b0b0);
    this.add
      .text(680, 110, "Escalera a\nla tienda", {
        fontSize: "14px",
        color: "#1a1a1a",
        align: "center",
      })
      .setOrigin(0.5);

    this.exitZone = this.addZoneMarker(120, 110, 160, 100, 0xd9a441);
    this.add
      .text(120, 110, "Salida", {
        fontSize: "14px",
        color: "#1a1a1a",
        align: "center",
      })
      .setOrigin(0.5);
  }

  protected onSceneUpdate() {
    if (
      Phaser.Geom.Rectangle.Overlaps(this.player.getBounds(), this.stairsZone)
    ) {
      this.scene.start("StoreScene");
    }

    if (
      Phaser.Geom.Rectangle.Overlaps(this.player.getBounds(), this.exitZone)
    ) {
      this.scene.start("ExteriorScene");
    }
  }
}
