interface ImageProcessorMessage {
  type: 'process' | 'cancel';
  file?: File;
  maxWidth?: number;
  maxHeight?: number;
  requestId?: string;
}

interface ImageProcessorResponse {
  type: 'success' | 'error' | 'progress';
  imageBitmap?: ImageBitmap;
  width?: number;
  height?: number;
  originalWidth?: number;
  originalHeight?: number;
  wasResized?: boolean;
  error?: string;
  progress?: number;
  requestId?: string;
}

const MAX_DIMENSION = 4096;

self.onmessage = async (e: MessageEvent<ImageProcessorMessage>) => {
  const { type, file, maxWidth = MAX_DIMENSION, maxHeight = MAX_DIMENSION, requestId } = e.data;

  if (type === 'cancel') {
    return;
  }

  if (type === 'process' && file) {
    try {
      postMessage({
        type: 'progress',
        progress: 10,
        requestId
      } as ImageProcessorResponse);

      const arrayBuffer = await file.arrayBuffer();

      postMessage({
        type: 'progress',
        progress: 30,
        requestId
      } as ImageProcessorResponse);

      const blob = new Blob([arrayBuffer], { type: file.type });
      let imageBitmap = await createImageBitmap(blob);

      postMessage({
        type: 'progress',
        progress: 60,
        requestId
      } as ImageProcessorResponse);

      const originalWidth = imageBitmap.width;
      const originalHeight = imageBitmap.height;
      let wasResized = false;

      if (originalWidth > maxWidth || originalHeight > maxHeight) {
        const scale = Math.min(maxWidth / originalWidth, maxHeight / originalHeight);
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

        postMessage({
          type: 'progress',
          progress: 90,
          requestId
        } as ImageProcessorResponse);
      }

      postMessage({
        type: 'success',
        imageBitmap,
        width: imageBitmap.width,
        height: imageBitmap.height,
        originalWidth,
        originalHeight,
        wasResized,
        requestId
      } as ImageProcessorResponse, [imageBitmap]);

    } catch (error) {
      postMessage({
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error processing image',
        requestId
      } as ImageProcessorResponse);
    }
  }
};

export {};
