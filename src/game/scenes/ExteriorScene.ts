import Phaser from "phaser";
import { eventBus } from "@/game/eventBus";
import { gameState } from "@/game/gameState";
import { playFireballSound } from "@/game/music";
import { gamesWithArt } from "@/data/shelves";
import { BasePlayerScene } from "./BasePlayerScene";

/** Texture key used for a given game's box art in the mini-combat encounter. */
function enemyTextureKey(gameId: string): string {
  return `enemy-${gameId}`;
}

interface Monster {
  sprite: Phaser.Physics.Arcade.Sprite;
  leftLeg: Phaser.GameObjects.Rectangle;
  rightLeg: Phaser.GameObjects.Rectangle;
  hits: number;
}

const ENEMY_SPEED = 90;
const ENEMY_HITS_TO_WIN = 3;
const FIREBALL_SPEED = 500;
const FIREBALL_COOLDOWN_MS = 450;
const LEG_OFFSET_X = 18;
const LEG_OFFSET_Y = 60;

// Combat levels: 1 = original baseline, picked at random each encounter
// (not tied to progress) -- each level unlocks a new trick on top of
// everything from the levels before it.
const MAX_COMBAT_LEVEL = 5;
const TELEPORT_MIN_LEVEL = 3;
const ENEMY_SHOOTS_MIN_LEVEL = 4;
const REPEL_MIN_LEVEL = 5;
const TELEPORT_INTERVAL_MS = 2600;
const TELEPORT_MIN_DISTANCE = 220;
const TELEPORT_MAX_DISTANCE = 340;
const ENEMY_FIREBALL_INTERVAL_MS = 1900;
const ENEMY_FIREBALL_SPEED = 320;
const REPEL_CHANCE = 0.25;
const YARD_BOUNDS = { minX: 120, maxX: 1416, minY: 580, maxY: 950 };

// Escaping through a door mid-fight doesn't let you off easy -- it just
// piles on more monsters (up to this many) for the next encounter.
const MAX_MONSTERS = 4;
const MONSTER_SPACING = 160;

export class ExteriorScene extends BasePlayerScene {
  private doorZone!: Phaser.Geom.Rectangle;
  private screenZone!: Phaser.Geom.Rectangle;
  private nearScreen = false;

  private spaceKey!: Phaser.Input.Keyboard.Key;
  private nKey!: Phaser.Input.Keyboard.Key;
  private fireballs!: Phaser.Physics.Arcade.Group;
  private enemyFireballs!: Phaser.Physics.Arcade.Group;
  private lastFireballTime = 0;

  private monsters: Monster[] = [];
  private encounterActive = false;
  private combatLevel = 1;
  private enemySpeed = ENEMY_SPEED;
  private teleportTimer: Phaser.Time.TimerEvent | null = null;
  private enemyFireTimer: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super("ExteriorScene");
  }

  preload() {
    super.preload();
    this.load.image("bg-fachada", "/assets/scene/fachada.png");

    // Every game that has real box art is a potential "monster" -- load
    // them all so the encounter can pick one at random each time.
    for (const game of gamesWithArt) {
      this.load.image(enemyTextureKey(game.id), game.image);
    }
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

    this.addInfoScreen(970, 390, 90, 110);

    this.spaceKey = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
    this.fireballs = this.physics.add.group();
    this.enemyFireballs = this.physics.add.group();

    if (gameState.hasExploredShelf && gameState.cartTotalItems === 0) {
      this.startEnemyEncounter();
    }

    // Secret test shortcut: hold N and tap M to spawn/respawn monsters
    // right away, without having to explore a shelf and empty the cart.
    this.nKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.N);
    this.input.keyboard!.on("keydown-M", () => {
      if (!this.nKey.isDown || this.encounterActive) return;
      this.revive();
      this.startEnemyEncounter();
    });

    this.events.on("shutdown", () => {
      eventBus.emit("screen-proximity", false);
    });
  }

  /**
   * Info screen on the glass door to the right of the entrance -- the
   * "pantalla con info" the player can approach and press E on to open the
   * game search screen. It's purely decorative (no collision, like the
   * door art itself); the interaction zone is a separate, taller rectangle
   * that reaches down past the wall's collision area (y > 530) into the
   * walkable yard, so it stays reachable even though the screen art sits
   * higher up on the facade.
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

    const sidePadding = 30;
    const top = y - height / 2 - sidePadding;
    const bottom = 590; // reaches into the walkable yard below the wall
    this.screenZone = new Phaser.Geom.Rectangle(
      x - width / 2 - sidePadding,
      top,
      width + sidePadding * 2,
      bottom - top
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
    if (gamesWithArt.length === 0) return;

    this.encounterActive = true;
    this.combatLevel = Phaser.Math.Between(1, MAX_COMBAT_LEVEL);
    this.enemySpeed = ENEMY_SPEED * (1 + (this.combatLevel - 1) * 0.15);

    const monsterCount = Phaser.Math.Clamp(
      gameState.pendingMonsters,
      1,
      MAX_MONSTERS
    );
    const startX = 768 - ((monsterCount - 1) * MONSTER_SPACING) / 2;

    this.monsters = [];
    for (let i = 0; i < monsterCount; i++) {
      const game = Phaser.Utils.Array.GetRandom(gamesWithArt);
      this.monsters.push(
        this.spawnMonster(startX + i * MONSTER_SPACING, 220, game.id)
      );
    }

    // One shared collider/overlap for the whole group of monster sprites,
    // not one per monster -- registering several overlaps against the same
    // fireballs group (one per monster) was cross-contaminating which
    // sprite each callback thought it was handling and corrupting a
    // *different* monster's physics body.
    const monsterSprites = this.monsters.map((m) => m.sprite);
    this.physics.add.collider(this.player, monsterSprites, () =>
      this.endEncounter("Perdiste el combate!", "#7a1f1f", true)
    );
    this.physics.add.overlap(
      this.fireballs,
      monsterSprites,
      (obj1, obj2) => this.handleFireballHit(obj1, obj2),
      undefined,
      this
    );
    this.physics.add.overlap(this.enemyFireballs, this.player, () =>
      this.endEncounter("Perdiste el combate!", "#7a1f1f", true)
    );

    if (this.combatLevel >= TELEPORT_MIN_LEVEL) {
      this.teleportTimer = this.time.addEvent({
        delay: TELEPORT_INTERVAL_MS,
        loop: true,
        callback: () => this.teleportMonsters(),
      });
    }
    if (this.combatLevel >= ENEMY_SHOOTS_MIN_LEVEL) {
      this.enemyFireTimer = this.time.addEvent({
        delay: ENEMY_FIREBALL_INTERVAL_MS,
        loop: true,
        callback: () => this.enemiesFireFireballs(),
      });
    }
  }

  /**
   * Physics body lives on a plain Sprite (Container + Arcade physics is
   * unreliable in Phaser 4); the "legs" are separate shapes we reposition
   * by hand each frame to follow the box.
   */
  private spawnMonster(x: number, y: number, gameId: string): Monster {
    const sprite = this.physics.add.sprite(x, y, enemyTextureKey(gameId));
    sprite.setDisplaySize(100, 120);
    sprite.body?.setSize(80, 100);

    const leftLeg = this.add.rectangle(
      x - LEG_OFFSET_X,
      y + LEG_OFFSET_Y,
      16,
      40,
      0xc9a876
    );
    const rightLeg = this.add.rectangle(
      x + LEG_OFFSET_X,
      y + LEG_OFFSET_Y,
      16,
      40,
      0xc9a876
    );

    return { sprite, leftLeg, rightLeg, hits: 0 };
  }

  private teleportMonsters() {
    if (!this.encounterActive) return;

    for (const monster of this.monsters) {
      if (!monster.sprite.body) continue;

      const angle = Math.random() * Math.PI * 2;
      const distance = Phaser.Math.Between(
        TELEPORT_MIN_DISTANCE,
        TELEPORT_MAX_DISTANCE
      );
      const newX = Phaser.Math.Clamp(
        this.player.x + Math.cos(angle) * distance,
        YARD_BOUNDS.minX,
        YARD_BOUNDS.maxX
      );
      const newY = Phaser.Math.Clamp(
        this.player.y + Math.sin(angle) * distance,
        YARD_BOUNDS.minY,
        YARD_BOUNDS.maxY
      );

      this.tweens.add({
        targets: monster.sprite,
        alpha: 0,
        duration: 120,
        onComplete: () => {
          if (!this.monsters.includes(monster)) return;
          monster.sprite.setPosition(newX, newY);
          monster.sprite.setAlpha(1);
        },
      });
    }
  }

  private enemiesFireFireballs() {
    if (!this.encounterActive) return;

    for (const monster of this.monsters) {
      if (!monster.sprite.body) continue;

      const dx = this.player.x - monster.sprite.x;
      const dy = this.player.y - monster.sprite.y;
      const length = Math.sqrt(dx * dx + dy * dy) || 1;
      const velocityX = (dx / length) * ENEMY_FIREBALL_SPEED;
      const velocityY = (dy / length) * ENEMY_FIREBALL_SPEED;

      const key = this.ensureEnemyFireballTexture();
      const fireball = this.physics.add.sprite(
        monster.sprite.x,
        monster.sprite.y,
        key
      );
      this.enemyFireballs.add(fireball);
      fireball.setVelocity(velocityX, velocityY);
      playFireballSound();

      this.time.delayedCall(2500, () => fireball.destroy());
    }
  }

  private ensureEnemyFireballTexture(): string {
    const key = "enemy-fireball";
    if (!this.textures.exists(key)) {
      const graphics = this.add.graphics();
      graphics.fillStyle(0x9b30ff, 1);
      graphics.fillCircle(8, 8, 8);
      graphics.generateTexture(key, 16, 16);
      graphics.destroy();
    }
    return key;
  }

  private repelFireball(fireball: Phaser.Physics.Arcade.Sprite) {
    const body = fireball.body as Phaser.Physics.Arcade.Body;
    const vx = body.velocity.x;
    const vy = body.velocity.y;

    this.fireballs.remove(fireball);
    this.enemyFireballs.add(fireball);
    fireball.setVelocity(-vx, -vy);
    fireball.setTint(0x9b30ff);
  }

  private updateEncounter() {
    if (!this.encounterActive) return;

    for (const monster of this.monsters) {
      if (!monster.sprite.body) continue; // defensive: skip a torn-down body

      const dx = this.player.x - monster.sprite.x;
      const dy = this.player.y - monster.sprite.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 1) {
        monster.sprite.setVelocity(
          (dx / distance) * this.enemySpeed,
          (dy / distance) * this.enemySpeed
        );
      }

      const swingDeg = Math.sin(this.time.now / 100) * 25;
      monster.leftLeg.setPosition(
        monster.sprite.x - LEG_OFFSET_X,
        monster.sprite.y + LEG_OFFSET_Y
      );
      monster.leftLeg.rotation = Phaser.Math.DegToRad(swingDeg);
      monster.rightLeg.setPosition(
        monster.sprite.x + LEG_OFFSET_X,
        monster.sprite.y + LEG_OFFSET_Y
      );
      monster.rightLeg.rotation = Phaser.Math.DegToRad(-swingDeg);
    }

    const canFire =
      this.time.now - this.lastFireballTime >= FIREBALL_COOLDOWN_MS;
    if (
      canFire &&
      (Phaser.Input.Keyboard.JustDown(this.spaceKey) || this.isEKeyJustDown())
    ) {
      this.lastFireballTime = this.time.now;
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
    if (!this.encounterActive) return;

    // Phaser doesn't guarantee arg order for group-vs-group overlaps, so
    // find whichever of the two callback args is one of our live monsters
    // (the other one is the fireball that hit it).
    const monster = this.monsters.find(
      (m) => m.sprite === obj1 || m.sprite === obj2
    );
    if (!monster) return;

    const fireball = (
      monster.sprite === obj1 ? obj2 : obj1
    ) as Phaser.Physics.Arcade.Sprite;

    // Level 5+: a chance the box bats the fireball straight back at you
    // instead of taking the hit.
    if (this.combatLevel >= REPEL_MIN_LEVEL && Math.random() < REPEL_CHANCE) {
      this.repelFireball(fireball);
      return;
    }

    // Disable (don't destroy) here: destroying a body mid-overlap-callback
    // corrupts Arcade Physics' internal state for other bodies checked in
    // the same step. Actually destroy it a moment later instead.
    fireball.disableBody(true, true);
    this.time.delayedCall(0, () => fireball.destroy());

    monster.hits += 1;
    this.tweens.add({
      targets: monster.sprite,
      alpha: 0.3,
      duration: 80,
      yoyo: true,
    });

    if (monster.hits >= ENEMY_HITS_TO_WIN) {
      this.defeatMonster(monster);
    }
  }

  private defeatMonster(monster: Monster) {
    this.monsters = this.monsters.filter((m) => m !== monster);

    this.tweens.add({
      targets: [monster.sprite, monster.leftLeg, monster.rightLeg],
      alpha: 0,
      scale: 0,
      duration: 400,
      onComplete: () => {
        monster.sprite.destroy();
        monster.leftLeg.destroy();
        monster.rightLeg.destroy();
      },
    });

    if (this.monsters.length === 0) {
      gameState.pendingMonsters = 1;
      this.endEncounter("Ganaste el combate!", "#2d2d44");
    }
  }

  private endEncounter(
    message: string,
    backgroundColor: string,
    isLoss = false
  ) {
    if (!this.encounterActive) return;

    this.encounterActive = false;

    if (isLoss) {
      this.setDefeated();
    }

    if (this.teleportTimer) {
      this.teleportTimer.remove();
      this.teleportTimer = null;
    }
    if (this.enemyFireTimer) {
      this.enemyFireTimer.remove();
      this.enemyFireTimer = null;
    }

    const monsters = this.monsters;
    this.monsters = [];

    for (const monster of monsters) {
      monster.sprite.setVelocity(0, 0);
      this.tweens.add({
        targets: [monster.sprite, monster.leftLeg, monster.rightLeg],
        alpha: 0,
        scale: 0,
        duration: 400,
        onComplete: () => {
          monster.sprite.destroy();
          monster.leftLeg.destroy();
          monster.rightLeg.destroy();
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
      if (this.encounterActive && !this.isTransitioning) {
        // Trying to flee through the door instead of finishing the fight
        // doesn't work -- it just means more monsters next time.
        gameState.pendingMonsters = Math.min(
          gameState.pendingMonsters + 1,
          MAX_MONSTERS
        );
        // Clear our own encounter bookkeeping right away: if this scene's
        // update() fires even one more time while the transition finishes
        // (its game objects already torn down by then), updateEncounter()
        // must see encounterActive=false and an empty monsters array, or
        // it crashes trying to move a monster with a destroyed body.
        this.abandonEncounter();
      }
      this.transitionTo("GroundFloorScene");
    }
  }

  private abandonEncounter() {
    this.encounterActive = false;
    if (this.teleportTimer) {
      this.teleportTimer.remove();
      this.teleportTimer = null;
    }
    if (this.enemyFireTimer) {
      this.enemyFireTimer.remove();
      this.enemyFireTimer = null;
    }
    this.monsters = [];
  }
}
