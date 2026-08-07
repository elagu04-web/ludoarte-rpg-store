import Phaser from "phaser";
import { BasePlayerScene } from "./BasePlayerScene";

/**
 * Dead-end room off GroundFloorScene's left wall -- no shop/rental logic
 * here, just a walkable space with a way back out. Like tienda.png and
 * planta-baja.png, the art has no wall on the side closest to the camera
 * (the bottom edge here) -- that open edge doubles as the doorway both in
 * and out, so there's only one exit zone instead of a drawn door + gap.
 */
export class BathroomScene extends BasePlayerScene {
  private exitZone!: Phaser.Geom.Rectangle;

  constructor() {
    super("BathroomScene");
  }

  preload() {
    super.preload();
    this.load.image("bg-bano", "/assets/scene/bano.png");
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
  }

  protected onSceneUpdate() {
    if (this.isPlayerInZone(this.exitZone)) {
      this.transitionTo("GroundFloorScene");
    }
  }
}
