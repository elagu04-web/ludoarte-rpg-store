import Phaser from "phaser";
import { eventBus } from "@/game/eventBus";
import { SCENE_DIMENSIONS } from "@/game/sceneDimensions";

export const PLAYER_SPEED = 320;

// Phaser captures (preventDefault) these keys globally by default so they
// don't scroll the page -- but that also blocks typing them into an HTML
// text input (e.g. the search screen), even while it has focus. Released
// while a menu is open and restored when it closes.
const CAPTURED_KEY_CODES = [
  Phaser.Input.Keyboard.KeyCodes.W,
  Phaser.Input.Keyboard.KeyCodes.A,
  Phaser.Input.Keyboard.KeyCodes.S,
  Phaser.Input.Keyboard.KeyCodes.D,
  Phaser.Input.Keyboard.KeyCodes.E,
  Phaser.Input.Keyboard.KeyCodes.SPACE,
  Phaser.Input.Keyboard.KeyCodes.UP,
  Phaser.Input.Keyboard.KeyCodes.DOWN,
  Phaser.Input.Keyboard.KeyCodes.LEFT,
  Phaser.Input.Keyboard.KeyCodes.RIGHT,
];

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
  private touchDirection = { up: false, down: false, left: false, right: false };
  private touchInteractRequested = false;
  private inputPaused = false;
  private isDefeated = false;

  preload() {
    this.load.spritesheet(
      "player-walk",
      "/assets/characters/player-walk-sheet.png",
      { frameWidth: 84, frameHeight: 108 }
    );
  }

  protected createPlayer(x: number, y: number) {
    // Each room has its own native size (the exterior is landscape, the
    // interiors are portrait and taller than the viewport) -- the camera
    // zooms in and follows the player instead of shrinking the whole room
    // to fit on screen.
    const dims = SCENE_DIMENSIONS[this.scene.key];
    this.physics.world.setBounds(0, 0, dims.width, dims.height);
    this.cameras.main.setBounds(0, 0, dims.width, dims.height);
    this.cameras.main.setZoom(dims.zoom);

    this.player = this.physics.add.sprite(x, y, "player-walk", 1);
    this.player.setCollideWorldBounds(true);
    this.player.body?.setSize(40, 50).setOffset(22, 54);
    this.createPlayerAnimations();

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

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

    this.touchDirection = { up: false, down: false, left: false, right: false };
    this.touchInteractRequested = false;

    const handleTouchDirection = (payload: {
      direction: Direction;
      pressed: boolean;
    }) => {
      this.touchDirection[payload.direction] = payload.pressed;
    };
    const handleTouchInteract = () => {
      this.touchInteractRequested = true;
    };

    eventBus.on("touch-direction", handleTouchDirection);
    eventBus.on("touch-interact", handleTouchInteract);

    this.inputPaused = false;
    const handleMenuOpen = (open: boolean) => {
      this.inputPaused = open;
      if (open) {
        keyboard.removeCapture(CAPTURED_KEY_CODES);
      } else {
        keyboard.addCapture(CAPTURED_KEY_CODES);
      }
    };
    eventBus.on("menu-open", handleMenuOpen);

    this.events.on("shutdown", () => {
      eventBus.off("touch-direction", handleTouchDirection);
      eventBus.off("touch-interact", handleTouchInteract);
      eventBus.off("menu-open", handleMenuOpen);
    });
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

  protected addBackground(key: string) {
    this.add.image(0, 0, key).setOrigin(0, 0);
  }

  protected addObstacle(
    x: number,
    y: number,
    width: number,
    height: number,
    options: { color?: number; visible?: boolean } = {}
  ) {
    const { color = 0x555577, visible = true } = options;
    const key = `obstacle-${width}x${height}-${color}-${visible ? "v" : "i"}`;

    if (!this.textures.exists(key)) {
      const graphics = this.add.graphics();
      graphics.fillStyle(color, visible ? 1 : 0);
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
    options: { color?: number; visible?: boolean } = {}
  ): Phaser.Geom.Rectangle {
    const { color = 0xffffff, visible = true } = options;
    if (visible) {
      this.add.rectangle(x, y, width, height, color);
    }
    return new Phaser.Geom.Rectangle(
      x - width / 2,
      y - height / 2,
      width,
      height
    );
  }

  /**
   * Currently-held movement axis, -1/0/1 per axis, regardless of the
   * 4-direction walk animation. Useful for 8-way aiming (e.g. fireballs).
   */
  protected getInputAxis(): { x: number; y: number } {
    let x = 0;
    let y = 0;

    if (this.cursors.left.isDown || this.wasd.left.isDown || this.touchDirection.left) {
      x = -1;
    } else if (this.cursors.right.isDown || this.wasd.right.isDown || this.touchDirection.right) {
      x = 1;
    }

    if (this.cursors.up.isDown || this.wasd.up.isDown || this.touchDirection.up) {
      y = -1;
    } else if (this.cursors.down.isDown || this.wasd.down.isDown || this.touchDirection.down) {
      y = 1;
    }

    return { x, y };
  }

  /**
   * Knocks the player out after losing a fight -- lying on the ground,
   * unable to move. Deliberately permanent for now (no respawn/recovery
   * yet); reload the page to reset.
   */
  protected setDefeated() {
    this.isDefeated = true;
    this.player.setVelocity(0, 0);
    this.player.anims.stop();
    this.player.setAngle(90);
    this.player.setTint(0x888888);
  }

  /** Undoes setDefeated() -- used by the secret test-combat shortcut. */
  protected revive() {
    this.isDefeated = false;
    this.player.setAngle(0);
    this.player.clearTint();
  }

  protected isEKeyJustDown(): boolean {
    if (Phaser.Input.Keyboard.JustDown(this.eKey)) return true;

    if (this.touchInteractRequested) {
      this.touchInteractRequested = false;
      return true;
    }

    return false;
  }

  /**
   * Whether the player's feet (center point) are standing inside a zone.
   * Deliberately stricter than a full sprite-bounds overlap so walking past
   * or near a door/staircase doesn't trigger it by accident.
   */
  protected isPlayerInZone(zone: Phaser.Geom.Rectangle): boolean {
    return zone.contains(this.player.x, this.player.y);
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
    if (this.isDefeated) {
      this.player.setVelocity(0, 0);
      return;
    }

    if (this.inputPaused) {
      this.player.setVelocity(0, 0);
      this.updatePlayerAnimation(0, 0);
      return;
    }

    let velocityX = 0;
    let velocityY = 0;

    if (this.cursors.left.isDown || this.wasd.left.isDown || this.touchDirection.left) {
      velocityX = -PLAYER_SPEED;
    } else if (this.cursors.right.isDown || this.wasd.right.isDown || this.touchDirection.right) {
      velocityX = PLAYER_SPEED;
    }

    if (this.cursors.up.isDown || this.wasd.up.isDown || this.touchDirection.up) {
      velocityY = -PLAYER_SPEED;
    } else if (this.cursors.down.isDown || this.wasd.down.isDown || this.touchDirection.down) {
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
