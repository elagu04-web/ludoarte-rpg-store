import Phaser from "phaser";

const PLAYER_SPEED = 200;

export class MainScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;
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

  create() {
    this.cameras.main.setBackgroundColor("#2d2d44");

    this.add
      .text(400, 24, "Ludoarte RPG Store", {
        fontSize: "20px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.createPlayerTexture();

    this.player = this.physics.add.sprite(400, 300, "player");
    this.player.setCollideWorldBounds(true);

    this.obstacles = this.physics.add.staticGroup();
    this.addObstacle(250, 150, 300, 30); // pared interna horizontal
    this.addObstacle(150, 400, 30, 200); // pared interna vertical
    this.addObstacle(620, 470, 140, 140); // mueble/estanteria de prueba

    this.physics.add.collider(this.player, this.obstacles);

    const keyboard = this.input.keyboard!;
    this.cursors = keyboard.createCursorKeys();
    this.wasd = {
      up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
  }

  private createPlayerTexture() {
    const graphics = this.add.graphics();
    graphics.fillStyle(0xffcc00, 1);
    graphics.fillRect(0, 0, 32, 32);
    graphics.generateTexture("player", 32, 32);
    graphics.destroy();
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
  }
}
