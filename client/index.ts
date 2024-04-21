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

  currentPlayer: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
  remoteRef: Phaser.GameObjects.Rectangle;

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

        if (sessionId === this.room.sessionId) {
          this.currentPlayer = entity
          // remoteRef is being used got debug only
          this.remoteRef = this.add.rectangle(0, 0, entity.width, entity.height);
          this.remoteRef.setStrokeStyle(1, 0xff0000);

          player.onChange(() => {
            this.remoteRef.x = player.x;
            this.remoteRef.y = player.y;
          })
        } else {
          // interpolate remote players
          player.onChange(() => {
            entity.setData('serverX', player.x);
            entity.setData('serverY', player.y);
          });
        }
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

  update(time: number, delta: number): void {
    // skip loop if not connected with room yet.
    if (!this.room) { return; }

    // send input to the server
    const velocity = 2;
    this.inputPayload.left = this.cursorKeys.left.isDown
    this.inputPayload.right = this.cursorKeys.right.isDown
    this.inputPayload.up = this.cursorKeys.up.isDown
    this.inputPayload.down = this.cursorKeys.down.isDown
    this.room.send(0, this.inputPayload)

    if (this.inputPayload.left) {
      this.currentPlayer.x -= velocity;

    } else if (this.inputPayload.right) {
      this.currentPlayer.x += velocity;
    }

    if (this.inputPayload.up) {
      this.currentPlayer.y -= velocity;

    } else if (this.inputPayload.down) {
      this.currentPlayer.y += velocity;
    }

    for (let sessionId in this.playerEntities) {
      // do not interpolate the current player
      if (sessionId === this.room.sessionId) { continue; }

      // interpolate all other players entities
      const entity = this.playerEntities[sessionId]
      const { serverX, serverY } = entity.data.values

      entity.x = Phaser.Math.Linear(entity.x, serverX, 0.2)
      entity.y = Phaser.Math.Linear(entity.y, serverY, 0.2)
    }
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
