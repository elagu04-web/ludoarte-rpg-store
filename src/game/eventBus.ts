import Phaser from "phaser";

class GameEventBus extends Phaser.Events.EventEmitter {}

export const eventBus = new GameEventBus();
