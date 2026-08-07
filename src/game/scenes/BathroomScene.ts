import Phaser from "phaser";
import { eventBus } from "@/game/eventBus";
import { playFireballSound } from "@/game/music";
import type { BoardGame } from "@/data/shelves";
import { BasePlayerScene } from "./BasePlayerScene";

// Corrido a la izquierda, lejos del camino recto entrada->pared de fondo,
// para no toparselo de una al entrar al baño. Tambien mas arriba (lejos
// de la entrada) para que haya que caminar un poco antes de cruzar su
// franja, en vez de disparar el dialogo apenas se entra a la sala.
const NPC_X = 380;
const NPC_Y = 580;
const NPC_WIDTH = 100;
const NPC_HEIGHT = 170;
// La zona de deteccion no es un halo alrededor del NPC sino una franja
// horizontal que cruza todo el ancho de la sala a su altura -- "pasar por
// su misma linea horizontal" dispara el dialogo aunque no camines derecho
// hacia el.
const NPC_ROW_PADDING = 80;

/** Misma convencion de key que ExteriorScene usa para sus "monstruos" de
 * caja -- si un juego ya se preload alla (todo lo que tiene arte real),
 * esta escena reaprovecha esa textura en vez de volver a cargarla. */
function attackerTextureKey(gameId: string): string {
  return `enemy-${gameId}`;
}

interface Attacker {
  sprite: Phaser.Physics.Arcade.Sprite;
  leftLeg: Phaser.GameObjects.Rectangle;
  rightLeg: Phaser.GameObjects.Rectangle;
  hits: number;
}

const ATTACKER_SPEED = 85;
const ATTACKER_HITS_TO_DEFEAT = 2;
const LEG_OFFSET_X = 18;
const LEG_OFFSET_Y = 60;
const FIREBALL_SPEED = 500;
const FIREBALL_COOLDOWN_MS = 450;

// Mismo esquema de "niveles" que ExteriorScene: se sortea uno al arrancar
// el ataque (no depende del progreso), y cada nivel suma un truco encima
// de los anteriores.
const MAX_COMBAT_LEVEL = 5;
const TELEPORT_MIN_LEVEL = 3;
const ATTACKER_SHOOTS_MIN_LEVEL = 4;
const REPEL_MIN_LEVEL = 5;
const TELEPORT_INTERVAL_MS = 2600;
const TELEPORT_MIN_DISTANCE = 180;
const TELEPORT_MAX_DISTANCE = 300;
const ATTACKER_FIREBALL_INTERVAL_MS = 1900;
const ATTACKER_FIREBALL_SPEED = 320;
const REPEL_CHANCE = 0.25;
// Area caminable donde pueden reaparecer al teletransportarse -- lejos de
// la mesada, la pared del fondo y la salida.
const ROOM_BOUNDS = { minX: 320, maxX: 1120, minY: 500, maxY: 1120 };

// Puntos de aparicion cerca de las 4 esquinas de la sala (dentro del piso
// caminable). No hace falta que esquiven la mesada/el NPC con precision de
// pixel -- igual que los monstruos de ExteriorScene, estas cajas no
// colisionan contra obstaculos, solo persiguen al jugador.
const ATTACK_CORNERS = [
  { x: 350, y: 550 }, // arriba-izquierda
  { x: 1100, y: 550 }, // arriba-derecha
  { x: 350, y: 1080 }, // abajo-izquierda
  { x: 1100, y: 1080 }, // abajo-derecha
];

/**
 * Dead-end room off GroundFloorScene's left wall -- no shop/rental logic
 * here, just a walkable space with a way back out. Like tienda.png and
 * planta-baja.png, the art has no wall on the side closest to the camera
 * (the bottom edge here) -- that open edge doubles as the doorway both in
 * and out, so there's only one exit zone instead of a drawn door + gap.
 *
 * Also home to the second-hand-games NPC: walking near him force-opens
 * the Si/No prompt (SecondHandNpcPrompt), no E press needed. Answering
 * "No" summons 2 or 4 boxes of those same second-hand games, one per
 * corner, that chase the player down. Same fireball mini-combat as
 * ExteriorScene, levels included: Space/E shoots, a couple hits defeats a
 * box, touching one un-shot is a loss (same game-over flow as
 * ExteriorScene's fights).
 */
export class BathroomScene extends BasePlayerScene {
  private exitZone!: Phaser.Geom.Rectangle;
  private npcZone!: Phaser.Geom.Rectangle;
  private nearNpc = false;

  private attackers: Attacker[] = [];
  private attackActive = false;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private fireballs!: Phaser.Physics.Arcade.Group;
  private enemyFireballs!: Phaser.Physics.Arcade.Group;
  private lastFireballTime = 0;
  private combatLevel = 1;
  private attackerSpeed = ATTACKER_SPEED;
  private teleportTimer: Phaser.Time.TimerEvent | null = null;
  private attackerFireTimer: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super("BathroomScene");
  }

  preload() {
    super.preload();
    this.load.image("bg-bano", "/assets/scene/bano.png");
    this.load.image(
      "npc-segunda-mano",
      "/assets/NPC/personaje-encapuchado-entrenador-pixel-art-chibi-transparente.png"
    );
    this.load.spritesheet(
      "fireball-anim",
      "/assets/effects/fireball-sheet.png",
      { frameWidth: 128, frameHeight: 128 }
    );
  }

  create() {
    // Phaser reuses the same Scene instance across visits -- without
    // resetting these, boxes from a fight left behind on a previous visit
    // (or a stuck "attack in progress" flag) would carry over silently.
    this.attackActive = false;
    this.attackers = [];
    this.lastFireballTime = 0;
    this.combatLevel = 1;
    this.attackerSpeed = ATTACKER_SPEED;
    this.teleportTimer = null;
    this.attackerFireTimer = null;

    this.addBackground("bg-bano");
    // Justo arriba de exitZone -- si arrancara ya adentro de esa zona se
    // iria de la escena en el mismo frame que entra.
    this.createPlayer(715, 1100);

    // Fila de baños + pared de fondo (arriba de la imagen).
    this.addObstacle(627, 230, 1254, 460, { visible: false });
    // Mesada de bachas, a la izquierda.
    this.addObstacle(150, 857, 300, 794, { visible: false });
    // Pared derecha (maceta, cuadro, tacho de basura).
    this.addObstacle(1192, 805, 124, 690, { visible: false });

    // El borde de abajo queda libre -- volver a caminar hacia la camara
    // es la salida, de vuelta al piso de abajo.
    this.exitZone = new Phaser.Geom.Rectangle(300, 1150, 830, 104);

    this.add
      .image(NPC_X, NPC_Y, "npc-segunda-mano")
      .setDisplaySize(NPC_WIDTH + 40, NPC_HEIGHT + 40);
    this.addObstacle(NPC_X, NPC_Y, NPC_WIDTH, NPC_HEIGHT, { visible: false });
    this.npcZone = new Phaser.Geom.Rectangle(
      0,
      NPC_Y - NPC_HEIGHT / 2 - NPC_ROW_PADDING,
      1254,
      NPC_HEIGHT + NPC_ROW_PADDING * 2
    );

    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.fireballs = this.physics.add.group();
    this.enemyFireballs = this.physics.add.group();
    if (!this.anims.exists("fireball-fly")) {
      this.anims.create({
        key: "fireball-fly",
        frames: this.anims.generateFrameNumbers("fireball-anim", { start: 0, end: 3 }),
        frameRate: 12,
        repeat: -1,
      });
    }

    const handleDeclined = (games: BoardGame[]) => this.startBoxAttack(games);
    eventBus.on("second-hand-declined", handleDeclined);

    // El "Continuar" del game-over es generico -- en ExteriorScene reinicia
    // otra pelea, pero aca no hay revancha, solo levantarse.
    const handleContinue = () => this.revive();
    eventBus.on("game-over-continue", handleContinue);

    this.events.on("shutdown", () => {
      eventBus.off("second-hand-declined", handleDeclined);
      eventBus.off("game-over-continue", handleContinue);
      this.stopCombatTimers();
      this.clearAttackers();
    });
  }

  private startBoxAttack(games: BoardGame[]) {
    if (this.attackActive || games.length === 0) return;

    const useAllFour = Phaser.Math.Between(0, 1) === 0;
    const corners = useAllFour
      ? ATTACK_CORNERS
      : Phaser.Math.Between(0, 1) === 0
        ? [ATTACK_CORNERS[0], ATTACK_CORNERS[3]]
        : [ATTACK_CORNERS[1], ATTACK_CORNERS[2]];

    const picks = corners.map(() => Phaser.Utils.Array.GetRandom(games));
    const missingTextures = picks.filter(
      (game) => !this.textures.exists(attackerTextureKey(game.id))
    );

    const spawn = () => {
      // El jugador pudo haberse ido de la sala mientras cargaban las
      // texturas -- no crear cajas en una escena que ya se esta cerrando.
      if (this.isTransitioning) return;

      this.attackActive = true;
      this.combatLevel = Phaser.Math.Between(1, MAX_COMBAT_LEVEL);
      this.attackerSpeed = ATTACKER_SPEED * (1 + (this.combatLevel - 1) * 0.15);

      this.attackers = corners.map((corner, i) =>
        this.spawnAttacker(corner.x, corner.y, picks[i])
      );

      const sprites = this.attackers.map((a) => a.sprite);
      this.physics.add.collider(this.player, sprites, () => this.loseToAttackers());
      this.physics.add.overlap(
        this.fireballs,
        sprites,
        (obj1, obj2) =>
          this.handleFireballHit(
            obj1 as Phaser.GameObjects.GameObject,
            obj2 as Phaser.GameObjects.GameObject
          ),
        undefined,
        this
      );
      this.physics.add.overlap(this.enemyFireballs, this.player, () =>
        this.loseToAttackers()
      );

      if (this.combatLevel >= TELEPORT_MIN_LEVEL) {
        this.teleportTimer = this.time.addEvent({
          delay: TELEPORT_INTERVAL_MS,
          loop: true,
          callback: () => this.teleportAttackers(),
        });
      }
      if (this.combatLevel >= ATTACKER_SHOOTS_MIN_LEVEL) {
        this.attackerFireTimer = this.time.addEvent({
          delay: ATTACKER_FIREBALL_INTERVAL_MS,
          loop: true,
          callback: () => this.attackersFireFireballs(),
        });
      }
    };

    if (missingTextures.length === 0) {
      spawn();
      return;
    }

    for (const game of missingTextures) {
      this.load.image(attackerTextureKey(game.id), game.image);
    }
    this.load.once(Phaser.Loader.Events.COMPLETE, spawn);
    this.load.start();
  }

  private spawnAttacker(x: number, y: number, game: BoardGame): Attacker {
    const sprite = this.physics.add.sprite(x, y, attackerTextureKey(game.id));
    sprite.setDisplaySize(90, 108);
    sprite.body?.setSize(70, 90);

    const leftLeg = this.add.rectangle(x - LEG_OFFSET_X, y + LEG_OFFSET_Y, 16, 40, 0xc9a876);
    const rightLeg = this.add.rectangle(x + LEG_OFFSET_X, y + LEG_OFFSET_Y, 16, 40, 0xc9a876);

    return { sprite, leftLeg, rightLeg, hits: 0 };
  }

  private updateAttackers() {
    if (!this.attackActive) return;

    for (const attacker of this.attackers) {
      if (!attacker.sprite.body) continue; // defensive: skip a torn-down body

      const dx = this.player.x - attacker.sprite.x;
      const dy = this.player.y - attacker.sprite.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 1) {
        attacker.sprite.setVelocity(
          (dx / distance) * this.attackerSpeed,
          (dy / distance) * this.attackerSpeed
        );
      }

      const swingDeg = Math.sin(this.time.now / 100) * 25;
      attacker.leftLeg.setPosition(
        attacker.sprite.x - LEG_OFFSET_X,
        attacker.sprite.y + LEG_OFFSET_Y
      );
      attacker.leftLeg.rotation = Phaser.Math.DegToRad(swingDeg);
      attacker.rightLeg.setPosition(
        attacker.sprite.x + LEG_OFFSET_X,
        attacker.sprite.y + LEG_OFFSET_Y
      );
      attacker.rightLeg.rotation = Phaser.Math.DegToRad(-swingDeg);
    }

    const canFire = this.time.now - this.lastFireballTime >= FIREBALL_COOLDOWN_MS;
    if (
      canFire &&
      (Phaser.Input.Keyboard.JustDown(this.spaceKey) || this.isEKeyJustDown())
    ) {
      this.lastFireballTime = this.time.now;
      this.fireFireball();
    }
  }

  /** Direct copy of ExteriorScene's aiming logic: fires along whichever
   * direction is held, or the way the player is currently facing if
   * standing still. */
  private fireFireball() {
    const axis = this.getInputAxis();
    let dirX = axis.x;
    let dirY = axis.y;

    if (dirX === 0 && dirY === 0) {
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

    const length = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
    const velocityX = (dirX / length) * FIREBALL_SPEED;
    const velocityY = (dirY / length) * FIREBALL_SPEED;

    const fireball = this.createFireballSprite(
      this.player.x,
      this.player.y,
      velocityX,
      velocityY
    );
    this.fireballs.add(fireball);
    fireball.setVelocity(velocityX, velocityY);
    playFireballSound();

    this.time.delayedCall(2000, () => fireball.destroy());
  }

  private createFireballSprite(
    x: number,
    y: number,
    velocityX: number,
    velocityY: number
  ): Phaser.Physics.Arcade.Sprite {
    const sprite = this.physics.add.sprite(x, y, "fireball-anim");
    sprite.play("fireball-fly");
    sprite.setDisplaySize(56, 56);
    sprite.body?.setCircle(50, 14, 14);
    sprite.rotation = Math.atan2(velocityY, velocityX) + Math.PI;
    return sprite;
  }

  /** Nivel 3+: las cajas se teletransportan cerca del jugador cada tanto en
   * vez de solo perseguir en linea recta. */
  private teleportAttackers() {
    if (!this.attackActive) return;

    for (const attacker of this.attackers) {
      if (!attacker.sprite.body) continue;

      const angle = Math.random() * Math.PI * 2;
      const distance = Phaser.Math.Between(TELEPORT_MIN_DISTANCE, TELEPORT_MAX_DISTANCE);
      const newX = Phaser.Math.Clamp(
        this.player.x + Math.cos(angle) * distance,
        ROOM_BOUNDS.minX,
        ROOM_BOUNDS.maxX
      );
      const newY = Phaser.Math.Clamp(
        this.player.y + Math.sin(angle) * distance,
        ROOM_BOUNDS.minY,
        ROOM_BOUNDS.maxY
      );

      this.tweens.add({
        targets: attacker.sprite,
        alpha: 0,
        duration: 120,
        onComplete: () => {
          if (!this.attackers.includes(attacker)) return;
          attacker.sprite.setPosition(newX, newY);
          attacker.sprite.setAlpha(1);
        },
      });
    }
  }

  /** Nivel 4+: las cajas tambien disparan de vuelta. */
  private attackersFireFireballs() {
    if (!this.attackActive) return;

    for (const attacker of this.attackers) {
      if (!attacker.sprite.body) continue;

      const dx = this.player.x - attacker.sprite.x;
      const dy = this.player.y - attacker.sprite.y;
      const length = Math.sqrt(dx * dx + dy * dy) || 1;
      const velocityX = (dx / length) * ATTACKER_FIREBALL_SPEED;
      const velocityY = (dy / length) * ATTACKER_FIREBALL_SPEED;

      const fireball = this.createFireballSprite(
        attacker.sprite.x,
        attacker.sprite.y,
        velocityX,
        velocityY
      );
      fireball.setTint(0x9b30ff);
      this.enemyFireballs.add(fireball);
      fireball.setVelocity(velocityX, velocityY);
      playFireballSound();

      this.time.delayedCall(2500, () => fireball.destroy());
    }
  }

  /** Nivel 5+: a veces la caja devuelve tu propia bola de fuego en vez de
   * recibir el golpe. */
  private repelFireball(fireball: Phaser.Physics.Arcade.Sprite) {
    const body = fireball.body as Phaser.Physics.Arcade.Body;
    const vx = -body.velocity.x;
    const vy = -body.velocity.y;

    this.fireballs.remove(fireball);
    this.enemyFireballs.add(fireball);
    fireball.setVelocity(vx, vy);
    fireball.setTint(0x9b30ff);
    fireball.rotation = Math.atan2(vy, vx) + Math.PI;
  }

  private handleFireballHit(
    obj1: Phaser.GameObjects.GameObject,
    obj2: Phaser.GameObjects.GameObject
  ) {
    if (!this.attackActive) return;

    const attacker = this.attackers.find((a) => a.sprite === obj1 || a.sprite === obj2);
    if (!attacker) return;

    const fireball = (attacker.sprite === obj1 ? obj2 : obj1) as Phaser.Physics.Arcade.Sprite;

    if (this.combatLevel >= REPEL_MIN_LEVEL && Math.random() < REPEL_CHANCE) {
      this.repelFireball(fireball);
      return;
    }

    fireball.disableBody(true, true);
    this.time.delayedCall(0, () => fireball.destroy());

    attacker.hits += 1;
    this.tweens.add({ targets: attacker.sprite, alpha: 0.3, duration: 80, yoyo: true });

    if (attacker.hits >= ATTACKER_HITS_TO_DEFEAT) {
      this.defeatAttacker(attacker);
    }
  }

  private defeatAttacker(attacker: Attacker) {
    this.attackers = this.attackers.filter((a) => a !== attacker);

    this.tweens.add({
      targets: [attacker.sprite, attacker.leftLeg, attacker.rightLeg],
      alpha: 0,
      scale: 0,
      duration: 400,
      onComplete: () => {
        attacker.sprite.destroy();
        attacker.leftLeg.destroy();
        attacker.rightLeg.destroy();
      },
    });

    if (this.attackers.length === 0) {
      this.attackActive = false;
      this.stopCombatTimers();
      const winText = this.add
        .text(this.player.x, this.player.y - 100, "¡Los espantaste!", {
          fontSize: "24px",
          color: "#ffffff",
          backgroundColor: "#2d2d44",
          padding: { x: 12, y: 8 },
        })
        .setOrigin(0.5);
      this.tweens.add({
        targets: winText,
        alpha: 0,
        duration: 400,
        delay: 1200,
        onComplete: () => winText.destroy(),
      });
    }
  }

  private loseToAttackers() {
    if (!this.attackActive) return;

    this.attackActive = false;
    this.stopCombatTimers();
    this.setDefeated();
    this.clearAttackers();
    // Deja ver al jugador tirado en el piso un instante antes de tapar la
    // escena con Continuar/Terminar -- mismo ritmo que ExteriorScene.
    this.time.delayedCall(1800, () => eventBus.emit("game-over-open"));
  }

  private stopCombatTimers() {
    if (this.teleportTimer) {
      this.teleportTimer.remove();
      this.teleportTimer = null;
    }
    if (this.attackerFireTimer) {
      this.attackerFireTimer.remove();
      this.attackerFireTimer = null;
    }
  }

  private clearAttackers() {
    for (const attacker of this.attackers) {
      attacker.sprite.destroy();
      attacker.leftLeg.destroy();
      attacker.rightLeg.destroy();
    }
    this.attackers = [];
  }

  private updateNpcProximity() {
    const inZone = Phaser.Geom.Rectangle.Overlaps(
      this.player.getBounds(),
      this.npcZone
    );

    if (inZone && !this.nearNpc) {
      eventBus.emit("npc-prompt-open", true);
    }
    this.nearNpc = inZone;
  }

  protected onSceneUpdate() {
    this.updateNpcProximity();
    this.updateAttackers();

    if (this.isPlayerInZone(this.exitZone)) {
      // Salir de la sala es una forma valida de escapar del ataque.
      if (this.attackActive) {
        this.attackActive = false;
        this.stopCombatTimers();
        this.clearAttackers();
      }
      this.transitionTo("GroundFloorScene");
    }
  }
}
