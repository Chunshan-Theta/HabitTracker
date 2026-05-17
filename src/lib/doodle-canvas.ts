const EXPORT_MAX_EDGE = 128;
const JPEG_QUALITY = 0.72;
const DATA_URL_PATTERN = /^data:image\/(jpeg|png|webp);base64,/;

export function isValidDoodleDataUrl(value: string): boolean {
  return DATA_URL_PATTERN.test(value.trim());
}

export function exportCompressedDoodle(source: HTMLCanvasElement): string {
  const rect = source.getBoundingClientRect();
  const width = rect.width || source.width;
  const height = rect.height || source.height;
  if (width <= 0 || height <= 0) {
    throw new Error("Canvas has no drawable area");
  }

  const scale = Math.min(EXPORT_MAX_EDGE / width, EXPORT_MAX_EDGE / height, 1);
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));

  const offscreen = document.createElement("canvas");
  offscreen.width = targetWidth;
  offscreen.height = targetHeight;

  const ctx = offscreen.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2d context unavailable");
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  ctx.drawImage(source, 0, 0, targetWidth, targetHeight);

  return offscreen.toDataURL("image/jpeg", JPEG_QUALITY);
}
