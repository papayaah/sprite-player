import { ACCENT_COLOR, TEXT_COLOR } from "./consts";

const MAX_WIDTH_OFFSET = 170
const MAX_HEIGHT = 140

class MiniSheet {
  constructor(scene) {
    this.scene = scene
    this.gridTexts = []

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

    scene.scene.get('GameScene').events.on('currentAnimation', (animationData) => {
      this.setCurrentFrame(animationData.frameIndex - 1, animationData.frameName);
    })

    scene.scene.get('GameScene').events.on('textureAdded', (data) => {
      // console.time("createMiniSheet")
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
      // console.timeEnd("createMiniSheet")
    })

    scene.scene.get('GameScene').events.on('thumbSelected', () => {
      this.selectedCells = [];
      this.sequencedCells = new Set();
      if (this.highlightsGraphics) this.drawSelectedHighlights();
    })

    scene.scene.get('GameScene').events.on('cellSequenceChanged', (frames) => {
      this.sequencedCells = new Set(frames);
      if (this.highlightsGraphics) this.drawSelectedHighlights();
    })
  }

  destroyExisting() {
    if (this.container) {
      this.container.destroy();
    }
    // gridTexts are NOT inside the container, so destroy them separately
    this.gridTexts.forEach(t => t.destroy());
    this.gridTexts = [];
  }

  calculateScale() {
    const gameWidth = this.scene.game.config.width - MAX_WIDTH_OFFSET;
    const scaleByWidth = gameWidth / this.imageWidth;
    const scaleByHeight = MAX_HEIGHT / this.imageHeight;
    return Math.min(scaleByWidth, scaleByHeight);
  }

  createMiniSheet() {
    const scale = this.calculateScale();

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

    // Initialize selection properties
    this.isDragging = false;
    this.selectionStartCell = null;
    this.selectionEndCell = null;

    this.highlightsGraphics = this.scene.add.graphics({ fillStyle: { color: ACCENT_COLOR, alpha: 0.3 } });
    this.container.add(this.highlightsGraphics);

    // Add mouse event listeners
    let miniSheetWidth = (this.imageWidth) * scale
    let miniSheetHeight = (this.imageHeight) * scale
    this.container.setSize(miniSheetWidth, miniSheetHeight).setInteractive()
    this.scene.input.on('pointerdown', this.onDragStart, this);
    this.scene.input.on('pointermove', this.onDragMove, this);
    this.scene.input.on('pointerup', this.onDragEnd, this);

  }

  drawGrid() {
    // Clear the existing grid graphics
    this.gridGraphics.clear();

    const scale = this.calculateScale();
    let miniFrameWidth = (this.imageWidth / this.cols) * scale;
    let miniFrameHeight = (this.imageHeight / this.rows) * scale;

    // Batch line drawing operations
    this.gridGraphics.beginPath();
    for (let i = 0; i <= this.cols; i++) {
      let x = i * miniFrameWidth;
      this.gridGraphics.moveTo(x, 0);
      this.gridGraphics.lineTo(x, this.miniSheet.displayHeight);
    }

    for (let j = 0; j <= this.rows; j++) {
      let y = j * miniFrameHeight;
      this.gridGraphics.moveTo(0, y);
      this.gridGraphics.lineTo(this.miniSheet.displayWidth, y);
    }
    this.gridGraphics.strokePath();

    // Reuse or create text objects
    let cellNumber = 0;
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        let centerX = (col + 0.6) * miniFrameWidth;
        let centerY = (row + 0.4) * miniFrameHeight;

        let cellText;
        if (this.gridTexts[cellNumber]) {
          cellText = this.gridTexts[cellNumber];
          cellText.setPosition(centerX, centerY);
          cellText.setText(cellNumber.toString());
        } else {
          cellText = this.scene.add.text(centerX, centerY, cellNumber.toString(), {
            fontFamily: 'monogram',
            fontSize: '14px',
            color: `#${TEXT_COLOR.toString(16)}`,
          });
          cellText.setResolution(3);
          this.gridTexts.push(cellText);
          this.container.add(cellText); // must be inside container so it moves with it
        }
        cellNumber++;
      }
    }

    // Trim excess text objects if necessary
    if (this.gridTexts.length > cellNumber) {
      for (let i = cellNumber; i < this.gridTexts.length; i++) {
        this.gridTexts[i].destroy();
      }
      this.gridTexts.length = cellNumber;
    }
  }


  drawHighlights() {
    if (!this.isDragging) return;

    this.highlightsGraphics.clear();

    const scale = this.calculateScale();
    const miniFrameWidth = this.imageWidth / this.cols * scale;
    const miniFrameHeight = this.imageHeight / this.rows * scale;

    // Highlight selected cells
    for (let col = Math.min(this.selectionStartCell.col, this.selectionEndCell.col); col <= Math.max(this.selectionStartCell.col, this.selectionEndCell.col); col++) {
      for (let row = Math.min(this.selectionStartCell.row, this.selectionEndCell.row); row <= Math.max(this.selectionStartCell.row, this.selectionEndCell.row); row++) {
        this.highlightsGraphics.fillRect(col * miniFrameWidth, row * miniFrameHeight, miniFrameWidth, miniFrameHeight);
      }
    }
  }


  updateFrameHighlight() {
    if (!this.miniSheet) return;

    const scale = this.calculateScale();
    const scaledFrameWidth = (this.imageWidth / this.cols) * scale;
    const scaledFrameHeight = (this.imageHeight / this.rows) * scale;

    // currentFrameName is the actual spritesheet cell index — correct for both
    // full animations and custom sequences with non-contiguous / repeated frames
    const cell = this.currentFrameName !== undefined ? this.currentFrameName : this.currentFrame;
    const highlightX = (cell % this.cols) * scaledFrameWidth;
    const highlightY = Math.floor(cell / this.cols) * scaledFrameHeight;

    this.frameHighlight.clear();
    this.frameHighlight.fillStyle(ACCENT_COLOR, 0.5);
    this.frameHighlight.fillRect(highlightX, highlightY, scaledFrameWidth, scaledFrameHeight);
  }

  setCurrentFrame(frameIndex, frameName) {
    this.currentFrame = frameIndex;
    // frameName is the actual spritesheet cell number; use it so the cursor
    // follows the correct cell even when playing a non-sequential sequence
    this.currentFrameName = frameName !== undefined ? frameName : frameIndex;
    this.updateFrameHighlight();
  }

  getCellFromPointer(pointer) {
    const scale = this.calculateScale();
    const miniFrameWidth = (this.imageWidth / this.cols) * scale;
    const miniFrameHeight = (this.imageHeight / this.rows) * scale;
    const col = Math.floor((pointer.x - this.container.x) / miniFrameWidth);
    const row = Math.floor((pointer.y - this.container.y) / miniFrameHeight);
    return { col, row };
  }

  onDragStart(pointer) {
    const cell = this.getCellFromPointer(pointer);
    const isCmdOrCtrl = pointer.event && (pointer.event.ctrlKey || pointer.event.metaKey);

    if (cell.col >= 0 && cell.col < this.cols && cell.row >= 0 && cell.row < this.rows) {
      if (isCmdOrCtrl) {
        // Cmd/Ctrl+click: append this cell to the sequence queue
        const spritesheetKey = this.scene.player.spritesheetKey;
        const cellNumber = cell.row * this.cols + cell.col;
        if (!this.sequencedCells) this.sequencedCells = new Set();
        this.sequencedCells.add(cellNumber);
        this.drawSelectedHighlights();
        this.scene.events.emit('addCellToSequence', { spritesheetKey, frameIndex: cellNumber });
        this.isDragging = false;
      } else {
        // Normal click: drag rectangle selection for quick preview
        this.highlightsGraphics.clear();
        this.isDragging = true;
        this.selectionStartCell = cell;
        this.selectionEndCell = cell;
      }
    } else {
      this.isDragging = false;
    }
  }

  drawSelectedHighlights() {
    this.highlightsGraphics.clear();
    if (!this.sequencedCells || this.sequencedCells.size === 0) return;

    const scale = this.calculateScale();
    const miniFrameWidth = this.imageWidth / this.cols * scale;
    const miniFrameHeight = this.imageHeight / this.rows * scale;

    this.highlightsGraphics.fillStyle(ACCENT_COLOR, 0.5);
    this.sequencedCells.forEach(cellNumber => {
      const col = cellNumber % this.cols;
      const row = Math.floor(cellNumber / this.cols);
      this.highlightsGraphics.fillRect(col * miniFrameWidth, row * miniFrameHeight, miniFrameWidth, miniFrameHeight);
    });
  }

  onDragMove(pointer) {
    if (!this.isDragging) return;

    this.selectionEndCell = this.getCellFromPointer(pointer);
    this.drawHighlights();
  }

  onDragEnd(pointer) {
    if (!this.isDragging) return;

    const endCell = this.getCellFromPointer(pointer);

    // Check if the end cell is within the grid bounds
    if (endCell.col >= 0 && endCell.col < this.cols && endCell.row >= 0 && endCell.row < this.rows) {
      // Drag end is within a valid cell, proceed with selecting cells
      this.selectionEndCell = endCell;

      const minCol = Math.min(this.selectionStartCell.col, this.selectionEndCell.col);
      const maxCol = Math.max(this.selectionStartCell.col, this.selectionEndCell.col);
      const minRow = Math.min(this.selectionStartCell.row, this.selectionEndCell.row);
      const maxRow = Math.max(this.selectionStartCell.row, this.selectionEndCell.row);

      const selectedCells = [];
      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          const cellNumber = row * this.cols + col;
          selectedCells.push(cellNumber);
        }
      }
      this.selectedCells = selectedCells;
      this.scene.events.emit('cellsSelected', selectedCells);
    } else {
      // Drag end is outside valid cells, cancel the drag
      this.highlightsGraphics.clear();
      this.selectedCells = null;
    }

    this.isDragging = false;
  }


}

export default MiniSheet;
