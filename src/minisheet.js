import { ACCENT_COLOR } from "./consts";

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
      this.createMiniatureSheet();
      //this.setCurrentFrame(0);
    });
  }

  destroyExisting() {
    if (this.container) {
      this.container.destroy(); // This will remove the container and its children
    }
  }

  createMiniatureSheet() {
    const gameWidth = this.scene.game.config.width;
    const maxDimension = Math.max(this.imageWidth, this.imageHeight);
    const scale = gameWidth / maxDimension;

    // Create a container for the spritesheet and the grid
    this.container = this.scene.add.container(0, 300);

    // Create a miniature version of the spritesheet
    let miniSheet = this.scene.add.sprite(0, 0, this.textureKey).setScale(scale).setOrigin(0, 0);

    // Draw the grid
    let gridGraphics = this.scene.add.graphics({ lineStyle: { width: 1, color: ACCENT_COLOR } });
    let miniFrameWidth = (this.imageWidth / this.cols) * scale;
    let miniFrameHeight = (this.imageHeight / this.rows) * scale;

    for (let i = 0; i <= this.cols; i++) {
      gridGraphics.lineBetween(
        i * miniFrameWidth, 0,
        i * miniFrameWidth, miniSheet.displayHeight
      );
    }

    for (let j = 0; j <= this.rows; j++) {
      gridGraphics.lineBetween(
        0, j * miniFrameHeight,
        miniSheet.displayWidth, j * miniFrameHeight
      );
    }
    this.gridGraphics = gridGraphics
    this.miniSheet = miniSheet

    this.frameHighlight = this.scene.add.graphics({ lineStyle: { width: 2, color: ACCENT_COLOR } });
    this.container.add(this.frameHighlight);
    this.container.add(gridGraphics);
    this.container.add(miniSheet);
  }

  drawGrid() {
    this.gridGraphics.clear()

    const gameWidth = this.scene.game.config.width;
    const maxDimension = Math.max(this.imageWidth, this.imageHeight);
    const scale = gameWidth / maxDimension;

    let miniFrameWidth = (this.imageWidth / this.cols) * scale;
    let miniFrameHeight = (this.imageHeight / this.rows) * scale;

    for (let i = 0; i <= this.cols; i++) {
      this.gridGraphics.lineBetween(
        i * miniFrameWidth, 0,
        i * miniFrameWidth, this.miniSheet.displayHeight
      );
    }

    for (let j = 0; j <= this.rows; j++) {
      this.gridGraphics.lineBetween(
        0, j * miniFrameHeight,
        this. miniSheet.displayWidth, j * miniFrameHeight
      );
    }
  }

  updateFrameHighlight() {
    const gameWidth = this.scene.game.config.width;
    const maxDimension = Math.max(this.imageWidth, this.imageHeight);
    const scale = gameWidth / maxDimension;
    const frameWidth = this.imageWidth / this.cols;
    const frameHeight = this.imageHeight / this.rows;
    const scaledFrameWidth = frameWidth * scale;
    const scaledFrameHeight = frameHeight * scale;
    const highlightX = (this.currentFrame % this.cols) * scaledFrameWidth;
    const highlightY = Math.floor(this.currentFrame / this.cols) * scaledFrameHeight;

    this.frameHighlight.clear();
    this.frameHighlight.fillStyle(ACCENT_COLOR, 0.5); // Red color with 50% opacity
    this.frameHighlight.fillRect(highlightX, highlightY, scaledFrameWidth, scaledFrameHeight);
  }


  // Call this method to change the current frame
  setCurrentFrame(frameIndex) {
    this.currentFrame = frameIndex;
    this.updateFrameHighlight();
  }
}

export default MiniSheet;
