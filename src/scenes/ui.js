import { ACCENT_COLOR, BACKGROUND_COLOR, PRIMARY_COLOR, TEXT_COLOR } from "../consts";

class UiScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UiScene', active: true });
  }

  preload() {
    this.load.plugin('rexcheckboxplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexcheckboxplugin.min.js', true);
  }

  create() {

    const uiHeight = 100;
    const gameWidth = this.sys.game.config.width;
    const gameHeight = this.sys.game.config.height;

    // Create a graphics object for the UI background
    const uiGraphics = this.add.graphics();

    // Set the fill color for the UI background
    uiGraphics.fillStyle(BACKGROUND_COLOR, 1); // Black color, fully opaque

    // Draw the UI background rectangle
    uiGraphics.fillRect(
      0,                      // x position, aligned to the left
      gameHeight - uiHeight,  // y position, 100 pixels from the bottom
      gameWidth,              // width of the UI background
      uiHeight                // height of the UI background
    );

    // Set the line style for the top border (e.g., 2 pixels thick, white color)
    uiGraphics.lineStyle(2, ACCENT_COLOR, 1); // White color, fully opaque

    // Draw the top border line
    uiGraphics.lineBetween(
      0, gameHeight - uiHeight, // Starting point (x1, y1)
      gameWidth, gameHeight - uiHeight // Ending point (x2, y2)
    );


    this.createUi()


    const box = this.rexUI.add.sizer({
      orientation: 'x',
      space: {
        bottom: 5,
      },
    });

    // Create the 'Flip X' checkbox and its label
    box.add(this.createCheckboxWithLabel('Flip X', false)) // Position (400, 300) and initially unchecked

    // Create the 'Flip Y' checkbox and its label
    box.add(this.createCheckboxWithLabel('Y', false)) // Position (400, 350) and initially unchecked

    // Create a simple button
    let button = this.rexUI.add.label({
      width: 150,
      height: 20,
      background: this.rexUI.add.roundRectangle(0, 0, 0, 0, 20, PRIMARY_COLOR),
      fontSize: '20px',
      text: this.add.text(0, 0, 'Full Screen', {
        fontFamily: 'monogram',
        fontSize: 30,
        color: `#${TEXT_COLOR.toString(16)}`,
      }),
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 },
      align: 'center'
    }).setInteractive()
      .on('pointerdown', () => this.toggleFullScreen());


    //   let button = this.rexUI.add.label({
    //     width: 100,
    //     height: 40,
    //

    //     align: 'center',
    //     text: this.add.text(0, 0, 'Full screen', {
    //         fontSize: 18
    //     }),
    // })

    box.add(button)

    box.setPosition(this.game.config.width - 200, this.game.config.height - 30).layout()
  }

  toggleFullScreen() {
    if (this.scale.isFullscreen) {
      // Exit fullscreen
      this.scale.stopFullscreen();
    } else {
      // Start fullscreen
      this.scale.startFullscreen();
    }
  }

  createUi() {
    const sizer = this.rexUI.add.sizer({
      x: 20,
      y: this.game.config.height - 60,
      orientation: 'x',
      space: {
        item: 5,
      },
    });

    // Add the 'Scale' slider and label to the sizer
    this.createSliderWithLabel(sizer, 'Scale', 3, 0.25, 10, true); // Initial value for 'Scale' slider
    this.createSliderWithLabel(sizer, 'Cols', 4, 1, 30); // Initial value for 'Scale' slider
    this.createSliderWithLabel(sizer, 'Rows', 4, 1, 30); // Initial value for 'Scale' slider
    // Add some vertical space between the sliders
    sizer.addSpace(20);

    // Add the 'Frame Rate' slider and label to the sizer
    this.createSliderWithLabel(sizer, 'Frame Rate', 10, 0, 120);

    // Layout the sizer
    sizer.setOrigin(0, 0).layout();
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
      fontSize: '24px',
      color: '#' + PRIMARY_COLOR.toString(16),
    });

    const valueText = this.add.text(0, 0, `${initialValue}`, {
      fontSize: '16px',
      color: '#' + PRIMARY_COLOR.toString(16),
    });

    const slider = this.rexUI.add.slider({
      width: sliderLength,
      height: 10,
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

    box.add(valueText);
    box.add(slider);
    box.add(label);
    sizer.add(box)
  }

  createCheckboxWithLabel(labelText, initialValue) {
    const box = this.rexUI.add.sizer({
      orientation: 'x',
      space: {
        left: 5,
        right: 5,
      },
    });

    const label = this.add.text(0, 0, labelText, {
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(0.5, 0.5);

    var checkbox = this.add.rexCheckbox(0, 0, 20, 20, {
      color: 0x005cb2,
      circleBox: true,

      //checked: true,
      animationDuration: 200
    });
    box.add(label)
    box.add(checkbox)
    box.layout()
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