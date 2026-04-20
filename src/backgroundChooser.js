class BackgroundChooser extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    this.scene = scene;
    this.colors = ['#0d2b45', '#203c56', '#544e68', '#8d697a', '#d08159', '#ffaa5e', '#ffd4a3', '#ffecd6'];
    this.selectedColor = '#0d2b45'; // Default to the first color

    this.createColorStrip()
    this.setSize(200, 20); // Explicitly set size for sizers
    scene.add.existing(this)
  }

  createColorStrip() {
    const stripWidth = 25; // Width of each color strip
    const stripHeight = 20; // Height of the color strip
    const totalHalfWidth = (this.colors.length * stripWidth) / 2;

    this.colors.forEach((color, index) => {
      let colorBox = this.scene.add.rectangle(
        (index * stripWidth) + (stripWidth / 2), 0, stripWidth, stripHeight, Phaser.Display.Color.HexStringToColor(color).color
      ).setInteractive()

      colorBox.on('pointerdown', () => {
        this.selectedColor = color;
        this.scene.scene.get('GameScene').cameras.main.setBackgroundColor(color);
      })

      this.add(colorBox);
    });
  }

  getSelectedColor() {
    return this.selectedColor;
  }
}

export default BackgroundChooser