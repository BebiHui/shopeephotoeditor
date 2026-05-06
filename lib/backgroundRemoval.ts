/**
 * Background removal wrapper around @imgly/background-removal.
 *
 * Compatible with @imgly/background-removal v1.4.x — its config schema is:
 *   model:  z.enum(['small', 'medium']).default('medium')
 *   output: { format: 'image/png' | 'image/jpeg' | 'image/webp' | ..., quality: number }
 *   publicPath, debug, progress
 *
 * Why this library:
 *  - Runs ENTIRELY in the browser (no Python service, no API key).
 *  - Uses ONNX Runtime Web with a U2Net-derived model + alpha matting,
 *    which gives clean edges for typical white-background product photos.
 *  - Models cached in browser after first download (~30–80 MB).
 */

import { removeBackground, type Config } from '@imgly/background-removal';

let warmedUp = false;

/**
 * 'medium' = best quality model in v1.4.x (recommended for product photos).
 * 'small'  = faster, slightly lower edge quality (use for very large batches).
 */
type BgModel = 'small' | 'medium';

const DEFAULT_CONFIG: Config = {
  output: { format: 'image/png', quality: 0.95 },
  model: 'medium',
  debug: false,
  // Default public path is fine; uncomment if you want to pin it:
  // publicPath: 'https://staticimgly.com/@imgly/background-removal-data/1.4.5/dist/',
};

export interface RemoveBgOptions {
  /** Higher quality just stays on 'medium' (best in v1.4.x). Kept for forward-compat. */
  highQuality?: boolean;
  onProgress?: (key: string, current: number, total: number) => void;
}

function buildConfig(opts: RemoveBgOptions): Config {
  // In v1.4.x both options collapse to 'medium' (the best the library has).
  // 'small' is exposed only as a perf escape hatch — pass highQuality: false
  // AND change the line below to switch to 'small' if you ever need speed.
  const model: BgModel = 'medium';
  return {
    ...DEFAULT_CONFIG,
    model,
    progress: opts.onProgress,
  };
}

/**
 * Removes the background from an image and returns a transparent PNG Blob.
 * Accepts a File, Blob, or string URL.
 */
export async function removeImageBackground(
  source: File | Blob | string,
  opts: RemoveBgOptions = {}
): Promise<Blob> {
  const blob = await removeBackground(source, buildConfig(opts));
  warmedUp = true;
  return blob;
}

/** Preload models so the first user interaction is fast. Safe to call multiple times. */
export async function warmUpBackgroundRemoval(
  onProgress?: (key: string, current: number, total: number) => void
): Promise<void> {
  if (warmedUp) return;
  // Tiny 1x1 transparent PNG used to trigger model download / WASM init.
  const tinyPng =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkAAIAAAoAAv/lxKUAAAAASUVORK5CYII=';
  try {
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
 * If you upgrade @imgly/background-removal to v1.5+ (uses isnet model names):
 *   1. In package.json bump to: "@imgly/background-removal": "^1.6.0"
 *   2. Run: npm install
 *   3. Change the type alias above to:
 *        type BgModel = 'isnet' | 'isnet_fp16' | 'isnet_quint8';
 *   4. In buildConfig: model = opts.highQuality ? 'isnet' : 'isnet_fp16';
 * Everything else stays the same.
 * ------------------------------------------------------------------------- */
