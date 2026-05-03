import { ACCENT_COLOR, TEXT_COLOR, UI_HEIGHT } from "./consts";

const MAX_WIDTH_OFFSET = 170
const MIN_CELL_PX = 20   // minimum rendered cell size so cells stay clickable

class MiniSheet {
  constructor(scene) {
    this.scene = scene
    this.gridTexts = []
    this._scrollY = 0

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
    this.scene.input.off('pointerdown', this.onDragStart, this);
    this.scene.input.off('pointermove', this.onDragMove, this);
    this.scene.input.off('pointerup', this.onDragEnd, this);
    this.scene.input.off('wheel', this._onWheel, this);

    if (this._maskGraphics) {
      this._maskGraphics.destroy();
      this._maskGraphics = null;
    }
    if (this.container) {
      this.container.destroy();
    }
    this.gridTexts.forEach(t => t.destroy());
    this.gridTexts = [];
  }

  maxDimensions() {
    const gameWidth  = this.scene.game.config.width;
    const gameHeight = this.scene.game.config.height;
    return {
      w: Math.floor((gameWidth  - MAX_WIDTH_OFFSET) * 0.72),
      h: Math.floor((gameHeight - UI_HEIGHT)        * 0.62),
    };
  }

  calculateScale() {
    const { w: maxW, h: maxH } = this.maxDimensions();
    const fitScale = Math.min(maxW / this.imageWidth, maxH / this.imageHeight);

    // Enforce minimum cell size so every cell is reachable by pointer
    const cellW = this.imageWidth / this.cols;
    const cellH = this.imageHeight / this.rows;
    const minScale = MIN_CELL_PX / Math.min(cellW, cellH);

    return Math.max(fitScale, minScale);
  }

  createMiniSheet() {
    const scale = this.calculateScale();
    this._scrollY = 0;

    // Visible viewport dimensions (content may be taller and scroll)
    const { w: maxW, h: maxH } = this.maxDimensions();
    this._visW = Math.min(this.imageWidth * scale, maxW);
    this._visH = Math.min(this.imageHeight * scale, maxH);

    this.container = this.scene.add.container(10, 10);

    // Clip content that overflows the visible viewport
    this._maskGraphics = this.scene.add.graphics();
    this._maskGraphics.fillRect(10, 10, this._visW, this._visH);
    this.container.setMask(this._maskGraphics.createGeometryMask());

    let miniSheet = this.scene.add.sprite(0, 0, this.textureKey).setScale(scale).setOrigin(0, 0);
    let gridGraphics = this.scene.add.graphics({ lineStyle: { width: 1, color: ACCENT_COLOR } });

    this.gridGraphics = gridGraphics
    this.miniSheet = miniSheet

    this.frameHighlight = this.scene.add.graphics({ lineStyle: { width: 2, color: ACCENT_COLOR } });
    this.container.add(this.frameHighlight);
    this.container.add(gridGraphics);
    this.container.add(miniSheet);

    this.drawGrid()

    this.isDragging = false;
    this.selectionStartCell = null;
    this.selectionEndCell = null;

    this.highlightsGraphics = this.scene.add.graphics({ fillStyle: { color: ACCENT_COLOR, alpha: 0.3 } });
    this.container.add(this.highlightsGraphics);

    this.scene.input.on('pointerdown', this.onDragStart, this);
    this.scene.input.on('pointermove', this.onDragMove, this);
    this.scene.input.on('pointerup', this.onDragEnd, this);
    this.scene.input.on('wheel', this._onWheel, this);
  }

  // Returns true when the pointer is inside the visible minisheet viewport
  isPointerOver(pointer) {
    if (!this._visW) return false;
    return pointer.x >= 10 && pointer.x <= 10 + this._visW &&
           pointer.y >= 10 && pointer.y <= 10 + this._visH;
  }

  _onWheel(pointer, gameObjects, deltaX, deltaY) {
    if (!this.isPointerOver(pointer)) return;

    const scale = this.calculateScale();
    const totalH = this.imageHeight * scale;
    const maxScroll = Math.max(0, totalH - this.maxDimensions().h);

    this._scrollY = Math.max(-maxScroll, Math.min(0, this._scrollY - deltaY));
    this.container.setY(10 + this._scrollY);
  }

  cellSize() {
    // Always derive cell dimensions from the sprite's actual rendered size
    // so grid lines, highlights, and hit-testing stay in sync even when
    // cols/rows change via sliders without a full re-create.
    return {
      w: this.miniSheet.displayWidth  / this.cols,
      h: this.miniSheet.displayHeight / this.rows,
    };
  }

  drawGrid() {
    this.gridGraphics.clear();

    const { w: miniFrameWidth, h: miniFrameHeight } = this.cellSize();

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
          this.container.add(cellText);
        }
        cellNumber++;
      }
    }

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

    const { w: miniFrameWidth, h: miniFrameHeight } = this.cellSize();

    for (let col = Math.min(this.selectionStartCell.col, this.selectionEndCell.col); col <= Math.max(this.selectionStartCell.col, this.selectionEndCell.col); col++) {
      for (let row = Math.min(this.selectionStartCell.row, this.selectionEndCell.row); row <= Math.max(this.selectionStartCell.row, this.selectionEndCell.row); row++) {
        this.highlightsGraphics.fillRect(col * miniFrameWidth, row * miniFrameHeight, miniFrameWidth, miniFrameHeight);
      }
    }
  }

  updateFrameHighlight() {
    if (!this.miniSheet) return;

    const { w: scaledFrameWidth, h: scaledFrameHeight } = this.cellSize();

    const cell = this.currentFrameName !== undefined ? this.currentFrameName : this.currentFrame;
    const highlightX = (cell % this.cols) * scaledFrameWidth;
    const highlightY = Math.floor(cell / this.cols) * scaledFrameHeight;

    this.frameHighlight.clear();
    this.frameHighlight.fillStyle(ACCENT_COLOR, 0.5);
    this.frameHighlight.fillRect(highlightX, highlightY, scaledFrameWidth, scaledFrameHeight);
  }

  setCurrentFrame(frameIndex, frameName) {
    this.currentFrame = frameIndex;
    this.currentFrameName = frameName !== undefined ? frameName : frameIndex;
    this.updateFrameHighlight();
  }

  getCellFromPointer(pointer) {
    const { w, h } = this.cellSize();
    const col = Math.floor((pointer.x - this.container.x) / w);
    const row = Math.floor((pointer.y - this.container.y) / h);
    return { col, row };
  }

  onDragStart(pointer) {
    // Ignore clicks outside the visible viewport
    if (!this.isPointerOver(pointer)) return;

    const cell = this.getCellFromPointer(pointer);
    const isCmdOrCtrl = pointer.event && (pointer.event.ctrlKey || pointer.event.metaKey);

    if (cell.col >= 0 && cell.col < this.cols && cell.row >= 0 && cell.row < this.rows) {
      if (isCmdOrCtrl) {
        const spritesheetKey = this.scene.player.spritesheetKey;
        const cellNumber = cell.row * this.cols + cell.col;
        if (!this.sequencedCells) this.sequencedCells = new Set();
        this.sequencedCells.add(cellNumber);
        this.drawSelectedHighlights();
        this.scene.events.emit('addCellToSequence', { spritesheetKey, frameIndex: cellNumber });
        this.isDragging = false;
      } else {
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

    const { w: miniFrameWidth, h: miniFrameHeight } = this.cellSize();

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

    if (endCell.col >= 0 && endCell.col < this.cols && endCell.row >= 0 && endCell.row < this.rows) {
      this.selectionEndCell = endCell;

      const minCol = Math.min(this.selectionStartCell.col, this.selectionEndCell.col);
      const maxCol = Math.max(this.selectionStartCell.col, this.selectionEndCell.col);
      const minRow = Math.min(this.selectionStartCell.row, this.selectionEndCell.row);
      const maxRow = Math.max(this.selectionStartCell.row, this.selectionEndCell.row);

      const selectedCells = [];
      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          selectedCells.push(row * this.cols + col);
        }
      }
      this.selectedCells = selectedCells;
      this.scene.events.emit('cellsSelected', selectedCells);
    } else {
      this.highlightsGraphics.clear();
      this.selectedCells = null;
    }

    this.isDragging = false;
  }
}

export default MiniSheet;
