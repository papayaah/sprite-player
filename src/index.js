import Phaser from 'phaser';
import logoImg from './assets/logo.png';
import backgroundImg from './assets/tiledemo.png'
import Dropzone from "dropzone";
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin';
import CreateScrollablePanel from './lib/CreateScrollablePanel.js';
import CreateItemsBox from './lib/CreateItemsBox.js';
import { CreateTitle } from './lib/CreateColumnPanel.js';
import { Pane } from 'tweakpane';

import PlayerScene from './scenes/player.js';
import UiScene from './scenes/ui.js';

import { BACKGROUND_COLOR, PRIMARY_COLOR } from './consts.js';
import { printCaches } from './scenes/utils.js';

var frameRate = 10;
Dropzone.autoDiscover = false;


function isBase64String(data) {
  // Regular expression to match Base64 characters
  const base64Pattern = /^[A-Za-z0-9+/=]+$/;
  return base64Pattern.test(data);
}

function scaleSpriteToFit(sprite, maxWidth, maxHeight) {
  const scaleX = maxWidth / sprite.width;
  const scaleY = maxHeight / sprite.height;
  const scale = Math.min(scaleX, scaleY);
  sprite.setScale(scale);
  return sprite;
}

function centerSpriteInLabel(sprite, labelWidth, labelHeight) {
  sprite.setX(labelWidth / 2 - sprite.displayWidth / 2);
  sprite.setY(labelHeight / 2 - sprite.displayHeight / 2);
}

class MyGame extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene', active: true });
  }

  preload() {
    if (process.env.NODE_ENV === 'development') {
      this.load.plugin('PhaserSceneWatcherPlugin', 'https://cdn.jsdelivr.net/npm/phaser-plugin-scene-watcher@6.0.0/dist/phaser-plugin-scene-watcher.umd.js', true);
    }

    setTimeout(() => {
    this.add.text(100, 100, 'Hello Phaser!', { fontFamily: 'monogram', fontSize: '50px', color: '#fff' });
  }, 2000)


    this.pane = new Pane();
    this.pane.containerElem_.style.width = '320px';
    this.pane.addButton({ title: 'Refresh' }).on('click', () => { console.time('refresh'); this.pane.refresh(); console.timeEnd('refresh'); });

    const folder = this.pane.addFolder({ title: 'Game', expanded: true });
    //folder.addMonitor(this.game, 'hasFocus');
    folder.addButton({ title: 'Step' }).on('click', () => { const t = performance.now(); const dt = loop._target; console.info('step', t, dt); this.game.step(t, dt); });
    folder.addButton({ title: 'Destroy' }).on('click', () => { console.info('Destroy game'); this.game.destroy(true); });

    const animsFolder = folder.addFolder({ title: 'Animations', expanded: false });
    animsFolder.addButton({ title: 'Pause all' }).on('click', () => { console.info('Pause all animations'); anims.pauseAll(); });
    animsFolder.addButton({ title: 'Resume all' }).on('click', () => { console.info('Resume all animations'); anims.resumeAll(); });
    animsFolder.addButton({ title: 'Print animations' }).on('click', () => { console.info('Animations:'); console.table(anims.anims.getArray().map(animToPrint)); });
    animsFolder.addButton({ title: 'Print JSON' }).on('click', () => { console.info(JSON.stringify(anims.toJSON())); });


    //this.loadingText = this.add.text(100, 100, 'Loading...', { fill: '#ffffff' });

    this.load.image('logo', logoImg);
    this.load.image('background', backgroundImg);

    var savedImage = localStorage.getItem('savedImage');
    if (savedImage) {
      let imageData = JSON.parse(savedImage);

      //this.loadImage(this, imageData.base64);
      //this.textures.addBase64('customTexture', imageData.frame);
      ////if(isBase64String(imageData.frame)) {
      //this.add.sprite(0, 0, imageData.frame);
      //}
    }

    this.displaySavedFrames();
  }


  create() {
    let bg = this.add.sprite(this.cameras.main.centerX, this.cameras.main.centerY, 'background');

    // Calculate the scale ratio
    let scaleX = this.scale.width / bg.width;
    let scaleY = this.scale.height / bg.height;
    let maxScale = Math.max(scaleX, scaleY);
    bg.setScale(maxScale)
      .setOrigin(0.5, 0.5)

    var itemsBox = this.rexUI.add.sizer({
      orientation: 'y',
      space: {
        left: 5, right: 5, top: 5, bottom: 5,
        item: 5
      },
    })

    itemsBox.addBackground(
      this.rexUI.add.roundRectangle({}),
      'background'
    )

    const labelWidth = 40;
    const labelHeight = 40;
    let startX = 50;  // Starting X position for the first frame
    const startY = 20; // Y position for all frames
    const spacing = 0; // Spacing between frames
    const self = this
    for (let i = 1; i <= 10; i++) {
      let frameData = localStorage.getItem('frame' + i);
      if (frameData) {
        frameData = JSON.parse(frameData);
        const box = this.rexUI.add.roundRectangle(0, 0, 20, 20, 10, BACKGROUND_COLOR);
        const sprite = this.add.sprite(0, 0, 'frame' + i);
        //centerSpriteInLabel(sprite, labelWidth, labelHeight);
        //scaleSpriteToFit(sprite, labelWidth, labelHeight);
        var item = this.rexUI.add.label({
          background: box,
          icon: sprite,
          iconWidth: labelWidth,
          iconHeight: labelHeight,
          // squareFitAction: true,
          align: 'center',
          orientation: 'y',
          space: {
            left: 2,
            right: 2,
            top: 0,
            bottom: 2,
            icon: 0,
            text: 1
          },
        })

        //itemsBox.add(item, { proportion: 0, expand: true })
        //box.add(sprite);

        item
          .setInteractive()
          .on('pointerdown', function () {
            let frameData = localStorage.getItem('frame' + i);
            frameData = JSON.parse(frameData);
            let {
              base64: imageData,
              imageWidth,
              imageHeight,
              frameWidth,
              frameHeight,
              numRows,
              numCols,
            } = frameData;
            this.scene.events.emit('spriteSelected', 'frame' + i);
            self.playSpritesheet(imageData, imageWidth, imageHeight);
          })

        itemsBox.add(item);
        //sprite.setOrigin(0, 0)
        startX += frameData.frameWidth + spacing;
      }
    }

    itemsBox.setPosition(this.game.config.width - labelWidth, 10)
      .setOrigin(0.5, 0)
      .layout()

    // Initialize Dropzone
    this.initDropzone();
  }

  playSpritesheet(imageData, imageWidth, imageHeight, save = false) {

    const textureKey = `texture-${Date.now()}`;
    this.textures.addBase64(textureKey, imageData);
    this.textures.once('addtexture', () => {
      if (save) {
        this.saveSpritesheet(textureKey, imageWidth, imageHeight)
      }
      this.scene.get('PlayerScene').createSprite(textureKey, imageWidth, imageHeight)
    });
  }

  saveSpritesheet(textureKey, imageWidth, imageHeight) {
    const spritesheetKey = `spritesheet-${Date.now()}`;
    this.textures.addSpriteSheet(spritesheetKey, this.textures.get(textureKey).getSourceImage(), { frameWidth: 144, frameHeight: 64 });
    let savedImage = {
      base64: this.textures.getBase64(textureKey),
      imageWidth,
      imageHeight,
      frame: this.textures.getBase64(spritesheetKey, 0),
    }
    this.saveNewFrame(JSON.stringify(savedImage));
  }

  saveNewFrame(frameData) {
    // Load or initialize the index for saving frames
    let currentFrameIndex = parseInt(localStorage.getItem('currentFrameIndex')) || 1;

    // Construct the frame key
    let frameKey = 'frame' + currentFrameIndex;

    // Save the frame data
    localStorage.setItem(frameKey, frameData);

    // Update the index for the next frame, wrapping back to 1 after 10
    currentFrameIndex = currentFrameIndex >= 10 ? 1 : currentFrameIndex + 1;

    console.log('saving as', currentFrameIndex)
    localStorage.setItem('currentFrameIndex', currentFrameIndex.toString());
  }

  displaySavedFrames() {
    let startX = 10;  // Starting X position for the first frame
    const startY = 10; // Y position for all frames
    const spacing = 5; // Spacing between frames

    for (let i = 1; i <= 10; i++) {
      let frameData = localStorage.getItem('frame' + i);
      if (frameData) {
        frameData = JSON.parse(frameData);
        // Load the frame as a Phaser image
        //let frameImage = this.add.image(startX, startY, 'frame' + i).setOrigin(0, 0);
        this.textures.addBase64('frame' + i, frameData.frame);
        //console.log('showing: ', frameData, ' at ', startX);
        // this.textures.once('addtexture', () => {
        //     const sprite = this.add.sprite(startX, startY, 'frame' + i);
        // });

        // startX += frameData.frameWidth + spacing;
      }
    }
  }



  loadImage(self, imageData) {
    var image = new Image();
    image.onload = function () {
      // Access the width and height of the image
      var imageWidth = this.width;
      var imageHeight = this.height;
      self.playSpritesheet(imageData, imageWidth, imageHeight, true);
    };
    image.src = imageData;
  }

  initDropzone() {
    var self = this;
    new Dropzone("#dropzone", {
      url: '/',
      autoProcessQueue: false,
      clickable: false,
      addedfile: function (file) {
        var reader = new FileReader();
        reader.onload = function (e) {
          self.loadImage(self, e.target.result);
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'dropzone',
  pixelArt: true,
  roundPixels: true,
  width: 800,
  height: 600,
  scene: [MyGame, UiScene, PlayerScene],
  scale: {
    // mode: Phaser.Scale.FIT,
    // autoCenter: Phaser.Scale.CENTER_BOTH,
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