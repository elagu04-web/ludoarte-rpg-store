import Phaser from "phaser";
import { eventBus } from "@/game/eventBus";
import { BasePlayerScene } from "./BasePlayerScene";

export class EstacionamientoScene extends BasePlayerScene {
  private buildingDoorZone!: Phaser.Geom.Rectangle;
  private truckZone!: Phaser.Geom.Rectangle;
  private nearTruck = false;

  constructor() {
    super("EstacionamientoScene");
  }

  preload() {
    super.preload();
    this.load.image("bg-estacionamiento", "/assets/scene/estacionamiento.png");
  }

  create() {
    this.addBackground("bg-estacionamiento");

    this.createPlayer(1375, 350);

    // Calle y vereda a la izquierda -- no caminables, el estacionamiento
    // empieza donde termina la vereda
    this.addObstacle(195, 512, 390, 1024, { visible: false });

    // Camion de LUDOARTE -- interactuable para pedir juegos que no hay en stock
    this.addObstacle(732, 190, 465, 260, { visible: false });
    this.truckZone = new Phaser.Geom.Rectangle(460, 20, 545, 340);

    // Cambios de nivel decorativos (colisionables)
    this.addObstacle(1060, 380, 140, 35, { visible: false });
    this.addObstacle(1060, 760, 140, 35, { visible: false });

    // Pared del edificio, con hueco para la puerta que vuelve a la planta baja
    this.addObstacle(1433, 75, 206, 150, { visible: false });
    this.addObstacle(1433, 652, 206, 744, { visible: false });
    this.buildingDoorZone = new Phaser.Geom.Rectangle(1330, 150, 90, 130);

    this.events.on("shutdown", () => {
      eventBus.emit("truck-proximity", false);
    });
  }

  private updateTruckProximity() {
    const inZone = Phaser.Geom.Rectangle.Overlaps(
      this.player.getBounds(),
      this.truckZone
    );

    if (inZone !== this.nearTruck) {
      this.nearTruck = inZone;
      eventBus.emit("truck-proximity", inZone);
    }
  }

  protected onSceneUpdate() {
    this.updateTruckProximity();

    if (this.nearTruck && this.isEKeyJustDown()) {
      eventBus.emit("order-truck-open", true);
    }

    if (this.isPlayerInZone(this.buildingDoorZone)) {
      this.transitionTo("GroundFloorScene");
    }
  }
}
