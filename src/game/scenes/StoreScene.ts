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
  private stairsDownZone!: Phaser.Geom.Rectangle;
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
    this.addBackground("bg-tienda");

    this.createPlayer(760, 890);

    // Estanterias interactivas (sobre los muebles del dibujo)
    this.addShelf(shelves[0], 547, 200, 275, 175);
    this.addShelf(shelves[1], 975, 200, 270, 175);
    this.addShelf(shelves[2], 205, 590, 230, 620);

    // Muebles decorativos (colisionables, no interactivos)
    this.addObstacle(1350, 525, 200, 610, { visible: false }); // torre de ajedrez
    this.addObstacle(775, 420, 260, 150, { visible: false }); // mesa de ajedrez central
    this.addObstacle(765, 665, 350, 220, { visible: false }); // mesa de juegos

    // Mostrador/caja -- interactuable para pagar por WhatsApp
    this.addObstacle(1210, 275, 165, 165, { visible: false });
    this.counterZone = this.addPaddedZone(1210, 275, 165, 165, 30);

    // Puesto de pedidos -- para consultar juegos que se pueden conseguir
    this.addOrderKiosk(1180, 550, 90, 110);

    this.stairsDownZone = this.addZoneMarker(763, 220, 80, 70, {
      visible: false,
    });

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

  /**
   * Free-standing kiosk where the player can look up games that can be
   * ordered (out of stock right now) -- opens the same search screen used
   * by the exterior info screen.
   */
  private addOrderKiosk(x: number, y: number, width: number, height: number) {
    this.addObstacle(x, y, width, height, { visible: false });

    this.add.rectangle(x, y, width, height, 0x1a1a2e).setStrokeStyle(4, 0x8b5a2b);
    this.add.rectangle(x, y, width - 20, height - 26, 0xc98b2e, 0.9);
    this.add
      .text(x, y, "?", {
        fontSize: "32px",
        color: "#3a2a10",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.orderZone = this.addPaddedZone(x, y, width, height, 30);
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

    if (this.isPlayerInZone(this.stairsDownZone)) {
      this.scene.start("GroundFloorScene");
    }
  }
}
