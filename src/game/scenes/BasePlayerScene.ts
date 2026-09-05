import Phaser from "phaser";
import { eventBus } from "@/game/eventBus";
import { gameState } from "@/game/gameState";
import { SCENE_DIMENSIONS } from "@/game/sceneDimensions";
import { PLAYER_CHARACTERS, textureKeyFor } from "@/game/characters";

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

// Below this stick displacement (0..1 of the joystick's radius), treat it
// as centered -- a resting thumb never sits at *exactly* 0,0, and without
// a deadzone that tiny drift kept the player twitching/facing a random
// direction while stationary.
const TOUCH_AXIS_DEADZONE = 0.15;

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
  /** Continuous -1..1 per axis from the mobile joystick -- not the old
   * 4-button D-pad, so movement/aim on touch can land at any angle, same
   * as dragging a real analog stick. */
  private touchAxis = { x: 0, y: 0 };
  private touchInteractRequested = false;
  private inputPaused = false;
  private isDefeated = false;
  private isLeavingScene = false;
  /** Key of the scene we just came from, so a room with more than one door
   * can spawn the player next to the door actually used instead of always
   * the same fixed point. Set by transitionTo() on the way out; read back
   * via Phaser's init(data) on the way in. */
  protected fromScene: string | null = null;

  init(data: { from?: string } = {}) {
    this.fromScene = data.from ?? null;
    // Phaser reuses the same Scene instance every time a scene is
    // (re)started -- it does not construct a fresh object, so field
    // initializers like `= false` only ever run once, at game boot. Without
    // resetting this here, the first time you ever left a room would leave
    // isLeavingScene stuck at true forever, silently no-op'ing every door
    // in that room on every later visit (transitionTo() would just return
    // immediately, with no error and no visible cause).
    this.isLeavingScene = false;
  }

  preload() {
    // All playable sprite sheets are loaded up front (they're small) so
    // switching character in the menu doesn't need a scene reload.
    for (const character of PLAYER_CHARACTERS) {
      this.load.spritesheet(textureKeyFor(character.key), character.file, {
        frameWidth: 84,
        frameHeight: 108,
      });
    }
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

    this.player = this.physics.add.sprite(
      x,
      y,
      textureKeyFor(gameState.playerCharacter),
      1
    );
    this.player.setCollideWorldBounds(true);
    this.player.body?.setSize(40, 50).setOffset(22, 54);
    this.applyPlayerTint();
    this.createPlayerAnimations();

    // Camera smoothing tightened from 0.1 -- fine with the old D-pad's
    // discrete taps, but the joystick's continuous direction changes made
    // that lag between "the player already turned" and "the camera
    // catches up" read as the whole game dragging/sliding.
    this.cameras.main.startFollow(this.player, true, 0.3, 0.3);

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

    this.touchAxis = { x: 0, y: 0 };
    this.touchInteractRequested = false;

    const handleTouchAxis = (payload: { x: number; y: number }) => {
      this.touchAxis = payload;
    };
    const handleTouchInteract = () => {
      this.touchInteractRequested = true;
    };

    eventBus.on("touch-axis", handleTouchAxis);
    eventBus.on("touch-interact", handleTouchInteract);

    this.inputPaused = false;
    const handleMenuOpen = (open: boolean) => {
      this.inputPaused = open;
      // A touch that lands on the (still-tappable) joystick/interact zone
      // while a menu is open queues up as a pending move/interact --
      // since onSceneUpdate() is skipped while paused, it never gets
      // consumed, and used to fire the instant the menu closed (e.g.
      // silently reopening the shelf you just closed). Dropping any
      // in-flight touch state on every open/close transition kills that.
      this.touchAxis = { x: 0, y: 0 };
      this.touchInteractRequested = false;
      if (open) {
        keyboard.removeCapture(CAPTURED_KEY_CODES);
      } else {
        keyboard.addCapture(CAPTURED_KEY_CODES);
      }
    };
    eventBus.on("menu-open", handleMenuOpen);

    this.events.on("shutdown", () => {
      eventBus.off("touch-axis", handleTouchAxis);
      eventBus.off("touch-interact", handleTouchInteract);
      eventBus.off("menu-open", handleMenuOpen);
    });
  }

  /** Only the currently-selected character's sprite needs a tint -- the
   * others are finished artwork that would look wrong multiplied by a
   * color, see PLAYER_CHARACTERS.tintable. */
  private applyPlayerTint() {
    const character = PLAYER_CHARACTERS.find(
      (c) => c.key === gameState.playerCharacter
    );
    this.player.setTint(character?.tintable ? gameState.playerTint : 0xffffff);
  }

  private createPlayerAnimations() {
    const directions: { key: Direction; start: number; end: number }[] = [
      { key: "down", start: 0, end: 2 },
      { key: "left", start: 3, end: 5 },
      { key: "right", start: 6, end: 8 },
      { key: "up", start: 9, end: 11 },
    ];

    // Animations are global (shared across scene restarts) -- one set per
    // character sprite sheet, keyed by direction + character so switching
    // character doesn't try to play frames from the wrong texture.
    for (const character of PLAYER_CHARACTERS) {
      const textureKey = textureKeyFor(character.key);
      for (const dir of directions) {
        const animKey = `walk-${dir.key}-${character.key}`;
        if (this.anims.exists(animKey)) continue;
        this.anims.create({
          key: animKey,
          frames: this.anims.generateFrameNumbers(textureKey, {
            start: dir.start,
            end: dir.end,
          }),
          frameRate: 8,
          repeat: -1,
        });
      }
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

  /**
   * Lets touch/mouse users tap a point of interest directly instead of
   * having to walk the character onto it first -- but only fires if
   * isNear() is already true at tap time, same as pressing E; tapping a
   * shelf/counter/etc. from across the room does nothing, exactly like
   * walking up to it does nothing until you're actually in the zone.
   */
  protected addTapHotspot(
    x: number,
    y: number,
    width: number,
    height: number,
    isNear: () => boolean,
    onTap: () => void
  ) {
    this.add
      .zone(x, y, width, height)
      .setInteractive()
      .on("pointerdown", () => {
        if (isNear()) onTap();
      });
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
   * Currently-held movement axis. Keyboard is always -1/0/1 per axis (the
   * 4-direction walk animation doesn't care about anything finer); the
   * mobile joystick instead reports a continuous -1..1 vector at whatever
   * angle the thumb is actually at, so touch aiming/movement isn't locked
   * to 8 directions like the old D-pad was.
   */
  protected getInputAxis(): { x: number; y: number } {
    if (this.isTouchAxisActive()) {
      return this.touchAxis;
    }

    let x = 0;
    let y = 0;

    if (this.cursors.left.isDown || this.wasd.left.isDown) {
      x = -1;
    } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
      x = 1;
    }

    if (this.cursors.up.isDown || this.wasd.up.isDown) {
      y = -1;
    } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
      y = 1;
    }

    return { x, y };
  }

  private isTouchAxisActive(): boolean {
    return (
      Math.abs(this.touchAxis.x) > TOUCH_AXIS_DEADZONE ||
      Math.abs(this.touchAxis.y) > TOUCH_AXIS_DEADZONE
    );
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
    this.applyPlayerTint();
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

  /**
   * Starts another scene, guarded against firing more than once. Standing
   * still exactly inside a door/stairs zone means isPlayerInZone() stays
   * true across many consecutive frames -- without this guard, each of
   * those frames called scene.start() again before the first transition
   * had actually finished, which left the new scene's physics bodies
   * corrupted (especially with several sprites/colliders set up at once,
   * like the multi-monster encounters).
   */
  protected transitionTo(sceneKey: string) {
    if (this.isLeavingScene) return;
    this.isLeavingScene = true;
    this.scene.start(sceneKey, { from: this.scene.key });
  }

  /** True from the first transitionTo() call onward -- use to guard any
   * one-time side effect (like a penalty applied on leaving) that should
   * only ever run once per scene instance. */
  protected get isTransitioning(): boolean {
    return this.isLeavingScene;
  }

  private updatePlayerAnimation(velocityX: number, velocityY: number) {
    let direction: Direction | null = null;

    if (velocityX < 0) direction = "left";
    else if (velocityX > 0) direction = "right";
    else if (velocityY < 0) direction = "up";
    else if (velocityY > 0) direction = "down";

    if (direction) {
      this.facing = direction;
      this.player.anims.play(
        `walk-${direction}-${gameState.playerCharacter}`,
        true
      );
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

    if (this.isTouchAxisActive()) {
      // Full 360-degree movement: walk in exactly the angle the thumb is
      // at, always at full speed (this game has no analog "walk slower"
      // concept -- only the direction is continuous, not the speed).
      const length = Math.sqrt(
        this.touchAxis.x * this.touchAxis.x + this.touchAxis.y * this.touchAxis.y
      );
      velocityX = (this.touchAxis.x / length) * PLAYER_SPEED;
      velocityY = (this.touchAxis.y / length) * PLAYER_SPEED;
    } else {
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
    }

    this.player.setVelocity(velocityX, velocityY);
    this.updatePlayerAnimation(velocityX, velocityY);

    this.onSceneUpdate();
  }

  /** Override in subclasses for scene-specific checks (doors, shelves, etc.). */
  protected onSceneUpdate(): void {}
}
