import Phaser from 'phaser';
import backgroundImg from './assets/sewer.png'
import portraitImg from './assets/talking.png'
import Dropzone from "dropzone";
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin';
import { Pane } from 'tweakpane';

import Player from './scenes/player.js';
import UiScene from './scenes/ui.js';

import { DEBUG } from './consts.js';
import MiniSheet from './minisheet.js';
import BubbleText from './bubbleText.js';
import AnimatedSprite from './animatedSprite.js';
import Thumbs from './thumbs.js';

Dropzone.autoDiscover = false;

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene', active: true });

    this.miniSheet = null;
  }

  preload() {
    if (DEBUG) {
      this.load.plugin('PhaserSceneWatcherPlugin', 'https://cdn.jsdelivr.net/npm/phaser-plugin-scene-watcher@6.0.0/dist/phaser-plugin-scene-watcher.umd.js', false);

      this.pane = new Pane();
      this.pane.containerElem_.style.width = '320px';
    }

    this.load.image('portrait', portraitImg);
    this.load.image('background', backgroundImg);

    this.bubbleText = new BubbleText(this)
    this.thumbs = new Thumbs(this)
    this.thumbs.preload()
    this.player = new Player(this)
    new MiniSheet(this)

    // let currentFrameIndex = parseInt(localStorage.getItem('currentFrameIndex')) || 1;
    this.blacksmith = new AnimatedSprite(this, 200, 300)
  }

  create() {
    // let bg = this.add.sprite(this.cameras.main.centerX, this.cameras.main.centerY, 'background')
    // let scaleX = this.scale.width / bg.width
    // let scaleY = this.scale.height / bg.height
    // let maxScale = Math.max(scaleX, scaleY)
    // bg.setScale(maxScale)
    //   .setOrigin(0.5, 0.5)

    // Initialize Dropzone
    this.initDropzone();

    //this.createSavedFrames()

    this.player.create()
    this.thumbs.create()
    this.bubbleText.initialize()
    this.blacksmith.initialize()
    this.add.existing(this.blacksmith)

    this.events.on('thumbSelected', (frameData) => {
      let {
        storageKey,
        base64: imageData,
        imageWidth,
        imageHeight,
      } = frameData;
      this.playSpritesheet(imageData, imageWidth, imageHeight, storageKey);
    }, this)

    this.events.on('storageItemUpdated', (storageKey) => {
      this.thumbs.reload(()=>{
        setTimeout(() => {
          this.thumbs.create()
        }, 50)
      })
    })
  }

  createMiniSheet(frameData) {
    let {
      base64: imageData,
      imageWidth,
      imageHeight,
      numRows,
      numCols,
    } = frameData;

    if (this.miniSheet) {
      this.miniSheet.destroyExisting();
    }
    this.miniSheet = new MiniSheet(this, textureKey, imageWidth, imageHeight, numRows, numCols);
  }

  playSpritesheet(imageData, imageWidth, imageHeight, storageKey) {
    this.bubbleText.destroy()
    this.blacksmith.destroy()

    const textureKey = `texture-${Date.now()}`
    this.textures.addBase64(textureKey, imageData)
    this.textures.once('addtexture', () => {
      if (!storageKey) {
        storageKey = this.saveSpritesheet(textureKey, imageWidth, imageHeight)
        this.thumbs.reload(()=>{
          setTimeout(() => {
            this.thumbs.create()
          }, 500)
        })
      }
      this.events.emit('textureAdded', { textureKey, storageKey })
    })
  }

  saveSpritesheet(textureKey, imageWidth, imageHeight) {
    const spritesheetKey = `spritesheet-${Date.now()}`;
    this.textures.addSpriteSheet(spritesheetKey, this.textures.get(textureKey).getSourceImage(), { frameWidth: 32, frameHeight: 32 });
    let savedImage = {
      base64: this.textures.getBase64(textureKey),
      imageWidth,
      imageHeight,
      numCols: 4,
      numRows: 4,
      frame: this.textures.getBase64(spritesheetKey, 0),
    }
    return this.saveNewFrame(JSON.stringify(savedImage));
  }

  saveNewFrame(frameData) {
    // Load or initialize the index for saving frames
    let currentFrameIndex = parseInt(localStorage.getItem('currentFrameIndex')) || 1

    // Construct the frame key
    let frameKey = 'frame' + currentFrameIndex

    // console.log(`Updated data for ${frameKey}`, JSON.parse(frameData))
    localStorage.setItem(frameKey, frameData)

    // Update the index for the next frame, wrapping back to 1 after 10
    currentFrameIndex = currentFrameIndex >= 10 ? 1 : currentFrameIndex + 1

    localStorage.setItem('currentFrameIndex', currentFrameIndex.toString())
    return frameKey
  }

  loadImage(self, imageData) {
    const image = new Image()
    image.onload = function() {
      const imageWidth = this.width
      const imageHeight = this.height
      self.playSpritesheet(imageData, imageWidth, imageHeight)
    }
    image.src = imageData
  }

  initDropzone() {
    const self = this
    new Dropzone("#dropzone", {
      url: '/',
      autoProcessQueue: false,
      clickable: false,
      addedfile: (file) => {
        const reader = new FileReader()
        reader.onload = function (e) {
          self.loadImage(self, e.target.result)
        };
        reader.readAsDataURL(file)
      }
    })
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'dropzone',
  pixelArt: true,
  roundPixels: true,
  width: 800,
  height: 600,
  scene: [GameScene, UiScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_HORIZONTALLY,
  },
  plugins: {
    scene: [{
      key: 'rexUI',
      plugin: RexUIPlugin,
      mapping: 'rexUI'
    }]
  }
};

const game = new Phaser.Game(config);
window.game = game;