import Phaser from "phaser";
import { eventBus } from "@/game/eventBus";
import { gameState } from "@/game/gameState";
import { playFireballSound } from "@/game/music";
import { BasePlayerScene } from "./BasePlayerScene";

const ENEMY_SPEED = 90;
const ENEMY_HITS_TO_WIN = 3;
const FIREBALL_SPEED = 500;
const LEG_OFFSET_X = 18;
const LEG_OFFSET_Y = 60;

export class ExteriorScene extends BasePlayerScene {
  private doorZone!: Phaser.Geom.Rectangle;
  private screenZone!: Phaser.Geom.Rectangle;
  private nearScreen = false;

  private spaceKey!: Phaser.Input.Keyboard.Key;
  private fireballs!: Phaser.Physics.Arcade.Group;

  private enemy: Phaser.Physics.Arcade.Sprite | null = null;
  private leftLeg: Phaser.GameObjects.Rectangle | null = null;
  private rightLeg: Phaser.GameObjects.Rectangle | null = null;
  private encounterActive = false;
  private enemyHits = 0;

  constructor() {
    super("ExteriorScene");
  }

  preload() {
    super.preload();
    this.load.image("bg-fachada", "/assets/scene/fachada.png");
    this.load.image("catan-enemy", "/assets/boardgames/catan-box.png");
  }

  create() {
    this.addBackground("bg-fachada");

    this.createPlayer(768, 850);

    // Fachada del edificio, con hueco central para la puerta (invisibles,
    // el dibujo de fondo ya muestra las paredes)
    this.addObstacle(335, 390, 670, 280, { visible: false });
    this.addObstacle(1228, 390, 616, 280, { visible: false });

    // Mesa de ajedrez decorativa afuera
    this.addObstacle(265, 635, 230, 170, { visible: false });

    this.doorZone = this.addZoneMarker(795, 350, 120, 100, { visible: false });

    this.addInfoScreen(970, 360, 90, 110);

    this.spaceKey = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
    this.fireballs = this.physics.add.group();

    if (gameState.hasExploredShelf && gameState.cartTotalItems === 0) {
      this.startEnemyEncounter();
    }

    this.events.on("shutdown", () => {
      eventBus.emit("screen-proximity", false);
    });
  }

  /**
   * Decorative info kiosk mounted on the wall to the right of the door --
   * the "pantalla con info" the player can approach and press E on to open
   * the game search screen.
   */
  private addInfoScreen(x: number, y: number, width: number, height: number) {
    this.add.rectangle(x, y, width, height, 0x1a1a2e).setStrokeStyle(4, 0x8b5a2b);
    this.add.rectangle(x, y, width - 20, height - 26, 0x2d8f6f, 0.9);
    this.add
      .text(x, y, "i", {
        fontSize: "32px",
        color: "#eaffea",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const padding = 30;
    this.screenZone = new Phaser.Geom.Rectangle(
      x - width / 2 - padding,
      y - height / 2 - padding,
      width + padding * 2,
      height + padding * 2
    );
  }

  private updateScreenProximity() {
    const inZone = Phaser.Geom.Rectangle.Overlaps(
      this.player.getBounds(),
      this.screenZone
    );

    if (inZone !== this.nearScreen) {
      this.nearScreen = inZone;
      eventBus.emit("screen-proximity", inZone);
    }
  }

  private startEnemyEncounter() {
    this.encounterActive = true;
    this.enemyHits = 0;

    // Physics body lives on a plain Sprite (Container + Arcade physics is
    // unreliable in Phaser 4); the "legs" are separate shapes we reposition
    // by hand each frame to follow the box.
    this.enemy = this.physics.add.sprite(768, 220, "catan-enemy");
    this.enemy.setDisplaySize(100, 120);
    this.enemy.body?.setSize(80, 100);

    this.leftLeg = this.add.rectangle(
      this.enemy.x - LEG_OFFSET_X,
      this.enemy.y + LEG_OFFSET_Y,
      16,
      40,
      0xc9a876
    );
    this.rightLeg = this.add.rectangle(
      this.enemy.x + LEG_OFFSET_X,
      this.enemy.y + LEG_OFFSET_Y,
      16,
      40,
      0xc9a876
    );

    this.physics.add.collider(this.player, this.enemy, () =>
      this.endEncounter("Perdiste el combate!", "#7a1f1f")
    );
    this.physics.add.overlap(
      this.fireballs,
      this.enemy,
      (obj1, obj2) => this.handleFireballHit(obj1, obj2),
      undefined,
      this
    );
  }

  private updateEncounter() {
    if (!this.encounterActive || !this.enemy) return;

    const dx = this.player.x - this.enemy.x;
    const dy = this.player.y - this.enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 1) {
      this.enemy.setVelocity(
        (dx / distance) * ENEMY_SPEED,
        (dy / distance) * ENEMY_SPEED
      );
    }

    const swingDeg = Math.sin(this.time.now / 100) * 25;
    if (this.leftLeg) {
      this.leftLeg.setPosition(
        this.enemy.x - LEG_OFFSET_X,
        this.enemy.y + LEG_OFFSET_Y
      );
      this.leftLeg.rotation = Phaser.Math.DegToRad(swingDeg);
    }
    if (this.rightLeg) {
      this.rightLeg.setPosition(
        this.enemy.x + LEG_OFFSET_X,
        this.enemy.y + LEG_OFFSET_Y
      );
      this.rightLeg.rotation = Phaser.Math.DegToRad(-swingDeg);
    }

    if (
      Phaser.Input.Keyboard.JustDown(this.spaceKey) ||
      this.isEKeyJustDown()
    ) {
      this.fireFireball();
    }
  }

  private fireFireball() {
    const axis = this.getInputAxis();
    let dirX = axis.x;
    let dirY = axis.y;

    if (dirX === 0 && dirY === 0) {
      // Standing still: fire in the direction the player is currently facing.
      switch (this.facing) {
        case "up":
          dirY = -1;
          break;
        case "down":
          dirY = 1;
          break;
        case "left":
          dirX = -1;
          break;
        case "right":
          dirX = 1;
          break;
      }
    }

    // Normalize so diagonals (45 degrees) travel at the same speed as
    // straight shots instead of faster.
    const length = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
    const velocityX = (dirX / length) * FIREBALL_SPEED;
    const velocityY = (dirY / length) * FIREBALL_SPEED;

    const key = this.ensureFireballTexture();
    const fireball = this.physics.add.sprite(
      this.player.x,
      this.player.y,
      key
    );
    this.fireballs.add(fireball);
    fireball.setVelocity(velocityX, velocityY);
    playFireballSound();

    this.time.delayedCall(2000, () => fireball.destroy());
  }

  private ensureFireballTexture(): string {
    const key = "fireball";
    if (!this.textures.exists(key)) {
      const graphics = this.add.graphics();
      graphics.fillStyle(0xff6600, 1);
      graphics.fillCircle(8, 8, 8);
      graphics.generateTexture(key, 16, 16);
      graphics.destroy();
    }
    return key;
  }

  private handleFireballHit(
    obj1: Phaser.GameObjects.GameObject,
    obj2: Phaser.GameObjects.GameObject
  ) {
    // Phaser doesn't guarantee arg order for group-vs-single-object overlaps,
    // so pick whichever of the two callback args isn't the enemy.
    const fireball = (
      obj1 === this.enemy ? obj2 : obj1
    ) as Phaser.Physics.Arcade.Sprite;

    // Disable (don't destroy) here: destroying a body mid-overlap-callback
    // corrupts Arcade Physics' internal state for other bodies checked in
    // the same step. Actually destroy it a moment later instead.
    fireball.disableBody(true, true);
    this.time.delayedCall(0, () => fireball.destroy());

    if (!this.encounterActive || !this.enemy) return;

    this.enemyHits += 1;
    this.tweens.add({
      targets: this.enemy,
      alpha: 0.3,
      duration: 80,
      yoyo: true,
    });

    if (this.enemyHits >= ENEMY_HITS_TO_WIN) {
      this.endEncounter("Ganaste el combate!", "#2d2d44");
    }
  }

  private endEncounter(message: string, backgroundColor: string) {
    if (!this.encounterActive) return;

    this.encounterActive = false;
    const enemy = this.enemy;
    const leftLeg = this.leftLeg;
    const rightLeg = this.rightLeg;
    this.enemy = null;
    this.leftLeg = null;
    this.rightLeg = null;

    if (enemy) {
      enemy.setVelocity(0, 0);
      this.tweens.add({
        targets: [enemy, leftLeg, rightLeg].filter(
          (target): target is NonNullable<typeof target> => target !== null
        ),
        alpha: 0,
        scale: 0,
        duration: 400,
        onComplete: () => {
          enemy.destroy();
          leftLeg?.destroy();
          rightLeg?.destroy();
        },
      });
    }

    this.add
      .text(768, 550, message, {
        fontSize: "28px",
        color: "#ffffff",
        backgroundColor,
        padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5);
  }

  protected onSceneUpdate() {
    this.updateEncounter();
    this.updateScreenProximity();

    if (this.nearScreen && this.isEKeyJustDown()) {
      eventBus.emit("search-open", true);
    }

    if (this.isPlayerInZone(this.doorZone)) {
      this.scene.start("GroundFloorScene");
    }
  }
}
