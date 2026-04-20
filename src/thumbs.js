import { ACCENT_COLOR, BACKGROUND_COLOR, DEBUG, MAX_THUMBS, PRIMARY_COLOR } from './consts.js';
import { scaleSpriteToFit, centerSpriteInLabel } from './scenes/utils.js';

class Thumbs {
  constructor(scene) {
    this.scene = scene
    this.textures = scene.textures
    this.activeKey = null
    this.container = this.scene.add.container(10, 10);
  }

  preload() {
    this.reload()
  }

  reload(callback) {
    this.destroy()

    const allKeys = new Set()
    for (let i = 1; i <= MAX_THUMBS; i++) {
      if (localStorage.getItem('frame' + i)) allKeys.add('frame' + i)
    }

    if (allKeys.size === 0) {
      if (callback) callback()
      return
    }

    let loadedCount = 0;
    const totalToLoad = allKeys.size;

    const onTextureAdded = (key) => {
      if (allKeys.has(key)) {
        loadedCount++;
        if (loadedCount === totalToLoad) {
          this.textures.off('addtexture', onTextureAdded);
          if (callback) callback();
        }
      }
    };

    this.textures.on('addtexture', onTextureAdded);

    for (const storageKey of allKeys) {
      const dataString = localStorage.getItem(storageKey);
      if (!dataString) {
        loadedCount++;
        continue;
      }
      
      const frameData = JSON.parse(dataString);
      if (!frameData || !frameData.frame) {
        loadedCount++;
        continue;
      }

      if (this.textures.exists(storageKey)) {
        this.textures.remove(storageKey);
      }
      this.textures.addBase64(storageKey, frameData.frame);
    }

    for (let i = MAX_THUMBS + 1; i < 1000; i++) {
      const key = 'frame' + i;
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
      } else {
        break;
      }
    }
  }

  create() {
    if (this.container && this.container.length > 0) {
        this.destroy();
    }

    var itemsBox = this.scene.rexUI.add.gridSizer({
      column: 2,
      row: 10,
      columnProportions: 0,
      rowProportions: 0,
      space: {
        column: 6,
        row: 4,
        left: 3, right: 3, top: 3, bottom: 3,
        item: 3
      },
    })

    itemsBox.addBackground(
      this.scene.rexUI.add.roundRectangle({}),
      'background'
    )

    const labelWidth = 64;
    const labelHeight = 64;
    const boxes = {}
    for (let i = 1; i <= MAX_THUMBS; i++) {
      let frameData = localStorage.getItem('frame' + i);
      if (frameData) {
        frameData = JSON.parse(frameData);
        const storageKey = 'frame' + i
        const isActive = this.activeKey === storageKey
        const box = this.scene.rexUI.add.roundRectangle(0, 0, labelWidth, labelHeight, 8, isActive ? ACCENT_COLOR : BACKGROUND_COLOR);
        boxes[storageKey] = box

        if (this.textures.exists(storageKey)) {
            const sprite = this.scene.add.sprite(0, 0, storageKey).setOrigin(0.5, 0.5);
            scaleSpriteToFit(sprite, labelWidth - 4, labelHeight - 4);

            var item = this.scene.rexUI.add.label({
              width: labelWidth,
              height: labelHeight,
              background: box,
              icon: sprite,
              align: 'center',
              orientation: 'y',
              space: { left: 2, right: 2, top: 2, bottom: 2, icon: 0, text: 0 },
            })

            item
              .setInteractive()
              .on('pointerdown', () => {
                let currentFd = JSON.parse(localStorage.getItem(storageKey));
                Object.entries(boxes).forEach(([k, b]) =>
                  b.setFillStyle(k === storageKey ? ACCENT_COLOR : BACKGROUND_COLOR)
                )
                this.activeKey = storageKey
                this.scene.events.emit('thumbSelected', { ...currentFd, storageKey })
              })
              .on('pointerover', () => game.canvas.classList.add('pointer-cursor'))
              .on('pointerout',  () => game.canvas.classList.remove('pointer-cursor'))

            itemsBox.add(item);
        }
      }
    }

    const gridWidth = (labelWidth * 2) + 6 + 6 + 6;
    const panelX = game.config.width - gridWidth - this.container.x - 8;
    const panelY = 4;
    itemsBox.setPosition(panelX, panelY)
      .setOrigin(0, 0)
      .layout();
    this.container.add(itemsBox);
  }

  destroy() {
    if (this.container) {
      this.container.destroy();
      this.container = this.scene.add.container(10, 10);
    }
  }
}

export default Thumbs;
