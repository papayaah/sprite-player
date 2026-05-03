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
    this.spriteScaleX = null
    this.spriteScaleY = null
    this.spriteAngle = 0
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
        this.spriteScaleX = sliderData.value
        this.spriteScaleY = sliderData.value
        this.scene.events.emit('syncScaleSliders', { value: sliderData.value })
      } else if (sliderData.label == 'Scale X') {
        if (this.sprite) {
          this.sprite.setScale(sliderData.value, this.spriteScaleY || sliderData.value)
        }
        this.spriteScaleX = sliderData.value
      } else if (sliderData.label == 'Scale Y') {
        if (this.sprite) {
          this.sprite.setScale(this.spriteScaleX || sliderData.value, sliderData.value)
        }
        this.spriteScaleY = sliderData.value
      } else if (sliderData.label == 'Rotation') {
        if (this.sprite) {
          this.sprite.setAngle(sliderData.value)
        }
        this.spriteAngle = sliderData.value
      } else {
        this.createSprite(this.textureKey, this.imageWidth, this.imageHeight)
      }

      // console.log(sliderData)
    }, this);

    this.input.keyboard.on('keydown-Y', () => this.toggleYoyo(), this);
    this.input.keyboard.on('keydown-R', () => this.toggleReverse(), this);
    this.input.keyboard.on('keydown-P', () => this.togglePause(), this);

    this.scene.events.on('UI_toggle_<Y>oyo', (value) => {
      if (!this.sprite) return;
      if (this.sprite.anims.yoyo !== value) this.toggleYoyo();
    });
    this.scene.events.on('UI_toggle_<R>everse', (value) => {
      if (!this.sprite) return;
      if (this.sprite.anims.inReverse !== value) this.toggleReverse();
    });
    this.scene.events.on('UI_toggle_<P>ause', (value) => {
      if (!this.sprite) return;
      if (this.sprite.anims.isPaused !== value) this.togglePause();
    });

    this.events.on('cellsSelected', (data) => {
      this.playSelectedFrames(data)
    })

    // Mouse wheel scaling logic
    this.scene.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
      if (!this.sprite) return;
      if (this.scene.miniSheet?.isPointerOver(pointer)) return;

      const scaleStep = 0.2; // Optimized for faster scaling
      const direction = deltaY > 0 ? -1 : 1; // Scroll Down = shrink, Scroll Up = grow
      let newScale = (this.spriteScaleX || 1) + (scaleStep * direction);

      // Clamp the scale to a reasonable range
      newScale = Math.max(0.1, Math.min(newScale, 10));

      this.spriteScaleX = newScale;
      this.spriteScaleY = newScale;
      this.sprite.setScale(newScale);

      // Notify UI to sync sliders
      this.scene.events.emit('syncScaleSliders', { value: newScale });
    });
  }

  toggleYoyo() {
    if (!this.sprite) return;
    this.sprite.anims.yoyo = !this.sprite.anims.yoyo;
    this.events.emit('yoyo', this.sprite.anims.yoyo);
  }

  toggleReverse() {
    if (!this.sprite) return;
    this.sprite.anims.reverse();
    this.events.emit('reverse', this.sprite.anims.inReverse);
  }

  togglePause() {
    if (!this.sprite) return;
    if (this.sprite.anims.isPaused) {
      this.sprite.anims.resume();
    } else {
      this.sprite.anims.pause();
    }
    this.events.emit('pause', this.sprite.anims.isPaused);
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

    const actualFrames = this.textures.get(spritesheetKey).frameTotal - 1;

    this.scene.events.emit('updateSpriteInfo', {
      frameWidth: Math.round(frameWidth),
      frameHeight: Math.round(frameHeight),
      totalFrames: actualFrames
    });

    const animationKey = `animation-${++this.animationKeyCounter}`;
    const animation = this.anims.create({
      key: animationKey,
      frames: this.anims.generateFrameNumbers(spritesheetKey, { start: 0, end: actualFrames - 1 }),
      frameRate: this.frameRate,
      repeat: -1
    });
    this.fullAnimationKey = animationKey
    // Create a sprite and play the animation
    const sprite = this.scene.add.sprite(0, 0, spritesheetKey);
    // Calculate scale factors to fit the game canvas
    // const scaleX = game.config.width / sprite.width;
    // const scaleY = game.config.height / sprite.height;
    // const scale = Math.max(scaleX, scaleY)

    const maxHeight = 300;
    const scale = Math.min(maxHeight / sprite.height, game.config.width / sprite.width);

    // Set the sprite's scale
    if (this.spriteScaleX && this.spriteScaleY) {
      sprite.setScale(this.spriteScaleX, this.spriteScaleY);
    } else {
      sprite.setScale(scale);
      this.spriteScaleX = scale;
      this.spriteScaleY = scale;
    }

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
    sprite.setAngle(this.spriteAngle);
    sprite.setInteractive();

    sprite.on('animationupdate', (anim, frame) => {
      this.events.emit('currentAnimation', {
        frameIndex: frame.index,
        frameName: frame.frame.name  // actual spritesheet cell index
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
    if (!selectedCells || selectedCells.length === 0 || !this.sprite) return;

    // Map directly in order, allowing duplicates, so [0,1,2,5,6,7,0,1,2] plays exactly that
    const selectedFrames = selectedCells.map(cellIndex => ({
      key: this.spritesheetKey,
      frame: cellIndex
    }));

    const animationKey = `animation-${++this.animationKeyCounter}`;
    this.scene.anims.create({
      key: animationKey,
      frames: selectedFrames,
      frameRate: this.frameRate,
      repeat: -1
    });

    this.currentAnimationKey = animationKey;
    this.sprite.play(animationKey);
    this.selectedCells = selectedCells.slice();
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
        frame: this.getThumbnailBase64(),
      }
    }

    // Save the merged data back to localStorage
    localStorage.setItem(this.storageKey, JSON.stringify(mergedData));
    this.events.emit('storageItemUpdated', this.storageKey)

    // console.log(`Updated data for spritesheet: ${this.spritesheetKey} storage${this.storageKey}`);
  }

  getThumbnailBase64() {
    if (!this.spritesheetKey || !this.textures.exists(this.spritesheetKey)) return null;
    const frame = this.textures.get(this.spritesheetKey).get(0);
    const canvas = document.createElement('canvas');
    canvas.width = frame.width;
    canvas.height = frame.height;
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(
      frame.texture.getSourceImage(),
      frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight,
      0, 0, frame.width, frame.height
    );
    
    return canvas.toDataURL();
  }

  playSequence(sequenceFrameDataArray) {
    // sequenceFrameDataArray is an array of frameData objects
    // Each frameData has base64, imageWidth, imageHeight, numCols, numRows, etc.
    
    if (sequenceFrameDataArray.length === 0) return;

    // Play through each frame in sequence, loading and playing for a duration
    let sequenceIndex = 0;
    const frameDuration = 1000; // Duration to show each frame in milliseconds (1 second)

    const playNextFrame = () => {
      if (sequenceIndex >= sequenceFrameDataArray.length) {
        // Sequence finished, loop back to start
        sequenceIndex = 0;
      }

      const frameData = sequenceFrameDataArray[sequenceIndex];
      const {
        base64: imageData,
        imageWidth,
        imageHeight,
        numCols = 4,
        numRows = 4
      } = frameData;

      // Update player settings
      this.numCols = numCols;
      this.numRows = numRows;

      // Create texture and sprite
      const textureKey = `sequence-texture-${Date.now()}-${sequenceIndex}`;
      this.textures.addBase64(textureKey, imageData);
      
      this.textures.once('addtexture', () => {
        this.createAnimation(textureKey);
        
        // Schedule next frame in sequence
        sequenceIndex++;
        this.sequenceTimer = this.scene.time.delayedCall(frameDuration, playNextFrame);
      });
    };

    playNextFrame();
  }
}

export default Player