import { ACCENT_COLOR } from "./consts";

const MAX_WIDTH_OFFSET = 80
const MAX_HEIGHT = 100

class MiniSheet {
  constructor(scene) {
    this.scene = scene

    scene.scene.get('UiScene').events.on('sliderChanged', (sliderData) => {
      if (!this.gridGraphics) return

      if (sliderData.label == 'Cols') {
        this.cols = sliderData.value;
        this.drawGrid()
        this.updateFrameHighlight()
      }

      if (sliderData.label == 'Rows') {
        this.rows = sliderData.value;
        this.drawGrid()
        this.updateFrameHighlight()
      }
    })

    scene.scene.get('PlayerScene').events.on('currentAnimation', (animationData) => {
      this.setCurrentFrame(animationData.frameIndex - 1);
    })

    scene.scene.get('GameScene').events.on('textureAdded', (data) => {
      let { textureKey, storageKey } = data
      this.textureKey = textureKey
      this.storageKey = storageKey
      let existingData = localStorage.getItem(this.storageKey);
      existingData = existingData ? JSON.parse(existingData) : {};
      this.cols = existingData.numCols || this.cols
      this.rows = existingData.numRows || this.rows
      this.imageHeight = existingData.imageHeight
      this.imageWidth = existingData.imageWidth
      this.destroyExisting()
      this.createMiniSheet()
      //this.setCurrentFrame(0);
    });
  }

  destroyExisting() {
    if (this.container) {
      this.container.destroy(); // This will remove the container and its children
    }
  }

  calculateScale() {
    const gameWidth = this.scene.game.config.width - MAX_WIDTH_OFFSET;
    const scaleByWidth = gameWidth / this.imageWidth;
    const scaleByHeight = MAX_HEIGHT / this.imageHeight;
    return Math.min(scaleByWidth, scaleByHeight);
  }

  createMiniSheet() {
    const scale = this.calculateScale();

    // Create a container for the spritesheet and the grid
    this.container = this.scene.add.container(10, 10);

    // Create a miniature version of the spritesheet
    let miniSheet = this.scene.add.sprite(0, 0, this.textureKey).setScale(scale).setOrigin(0, 0);

    // Draw the grid
    let gridGraphics = this.scene.add.graphics({ lineStyle: { width: 1, color: ACCENT_COLOR } });

    this.gridGraphics = gridGraphics
    this.miniSheet = miniSheet

    this.frameHighlight = this.scene.add.graphics({ lineStyle: { width: 2, color: ACCENT_COLOR } });
    this.container.add(this.frameHighlight);
    this.container.add(gridGraphics);
    this.container.add(miniSheet);

    this.drawGrid()
  }

  drawGrid() {
    this.gridGraphics.clear();

    const scale = this.calculateScale()

    let miniFrameWidth = (this.imageWidth / this.cols) * scale
    let miniFrameHeight = (this.imageHeight / this.rows) * scale

    for (let i = 0; i <= this.cols; i++) {
        this.gridGraphics.lineBetween(
            i * miniFrameWidth, 0,
            i * miniFrameWidth, this.miniSheet.displayHeight
        );
    }

    for (let j = 0; j <= this.rows; j++) {
        this.gridGraphics.lineBetween(
            0, j * miniFrameHeight,
            this.miniSheet.displayWidth, j * miniFrameHeight
        );
    }
  }

  updateFrameHighlight() {
    const gameWidth = this.scene.game.config.width - MAX_WIDTH_OFFSET;
    const scaleByWidth = gameWidth / this.imageWidth;
    const scaleByHeight = MAX_HEIGHT / this.imageHeight;
    const scale = Math.min(scaleByWidth, scaleByHeight);
    const frameWidth = this.imageWidth / this.cols;
    const frameHeight = this.imageHeight / this.rows;
    const scaledFrameWidth = frameWidth * scale;
    const scaledFrameHeight = frameHeight * scale;
    const highlightX = (this.currentFrame % this.cols) * scaledFrameWidth;
    const highlightY = Math.floor(this.currentFrame / this.cols) * scaledFrameHeight;

    this.frameHighlight.clear();
    this.frameHighlight.fillStyle(ACCENT_COLOR, 0.5); // Use the ACCENT_COLOR with 50% opacity
    this.frameHighlight.fillRect(highlightX, highlightY, scaledFrameWidth, scaledFrameHeight);
}



  // Call this method to change the current frame
  setCurrentFrame(frameIndex) {
    this.currentFrame = frameIndex;
    this.updateFrameHighlight();
  }
}

export default MiniSheet;
