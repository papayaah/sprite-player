class AnimatedSprite extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, textureKey) {
    // Pass a default texture key if none provided to ensure proper initialization
    super(scene, x, y, textureKey || '__DEFAULT')

    this.spritesheetKey = 'blacksmith'
    this.startFrame = 1
    this.endFrame = 10
    this.frameRate = 10
    this.posX = x
    this.posY = y

    this.scene = scene;

    // Load the spritesheet if it hasn't been loaded yet
    if (!this.scene.textures.exists(this.spritesheetKey)) {
        this.scene.load.spritesheet(this.spritesheetKey, 'assets/bored_01.png', { frameWidth: 32, frameHeight: 32 })
    }
  }

  initialize() {
    // Check if the animation already exists to avoid warnings/errors
    if (!this.scene.anims.exists('walk')) {
      this.scene.anims.create({
        key: 'walk',
        frames: this.scene.anims.generateFrameNumbers(this.spritesheetKey),
        frameRate: 10,
        repeat: -1,
      })
    }

    this.setScale(10)
    // Only play if the texture is loaded and animation exists
    if (this.scene.textures.exists(this.spritesheetKey)) {
        this.play('walk')
    }
  }
}

export default AnimatedSprite