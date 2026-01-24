import { Shape, ImageInfo } from '../types';

export type ExportFormat = 'png' | 'jpeg' | 'svg';

export interface ExportOptions {
  format: ExportFormat;
  quality?: number;
}

export const renderImageWithShapes = (
  imageInfo: ImageInfo,
  shapes: Shape[]
): HTMLCanvasElement | null => {
  if (!imageInfo.element) return null;

  const canvas = document.createElement('canvas');
  canvas.width = imageInfo.naturalWidth;
  canvas.height = imageInfo.naturalHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(imageInfo.element, 0, 0, imageInfo.naturalWidth, imageInfo.naturalHeight);

  shapes.forEach(shape => {
    if (shape.points.length < 3) return;

    const { r, g, b } = shape.style.color;
    const opacity = shape.style.opacity;

    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
    ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.lineWidth = shape.style.strokeWidth || 2;

    ctx.beginPath();
    ctx.moveTo(shape.points[0].x, shape.points[0].y);
    shape.points.slice(1).forEach(point => {
      ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });

  return canvas;
};

export const copyImageToClipboard = async (
  imageInfo: ImageInfo,
  shapes: Shape[]
): Promise<boolean> => {
  const canvas = renderImageWithShapes(imageInfo, shapes);
  if (!canvas) return false;

  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        resolve(false);
        return;
      }

      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        resolve(true);
      } catch {
        resolve(false);
      }
    }, 'image/png');
  });
};

export const exportAsImage = (
  imageInfo: ImageInfo,
  shapes: Shape[],
  options: ExportOptions
): boolean => {
  const canvas = renderImageWithShapes(imageInfo, shapes);
  if (!canvas) return false;

  const mimeType = options.format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const quality = options.format === 'jpeg' ? (options.quality || 0.92) : undefined;
  const dataUrl = canvas.toDataURL(mimeType, quality);

  const baseName = imageInfo.fileName.replace(/\.[^/.]+$/, '') || 'export';
  const extension = options.format;
  const fileName = `${baseName}_annotated.${extension}`;

  triggerDownload(dataUrl, fileName);
  return true;
};

export const exportAsSVG = (
  imageInfo: ImageInfo,
  shapes: Shape[]
): boolean => {
  if (!imageInfo.element) return false;

  const width = imageInfo.naturalWidth;
  const height = imageInfo.naturalHeight;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  ctx.drawImage(imageInfo.element, 0, 0, width, height);
  const imageDataUrl = canvas.toDataURL('image/png');

  let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <image xlink:href="${imageDataUrl}" width="${width}" height="${height}"/>`;

  shapes.forEach(shape => {
    if (shape.points.length < 3) return;

    const { r, g, b } = shape.style.color;
    const opacity = shape.style.opacity;
    const strokeWidth = shape.style.strokeWidth || 2;

    const pointsStr = shape.points.map(p => `${p.x},${p.y}`).join(' ');

    svgContent += `
  <polygon points="${pointsStr}" fill="rgba(${r}, ${g}, ${b}, ${opacity})" stroke="rgb(${r}, ${g}, ${b})" stroke-width="${strokeWidth}"/>`;
  });

  svgContent += '\n</svg>';

  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);

  const baseName = imageInfo.fileName.replace(/\.[^/.]+$/, '') || 'export';
  const fileName = `${baseName}_annotated.svg`;

  triggerDownload(url, fileName);
  URL.revokeObjectURL(url);

  return true;
};

const triggerDownload = (url: string, fileName: string): void => {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
