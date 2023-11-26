import { ACCENT_COLOR, BACKGROUND_COLOR, DEBUG } from "../consts";

class PlayerScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PlayerScene', active: true });

    this.sprite = null;
    this.animationKeyCounter = 0; // Initialize a counter for animation keys

    // default values
    this.imageWidth = null;
    this.imageHeight = null;
    this.numCols = 4;
    this.numRows = 4;
    this.frameRate = 10;
    this.spriteScale = null;
    this.textureKey = null;
    this.posX = null;
    this.posY = null;
    this.storageKey = null;
  }

  create() {
    this.input.on('dragstart', function (pointer, gameObject) {
      gameObject.setTint(ACCENT_COLOR);
      game.canvas.classList.add('grab-cursor');
    });

    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      game.canvas.classList.remove('grab-cursor');
      game.canvas.classList.add('grabbing-cursor');
      const bottomLimit = this.game.config.height - 200;

      gameObject.x = dragX;
      if (dragY > bottomLimit) {
        gameObject.y = bottomLimit;
      } else {
        gameObject.y = dragY;
      }
    });

    this.input.on('dragend', (pointer, gameObject) => {
      game.canvas.classList.remove('grabbing-cursor');
      gameObject.clearTint();

      this.posX = gameObject.x
      this.posY = gameObject.y
    });

    this.scene.get('GameScene').events.on('spriteSelected', (storageKey) => {
      this.storageKey = storageKey
      let existingData = localStorage.getItem(this.storageKey);
      existingData = existingData ? JSON.parse(existingData) : {};
      this.numCols = existingData.numCols || this.numCols
      this.numRows = existingData.numRows || this.numRows
    });
  }

  createSprite(textureKey, imageWidth, imageHeight) {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }

    this.imageWidth = imageWidth
    this.imageHeight = imageHeight
    this.textureKey = textureKey
    this.sprite = this.createAnimation(textureKey)

    if (DEBUG) {
      const pane = this.scene.get('GameScene').pane
      const folder = pane.addFolder({ title: 'Sprite', expanded: false });

      for (let prop in this.sprite) {
        if (this.sprite.hasOwnProperty(prop)) {
          let value = this.sprite[prop];
          if (value !== null && typeof value !== 'object') {
            folder.addBinding(this.sprite, prop, { readonly: true });
          }
        }
      }
    }

    this.scene.get('UiScene').events.on('sliderChanged', (sliderData) => {
      // animation.msPerFrame = sliderValue;
      // sprite.anims.timeScale = sliderValue;
      if (sliderData.label == 'Frame Rate') {
        this.frameRate = sliderData.value
      }

      if (sliderData.label == 'Cols') {
        this.numCols = sliderData.value;
        this.updateStorage({ numCols: this.numCols })
      }

      if (sliderData.label == 'Rows') {
        this.numRows = sliderData.value;
        this.updateStorage({ numRows: this.numRows })
      }

      if (sliderData.label == 'Scale') {
        this.sprite.setScale(sliderData.value)
        this.spriteScale = sliderData.value
      } else {
        if (this.sprite) {
          this.sprite.destroy();
        }
        this.sprite = this.createAnimation(this.textureKey)
      }

      // console.log(sliderData)
      // animation.msPerFrame = sliderData.value;
      // sprite.anims.play(animationKey, sliderData.value);
    }, this);
  }

  createAnimation(textureKey) {
    const spritesheetKey = `spritesheet-${this.animationKeyCounter++}`;
    this.spritesheetKey = spritesheetKey
    let frameWidth = this.imageWidth / this.numCols;
    let frameHeight = this.imageHeight / this.numRows;
    this.textures.addSpriteSheet(spritesheetKey, this.textures.get(textureKey).getSourceImage(), { frameWidth: frameWidth, frameHeight: frameHeight });

    const animationKey = `animation-${this.animationKeyCounter++}`;
    const animation = this.anims.create({
      key: animationKey,
      frames: this.anims.generateFrameNumbers(spritesheetKey, { start: 0, end: this.numCols * this.numRows - 1 }),
      frameRate: this.frameRate,
      repeat: -1
    });

    // Create a sprite and play the animation
    const sprite = this.add.sprite(0, 0, spritesheetKey);
    // Calculate scale factors to fit the game canvas
    // const scaleX = game.config.width / sprite.width;
    // const scaleY = game.config.height / sprite.height;
    // const scale = Math.max(scaleX, scaleY); // Use the larger scale factor to maintain aspect ratio

    const maxHeight = 300;
    const scale = Math.min(maxHeight / sprite.height, game.config.width / sprite.width);

    // Set the sprite's scale
    sprite.setScale(scale);

    // console.log(scale, sprite.width, scaleX, scaleY);
    // console.log(this.cameras.main.centerX, this.cameras.main.centerY);

    // Set the sprite's scale
    if (this.spriteScale) {
      //sprite.setScale(this.spriteScale)
    } else {
      //sprite.setScale(scale / 2)
      this.spriteScale = sprite.scale
    }

    // bottom center
    // sprite.setOrigin(0.5, 1);
    // sprite position
    const uiHeight = 100;
    if (this.posX) {
      sprite.x = this.posX
      sprite.y = this.posY
    } else {
      sprite.x = game.config.width / 2;
      sprite.y = game.config.height / 2;
      this.posX = sprite.x
      this.posY = sprite.y
    }
    sprite.play(animationKey);
    sprite.setInteractive();

    sprite.on('animationupdate', (anim, frame) => {
      this.events.emit('currentAnimation', {
        frameIndex: frame.index
      });
  });


    this.input.setDraggable(sprite);

    console.log(
      'Animation Key: ' + animationKey,
      'Scale: ' + this.spriteScale,
      'Position X: ' + this.posX,
      'Position Y: ' + this.posY,
      'Sprite X: ' + sprite.x,
      'Sprite Y: ' + sprite.y,
      'Frame Width: ' + frameWidth,
      'Frame Height: ' + frameHeight,
      'Number of Columns: ' + this.numCols,
      'Number of Rows: ' + this.numRows,
      'Frame Rate: ' + this.frameRate
    );

    return sprite;
  }

  updateStorage(newData) {
    // Retrieve the current data from localStorage
    let existingData = localStorage.getItem(this.storageKey);

    // Parse the existing data if it exists and is in JSON format
    existingData = existingData ? JSON.parse(existingData) : {};

    // Merge newData with existingData
    // Assuming both existingData and newData are objects
    const mergedData = { ...existingData, ...newData, ...{
      frame: this.textures.getBase64(this.spritesheetKey, 0),
    }};

    // Save the merged data back to localStorage
    localStorage.setItem(this.storageKey, JSON.stringify(mergedData));

    console.log(`Updated data for ${this.storageKey}`);
  }
}

export default PlayerScene