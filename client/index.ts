import Phaser from "phaser";
import { Client, Room } from "colyseus.js";

export class GameScene extends Phaser.Scene {
  client = new Client("ws://localhost:2567")
  room: Room;

  preload() {
    // preload scene
  }

  async create() {
    console.log('Joining room...')

    try {
      this.room = await this.client.joinOrCreate('my_room')
      console.log('Joined room!')
    } catch (e) {
      console.error(e)
    }
  }

  update() {
    // game loop
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: "#b6d53c",
  parent: 'phaser-example',
  physics: { default: 'arcade' },
  pixelArt: true,
  scene: [GameScene]
}

const game = new Phaser.Game(config)
