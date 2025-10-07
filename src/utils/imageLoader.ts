export interface ImageLoadResult {
  imageBitmap: ImageBitmap;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  wasResized: boolean;
}

export interface ImageLoadOptions {
  maxWidth?: number;
  maxHeight?: number;
  onProgress?: (progress: number) => void;
}

let worker: Worker | null = null;
let requestIdCounter = 0;

const isWorkerSupported = (): boolean => {
  return typeof Worker !== 'undefined' && typeof window !== 'undefined';
};

const getWorker = (): Worker | null => {
  if (!isWorkerSupported()) {
    return null;
  }
  if (!worker) {
    try {
      worker = new Worker(
        new URL('../workers/imageProcessor.worker.ts', import.meta.url),
        { type: 'module' }
      );
    } catch (error) {
      console.warn('Failed to initialize Web Worker, falling back to main thread:', error);
      return null;
    }
  }
  return worker;
};

const loadImageFallback = async (
  file: File,
  options: ImageLoadOptions = {}
): Promise<ImageLoadResult> => {
  const MAX_DIMENSION = options.maxWidth || 4096;
  const maxHeight = options.maxHeight || 4096;

  options.onProgress?.(30);

  const arrayBuffer = await file.arrayBuffer();
  const blob = new Blob([arrayBuffer], { type: file.type });

  options.onProgress?.(60);

  let imageBitmap = await createImageBitmap(blob);
  const originalWidth = imageBitmap.width;
  const originalHeight = imageBitmap.height;
  let wasResized = false;

  if (originalWidth > MAX_DIMENSION || originalHeight > maxHeight) {
    const scale = Math.min(MAX_DIMENSION / originalWidth, maxHeight / originalHeight);
    const newWidth = Math.floor(originalWidth * scale);
    const newHeight = Math.floor(originalHeight * scale);

    const resizedBitmap = await createImageBitmap(imageBitmap, {
      resizeWidth: newWidth,
      resizeHeight: newHeight,
      resizeQuality: 'high'
    });

    imageBitmap.close();
    imageBitmap = resizedBitmap;
    wasResized = true;
  }

  options.onProgress?.(100);

  return {
    imageBitmap,
    width: imageBitmap.width,
    height: imageBitmap.height,
    originalWidth,
    originalHeight,
    wasResized
  };
};

export const loadImageOptimized = (
  file: File,
  options: ImageLoadOptions = {}
): Promise<ImageLoadResult> => {
  const worker = getWorker();

  if (!worker) {
    return loadImageFallback(file, options);
  }

  return new Promise((resolve, reject) => {
    const requestId = `req_${++requestIdCounter}`;

    const handleMessage = (e: MessageEvent) => {
      if (e.data.requestId !== requestId) return;

      switch (e.data.type) {
        case 'progress':
          options.onProgress?.(e.data.progress);
          break;

        case 'success':
          worker.removeEventListener('message', handleMessage);
          resolve({
            imageBitmap: e.data.imageBitmap,
            width: e.data.width,
            height: e.data.height,
            originalWidth: e.data.originalWidth,
            originalHeight: e.data.originalHeight,
            wasResized: e.data.wasResized
          });
          break;

        case 'error':
          worker.removeEventListener('message', handleMessage);
          reject(new Error(e.data.error));
          break;
      }
    };

    worker.addEventListener('message', handleMessage);

    worker.postMessage({
      type: 'process',
      file,
      maxWidth: options.maxWidth,
      maxHeight: options.maxHeight,
      requestId
    });
  });
};

export const createImageFromBitmap = (imageBitmap: ImageBitmap): HTMLImageElement => {
  const canvas = document.createElement('canvas');
  canvas.width = imageBitmap.width;
  canvas.height = imageBitmap.height;

  const ctx = canvas.getContext('2d', {
    alpha: true,
    desynchronized: true,
    willReadFrequently: false
  });

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(imageBitmap, 0, 0);

  const img = new Image();
  img.src = canvas.toDataURL('image/png', 0.95);
  img.className = 'max-w-none transform-gpu';
  img.style.imageRendering = 'high-quality';
  img.decoding = 'async';
  img.loading = 'eager';

  return img;
};

export const terminateWorker = (): void => {
  if (worker) {
    worker.terminate();
    worker = null;
  }
};
