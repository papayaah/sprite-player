export function isBase64String(data) {
  // Regular expression to match Base64 characters
  const base64Pattern = /^[A-Za-z0-9+/=]+$/;
  return base64Pattern.test(data);
}

export function scaleSpriteToFit(sprite, maxWidth, maxHeight) {
  const scaleX = maxWidth / sprite.width;
  const scaleY = maxHeight / sprite.height;
  const scale = Math.min(scaleX, scaleY);
  sprite.setScale(scale);
  return sprite;
}

export function centerSpriteInLabel(sprite, labelWidth, labelHeight) {
  sprite.setX(labelWidth / 2 - sprite.displayWidth / 2);
  sprite.setY(labelHeight / 2 - sprite.displayHeight / 2);
}

export function hexToWebColor(hex) {
  return '#' + hex.toString(16)
}

export function getSizerTotalWidth(sizer) {
  let totalWidth = 0;
  sizer.children.forEach(child => {
      totalWidth += child.width; // Add the width of each child
      // Add additional logic here if you have padding or spacing between children
  });
  return totalWidth;
}