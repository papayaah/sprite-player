import BackgroundChooser from "../backgroundChooser";
import { ACCENT_COLOR, BACKGROUND_COLOR, FONT_SIZE, PRIMARY_COLOR, TEXT_COLOR, UI_HEIGHT } from "../consts";
import {getSizerTotalWidth, hexToWebColor} from './utils'

class UiScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UiScene', active: true });
    this.cols = 4
    this.rows = 4
  }

  preload() {
    this.load.plugin('rexcheckboxplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexcheckboxplugin.min.js', true);
  }

  create() {
    if (!this.plugins.isActive('rexcheckboxplugin')) return

    this.scene.get('GameScene').events.on('textureAdded', (data) => {
      console.time("uiTextureAdded")

      let { storageKey } = data
      this.storageKey = storageKey
      let existingData = localStorage.getItem(this.storageKey)
      existingData = existingData ? JSON.parse(existingData) : {}
      this.cols = existingData.numCols || this.cols
      this.rows = existingData.numRows || this.rows

      this.setSliderValue(this.colSlider, this.cols)
      this.setSliderValue(this.rowSlider, this.rows)

      console.timeEnd("uiTextureAdded")
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
        fontFamily: 'monogram',
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

  createUi() {
    const sizer = this.rexUI.add.sizer({
      x: 20,
      y: this.game.config.height - 80,
      orientation: 'x',
      space: {
        item: 5,
      },
    });

    // Add the 'Scale' slider and label to the sizer
    this.createSliderWithLabel(sizer, 'Scale', 3, 0.25, 10, true); // Initial value for 'Scale' slider
    this.colSlider = this.createSliderWithLabel(sizer, 'Cols', this.cols, 1, 30); // Initial value for 'Scale' slider
    this.rowSlider = this.createSliderWithLabel(sizer, 'Rows', this.rows, 1, 30); // Initial value for 'Scale' slider
    // Add some vertical space between the sliders
    sizer.addSpace(20);

    // Add the 'Frame Rate' slider and label to the sizer
    this.createSliderWithLabel(sizer, 'Frame Rate', 10, 0, 120);

    // Layout the sizer
    sizer.setOrigin(0, 0).layout();

    const box = this.rexUI.add.sizer({
      orientation: 'x',
      space: {
        top: 30,
        left: 10,
        bottom: 10,
      },
    })
    box.add(this.createCheckboxWithLabel('<R>everse', false))
    box.add(this.createCheckboxWithLabel('<Y>oyo', false))
    box.add(this.createCheckboxWithLabel('<P>ause', false))

    const ybox = this.rexUI.add.sizer({
      orientation: 'y',
    })
    ybox.add(new BackgroundChooser(this, 0, 0))
    ybox.add(box).layout()

    sizer.add(ybox).layout()
  }

  createSliderWithLabel(sizer, labelText, initialValue, minValue, maxValue, useDecimals) {
    const baseSliderLength = 50; // Base length for the slider
    const sliderLength = baseSliderLength + maxValue / 2; // Scale slider length based on maxValue

    const box = this.rexUI.add.sizer({
      orientation: 'y',
      space: {
        bottom: 5,
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
      width: sliderLength,
      height: 20,
      track: this.rexUI.add.roundRectangle(0, 0, 0, 0, 10, PRIMARY_COLOR),
      thumb: this.rexUI.add.roundRectangle(0, 0, 0, 0, 10, ACCENT_COLOR),
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
        item: 5
      },
    });

    const label = this.add.text(0, 0, labelText, {
      fontFamily: 'monogram',
      fontSize: FONT_SIZE,
      color: hexToWebColor(TEXT_COLOR)
    })

    var checkbox = this.add.rexCheckbox(0, 0, 20, 20, {
      color: PRIMARY_COLOR,
      circleBox: true,
      animationDuration: 200
    })
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

    // Create the checkbox
    // const checkbox = this.rexUI.add.checkBox({
    //     x: x + 40,
    //     y: y,
    //     background: this.rexUI.add.roundRectangle(0, 0, 20, 20, 10, 0xCCCCCC),
    //     icon: this.rexUI.add.roundRectangle(0, 0, 10, 10, 5, 0xFFFFFF),
    //     checked: initialValue,
    //     space: {
    //         left: 10,
    //         right: 10,
    //         top: 10,
    //         bottom: 10,
    //         icon: 10
    //     }
    // }).setOrigin(0.5, 0.5).layout();

    // // Add logic here to handle the checkbox change event, if needed
    // checkbox.on('changed', (checkbox, value) => {
    //     console.log(`${labelText} Checkbox: ${value}`);
    //     // Additional logic to handle flip X or Y
    // });
  }

}

export default UiScene