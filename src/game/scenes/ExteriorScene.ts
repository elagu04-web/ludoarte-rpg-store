import Phaser from "phaser";
import { BasePlayerScene } from "./BasePlayerScene";

export class ExteriorScene extends BasePlayerScene {
  private doorZone!: Phaser.Geom.Rectangle;

  constructor() {
    super("ExteriorScene");
  }

  preload() {
    super.preload();
    this.load.image("bg-fachada", "/assets/scene/fachada.png");
  }

  create() {
    this.addBackground("bg-fachada");

    this.createPlayer(768, 850);

    // Fachada del edificio, con hueco central para la puerta (invisibles,
    // el dibujo de fondo ya muestra las paredes)
    this.addObstacle(335, 390, 670, 280, { visible: false });
    this.addObstacle(1228, 390, 616, 280, { visible: false });

    // Mesa de ajedrez decorativa afuera
    this.addObstacle(265, 635, 230, 170, { visible: false });

    this.doorZone = this.addZoneMarker(795, 350, 120, 100, { visible: false });
  }

  protected onSceneUpdate() {
    if (this.isPlayerInZone(this.doorZone)) {
      this.scene.start("GroundFloorScene");
    }
  }
}
