import { ACCENT_COLOR, BACKGROUND_COLOR, FONT_SIZE, PRIMARY_COLOR, TEXT_COLOR, UI_HEIGHT } from "../consts";
import {getSizerTotalWidth, hexToWebColor} from './utils'

class UiScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UiScene', active: true });
    this.cols = 4
    this.rows = 4
  }

  preload() {
  }

  create() {
    if (!this.plugins.isActive('rexCheckbox')) return

    this.scene.get('GameScene').events.on('textureAdded', (data) => {
      let { storageKey } = data
      this.storageKey = storageKey
      let existingData = localStorage.getItem(this.storageKey)
      existingData = existingData ? JSON.parse(existingData) : {}
      this.cols = existingData.numCols || this.cols
      this.rows = existingData.numRows || this.rows

      this.setSliderValue(this.colSlider, this.cols)
      this.setSliderValue(this.rowSlider, this.rows)

      if (this.exportNameInput?.node) {
        this.exportNameInput.node.value = existingData.name || ''
      }
      if (this.exportSuffixInput?.node) {
        this.exportSuffixInput.node.value = existingData.suffix || ''
      }
    })

    this.scene.get('GameScene').events.on('syncScaleSliders', (data) => {
      this.setSliderValue(this.scaleSlider, data.value)
      this.setSliderValue(this.scaleXSlider, data.value)
      this.setSliderValue(this.scaleYSlider, data.value)
    })

    this.scene.get('GameScene').events.on('updateSpriteInfo', (data) => {
      this.infoText.setText(`Frames: ${data.totalFrames} | W: ${data.frameWidth} | H: ${data.frameHeight}`);
    });

    this.createBackground()
    this.createUi()
  }

  createBackground() {
    const gameWidth = this.sys.game.config.width
    const gameHeight = this.sys.game.config.height

    const uiGraphics = this.add.graphics()
    uiGraphics.fillStyle(BACKGROUND_COLOR, 1)

    // Draw the UI background rectangle
    uiGraphics.fillRect(
      0,                      // x position, aligned to the left
      gameHeight - UI_HEIGHT,  // y position, 100 pixels from the bottom
      gameWidth,              // width of the UI background
      UI_HEIGHT                // height of the UI background
    )

    // Set the line style for the top border (e.g., 2 pixels thick, white color)
    uiGraphics.lineStyle(2, ACCENT_COLOR, 1)

    // Draw the top border line
    uiGraphics.lineBetween(
      0, gameHeight - UI_HEIGHT, // Starting point (x1, y1)
      gameWidth, gameHeight - UI_HEIGHT // Ending point (x2, y2)
    )
  }

  createFullscreenButton() {
    let button = this.rexUI.add.label({
      width: 150,
      height: 30,
      background: this.rexUI.add.roundRectangle(0, 0, 0, 0, 20, PRIMARY_COLOR),
      fontSize: FONT_SIZE,
      text: this.add.text(0, 0, 'Full Screen', {
        fontFamily: 'm5x7',
        fontSize: FONT_SIZE,
        color: `#${TEXT_COLOR.toString(16)}`,
      }),
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 },
      align: 'center'
    }).setInteractive()
      .on('pointerdown', () => this.toggleFullScreen())
  }

  toggleFullScreen() {
    if (this.scale.isFullscreen) {
      // Exit fullscreen
      this.scale.stopFullscreen();
    } else {
      this.scale.startFullscreen();
    }
  }

  createExportInputs() {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display:flex;gap:4px;';

    const inputCss = [
      'background:#203c56',
      'color:#fff6d3',
      'border:1px solid #f9a875',
      'font-family:monogram',
      'font-size:13px',
      'padding:2px 5px',
      'outline:none',
      'box-sizing:border-box',
      'margin:0',
    ].join(';');

    const nameInput = document.createElement('input');
    nameInput.style.cssText = inputCss + ';width:80px;';
    nameInput.placeholder = 'sprite_name';

    const suffixInput = document.createElement('input');
    suffixInput.style.cssText = inputCss + ';width:56px;';
    suffixInput.placeholder = 'suffix';

    wrapper.appendChild(nameInput);
    wrapper.appendChild(suffixInput);

    const dom = this.add.dom(0, 0, wrapper);
    dom.width = 144;
    dom.height = 22;
    dom.setOrigin(0, 0.5);

    return { dom, nameInput, suffixInput };
  }

  getExportName() {
    const prefix = this.exportNameInput.node.value.trim() || 'sprite';
    const suffix = this.exportSuffixInput.node.value.trim();
    return suffix ? `${prefix}${suffix}` : prefix;
  }

  flashExportHint(message) {
    if (!this.exportHintText) return;
    this.exportHintText.setText(message);
    this.tweens.killTweensOf(this.exportHintText);
    this.exportHintText.setAlpha(1);
    this.tweens.add({
      targets: this.exportHintText,
      alpha: 0,
      delay: 1500,
      duration: 600,
    });
  }

  createUi() {
    this.rootSizer = this.rexUI.add.sizer({
      x: 10,
      y: this.game.config.height - UI_HEIGHT + 6,
      orientation: 'x',
      space: { item: 6 }
    });

    this.infoText = this.add.text(0, 0, 'Frames: - | W: - | H: -', {
      fontFamily: 'monogram',
      fontSize: FONT_SIZE,
      color: hexToWebColor(TEXT_COLOR),
      backgroundColor: '#00000066',
      padding: { x: 5, y: 2 }
    });

    // COLUMN 0: Sequence Controls
    const sequenceCol = this.rexUI.add.sizer({
      orientation: 'y',
      space: { item: 3 }
    });

    const seqButtonRow = this.rexUI.add.sizer({ orientation: 'x', space: { item: 4 } });
    seqButtonRow.add(this.createButton('Play', () => {
      const game = this.scene.get('GameScene');
      if (!game.player?.spritesheetKey) return this.flashExportHint('Load a spritesheet first');
      const hasSequence = game.sequence?.getCellFrames().length > 0;
      this.flashExportHint(hasSequence ? 'Playing your selected sequence' : 'Playing all frames');
      game.events.emit('playSequence');
    }, 70));
    seqButtonRow.add(this.createButton('Clear', () => {
      const game = this.scene.get('GameScene');
      if (!game.sequence?.getCellFrames().length) return this.flashExportHint('Nothing to clear');
      this.flashExportHint('Cleared the selected sequence');
      game.sequence.clear();
    }, 70));
    sequenceCol.add(seqButtonRow, { align: 'left' });

    const inputs = this.createExportInputs();
    this.exportNameInput = { node: inputs.nameInput };
    this.exportSuffixInput = { node: inputs.suffixInput };
    sequenceCol.add(inputs.dom, { align: 'left' });

    const persistInputs = () => {
      if (!this.storageKey) return;
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const data = JSON.parse(raw);
      data.name = inputs.nameInput.value;
      data.suffix = inputs.suffixInput.value;
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    };
    inputs.nameInput.addEventListener('change', persistInputs);
    inputs.suffixInput.addEventListener('change', persistInputs);

    const exportRow = this.rexUI.add.sizer({ orientation: 'x', space: { item: 4 } });
    exportRow.add(this.createSmallButton('Frames', () => {
      const game = this.scene.get('GameScene');
      if (!game.player?.spritesheetKey) return this.flashExportHint('Load a spritesheet first');
      game.events.emit('exportFrames', this.getExportName());
    }));
    exportRow.add(this.createSmallButton('Sheet', () => {
      const game = this.scene.get('GameScene');
      if (!game.player?.spritesheetKey) return this.flashExportHint('Load a spritesheet first');
      game.events.emit('exportSheet', this.getExportName());
    }));
    exportRow.add(this.createSmallButton('GIF', () => {
      const game = this.scene.get('GameScene');
      if (!game.player?.spritesheetKey) return this.flashExportHint('Load a spritesheet first');
      game.events.emit('exportGif', this.getExportName());
    }));
    sequenceCol.add(exportRow, { align: 'left' });

    this.exportHintText = this.add.text(0, 0, '', {
      fontFamily: 'm5x7',
      fontSize: '13px',
      color: hexToWebColor(ACCENT_COLOR),
    });
    this.exportHintText.setAlpha(0);
    sequenceCol.add(this.exportHintText, { align: 'left' });
    sequenceCol.add(this.infoText, { align: 'left' });

    this.rootSizer.add(sequenceCol, { align: 'top' });

    // COLUMN 1: Sliders + info + BG picker stacked vertically
    const sliderCol = this.rexUI.add.sizer({
      orientation: 'y',
      space: { item: 6 }
    });

    const sliderGrid = this.rexUI.add.gridSizer({
      column: 4,
      row: 2,
      columnProportions: 0,
      rowProportions: 0,
      space: { column: 15, row: 5 },
    });

    this.scaleSlider = this.createSliderWithLabel(sliderGrid, 'Scale', 3, 0.1, 10, true);
    this.scaleXSlider = this.createSliderWithLabel(sliderGrid, 'Scale X', 3, 0.1, 10, true);
    this.scaleYSlider = this.createSliderWithLabel(sliderGrid, 'Scale Y', 3, 0.1, 10, true);
    this.createSliderWithLabel(sliderGrid, 'Rotation', 0, 0, 360);
    this.colSlider = this.createSliderWithLabel(sliderGrid, 'Cols', this.cols, 1, 60);
    this.rowSlider = this.createSliderWithLabel(sliderGrid, 'Rows', this.rows, 1, 40);
    this.createSliderWithLabel(sliderGrid, 'Frame Rate', 10, 0, 120);

    sliderCol.add(sliderGrid, { align: 'left' });

    const bottomRow = this.rexUI.add.sizer({ orientation: 'x', space: { item: 12 } });
    const bgLabelCol = this.rexUI.add.sizer({ orientation: 'y', space: { item: 2 } });
    const bgLabelTop = this.add.text(0, 0, 'Background:', {
      fontFamily: 'monogram',
      fontSize: FONT_SIZE,
      color: hexToWebColor(TEXT_COLOR),
    });
    const bgLabelBottom = this.add.text(0, 0, 'Drop Background:', {
      fontFamily: 'monogram',
      fontSize: FONT_SIZE,
      color: hexToWebColor(TEXT_COLOR),
    });
    bgLabelCol.add(bgLabelTop, { align: 'left' });
    bgLabelCol.add(bgLabelBottom, { align: 'left' });
    bottomRow.add(bgLabelCol, { align: 'top' });
    bottomRow.add(this.createBackgroundPicker(), { align: 'top' });
    sliderCol.add(bottomRow, { align: 'left' });

    this.rootSizer.add(sliderCol, { align: 'top' });

    // COLUMN 2: Animation Controls
    const checkboxCol = this.rexUI.add.sizer({
      orientation: 'y',
      space: { item: 10 }
    });
    checkboxCol.add(this.createCheckboxWithLabel('<R>everse', false), { align: 'left' });
    checkboxCol.add(this.createCheckboxWithLabel('<Y>oyo', false), { align: 'left' });
    checkboxCol.add(this.createCheckboxWithLabel('<P>ause', false), { align: 'left' });

    this.rootSizer.add(checkboxCol, { align: 'top' });

    this.rootSizer.setOrigin(0, 0).layout();
  }

  createBackgroundPicker() {
    this.bgColors = ['#0d2b45', '#203c56', '#544e68', '#8d697a', '#d08159', '#ffaa5e', '#ffd4a3', '#ffecd6'];
    this.bgState = this.loadBgState();

    this.bgPickerEl = document.createElement('div');
    this.bgPickerEl.style.cssText = 'display:flex;flex-direction:column;align-items:flex-start;gap:2px;font-family:monogram;';

    this.bgPickerDom = this.add.dom(0, 0, this.bgPickerEl);
    this.bgPickerDom.setOrigin(0, 0);

    this.populateBgPicker();
    this.time.delayedCall(0, () => this.applyActiveBg());

    return this.bgPickerDom;
  }

  loadBgState() {
    try {
      const list = JSON.parse(localStorage.getItem('backgrounds') || '[]');
      const active = localStorage.getItem('activeBg') || 'color:#0d2b45';
      console.log('[bg] loadBgState', { listLen: list.length, ids: list.map(b => b.id), active });
      return { list, active };
    } catch (e) {
      console.warn('[bg] loadBgState parse failed', e);
      return { list: [], active: 'color:#0d2b45' };
    }
  }

  saveBgState() {
    try {
      localStorage.setItem('backgrounds', JSON.stringify(this.bgState.list));
      localStorage.setItem('activeBg', this.bgState.active);
      console.log('[bg] saveBgState ok', { listLen: this.bgState.list.length, active: this.bgState.active });
    } catch (e) {
      console.warn('[bg] saveBgState FAILED (likely quota)', e);
      throw e;
    }
  }

  applyActiveBg() {
    const game = this.scene.get('GameScene');
    if (!game) { console.warn('[bg] applyActiveBg: no GameScene'); return; }
    const [type, value] = this.bgState.active.split(/:(.+)/);
    console.log('[bg] applyActiveBg', { type, value });
    if (type === 'color') {
      game.events.emit('clearBackgroundImage');
      game.cameras.main.setBackgroundColor(value);
    } else if (type === 'image') {
      const bg = this.bgState.list.find(b => b.id === value);
      if (bg) {
        console.log('[bg] applyActiveBg emitting setBackgroundImage', bg.id, 'dataURL len=', bg.dataURL?.length);
        game.events.emit('setBackgroundImage', { id: bg.id, dataURL: bg.dataURL });
      } else {
        console.warn('[bg] applyActiveBg: active id not in list, falling back to color');
        this.bgState.active = 'color:' + this.bgColors[0];
        this.saveBgState();
        game.cameras.main.setBackgroundColor(this.bgColors[0]);
      }
    }
  }

  populateBgPicker() {
    const TILE_W = 25, TILE_H = 20;
    this.bgPickerEl.innerHTML = '';

    const baseTileCss = `width:${TILE_W}px;height:${TILE_H}px;flex:0 0 auto;box-sizing:border-box;cursor:pointer;background-size:cover;background-position:center;`;
    const selectedOutline = 'outline:2px solid #f9a875;outline-offset:-2px;';
    const rowCss = 'display:flex;flex-direction:row;flex-wrap:nowrap;gap:0;align-items:center;';

    const colorRow = document.createElement('div');
    colorRow.style.cssText = rowCss;
    this.bgColors.forEach(color => {
      const tile = document.createElement('div');
      const isActive = this.bgState.active === 'color:' + color;
      tile.style.cssText = baseTileCss + `background:${color};` + (isActive ? selectedOutline : '');
      tile.title = color;
      tile.addEventListener('pointerdown', () => {
        this.bgState.active = 'color:' + color;
        this.saveBgState();
        const game = this.scene.get('GameScene');
        game.events.emit('clearBackgroundImage');
        game.cameras.main.setBackgroundColor(color);
        this.populateBgPicker();
      });
      colorRow.appendChild(tile);
    });
    this.bgPickerEl.appendChild(colorRow);

    const imageRow = document.createElement('div');
    imageRow.style.cssText = rowCss;

    this.bgState.list.forEach(bg => {
      const tile = document.createElement('div');
      const isActive = this.bgState.active === 'image:' + bg.id;
      tile.style.cssText = baseTileCss + `background-image:url(${bg.dataURL});` + (isActive ? selectedOutline : '');
      tile.title = 'Background ' + bg.id + ' (right-click to remove)';
      tile.addEventListener('pointerdown', () => {
        this.bgState.active = 'image:' + bg.id;
        this.saveBgState();
        this.scene.get('GameScene').events.emit('setBackgroundImage', { id: bg.id, dataURL: bg.dataURL });
        this.populateBgPicker();
      });
      tile.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.removeBackground(bg.id);
      });
      imageRow.appendChild(tile);
    });

    const plus = document.createElement('div');
    const plusBaseCss = baseTileCss + 'border:1px dashed #f9a875;color:#f9a875;display:flex;align-items:center;justify-content:center;font-size:13px;line-height:1;background:rgba(249,168,117,0.12);';
    plus.style.cssText = plusBaseCss;
    plus.textContent = '+';
    plus.title = 'Drop an image file here to add a custom background';

    plus.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      plus.style.cssText = plusBaseCss + 'background:rgba(249,168,117,0.5);border-style:solid;';
    });
    plus.addEventListener('dragleave', (e) => {
      e.stopPropagation();
      plus.style.cssText = plusBaseCss;
    });
    plus.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      plus.style.cssText = plusBaseCss;
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) this.addBackgroundFromFile(file);
    });

    imageRow.appendChild(plus);
    this.bgPickerEl.appendChild(imageRow);

    const colsW = this.bgColors.length * TILE_W;
    const imgsW = (this.bgState.list.length + 1) * TILE_W;
    const totalW = Math.max(colsW, imgsW);
    const totalH = TILE_H * 2 + 2;
    this.bgPickerEl.style.width = totalW + 'px';
    this.bgPickerEl.style.height = totalH + 'px';
    this.bgPickerDom.width = totalW;
    this.bgPickerDom.height = totalH;
    if (this.rootSizer) this.rootSizer.layout();
  }

  removeBackground(id) {
    this.bgState.list = this.bgState.list.filter(b => b.id !== id);
    if (this.bgState.active === 'image:' + id) {
      this.bgState.active = 'color:' + this.bgColors[0];
      const game = this.scene.get('GameScene');
      game.events.emit('clearBackgroundImage');
      game.cameras.main.setBackgroundColor(this.bgColors[0]);
    }
    this.saveBgState();
    this.populateBgPicker();
  }

  addBackgroundFromFile(file) {
    console.log('[bg] addBackgroundFromFile', file.name, file.type, file.size);
    if (!file.type.startsWith('image/')) { console.warn('[bg] not an image, ignoring'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataURL = e.target.result;
      const id = 'bg-' + Date.now();
      console.log('[bg] read complete, pushing', id, 'dataURL len=', dataURL.length);
      this.bgState.list.push({ id, dataURL });
      this.bgState.active = 'image:' + id;
      try {
        this.saveBgState();
      } catch (err) {
        console.warn('[bg] saveBgState threw, rolling back');
        this.bgState.list.pop();
        return;
      }
      this.scene.get('GameScene').events.emit('setBackgroundImage', { id, dataURL });
      this.populateBgPicker();
    };
    reader.readAsDataURL(file);
  }

  createSliderWithLabel(sizer, labelText, initialValue, minValue, maxValue, useDecimals) {
    const sliderWidth = 80; // Fixed width for all sliders

    const box = this.rexUI.add.sizer({
      orientation: 'y',
      space: {
        bottom: 2,
      },
    });
    const label = this.add.text(0, 0, labelText, {
      fontFamily: 'monogram',
      fontSize: FONT_SIZE,
      color: hexToWebColor(TEXT_COLOR),
    });

    const valueText = this.add.text(0, 0, `${initialValue}`, {
      fontFamily: 'monogram',
      fontSize: FONT_SIZE,
      color: hexToWebColor(TEXT_COLOR),
    });

    const slider = this.rexUI.add.slider({
      width: sliderWidth,
      height: 12,
      track: this.rexUI.add.roundRectangle(0, 0, 0, 0, 6, PRIMARY_COLOR),
      thumb: this.rexUI.add.roundRectangle(0, 0, 0, 0, 6, ACCENT_COLOR),
      value: (initialValue - minValue) / (maxValue - minValue),
      easeValue: { duration: 250 },
      valuechangeCallback: function (value) {
        let rawValue = Phaser.Math.Linear(minValue, maxValue, value);
        let adjustedValue = useDecimals ? Math.round(rawValue * 20) / 20 : Math.round(rawValue);
        valueText.setText(adjustedValue.toFixed(useDecimals ? 2 : 0));
        this.scene.events.emit('sliderChanged', { label: labelText, value: adjustedValue });
      },
    }).layout();
    slider.minValue = minValue
    slider.maxValue = maxValue

    box.setInteractive()
    box.on('pointerover', () => {
      this.game.canvas.classList.add('slider-hover-cursor');
    })

    box.on('pointerout', () => {
      this.game.canvas.classList.remove('slider-hover-cursor');
    })

    box.add(valueText);
    box.add(slider);
    box.add(label);
    sizer.add(box)

    return slider
  }

  setSliderValue(slider, value)
  {
    if (!slider) return
    const minValue = slider.minValue
    const maxValue = slider.maxValue
    value = (value - minValue) / (maxValue - minValue)
    slider.setValue(value).layout()
  }

  createCheckboxWithLabel(labelText, initialValue) {
    const box = this.rexUI.add.sizer({
      orientation: 'x',
      space: {
        right: 5,
        item: 3
      },
    });

    const label = this.add.text(0, 0, labelText, {
      fontFamily: 'monogram',
      fontSize: FONT_SIZE,
      color: hexToWebColor(TEXT_COLOR)
    })

    var checkbox = this.add.rexCheckbox(0, 0, 14, 14, {
      color: PRIMARY_COLOR,
      circleBox: true,
      animationDuration: 200
    })

    checkbox.on('valuechange', (value) => {
      this.scene.get('GameScene').events.emit(`UI_toggle_${labelText}`, value);
    });

    box.add(label, { align: 'center' })
    box.add(checkbox, { align: 'center' })
    box.layout()


    this.scene.get('GameScene').events.on('pause', (value) => {
      if(labelText == '<P>ause') {
        checkbox.setChecked(value)
      }
    })
    this.scene.get('GameScene').events.on('reverse', (value) => {
      if(labelText == '<R>everse') {
        checkbox.setChecked(value)
      }
    })
    this.scene.get('GameScene').events.on('yoyo', (value) => {
      if(labelText == '<Y>oyo') {
        checkbox.setChecked(value)
      }
    })


    return box
  }

  createSmallButton(label, onClickCallback) {
    const button = this.rexUI.add.label({
      width: 54,
      height: 22,
      background: this.rexUI.add.roundRectangle(0, 0, 0, 0, 4, PRIMARY_COLOR),
      text: this.add.text(0, 0, label, {
        fontFamily: 'm5x7',
        fontSize: '13px',
        color: `#${TEXT_COLOR.toString(16)}`,
      }),
      padding: { x: 6, y: 3 },
      align: 'center'
    })
      .setInteractive()
      .on('pointerdown', onClickCallback)
      .on('pointerover', () => {
        button.setScale(1.05);
        this.game.canvas.classList.add('pointer-cursor');
      })
      .on('pointerout', () => {
        button.setScale(1);
        this.game.canvas.classList.remove('pointer-cursor');
      });
    return button;
  }

  createButton(label, onClickCallback, width = 120) {
    const button = this.rexUI.add.label({
      width,
      height: 30,
      background: this.rexUI.add.roundRectangle(0, 0, 0, 0, 6, PRIMARY_COLOR),
      fontSize: FONT_SIZE,
      text: this.add.text(0, 0, label, {
        fontFamily: 'm5x7',
        fontSize: FONT_SIZE,
        color: `#${TEXT_COLOR.toString(16)}`,
      }),
      padding: { x: 10, y: 5 },
      align: 'center'
    })
      .setInteractive()
      .on('pointerdown', onClickCallback)
      .on('pointerover', () => {
        button.setScale(1.05);
        this.game.canvas.classList.add('pointer-cursor');
      })
      .on('pointerout', () => {
        button.setScale(1);
        this.game.canvas.classList.remove('pointer-cursor');
      });

    return button;
  }

}

export default UiScene