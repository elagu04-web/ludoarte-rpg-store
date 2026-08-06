import Phaser from "phaser";
import { eventBus } from "@/game/eventBus";
import { findActivity } from "@/data/activities";
import { BasePlayerScene } from "./BasePlayerScene";

export class GroundFloorScene extends BasePlayerScene {
  private stairsZone!: Phaser.Geom.Rectangle;
  private exitZone!: Phaser.Geom.Rectangle;
  private leftDoorZone!: Phaser.Geom.Rectangle;
  private tvZone!: Phaser.Geom.Rectangle;
  private nearTv = false;
  private rentalZone!: Phaser.Geom.Rectangle;
  private nearRental = false;
  private activityZones: { id: string; zone: Phaser.Geom.Rectangle }[] = [];
  private nearActivityId: string | null = null;

  constructor() {
    super("GroundFloorScene");
  }

  preload() {
    super.preload();
    this.load.image("bg-planta-baja", "/assets/scene/planta-baja.png");
  }

  /**
   * This is the only room with three doors, so unlike the other scenes it
   * can't just spawn the player at one fixed point -- each door needs to
   * drop you back in next to itself, not wherever another door happens to
   * be. Coordinates are just past each door's wall gap, on the walkable
   * side.
   */
  private getSpawnPoint(): { x: number; y: number } {
    switch (this.fromScene) {
      case "StoreScene":
        return { x: 585, y: 230 }; // below the stairs (top-right gap)
      case "EstacionamientoScene":
        return { x: 207, y: 230 }; // below the left door
      case "ExteriorScene":
      default:
        return { x: 455, y: 1450 }; // above the street-side door
    }
  }

  create() {
    this.addBackground("bg-planta-baja");

    const spawn = this.getSpawnPoint();
    this.createPlayer(spawn.x, spawn.y);

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
    this.addTapHotspot(
      290 + 230 / 2,
      40 + 360 / 2,
      230,
      360,
      () => this.nearTv,
      () => eventBus.emit("tv-menu-open", true)
    );

    // Barras/estanterias decorativas a los lados (colisionables). Se
    // extienden hasta encontrarse con la pared de abajo (wallB1/wallB2) --
    // antes terminaban en y=1310 y la pared empezaba en y=1480, dejando
    // una franja de pared sin colision de 170px donde se podia caminar
    // "sobre lo negro" del fondo.
    this.addObstacle(102, 840, 165, 1280, { visible: false });
    this.addObstacle(813, 840, 166, 1280, { visible: false });

    // Mesas centrales (2 columnas x 4 filas). Cada una tiene su cartel y,
    // menos la de Alquiler (que ya tiene su propio menu de siempre), abre
    // el panel de info generico (ActivityInfoScreen) con horarios/precio y
    // un boton de WhatsApp -- ver data/activities.ts por el contenido de
    // cada una.
    // Un poco mas chica que el dibujo de la mesa (que incluye las patas,
    // mas anchas que el tablero) para dejar un pasillo comodo entre
    // columnas -- con el tamaño real completo el hueco quedaba demasiado
    // justo para cruzar en diagonal.
    const TABLE_SIZE = 125;
    const RENTAL_TABLE = { x: 560, y: 535, width: TABLE_SIZE, height: TABLE_SIZE };
    const tables: { x: number; y: number; label?: string; activityId?: string }[] = [
      { x: 355, y: 535, label: "AJEDREZ", activityId: "ajedrez" },
      { x: 560, y: 535, label: "ALQUILER" },
      { x: 355, y: 735, label: "ARTE", activityId: "arte" },
      { x: 560, y: 735, label: "ARCILLA", activityId: "arcilla" },
      { x: 355, y: 935, label: "EVENTOS", activityId: "eventos" },
      { x: 560, y: 935, label: "CLUB DEL PUZZLE", activityId: "club-del-puzzle" },
      { x: 355, y: 1145, label: "MEMBRESIA", activityId: "membresia" },
      { x: 560, y: 1145 },
    ];
    const tablePadding = 30;
    for (const table of tables) {
      this.addObstacle(table.x, table.y, TABLE_SIZE, TABLE_SIZE, { visible: false });
      if (table.label) {
        this.add
          .text(table.x, table.y, table.label, {
            fontSize: "20px",
            color: "#ffffff",
            fontStyle: "bold",
            align: "center",
            wordWrap: { width: TABLE_SIZE - 20 },
          })
          .setOrigin(0.5);
      }
      if (table.activityId) {
        const activityId = table.activityId;
        this.addTapHotspot(
          table.x,
          table.y,
          TABLE_SIZE,
          TABLE_SIZE,
          () => this.nearActivityId === activityId,
          () => eventBus.emit("activity-open", activityId)
        );
        this.activityZones.push({
          id: activityId,
          zone: new Phaser.Geom.Rectangle(
            table.x - TABLE_SIZE / 2 - tablePadding,
            table.y - TABLE_SIZE / 2 - tablePadding,
            TABLE_SIZE + tablePadding * 2,
            TABLE_SIZE + tablePadding * 2
          ),
        });
      }
    }
    this.addTapHotspot(
      RENTAL_TABLE.x,
      RENTAL_TABLE.y,
      RENTAL_TABLE.width,
      RENTAL_TABLE.height,
      () => this.nearRental,
      () => eventBus.emit("rental-open", true)
    );

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
      eventBus.emit("activity-proximity", null);
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

  private updateActivityProximity() {
    const bounds = this.player.getBounds();
    const match = this.activityZones.find(({ zone }) =>
      Phaser.Geom.Rectangle.Overlaps(bounds, zone)
    );
    const matchedId = match?.id ?? null;

    if (matchedId !== this.nearActivityId) {
      this.nearActivityId = matchedId;
      eventBus.emit(
        "activity-proximity",
        matchedId ? findActivity(matchedId)?.title ?? null : null
      );
    }
  }

  protected onSceneUpdate() {
    this.updateTvProximity();
    this.updateRentalProximity();
    this.updateActivityProximity();

    if (this.nearTv && this.isEKeyJustDown()) {
      eventBus.emit("tv-menu-open", true);
    }

    if (this.nearRental && this.isEKeyJustDown()) {
      eventBus.emit("rental-open", true);
    }

    if (this.nearActivityId && this.isEKeyJustDown()) {
      eventBus.emit("activity-open", this.nearActivityId);
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
