export interface ProcessedPaper {
  canvas: HTMLCanvasElement;
  dataUrl: string;
}

let cachedPaperPromise: Promise<ProcessedPaper> | null = null;

/**
 * Crops the inner handmade cotton-rag fiber area from the studio paper photo
 * so no outer grey studio table margin ever shows on the card or envelope.
 */
export function loadCroppedCottonPaper(src: string): Promise<ProcessedPaper> {
  if (cachedPaperPromise) return cachedPaperPromise;

  cachedPaperPromise = new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const sw = img.naturalWidth;
      const sh = img.naturalHeight;
      const cropX = Math.round(sw * 0.12);
      const cropY = Math.round(sh * 0.10);
      const cropW = Math.round(sw * 0.76);
      const cropH = Math.round(sh * 0.80);

      const canvas = document.createElement('canvas');
      canvas.width = cropW;
      canvas.height = cropH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable'));
        return;
      }

      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

      // Subtle warm ivory brightening wash so typography reads with luxury contrast
      ctx.fillStyle = 'rgba(255, 252, 246, 0.28)';
      ctx.fillRect(0, 0, cropW, cropH);

      resolve({
        canvas,
        dataUrl: canvas.toDataURL('image/jpeg', 0.92),
      });
    };
    img.onerror = () => reject(new Error('Failed to load cotton paper texture'));
    img.src = src;
  });

  return cachedPaperPromise;
}
