function drawFrameToCanvas(texture, frameIndex) {
  const frame = texture.get(frameIndex);
  if (!frame) return null;
  const canvas = document.createElement('canvas');
  canvas.width = frame.cutWidth;
  canvas.height = frame.cutHeight;
  canvas.getContext('2d').drawImage(
    frame.source.image,
    frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight,
    0, 0, frame.cutWidth, frame.cutHeight
  );
  return canvas;
}

function triggerDownload(canvas, filename) {
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), {
      href: url, download: filename, style: 'display:none'
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
}

export function exportFrames(scene, spritesheetKey, frameIndices, prefix) {
  if (!spritesheetKey || !frameIndices?.length) return;
  const texture = scene.textures.get(spritesheetKey);
  if (!texture) return;

  // Export every entry in sequence order — duplicates become their own numbered file
  frameIndices.forEach((frameIndex, i) => {
    const canvas = drawFrameToCanvas(texture, frameIndex);
    if (!canvas) return;
    const n = String(i + 1).padStart(2, '0');
    triggerDownload(canvas, `${prefix}_${n}.png`);
  });
}

export function exportSpritesheet(scene, spritesheetKey, frameIndices, prefix) {
  if (!spritesheetKey || !frameIndices?.length) return;
  const texture = scene.textures.get(spritesheetKey);
  if (!texture) return;

  const sample = texture.get(frameIndices[0]);
  if (!sample) return;

  const fw = sample.cutWidth;
  const fh = sample.cutHeight;
  const sheet = document.createElement('canvas');
  sheet.width = fw * frameIndices.length;
  sheet.height = fh;
  const ctx = sheet.getContext('2d');

  // Preserve full sequence order (including repeated frames)
  frameIndices.forEach((frameIndex, i) => {
    const frame = texture.get(frameIndex);
    if (!frame) return;
    ctx.drawImage(
      frame.source.image,
      frame.cutX, frame.cutY, fw, fh,
      i * fw, 0, fw, fh
    );
  });

  triggerDownload(sheet, `${prefix}_sheet.png`);
}
