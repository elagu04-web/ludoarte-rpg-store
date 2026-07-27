import Phaser from "phaser";
import { BasePlayerScene } from "./BasePlayerScene";

export class GroundFloorScene extends BasePlayerScene {
  private stairsZone!: Phaser.Geom.Rectangle;
  private exitZone!: Phaser.Geom.Rectangle;

  constructor() {
    super("GroundFloorScene");
  }

  preload() {
    super.preload();
    this.load.image("bg-planta-baja", "/assets/scene/planta-baja.png");
  }

  create() {
    this.addBackground("bg-planta-baja");

    this.createPlayer(768, 780);

    // Mostradores laterales
    this.addObstacle(205, 490, 250, 630, { visible: false });
    this.addObstacle(1325, 490, 250, 630, { visible: false });

    // Mesas (2 columnas)
    this.addObstacle(597, 480, 235, 470, { visible: false });
    this.addObstacle(958, 480, 235, 470, { visible: false });

    // Reja/valla inferior, con hueco para la salida
    this.addObstacle(327, 905, 655, 100, { visible: false });
    this.addObstacle(1208, 905, 656, 100, { visible: false });

    this.stairsZone = this.addZoneMarker(768, 110, 80, 70, {
      visible: false,
    });
    this.exitZone = this.addZoneMarker(768, 895, 90, 50, {
      visible: false,
    });
  }

  protected onSceneUpdate() {
    if (this.isPlayerInZone(this.stairsZone)) {
      this.scene.start("StoreScene");
    }

    if (this.isPlayerInZone(this.exitZone)) {
      this.scene.start("ExteriorScene");
    }
  }
}
