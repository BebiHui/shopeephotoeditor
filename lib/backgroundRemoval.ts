/**
 * Background removal wrapper around @imgly/background-removal.
 *
 * IMPORTANT: imgly is loaded LAZILY (dynamic import) so that Next.js
 * production build doesn't try to evaluate WASM/worker code on the server.
 * This is why we keep the file free of any top-level imports from imgly.
 *
 * Compatible with @imgly/background-removal v1.4.x — schema:
 *   model:  z.enum(['small', 'medium']).default('medium')
 *   output: { format: 'image/png' | 'image/jpeg' | 'image/webp' | ..., quality: number }
 */

let warmedUp = false;

type ImglyModule = typeof import('@imgly/background-removal');
type Config = Parameters<ImglyModule['removeBackground']>[1];

/** Cache the imported module so we only download/load it once. */
let imglyPromise: Promise<ImglyModule> | null = null;
function getImgly(): Promise<ImglyModule> {
  if (!imglyPromise) {
    imglyPromise = import('@imgly/background-removal');
  }
  return imglyPromise;
}

const BASE_CONFIG: Config = {
  output: { format: 'image/png', quality: 0.95 },
  model: 'medium', // 'small' | 'medium' in v1.4.x; 'medium' = best quality
  debug: false,
};

export interface RemoveBgOptions {
  /** Reserved for future versions; in v1.4.x both modes use 'medium'. */
  highQuality?: boolean;
  onProgress?: (key: string, current: number, total: number) => void;
}

function buildConfig(opts: RemoveBgOptions): Config {
  return {
    ...BASE_CONFIG,
    progress: opts.onProgress,
  };
}

/**
 * Removes the background from an image and returns a transparent PNG Blob.
 * Accepts a File, Blob, or string URL. Browser-only.
 */
export async function removeImageBackground(
  source: File | Blob | string,
  opts: RemoveBgOptions = {}
): Promise<Blob> {
  const { removeBackground } = await getImgly();
  const blob = await removeBackground(source, buildConfig(opts));
  warmedUp = true;
  return blob;
}

/** Preload the model so the first user interaction is fast. Safe to call multiple times. */
export async function warmUpBackgroundRemoval(
  onProgress?: (key: string, current: number, total: number) => void
): Promise<void> {
  if (warmedUp) return;
  // Tiny 1x1 transparent PNG used to trigger model download / WASM init.
  const tinyPng =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkAAIAAAoAAv/lxKUAAAAASUVORK5CYII=';
  try {
    const { removeBackground } = await getImgly();
    await removeBackground(tinyPng, buildConfig({ onProgress }));
    warmedUp = true;
  } catch {
    // Warm-up errors are non-fatal — the real call will surface them.
  }
}

export function isWarmedUp() {
  return warmedUp;
}

/* ------------------------------------------------------------------------- *
 * Upgrading to v1.5+ (uses isnet model names):
 *   1. package.json: "@imgly/background-removal": "^1.6.0"
 *   2. npm install
 *   3. In BASE_CONFIG change model to 'isnet' (best) or 'isnet_fp16' (fast).
 * ------------------------------------------------------------------------- */
