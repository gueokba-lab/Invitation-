export interface ProcessedSprite {
  canvas: HTMLCanvasElement;
  dataUrl: string;
}

let cachedPromise: Promise<ProcessedSprite> | null = null;

/**
 * Loads the generated wax seal image and performs a corner-seeded flood fill
 * to remove the pure-white studio background with soft anti-aliased edges,
 * preserving all metallic highlights inside the seal.
 */
export function loadTransparentWaxSeal(src: string): Promise<ProcessedSprite> {
  if (cachedPromise) return cachedPromise;

  cachedPromise = new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;

      const visited = new Uint8Array(w * h);
      const queue = new Int32Array(w * h);
      let head = 0;
      let tail = 0;

      const isBgLike = (idx: number): boolean => {
        const p = idx * 4;
        const r = data[p];
        const g = data[p + 1];
        const b = data[p + 2];
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const lum = (r + g + b) / 3;
        return lum > 224 && max - min < 26;
      };

      const seedPoints = [0, w - 1, (h - 1) * w, h * w - 1];
      for (const s of seedPoints) {
        if (!visited[s] && isBgLike(s)) {
          visited[s] = 1;
          queue[tail++] = s;
        }
      }

      while (head < tail) {
        const curr = queue[head++];
        const x = curr % w;
        const y = (curr - x) / w;

        const p = curr * 4;
        const lum = (data[p] + data[p + 1] + data[p + 2]) / 3;
        // Soft edge feather near luminance threshold
        if (lum >= 242) {
          data[p + 3] = 0;
        } else {
          const alpha = Math.round(((242 - lum) / 18) * 255);
          data[p + 3] = Math.max(0, Math.min(255, alpha));
        }

        if (x > 0) {
          const left = curr - 1;
          if (!visited[left] && isBgLike(left)) {
            visited[left] = 1;
            queue[tail++] = left;
          }
        }
        if (x < w - 1) {
          const right = curr + 1;
          if (!visited[right] && isBgLike(right)) {
            visited[right] = 1;
            queue[tail++] = right;
          }
        }
        if (y > 0) {
          const up = curr - w;
          if (!visited[up] && isBgLike(up)) {
            visited[up] = 1;
            queue[tail++] = up;
          }
        }
        if (y < h - 1) {
          const down = curr + w;
          if (!visited[down] && isBgLike(down)) {
            visited[down] = 1;
            queue[tail++] = down;
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve({
        canvas,
        dataUrl: canvas.toDataURL('image/png'),
      });
    };
    img.onerror = () => reject(new Error('Failed to load wax seal image'));
    img.src = src;
  });

  return cachedPromise;
}
