import { ACCENT_COLOR, BACKGROUND_COLOR, PRIMARY_COLOR, UI_HEIGHT } from './consts.js';
import { scaleSpriteToFit } from './scenes/utils.js';

class Sequence {
  constructor(scene) {
    this.scene = scene;
    this.queue = []; // Array of {storageKey, frameData}
    this.container = this.scene.add.container(0, 0);
    this.boxes = {};
    this.isPlaying = false;
  }

  addFrame(storageKey, frameData) {
    this.queue.push({ storageKey, frameData });
    this.render();
  }

  addCell(spritesheetKey, frameIndex) {
    this.queue.push({ spritesheetKey, frameIndex });
    this.render();
  }

  addCells(spritesheetKey, frameIndices) {
    frameIndices.forEach(frameIndex => {
      this.queue.push({ spritesheetKey, frameIndex });
    });
    this.render();
  }

  getCellFrames() {
    return this.queue
      .filter(item => item.spritesheetKey !== undefined)
      .map(item => item.frameIndex);
  }

  removeFrame(index) {
    this.queue.splice(index, 1);
    this.render();
    this.scene.events.emit('cellSequenceChanged', this.getCellFrames());
  }

  reorderFrame(fromIndex, toIndex) {
    const [frame] = this.queue.splice(fromIndex, 1);
    this.queue.splice(toIndex, 0, frame);
    this.render();
  }

  clear() {
    this.queue = [];
    this.render();
    this.scene.events.emit('cellSequenceChanged', []);
  }

  clearSilently() {
    this.queue = [];
    this.render();
  }

  render() {
    // Clear previous elements
    if (this.container) {
      this.container.removeAll(true);
    }
    this.boxes = {};

    const itemSize = 38;
    const spacing = 4;
    const padding = 8;
    const itemsPerRow = 10;

    // Add title
    if (this.queue.length > 0) {
      const title = this.scene.add.text(
        padding,
        padding - 20,
        `Sequence (${this.queue.length})`,
        {
          fontFamily: 'm5x7',
          fontSize: '14px',
          color: '#f9a875',
          backgroundColor: '#00000088',
          padding: { x: 5, y: 3 }
        }
      );
      this.container.add(title);
    }

    // Create items
    this.queue.forEach((item, index) => {
      const { storageKey, frameData, spritesheetKey, frameIndex } = item;
      const row = Math.floor(index / itemsPerRow);
      const col = index % itemsPerRow;
      const x = padding + col * (itemSize + spacing);
      const y = padding + row * (itemSize + spacing);

      // Background box
      const box = this.scene.rexUI.add.roundRectangle(
        x + itemSize / 2,
        y + itemSize / 2,
        itemSize,
        itemSize,
        6,
        BACKGROUND_COLOR
      );

      // Sprite
      let sprite = null;
      if (spritesheetKey !== undefined && this.scene.textures.exists(spritesheetKey)) {
        sprite = this.scene.add.sprite(x + itemSize / 2, y + itemSize / 2, spritesheetKey, frameIndex).setOrigin(0.5, 0.5);
        scaleSpriteToFit(sprite, itemSize - 6, itemSize - 6);
      } else if (storageKey && this.scene.textures.exists(storageKey)) {
        sprite = this.scene.add.sprite(x + itemSize / 2, y + itemSize / 2, storageKey).setOrigin(0.5, 0.5);
        scaleSpriteToFit(sprite, itemSize - 6, itemSize - 6);
      }

      // Label with index
      const label = this.scene.add.text(
        x + itemSize / 2 + 16,
        y + itemSize / 2 - 18,
        (index + 1).toString(),
        {
          fontFamily: 'm5x7',
          fontSize: '14px',
          color: '#ffffff',
          backgroundColor: '#ff6b6f99',
          padding: { x: 3, y: 2 }
        }
      ).setOrigin(0.5, 0.5);

      // Make the box interactive for removal
      box.setInteractive()
        .on('pointerover', () => {
          box.setFillStyle(ACCENT_COLOR);
          game.canvas.classList.add('pointer-cursor');
        })
        .on('pointerout', () => {
          box.setFillStyle(BACKGROUND_COLOR);
          game.canvas.classList.remove('pointer-cursor');
        })
        .on('pointerdown', () => {
          console.log('Removing frame from sequence:', index);
          this.removeFrame(index);
        });

      this.boxes[index] = { box, sprite, label };
      this.container.add([box, sprite, label].filter(Boolean));
    });

    // Position strip just above the UI bar — leave room for a second row of items
    const gameH = this.scene.game.config.height;
    const stripY = gameH - UI_HEIGHT - 96;
    this.container.setPosition(10, stripY);
  }

  getQueue() {
    return this.queue.map(item => item.storageKey);
  }

  getQueueFrameData() {
    return this.queue.map(item => item.frameData);
  }

  destroy() {
    if (this.container) {
      this.container.destroy();
      this.container = this.scene.add.container(0, 0);
    }
  }
}

export default Sequence;
