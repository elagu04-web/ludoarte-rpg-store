import Phaser from "phaser";
import { eventBus } from "@/game/eventBus";
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
    this.addObstacle(1210, 275, 165, 165, { visible: false }); // mostrador/caja
    this.addObstacle(775, 420, 260, 150, { visible: false }); // mesa de ajedrez central
    this.addObstacle(765, 665, 350, 220, { visible: false }); // mesa de juegos

    this.stairsDownZone = this.addZoneMarker(763, 220, 80, 70, {
      visible: false,
    });

    this.events.on("shutdown", () => {
      eventBus.emit("shelf-proximity", null);
    });
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

  protected onSceneUpdate() {
    this.updateShelfProximity();

    if (this.nearbyShelfId && this.isEKeyJustDown()) {
      eventBus.emit("shelf-open", this.nearbyShelfId);
    }

    if (this.isPlayerInZone(this.stairsDownZone)) {
      this.scene.start("GroundFloorScene");
    }
  }
}
