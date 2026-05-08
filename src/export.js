import { GIFEncoder, quantize, applyPalette } from 'gifenc';

function isFrameEmpty(frame) {
  if (!frame || !frame.cutWidth || !frame.cutHeight) return true;
  const canvas = document.createElement('canvas');
  canvas.width = frame.cutWidth;
  canvas.height = frame.cutHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(
    frame.source.image,
    frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight,
    0, 0, frame.cutWidth, frame.cutHeight
  );
  const data = ctx.getImageData(0, 0, frame.cutWidth, frame.cutHeight).data;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] !== 0) return false;
  }
  return true;
}

function trimTrailingEmpty(texture, frameIndices) {
  let last = frameIndices.length - 1;
  while (last >= 0 && isFrameEmpty(texture.get(frameIndices[last]))) last--;
  return frameIndices.slice(0, last + 1);
}

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

  frameIndices = trimTrailingEmpty(texture, frameIndices);
  if (!frameIndices.length) return;

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

  frameIndices = trimTrailingEmpty(texture, frameIndices);
  if (!frameIndices.length) return;

  const sample = texture.get(frameIndices[0]);
  if (!sample) return;

  const fw = sample.cutWidth;
  const fh = sample.cutHeight;
  const n = frameIndices.length;

  // Square layout when count is a perfect square ≥ 4; otherwise a single horizontal strip
  const root = Math.sqrt(n);
  const isSquare = n >= 4 && Number.isInteger(root);
  const cols = isSquare ? root : n;
  const rows = isSquare ? root : 1;

  const sheet = document.createElement('canvas');
  sheet.width = fw * cols;
  sheet.height = fh * rows;
  const ctx = sheet.getContext('2d');

  // Preserve full sequence order (including repeated frames)
  frameIndices.forEach((frameIndex, i) => {
    const frame = texture.get(frameIndex);
    if (!frame) return;
    const col = i % cols;
    const row = Math.floor(i / cols);
    ctx.drawImage(
      frame.source.image,
      frame.cutX, frame.cutY, fw, fh,
      col * fw, row * fh, fw, fh
    );
  });

  triggerDownload(sheet, `${prefix}.png`);
}

export function exportGif(scene, spritesheetKey, frameIndices, prefix, frameRate) {
  if (!spritesheetKey || !frameIndices?.length) return;
  const texture = scene.textures.get(spritesheetKey);
  if (!texture) return;

  frameIndices = trimTrailingEmpty(texture, frameIndices);
  if (!frameIndices.length) return;

  const sample = texture.get(frameIndices[0]);
  if (!sample) return;

  const fw = sample.cutWidth;
  const fh = sample.cutHeight;
  const delay = Math.max(20, Math.round(1000 / Math.max(1, frameRate || 10)));

  const gif = GIFEncoder();

  frameIndices.forEach((frameIndex) => {
    const canvas = drawFrameToCanvas(texture, frameIndex);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { data } = ctx.getImageData(0, 0, fw, fh);
    const palette = quantize(data, 256, { format: 'rgba4444' });
    const indexed = applyPalette(data, palette, 'rgba4444');
    gif.writeFrame(indexed, fw, fh, { palette, delay, transparent: true });
  });

  gif.finish();

  const blob = new Blob([gif.bytes()], { type: 'image/gif' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), {
    href: url, download: `${prefix}.gif`, style: 'display:none'
  });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
