import { ACCENT_COLOR, BACKGROUND_COLOR } from "./consts";

const content = `Hi there! Drag and drop any spritesheet file and use the settings below to adjust.`;

class BubbleText {
  constructor(scene) {
    this.scene = scene
  }

  initialize() {
    this.textBox = createTextBox(this.scene, 220, 150, {
      wrapWidth: 500,
    })
      .start(content, 10)
  }

  destroy() {
    this.textBox.destroy()
  }
}

const GetValue = Phaser.Utils.Objects.GetValue;
var createTextBox = function (scene, x, y, config) {
  //const portraitSprite = scene.add.sprite(0, 0, 'portrait')
  //portraitSprite.flipX = true
  var wrapWidth = GetValue(config, 'wrapWidth', 0);
  var fixedWidth = GetValue(config, 'fixedWidth', 0);
  var fixedHeight = GetValue(config, 'fixedHeight', 0);
  var textBox = scene.rexUI.add.textBox({
    x: x,
    y: y,

    background: CreateSpeechBubbleShape(scene)
      .setFillStyle(BACKGROUND_COLOR, 1)
      .setStrokeStyle(2, ACCENT_COLOR, 1),

    // need to be face
    // icon: scene.rexUI.add.roundRectangle(0, 0, 2, 2, 20, ACCENT_COLOR),
    icon: scene.add.sprite(0, 0, 'portrait'),

    // text: getBuiltInText(scene, wrapWidth, fixedWidth, fixedHeight),
    text: getBBcodeText(scene, wrapWidth, fixedWidth, fixedHeight),

    action: scene.add.image(0, 0, 'nextPage').setTint(ACCENT_COLOR).setVisible(false),

    space: {
      left: 10, right: 10, top: 10, bottom: 25,
      icon: 10,
      text: 10,
    }
  })
    .setOrigin(0, 1)
    .setScale(0.75)
    .layout();

  textBox
    .setInteractive()
    .on('pointerdown', function () {
      var icon = this.getElement('action').setVisible(false);
      this.resetChildVisibleState(icon);
      if (this.isTyping) {
        this.stop(true);
      } else {
        this.typeNextPage();
      }
    }, textBox)
    .on('pageend', function () {
      if (this.isLastPage) {
        return;
      }

      var icon = this.getElement('action').setVisible(true);
      this.resetChildVisibleState(icon);
      icon.y -= 30;
      var tween = scene.tweens.add({
        targets: icon,
        y: '+=30', // '+=100'
        ease: 'Bounce', // 'Cubic', 'Elastic', 'Bounce', 'Back'
        duration: 500,
        repeat: 0, // -1: infinity
        yoyo: false
      });
    }, textBox)
  //.on('type', function () {
  //})

  return textBox;
}

var getBuiltInText = function (scene, wrapWidth, fixedWidth, fixedHeight) {
  return scene.add.text(0, 0, '', {
    fontSize: '24px',
    wordWrap: {
      width: wrapWidth
    },
    maxLines: 3
  })
    .setFixedSize(fixedWidth, fixedHeight);
}

var getBBcodeText = function (scene, wrapWidth, fixedWidth, fixedHeight) {
  return scene.rexUI.add.BBCodeText(0, 0, '', {
    fixedWidth: fixedWidth,
    fixedHeight: fixedHeight,
    fontFamily: 'monogram',
    fontSize: '32px',
    wrap: {
      mode: 'word',
      width: wrapWidth
    },
    maxLines: 3
  })
}

var CreateSpeechBubbleShape = function (scene, fillColor, strokeColor) {
  return scene.rexUI.add.customShapes({
    create: { lines: 1 },
    update: function () {
      var radius = 20;
      var indent = 15;

      var left = 0, right = this.width,
        top = 0, bottom = this.height, boxBottom = bottom - indent;
      this.getShapes()[0]
        .lineStyle(this.lineWidth, this.strokeColor, this.strokeAlpha)
        .fillStyle(this.fillColor, this.fillAlpha)
        // top line, right arc
        .startAt(left + radius, top).lineTo(right - radius, top).arc(right - radius, top + radius, radius, 270, 360)
        // right line, bottom arc
        .lineTo(right, boxBottom - radius).arc(right - radius, boxBottom - radius, radius, 0, 90)
        // bottom indent
        .lineTo(left + 60, boxBottom).lineTo(left + 50, bottom).lineTo(left + 40, boxBottom)
        // bottom line, left arc
        .lineTo(left + radius, boxBottom).arc(left + radius, boxBottom - radius, radius, 90, 180)
        // left line, top arc
        .lineTo(left, top + radius).arc(left + radius, top + radius, radius, 180, 270)
        .close()
    }
  })
}

export default BubbleText