import Phaser from "phaser";
import { eventBus } from "@/game/eventBus";
import { gameState } from "@/game/gameState";
import { shelves, type ShelfData } from "@/data/shelves";
import { BasePlayerScene } from "./BasePlayerScene";

const SHELF_INTERACTION_PADDING = 30;

interface ShelfZone {
  id: string;
  rect: Phaser.Geom.Rectangle;
}

export class StoreScene extends BasePlayerScene {
  private shelfZones: ShelfZone[] = [];
  private nearbyShelfId: string | null = null;
  private topDoorZone!: Phaser.Geom.Rectangle;
  private counterZone!: Phaser.Geom.Rectangle;
  private nearCounter = false;
  private orderZone!: Phaser.Geom.Rectangle;
  private nearOrderKiosk = false;

  constructor() {
    super("StoreScene");
  }

  preload() {
    super.preload();
    this.load.image("bg-tienda", "/assets/scene/tienda.png");
  }

  create() {
    this.resizeToScene("StoreScene");
    this.addBackground("bg-tienda");

    this.createPlayer(500, 1450);

    // Pared de fondo, con hueco para la puerta que sube a la planta baja
    this.addObstacle(130, 115, 260, 230, { visible: false });
    this.addObstacle(677, 115, 694, 230, { visible: false });
    this.topDoorZone = new Phaser.Geom.Rectangle(260, 60, 70, 170);

    // Estanterias interactivas (sobre los muebles del dibujo). Las de los
    // costados corren casi toda la altura del salon, asi que la zona de
    // interaccion se recorta antes de llegar al mostrador/mesa de pedidos
    // de mas abajo, para que no se solapen los carteles de "Presiona E".
    this.addObstacle(180, 740, 160, 1020, { visible: false }); // estanteria izquierda
    this.shelfZones.push({
      id: shelves[0].id,
      rect: new Phaser.Geom.Rectangle(70, 200, 180, 750),
    });
    this.addObstacle(865, 740, 130, 1020, { visible: false }); // estanteria derecha
    this.shelfZones.push({
      id: shelves[1].id,
      rect: new Phaser.Geom.Rectangle(810, 200, 150, 750),
    });
    this.addShelf(shelves[2], 325, 640, 190, 300); // mesa de exhibicion

    // Mostrador con laptop -- interactuable para pagar por WhatsApp
    this.addObstacle(700, 1117, 200, 265, { visible: false });
    this.counterZone = this.addPaddedZone(700, 1117, 200, 265, 30);

    // Mesa de ajedrez -- puesto de pedidos (consultar juegos por pedido)
    this.addObstacle(292, 1090, 195, 210, { visible: false });
    this.orderZone = this.addPaddedZone(292, 1090, 195, 210, 30);

    this.events.on("shutdown", () => {
      eventBus.emit("shelf-proximity", null);
      eventBus.emit("counter-proximity", false);
      eventBus.emit("order-proximity", false);
    });
  }

  private addPaddedZone(
    x: number,
    y: number,
    width: number,
    height: number,
    padding: number
  ): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(
      x - width / 2 - padding,
      y - height / 2 - padding,
      width + padding * 2,
      height + padding * 2
    );
  }

  private addShelf(
    shelf: ShelfData,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    this.addObstacle(x, y, width, height, { visible: false });

    this.shelfZones.push({
      id: shelf.id,
      rect: new Phaser.Geom.Rectangle(
        x - width / 2 - SHELF_INTERACTION_PADDING,
        y - height / 2 - SHELF_INTERACTION_PADDING,
        width + SHELF_INTERACTION_PADDING * 2,
        height + SHELF_INTERACTION_PADDING * 2
      ),
    });
  }

  private updateShelfProximity() {
    const playerBounds = this.player.getBounds();

    let nearestShelfId: string | null = null;
    for (const zone of this.shelfZones) {
      if (Phaser.Geom.Rectangle.Overlaps(playerBounds, zone.rect)) {
        nearestShelfId = zone.id;
        break;
      }
    }

    if (nearestShelfId !== this.nearbyShelfId) {
      this.nearbyShelfId = nearestShelfId;
      eventBus.emit("shelf-proximity", nearestShelfId);
    }
  }

  private updateCounterProximity() {
    const inZone = Phaser.Geom.Rectangle.Overlaps(
      this.player.getBounds(),
      this.counterZone
    );

    if (inZone !== this.nearCounter) {
      this.nearCounter = inZone;
      eventBus.emit("counter-proximity", inZone);
    }
  }

  private updateOrderProximity() {
    const inZone = Phaser.Geom.Rectangle.Overlaps(
      this.player.getBounds(),
      this.orderZone
    );

    if (inZone !== this.nearOrderKiosk) {
      this.nearOrderKiosk = inZone;
      eventBus.emit("order-proximity", inZone);
    }
  }

  protected onSceneUpdate() {
    this.updateShelfProximity();
    this.updateCounterProximity();
    this.updateOrderProximity();

    if (this.isEKeyJustDown()) {
      if (this.nearbyShelfId) {
        gameState.hasExploredShelf = true;
        eventBus.emit("shelf-open", this.nearbyShelfId);
      } else if (this.nearCounter) {
        eventBus.emit("cart-open-request", true);
      } else if (this.nearOrderKiosk) {
        eventBus.emit("search-open", true);
      }
    }

    if (this.isPlayerInZone(this.topDoorZone)) {
      this.scene.start("GroundFloorScene");
    }
  }
}
