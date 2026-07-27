import Phaser from "phaser";

const PLAYER_SPEED = 200;

export class MainScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
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
