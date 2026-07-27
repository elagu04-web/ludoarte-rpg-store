import Phaser from "phaser";

export const PLAYER_SPEED = 200;

export type Direction = "down" | "left" | "right" | "up";

export const IDLE_FRAME: Record<Direction, number> = {
  down: 1,
  left: 4,
  right: 7,
  up: 10,
};

/**
 * Base scene shared by every walkable screen (exterior, ground floor, store).
 * Handles loading the player sprite, movement, animation and collisions so
 * each screen only needs to add its own obstacles/zones.
 */
export abstract class BasePlayerScene extends Phaser.Scene {
  protected player!: Phaser.Physics.Arcade.Sprite;
  protected obstacles!: Phaser.Physics.Arcade.StaticGroup;
  protected facing: Direction = "down";

  private eKey!: Phaser.Input.Keyboard.Key;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };

  preload() {
    this.load.spritesheet(
      "player-walk",
      "/assets/characters/player-walk-sheet.png",
      { frameWidth: 84, frameHeight: 108 }
    );
  }

  protected createPlayer(x: number, y: number) {
    this.player = this.physics.add.sprite(x, y, "player-walk", 1);
    this.player.setCollideWorldBounds(true);
    this.player.body?.setSize(40, 50).setOffset(22, 54);
    this.createPlayerAnimations();

    this.obstacles = this.physics.add.staticGroup();
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
    if (this.anims.exists("walk-down")) return; // animations are global, create once

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

  protected addObstacle(
    x: number,
    y: number,
    width: number,
    height: number,
    color: number = 0x555577
  ) {
    const key = `obstacle-${width}x${height}-${color}`;

    if (!this.textures.exists(key)) {
      const graphics = this.add.graphics();
      graphics.fillStyle(color, 1);
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
    return obstacle;
  }

  /** A walkable (non-colliding) marker zone, e.g. a door or staircase. */
  protected addZoneMarker(
    x: number,
    y: number,
    width: number,
    height: number,
    color: number
  ): Phaser.Geom.Rectangle {
    this.add.rectangle(x, y, width, height, color);
    return new Phaser.Geom.Rectangle(
      x - width / 2,
      y - height / 2,
      width,
      height
    );
  }

  protected isEKeyJustDown(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.eKey);
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

    this.onSceneUpdate();
  }

  /** Override in subclasses for scene-specific checks (doors, shelves, etc.). */
  protected onSceneUpdate(): void {}
}
