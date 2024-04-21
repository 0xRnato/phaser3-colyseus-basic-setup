import Phaser from "phaser";
import { Client, Room } from "colyseus.js";

export class GameScene extends Phaser.Scene {
  client = new Client("ws://localhost:2567")
  room: Room;
  // we will assign each player visual representation here
  // by their `sessionId`
  playerEntities: { [sessionId: string]: any } = {};

  // local imput cache
  inputPayload = {
    left: false,
    right: false,
    up: false,
    down: false
  }

  cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys;

  preload() {
    this.load.image('ship_0001', 'https://cdn.glitch.global/3e033dcd-d5be-4db4-99e8-086ae90969ec/ship_0001.png');
    this.cursorKeys = this.input.keyboard.createCursorKeys();
  }

  async create() {
    console.log('Joining room...')

    try {
      this.room = await this.client.joinOrCreate('my_room')
      console.log('Joined room!')

      this.room.state.players.onAdd((player, sessionId) => {
        const entity = this.physics.add.image(player.x, player.y, 'ship_0001')
        this.playerEntities[sessionId] = entity

        // listening for server updates
        player.onChange(() => {
          // update local position immediately
          entity.x = player.x
          entity.y = player.y
        })
        // Alternative, listening to individual properties:
        // player.listen("x", (newX, prevX) => console.log(newX, prevX));
        // player.listen("y", (newY, prevY) => console.log(newY, prevY));
      });

      this.room.state.players.onRemove((player, sessionId) => {
        const entity = this.playerEntities[sessionId]
        if (entity) {
          entity.destroy()
          delete this.playerEntities[sessionId]
        }
      })
    } catch (e) {
      console.error(e)
    }
  }

  update() {
    // skip loop if not connected with room yet.
    if (!this.room) { return; }

    // send input to the server
    this.inputPayload.left = this.cursorKeys.left.isDown
    this.inputPayload.right = this.cursorKeys.right.isDown
    this.inputPayload.up = this.cursorKeys.up.isDown
    this.inputPayload.down = this.cursorKeys.down.isDown
    this.room.send(0, this.inputPayload)
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
