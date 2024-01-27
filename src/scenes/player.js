import { ACCENT_COLOR, BACKGROUND_COLOR, DEBUG } from "../consts";

class Player {
  constructor(scene) {
    this.scene = scene
    this.events = scene.events
    this.input = scene.input
    this.textures = scene.textures
    this.anims = scene.anims

    this.sprite = null;
    this.animationKeyCounter = 0 // Initialize a counter for animation keys

    // default values
    this.imageWidth = null
    this.imageHeight = null
    this.textureKey = null
    this.posX = null
    this.posY = null
    this.storageKey = null
    this.spritesheetKey = null
    this.debounceTimer = null

    // settings
    this.numCols = 4
    this.numRows = 4
    this.frameRate = 10
    this.spriteScale = null
  }

  create() {
    this.input.on('dragstart', function (pointer, gameObject) {
      gameObject.setTint(ACCENT_COLOR);
      game.canvas.classList.add('grab-cursor');
    });

    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      game.canvas.classList.remove('grab-cursor');
      game.canvas.classList.add('grabbing-cursor');
      const bottomLimit = game.config.height - 200;

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

    this.events.on('textureAdded', (data) => {
      const { textureKey, storageKey } = data;
      this.textureKey = textureKey
      this.storageKey = storageKey
      let existingData = localStorage.getItem(this.storageKey);
      existingData = existingData ? JSON.parse(existingData) : {};
      // console.log(`textureAdded: ${storageKey}`, existingData)
      this.numCols = existingData.numCols || this.numCols
      this.numRows = existingData.numRows || this.numRows
      this.imageHeight = existingData.imageHeight
      this.imageWidth = existingData.imageWidth

      this.createSprite(this.textureKey, this.imageWidth, this.imageHeight)
    })

    this.scene.scene.get('GameScene').events.on('thumbSelected', () => {
      this.selectedCells = null
    })

    this.scene.scene.get('UiScene').events.on('sliderChanged', (sliderData) => {
      if (sliderData.label == 'Frame Rate') {
        this.frameRate = sliderData.value
        if (this.selectedCells) {
          this.playSelectedFrames(this.selectedCells)
          return
        }
      }

      if (sliderData.label == 'Cols') {
        this.numCols = sliderData.value;
      }

      if (sliderData.label == 'Rows') {
        this.numRows = sliderData.value;
      }

      if (sliderData.label == 'Scale') {
        if (this.sprite) {
          this.sprite.setScale(sliderData.value)
        }
        this.spriteScale = sliderData.value
      } else {
        this.createSprite(this.textureKey, this.imageWidth, this.imageHeight)
      }

      // console.log(sliderData)
    }, this);

    this.input.keyboard.on('keydown-Y', function (event) {
      if (!this.sprite) return
      this.sprite.anims.yoyo = !this.sprite.anims.yoyo;
      this.events.emit('yoyo', this.sprite.anims.yoyo);
    }, this);

    this.input.keyboard.on('keydown-R', function (event) {
      if (!this.sprite) return
      this.sprite.anims.reverse()
      this.events.emit('reverse', this.sprite.anims.inReverse)
    }, this);
    this.input.keyboard.on('keydown-P', function (event) {
      if (!this.sprite) return
      if (this.sprite.anims.isPaused) {
        this.sprite.anims.resume();
      }
      else {
        this.sprite.anims.pause();
      }
      this.events.emit('pause', this.sprite.anims.isPaused);
    }, this);

    this.events.on('cellsSelected', (data) => {
      this.playSelectedFrames(data)
    })
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
      const pane = this.scene.scene.get('GameScene').pane
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
  }

  createAnimation(textureKey) {
    if (!textureKey) return

    const spritesheetKey = `spritesheet-${++this.animationKeyCounter}`;
    this.spritesheetKey = spritesheetKey
    // console.log('set this.spritesheetKey', this.spritesheetKey, this.imageWidth, this.imageHeight, this.numCols, this.numRows, this.textureKey)
    let frameWidth = this.imageWidth / this.numCols;
    let frameHeight = this.imageHeight / this.numRows;
    this.textures.addSpriteSheet(spritesheetKey, this.textures.get(textureKey).getSourceImage(), { frameWidth: frameWidth, frameHeight: frameHeight });

    const animationKey = `animation-${++this.animationKeyCounter}`;
    const animation = this.anims.create({
      key: animationKey,
      frames: this.anims.generateFrameNumbers(spritesheetKey, { start: 0, end: this.numCols * this.numRows - 1 }),
      frameRate: this.frameRate,
      repeat: -1
    });
    this.fullAnimationKey = animationKey
    // Create a sprite and play the animation
    const sprite = this.scene.add.sprite(0, 0, spritesheetKey);
    // Calculate scale factors to fit the game canvas
    // const scaleX = game.config.width / sprite.width;
    // const scaleY = game.config.height / sprite.height;
    // const scale = Math.max(scaleX, scaleY); // Use the larger scale factor to maintain aspect ratio

    const maxHeight = 300;
    const scale = Math.min(maxHeight / sprite.height, game.config.width / sprite.width);

    // Set the sprite's scale
    sprite.setScale(scale);

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

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.updateStorage()
    }, 1000);

    return sprite;
  }

  playSelectedFrames(selectedCells) {
    const currentAnimationFrames = this.scene.anims.get(this.fullAnimationKey).frames;

    // Filter the frames to include only the selected ones
    // const selectedFrames = currentAnimationFrames.filter(frame =>
    //   selectedCells.includes(frame.index)
    // );
    const selectedFrames = currentAnimationFrames.filter(frame =>
      selectedCells.includes(frame.index)
    ).map(frame => ({ key: this.spritesheetKey, frame: frame.frame.name }));

    // Create a new animation with these frames
    const animationKey = `animation-${++this.animationKeyCounter}`;
    const animation = this.scene.anims.create({
      key: animationKey,
      frames: selectedFrames,
      frameRate: this.frameRate,
      repeat: -1
    });

    this.currentAnimationKey = animationKey
    this.sprite.play(animationKey)
    this.selectedCells = selectedCells
  }


  updateStorage() {
    // Retrieve the current data from localStorage
    let existingData = localStorage.getItem(this.storageKey);

    // Parse the existing data if it exists and is in JSON format
    existingData = existingData ? JSON.parse(existingData) : {};

    // Merge newData with existingData
    // Assuming both existingData and newData are objects
    const mergedData = {
      ...existingData, ...{
        numRows: this.numRows,
        numCols: this.numCols,
        frame: this.textures.getBase64(this.spritesheetKey, 0),
      }
    }

    // Save the merged data back to localStorage
    localStorage.setItem(this.storageKey, JSON.stringify(mergedData));
    this.events.emit('storageItemUpdated', this.storageKey)

    // console.log(`Updated data for spritesheet: ${this.spritesheetKey} storage${this.storageKey}`);
  }
}

export default Player