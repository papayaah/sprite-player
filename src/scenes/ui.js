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

  createExportInput(placeholder) {
    const input = this.add.dom(0, 0, 'input', [
      'background:#203c56',
      'color:#fff6d3',
      'border:1px solid #f9a875',
      'font-family:monogram',
      'font-size:13px',
      'padding:2px 5px',
      'width:108px',
      'outline:none',
      'box-sizing:border-box',
    ].join(';'));
    input.node.placeholder = placeholder;
    input.width = 112;
    input.height = 22;
    input.setOrigin(0, 0.5);
    return input;
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
    const rootSizer = this.rexUI.add.sizer({
      x: 20,
      y: this.game.config.height - UI_HEIGHT + 15,
      orientation: 'x',
      space: { item: 15 }
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
      space: { item: 6 }
    });

    sequenceCol.add(this.createButton('Play Sequence', () => {
      this.scene.get('GameScene').events.emit('playSequence');
    }), { align: 'left' });

    sequenceCol.add(this.createButton('Clear Sequence', () => {
      this.scene.get('GameScene').sequence.clear();
    }), { align: 'left' });

    this.exportNameInput = this.createExportInput('sprite_name');
    sequenceCol.add(this.exportNameInput, { align: 'left' });

    this.exportSuffixInput = this.createExportInput('suffix (optional)');
    sequenceCol.add(this.exportSuffixInput, { align: 'left' });

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
    sequenceCol.add(exportRow, { align: 'left' });

    this.exportHintText = this.add.text(0, 0, '', {
      fontFamily: 'm5x7',
      fontSize: '13px',
      color: hexToWebColor(ACCENT_COLOR),
    });
    this.exportHintText.setAlpha(0);
    sequenceCol.add(this.exportHintText, { align: 'left' });

    rootSizer.add(sequenceCol, { align: 'top' });

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
    const bgLabel = this.add.text(0, 0, 'Background:', {
      fontFamily: 'monogram',
      fontSize: FONT_SIZE,
      color: hexToWebColor(TEXT_COLOR)
    });
    bottomRow.add(bgLabel);
    bottomRow.add(this.createBackgroundPicker());
    bottomRow.add(this.infoText);
    sliderCol.add(bottomRow, { align: 'left' });

    rootSizer.add(sliderCol, { align: 'top' });

    // COLUMN 2: Animation Controls
    const checkboxCol = this.rexUI.add.sizer({
      orientation: 'y',
      space: { item: 10 }
    });
    checkboxCol.add(this.createCheckboxWithLabel('<R>everse', false), { align: 'left' });
    checkboxCol.add(this.createCheckboxWithLabel('<Y>oyo', false), { align: 'left' });
    checkboxCol.add(this.createCheckboxWithLabel('<P>ause', false), { align: 'left' });

    rootSizer.add(checkboxCol, { align: 'top' });

    rootSizer.setOrigin(0, 0).layout();
  }

  createBackgroundPicker() {
    const colors = ['#0d2b45', '#203c56', '#544e68', '#8d697a', '#d08159', '#ffaa5e', '#ffd4a3', '#ffecd6'];
    const pickerSizer = this.rexUI.add.sizer({
      orientation: 'x',
      space: { item: 0 }
    });

    colors.forEach(color => {
      const rect = this.add.rectangle(0, 0, 25, 20, Phaser.Display.Color.HexStringToColor(color).color)
        .setInteractive()
        .on('pointerdown', () => {
          this.scene.get('GameScene').cameras.main.setBackgroundColor(color);
        });
      pickerSizer.add(rect);
    });

    return pickerSizer;
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

    box.add(label)
    box.add(checkbox)
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

  createButton(label, onClickCallback) {
    const button = this.rexUI.add.label({
      width: 120,
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