class AnimatedSprite extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, textureKey) {
    super(scene, x, y)

    const frameWidth = 32
    const frameHeight = 32
    // this.textureKey = 'blacksmith'
    this.spritesheetKey = 'blacksmith'
    this.startFrame = 1
    this.endFrame = 10
    this.frameRate = 10
    this.posX = x
    this.posY = y

    this.scene = scene;

    this.scene.load.spritesheet(this.spritesheetKey, 'assets/bored_01.png', { frameWidth: 32, frameHeight: 32 })
  }

  initialize() {
    this.scene.anims.create({
      key: 'walk',
      frames: this.anims.generateFrameNumbers(this.spritesheetKey),
      frameRate: 10,
      repeat: -1,
    })

    // const sprite = this.scene.add.sprite(200, 300, 'blacksmith').setScale(10)
    this.setScale(10)
    this.play('walk')
  }
}

export default AnimatedSprite