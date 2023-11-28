import { BACKGROUND_COLOR, DEBUG, PRIMARY_COLOR } from './consts.js';

const MAX_THUMBS = 10

class Thumbs {
  constructor(scene) {
    this.scene = scene

    this.container = this.scene.add.container(10, 10);
  }

  preload() {
    for (let i = 1; i <= MAX_THUMBS; i++) {
      let frameData = localStorage.getItem('frame' + i);
      if (frameData) {
        frameData = JSON.parse(frameData);
        this.scene.textures.addBase64('frame' + i, frameData.frame);
      }
    }
  }

  reload() {

  }

  create() {
    var itemsBox = this.scene.rexUI.add.sizer({
      orientation: 'y',
      space: {
        left: 5, right: 5, top: 5, bottom: 5,
        item: 5
      },
    })

    itemsBox.addBackground(
      this.scene.rexUI.add.roundRectangle({}),
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
        const box = this.scene.rexUI.add.roundRectangle(0, 0, 20, 20, 10, BACKGROUND_COLOR);
        const sprite = this.scene.add.sprite(0, 0, 'frame' + i);
        //centerSpriteInLabel(sprite, labelWidth, labelHeight);
        //scaleSpriteToFit(sprite, labelWidth, labelHeight);
        var item = this.scene.rexUI.add.label({
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
          .on('pointerdown',  () => {
            const storageKey = 'frame' + i
            let frameData = localStorage.getItem(storageKey);
            frameData = JSON.parse(frameData);

            // this.playSpritesheet(imageData, imageWidth, imageHeight, storageKey);
            this.scene.events.emit('thumbSelected', { ...frameData, storageKey } )
          })
          .on('pointerover', () => {
            game.canvas.classList.add('pointer-cursor');
          })

          .on('pointerout', () => {
            game.canvas.classList.remove('pointer-cursor');
          })

        itemsBox.add(item);
        //sprite.setOrigin(0, 0)
        startX += frameData.frameWidth + spacing;
      }
    }

    itemsBox.setPosition(game.config.width - labelWidth, 10)
      .setOrigin(0.5, 0)
      .layout()

    this.container.add(itemsBox)
  }

  destroy() {
    if (this.container) {
      this.container.destroy();
    }
  }
}

export default Thumbs;
