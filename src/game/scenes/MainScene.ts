import Phaser from "phaser";
import { eventBus } from "@/game/eventBus";
import { shelves, type ShelfData } from "@/data/shelves";

const PLAYER_SPEED = 200;
const SHELF_INTERACTION_PADDING = 40;

type Direction = "down" | "left" | "right" | "up";

const IDLE_FRAME: Record<Direction, number> = {
  down: 1,
  left: 4,
  right: 7,
  up: 10,
};

interface ShelfZone {
  id: string;
  rect: Phaser.Geom.Rectangle;
}

export class MainScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;
  private shelfZones: ShelfZone[] = [];
  private nearbyShelfId: string | null = null;
  private eKey!: Phaser.Input.Keyboard.Key;
  private facing: Direction = "down";
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };

  constructor() {
    super("MainScene");
  }

  preload() {
    this.load.spritesheet(
      "player-walk",
      "/assets/characters/player-walk-sheet.png",
      { frameWidth: 84, frameHeight: 108 }
    );
  }

  create() {
    this.cameras.main.setBackgroundColor("#2d2d44");

    this.add
      .text(400, 24, "Ludoarte RPG Store", {
        fontSize: "20px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.player = this.physics.add.sprite(400, 300, "player-walk", 1);
    this.player.setCollideWorldBounds(true);
    this.player.body?.setSize(40, 50).setOffset(22, 54);
    this.createPlayerAnimations();

    this.obstacles = this.physics.add.staticGroup();
    this.addObstacle(250, 150, 300, 30); // pared interna horizontal
    this.addObstacle(150, 400, 30, 200); // pared interna vertical

    this.addShelf(shelves[0], 680, 110, 140, 70);
    this.addShelf(shelves[1], 680, 480, 140, 140);
    this.addShelf(shelves[2], 270, 520, 180, 70);

    this.physics.add.collider(this.player, this.obstacles);

    const keyboard = this.input.keyboard!;
    this.cursors = keyboard.createCursorKeys();
    this.wasd = {
      up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.eKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }

  private createPlayerAnimations() {
    const directions: { key: Direction; start: number; end: number }[] = [
      { key: "down", start: 0, end: 2 },
      { key: "left", start: 3, end: 5 },
      { key: "right", start: 6, end: 8 },
      { key: "up", start: 9, end: 11 },
    ];

    for (const dir of directions) {
      this.anims.create({
        key: `walk-${dir.key}`,
        frames: this.anims.generateFrameNumbers("player-walk", {
          start: dir.start,
          end: dir.end,
        }),
        frameRate: 8,
        repeat: -1,
      });
    }
  }

  private addObstacle(x: number, y: number, width: number, height: number) {
    const key = `obstacle-${width}x${height}`;

    if (!this.textures.exists(key)) {
      const graphics = this.add.graphics();
      graphics.fillStyle(0x555577, 1);
      graphics.fillRect(0, 0, width, height);
      graphics.generateTexture(key, width, height);
      graphics.destroy();
    }

    const obstacle = this.obstacles.create(
      x,
      y,
      key
    ) as Phaser.Physics.Arcade.Sprite;
    obstacle.refreshBody();
  }

  private addShelf(
    shelf: ShelfData,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    const key = `shelf-${width}x${height}`;

    if (!this.textures.exists(key)) {
      const graphics = this.add.graphics();
      graphics.fillStyle(0x8b5a2b, 1);
      graphics.fillRect(0, 0, width, height);
      graphics.generateTexture(key, width, height);
      graphics.destroy();
    }

    const shelfSprite = this.obstacles.create(
      x,
      y,
      key
    ) as Phaser.Physics.Arcade.Sprite;
    shelfSprite.refreshBody();

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

  private updatePlayerAnimation(velocityX: number, velocityY: number) {
    let direction: Direction | null = null;

    if (velocityX < 0) direction = "left";
    else if (velocityX > 0) direction = "right";
    else if (velocityY < 0) direction = "up";
    else if (velocityY > 0) direction = "down";

    if (direction) {
      this.facing = direction;
      this.player.anims.play(`walk-${direction}`, true);
    } else {
      this.player.anims.stop();
      this.player.setFrame(IDLE_FRAME[this.facing]);
    }
  }

  update() {
    let velocityX = 0;
    let velocityY = 0;

    if (this.cursors.left.isDown || this.wasd.left.isDown) {
      velocityX = -PLAYER_SPEED;
    } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
      velocityX = PLAYER_SPEED;
    }

    if (this.cursors.up.isDown || this.wasd.up.isDown) {
      velocityY = -PLAYER_SPEED;
    } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
      velocityY = PLAYER_SPEED;
    }

    if (velocityX !== 0 && velocityY !== 0) {
      velocityX *= Math.SQRT1_2;
      velocityY *= Math.SQRT1_2;
    }

    this.player.setVelocity(velocityX, velocityY);
    this.updatePlayerAnimation(velocityX, velocityY);

    this.updateShelfProximity();

    if (this.nearbyShelfId && Phaser.Input.Keyboard.JustDown(this.eKey)) {
      eventBus.emit("shelf-open", this.nearbyShelfId);
    }
  }
}
