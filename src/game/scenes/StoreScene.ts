import Phaser from "phaser";
import { eventBus } from "@/game/eventBus";
import { shelves, type ShelfData } from "@/data/shelves";
import { BasePlayerScene } from "./BasePlayerScene";

const SHELF_INTERACTION_PADDING = 40;

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

  create() {
    this.cameras.main.setBackgroundColor("#2d2d44");

    this.add
      .text(400, 24, "Ludoarte - Tienda", {
        fontSize: "20px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.createPlayer(400, 550);

    this.addObstacle(250, 150, 300, 30); // pared interna horizontal
    this.addObstacle(150, 400, 30, 200); // pared interna vertical

    this.addShelf(shelves[0], 680, 110, 140, 70);
    this.addShelf(shelves[1], 680, 480, 140, 140);
    this.addShelf(shelves[2], 270, 520, 180, 70);

    this.stairsDownZone = this.addZoneMarker(500, 110, 160, 100, 0xb0b0b0);
    this.add
      .text(500, 110, "Escalera a\nplanta baja", {
        fontSize: "14px",
        color: "#1a1a1a",
        align: "center",
      })
      .setOrigin(0.5);

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
    this.addObstacle(x, y, width, height, 0x8b5a2b);

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

    if (
      Phaser.Geom.Rectangle.Overlaps(this.player.getBounds(), this.stairsDownZone)
    ) {
      this.scene.start("GroundFloorScene");
    }
  }
}
