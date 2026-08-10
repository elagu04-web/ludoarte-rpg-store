import Phaser from "phaser";
import { eventBus } from "@/game/eventBus";
import { findActivity } from "@/data/activities";
import { BasePlayerScene } from "./BasePlayerScene";

export class GroundFloorScene extends BasePlayerScene {
  private stairsZone!: Phaser.Geom.Rectangle;
  private exitZone!: Phaser.Geom.Rectangle;
  private leftDoorZone!: Phaser.Geom.Rectangle;
  private bathroomZone!: Phaser.Geom.Rectangle;
  private tvZone!: Phaser.Geom.Rectangle;
  private nearTv = false;
  private rentalZone!: Phaser.Geom.Rectangle;
  private nearRental = false;
  private deliveryRentalZone!: Phaser.Geom.Rectangle;
  private nearDeliveryRental = false;
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
      case "BathroomScene":
        return { x: 230, y: 985 }; // just right of the bathroom door
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

    // Barra/estanteria decorativa de la derecha (colisionable). Se
    // extiende hasta encontrarse con la pared de abajo (wallB2) -- antes
    // terminaba en y=1310 y la pared empezaba en y=1480, dejando una
    // franja de pared sin colision de 170px donde se podia caminar
    // "sobre lo negro" del fondo.
    this.addObstacle(813, 840, 166, 1280, { visible: false });

    // La de la izquierda es igual, pero partida en dos: en el medio (ya
    // dibujada en el fondo) esta la puerta que lleva al baño.
    this.addObstacle(102, 560, 165, 720, { visible: false }); // arriba de la puerta
    this.addObstacle(102, 1265, 165, 430, { visible: false }); // abajo de la puerta
    this.bathroomZone = new Phaser.Geom.Rectangle(20, 920, 170, 130);

    // Mesas centrales (2 columnas x 4 filas) -- el cartel de cada una ya
    // esta dibujado en el fondo (bg-planta-baja), aca solo hace falta la
    // colision y, menos para Alquiler (que ya tiene su propio menu de
    // siempre), el panel de info generico (ActivityInfoScreen) con
    // horarios/precio y un boton de WhatsApp -- ver data/activities.ts
    // por el contenido de cada una.
    // Un poco mas chica que el dibujo de la mesa (que incluye las patas,
    // mas anchas que el tablero) para dejar un pasillo comodo entre
    // columnas -- con el tamaño real completo el hueco quedaba demasiado
    // justo para cruzar en diagonal.
    const TABLE_SIZE = 125;
    // Las mesas estan a 200px (filas) / 205px (columnas) de centro a
    // centro, asi que el hueco libre entre bordes es de 75-80px. El
    // personaje mide 40x50 (ver createPlayer) -- este padding tiene que
    // ser chico para que el halo de una mesa nunca llegue a tocar el de
    // la vecina ni siquiera con el cuerpo del personaje metido en el
    // medio, o parado ahi dispara la mesa equivocada (le paso con
    // Ajedrez/Alquiler: el halo de Alquiler llegaba hasta Ajedrez).
    const TABLE_PROXIMITY_PADDING = 6;
    const RENTAL_TABLE = { x: 560, y: 535, width: TABLE_SIZE, height: TABLE_SIZE };
    const DELIVERY_RENTAL_TABLE = { x: 560, y: 1145, width: TABLE_SIZE, height: TABLE_SIZE };
    const tables: { x: number; y: number; activityId?: string }[] = [
      { x: 355, y: 535, activityId: "ajedrez" }, // AJEDREZ
      { x: 560, y: 535 }, // ALQUILER (en el local)
      { x: 355, y: 735, activityId: "arte" }, // ARTE
      { x: 560, y: 735, activityId: "arcilla" }, // ARCILLA
      { x: 355, y: 935, activityId: "eventos" }, // EVENTOS
      { x: 560, y: 935, activityId: "club-del-puzzle" }, // CLUB DEL PUZZLE
      { x: 355, y: 1145, activityId: "membresia" }, // MEMBRESIA
      { x: 560, y: 1145 }, // ALQUILER A DOMICILIO (mesa antes vacia)
    ];
    for (const table of tables) {
      this.addObstacle(table.x, table.y, TABLE_SIZE, TABLE_SIZE, { visible: false });
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
            table.x - TABLE_SIZE / 2 - TABLE_PROXIMITY_PADDING,
            table.y - TABLE_SIZE / 2 - TABLE_PROXIMITY_PADDING,
            TABLE_SIZE + TABLE_PROXIMITY_PADDING * 2,
            TABLE_SIZE + TABLE_PROXIMITY_PADDING * 2
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

    this.rentalZone = new Phaser.Geom.Rectangle(
      RENTAL_TABLE.x - RENTAL_TABLE.width / 2 - TABLE_PROXIMITY_PADDING,
      RENTAL_TABLE.y - RENTAL_TABLE.height / 2 - TABLE_PROXIMITY_PADDING,
      RENTAL_TABLE.width + TABLE_PROXIMITY_PADDING * 2,
      RENTAL_TABLE.height + TABLE_PROXIMITY_PADDING * 2
    );

    this.addTapHotspot(
      DELIVERY_RENTAL_TABLE.x,
      DELIVERY_RENTAL_TABLE.y,
      DELIVERY_RENTAL_TABLE.width,
      DELIVERY_RENTAL_TABLE.height,
      () => this.nearDeliveryRental,
      () => eventBus.emit("rental-delivery-open", true)
    );

    this.deliveryRentalZone = new Phaser.Geom.Rectangle(
      DELIVERY_RENTAL_TABLE.x - DELIVERY_RENTAL_TABLE.width / 2 - TABLE_PROXIMITY_PADDING,
      DELIVERY_RENTAL_TABLE.y - DELIVERY_RENTAL_TABLE.height / 2 - TABLE_PROXIMITY_PADDING,
      DELIVERY_RENTAL_TABLE.width + TABLE_PROXIMITY_PADDING * 2,
      DELIVERY_RENTAL_TABLE.height + TABLE_PROXIMITY_PADDING * 2
    );

    // Pared inferior, con hueco para la puerta de salida
    this.addObstacle(170, 1550, 340, 140, { visible: false });
    this.addObstacle(743, 1550, 346, 140, { visible: false });

    this.stairsZone = new Phaser.Geom.Rectangle(520, 60, 130, 135);
    this.exitZone = new Phaser.Geom.Rectangle(340, 1520, 230, 130);

    this.events.on("shutdown", () => {
      eventBus.emit("tv-proximity", false);
      eventBus.emit("rental-proximity", false);
      eventBus.emit("rental-delivery-proximity", false);
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

  private updateDeliveryRentalProximity() {
    const inZone = Phaser.Geom.Rectangle.Overlaps(
      this.player.getBounds(),
      this.deliveryRentalZone
    );

    if (inZone !== this.nearDeliveryRental) {
      this.nearDeliveryRental = inZone;
      eventBus.emit("rental-delivery-proximity", inZone);
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
    this.updateDeliveryRentalProximity();
    this.updateActivityProximity();

    if (this.nearTv && this.isEKeyJustDown()) {
      eventBus.emit("tv-menu-open", true);
    }

    if (this.nearRental && this.isEKeyJustDown()) {
      eventBus.emit("rental-open", true);
    }

    if (this.nearDeliveryRental && this.isEKeyJustDown()) {
      eventBus.emit("rental-delivery-open", true);
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

    if (this.isPlayerInZone(this.bathroomZone)) {
      this.transitionTo("BathroomScene");
    }
  }
}
