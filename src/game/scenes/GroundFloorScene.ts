import Phaser from "phaser";
import { eventBus } from "@/game/eventBus";
import { BasePlayerScene } from "./BasePlayerScene";

export class GroundFloorScene extends BasePlayerScene {
  private stairsZone!: Phaser.Geom.Rectangle;
  private exitZone!: Phaser.Geom.Rectangle;
  private leftDoorZone!: Phaser.Geom.Rectangle;
  private tvZone!: Phaser.Geom.Rectangle;
  private nearTv = false;
  private rentalZone!: Phaser.Geom.Rectangle;
  private nearRental = false;

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

    // Pared de fondo, con huecos para la puerta de la izquierda (va al
    // estacionamiento) y la escalera que sube a la tienda
    this.addObstacle(77, 97, 155, 195, { visible: false });
    this.addObstacle(390, 97, 260, 195, { visible: false });
    this.addObstacle(783, 97, 266, 195, { visible: false });
    this.leftDoorZone = new Phaser.Geom.Rectangle(155, 60, 105, 135);

    // Mesa/mostrador debajo de la pantalla decorativa
    this.addObstacle(405, 260, 230, 150, { visible: false });

    // Tele gigante -- interactuable, abre el menu (fotos, etc.). La zona
    // baja hasta el piso caminable, mas alla de la mesa que esta debajo.
    this.tvZone = new Phaser.Geom.Rectangle(290, 40, 230, 360);

    // Barras/estanterias decorativas a los lados (colisionables)
    this.addObstacle(102, 755, 165, 1110, { visible: false });
    this.addObstacle(813, 755, 166, 1110, { visible: false });

    // Mesas centrales (2 columnas x 4 filas). La de arriba a la derecha
    // (la mas cerca de la tele) tambien es el punto de alquiler -- de
    // momento solo el texto "ALQUILER" sobre la mesa, para que se entienda,
    // hasta que haya un cartel de verdad.
    const RENTAL_TABLE = { x: 560, y: 535, width: 145, height: 145 };
    const tableY = [535, 735, 935, 1145];
    for (const y of tableY) {
      this.addObstacle(355, y, 145, 145, { visible: false });
      this.addObstacle(560, y, 145, 145, { visible: false });
    }
    this.add
      .text(RENTAL_TABLE.x, RENTAL_TABLE.y, "ALQUILER", {
        fontSize: "20px",
        color: "#ffffff",
        fontStyle: "bold",
        align: "center",
        wordWrap: { width: RENTAL_TABLE.width - 20 },
      })
      .setOrigin(0.5);
    const rentalPadding = 30;
    this.rentalZone = new Phaser.Geom.Rectangle(
      RENTAL_TABLE.x - RENTAL_TABLE.width / 2 - rentalPadding,
      RENTAL_TABLE.y - RENTAL_TABLE.height / 2 - rentalPadding,
      RENTAL_TABLE.width + rentalPadding * 2,
      RENTAL_TABLE.height + rentalPadding * 2
    );

    // Pared inferior, con hueco para la puerta de salida
    this.addObstacle(170, 1550, 340, 140, { visible: false });
    this.addObstacle(743, 1550, 346, 140, { visible: false });

    this.stairsZone = new Phaser.Geom.Rectangle(520, 60, 130, 135);
    this.exitZone = new Phaser.Geom.Rectangle(340, 1520, 230, 130);

    this.events.on("shutdown", () => {
      eventBus.emit("tv-proximity", false);
      eventBus.emit("rental-proximity", false);
    });
  }

  private updateTvProximity() {
    const inZone = Phaser.Geom.Rectangle.Overlaps(
      this.player.getBounds(),
      this.tvZone
    );

    if (inZone !== this.nearTv) {
      this.nearTv = inZone;
      eventBus.emit("tv-proximity", inZone);
    }
  }

  private updateRentalProximity() {
    const inZone = Phaser.Geom.Rectangle.Overlaps(
      this.player.getBounds(),
      this.rentalZone
    );

    if (inZone !== this.nearRental) {
      this.nearRental = inZone;
      eventBus.emit("rental-proximity", inZone);
    }
  }

  protected onSceneUpdate() {
    this.updateTvProximity();
    this.updateRentalProximity();

    if (this.nearTv && this.isEKeyJustDown()) {
      eventBus.emit("tv-menu-open", true);
    }

    if (this.nearRental && this.isEKeyJustDown()) {
      eventBus.emit("rental-open", true);
    }

    if (this.isPlayerInZone(this.stairsZone)) {
      this.transitionTo("StoreScene");
    }

    if (this.isPlayerInZone(this.exitZone)) {
      this.transitionTo("ExteriorScene");
    }

    if (this.isPlayerInZone(this.leftDoorZone)) {
      this.transitionTo("EstacionamientoScene");
    }
  }
}
