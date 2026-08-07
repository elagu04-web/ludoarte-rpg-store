import Phaser from "phaser";
import { eventBus } from "@/game/eventBus";
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

/**
 * Dead-end room off GroundFloorScene's left wall -- no shop/rental logic
 * here, just a walkable space with a way back out. Like tienda.png and
 * planta-baja.png, the art has no wall on the side closest to the camera
 * (the bottom edge here) -- that open edge doubles as the doorway both in
 * and out, so there's only one exit zone instead of a drawn door + gap.
 *
 * Also home to the second-hand-games NPC: walking near him force-opens
 * the Si/No prompt (SecondHandNpcPrompt), no E press needed.
 */
export class BathroomScene extends BasePlayerScene {
  private exitZone!: Phaser.Geom.Rectangle;
  private npcZone!: Phaser.Geom.Rectangle;
  private nearNpc = false;

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
  }

  create() {
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

    if (this.isPlayerInZone(this.exitZone)) {
      this.transitionTo("GroundFloorScene");
    }
  }
}
