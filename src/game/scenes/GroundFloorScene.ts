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

    this.createPlayer(455, 1450);

    // Pared de fondo, con hueco para la escalera que sube a la tienda
    this.addObstacle(260, 97, 520, 195, { visible: false });
    this.addObstacle(783, 97, 266, 195, { visible: false });

    // Mesa/mostrador debajo de la pantalla decorativa
    this.addObstacle(405, 260, 230, 150, { visible: false });

    // Barras/estanterias decorativas a los lados (colisionables)
    this.addObstacle(102, 755, 165, 1110, { visible: false });
    this.addObstacle(813, 755, 166, 1110, { visible: false });

    // Mesas centrales (2 columnas x 4 filas)
    const tableY = [535, 735, 935, 1145];
    for (const y of tableY) {
      this.addObstacle(355, y, 145, 145, { visible: false });
      this.addObstacle(560, y, 145, 145, { visible: false });
    }

    // Pared inferior, con hueco para la puerta de salida
    this.addObstacle(170, 1550, 340, 140, { visible: false });
    this.addObstacle(743, 1550, 346, 140, { visible: false });

    this.stairsZone = new Phaser.Geom.Rectangle(520, 60, 130, 135);
    this.exitZone = new Phaser.Geom.Rectangle(340, 1520, 230, 130);
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
