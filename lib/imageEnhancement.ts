/**
 * Image enhancement utilities — runs on a Canvas2D ImageData buffer.
 *
 * The pipeline applies (in order):
 *  1) White balance / warmth shift (R/B channel bias)
 *  2) Brightness (additive)
 *  3) Contrast (scale around 128)
 *  4) Saturation (HSL)
 *  5) Sharpness via unsharp-mask (3x3 Gaussian blur, then add weighted highpass)
 *
 * All channels respect alpha — fully transparent pixels are left alone so the
 * cutout's clean edges are preserved.
 */

import type { EnhancementParams } from './types';

/** Apply enhancement to an HTMLImageElement and return a new canvas with the result. */
export function enhanceImage(
  source: HTMLImageElement | HTMLCanvasElement,
  params: EnhancementParams
): HTMLCanvasElement {
  const w = (source as HTMLImageElement).naturalWidth || (source as HTMLCanvasElement).width;
  const h = (source as HTMLImageElement).naturalHeight || (source as HTMLCanvasElement).height;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('No 2D context available');
  ctx.drawImage(source, 0, 0, w, h);

  const imgData = ctx.getImageData(0, 0, w, h);
  applyColorAdjustments(imgData, params);
  ctx.putImageData(imgData, 0, 0);

  if (params.sharpness > 0) {
    return applyUnsharpMask(canvas, params.sharpness / 100);
  }
  return canvas;
}

/** In-place color adjustments: warmth, brightness, contrast, saturation. */
function applyColorAdjustments(img: ImageData, params: EnhancementParams) {
  const d = img.data;
  // Map slider ranges to actual factors
  const brightness = params.brightness * 2.55;        // -127.5 .. +127.5 (scaled)
  const contrastFactor = (259 * (params.contrast + 255)) / (255 * (259 - params.contrast));
  const saturation = 1 + params.saturation / 100;     // 0.5 .. 1.5
  const warmthR = params.warmth * 0.6;                // shift R up if warm
  const warmthB = -params.warmth * 0.6;               // shift B down if warm

  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue; // skip fully transparent

    let r = d[i], g = d[i + 1], b = d[i + 2];

    // Warmth
    r = clamp(r + warmthR);
    b = clamp(b + warmthB);

    // Brightness
    r = clamp(r + brightness);
    g = clamp(g + brightness);
    b = clamp(b + brightness);

    // Contrast
    r = clamp(contrastFactor * (r - 128) + 128);
    g = clamp(contrastFactor * (g - 128) + 128);
    b = clamp(contrastFactor * (b - 128) + 128);

    // Saturation (around luminance gray)
    const gray = 0.2989 * r + 0.587 * g + 0.114 * b;
    r = clamp(gray + (r - gray) * saturation);
    g = clamp(gray + (g - gray) * saturation);
    b = clamp(gray + (b - gray) * saturation);

    d[i] = r;
    d[i + 1] = g;
    d[i + 2] = b;
  }
}

function clamp(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

/** Unsharp mask: result = original + amount * (original - blurred). */
function applyUnsharpMask(source: HTMLCanvasElement, amount: number): HTMLCanvasElement {
  const w = source.width, h = source.height;
  const out = document.createElement('canvas');
  out.width = w; out.height = h;
  const outCtx = out.getContext('2d', { willReadFrequently: true })!;

  // Draw blurred copy
  const blurCanvas = document.createElement('canvas');
  blurCanvas.width = w; blurCanvas.height = h;
  const blurCtx = blurCanvas.getContext('2d')!;
  blurCtx.filter = 'blur(1.2px)';
  blurCtx.drawImage(source, 0, 0);
  blurCtx.filter = 'none';

  const orig = source.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, w, h);
  const blurred = blurCtx.getImageData(0, 0, w, h);
  const result = outCtx.createImageData(w, h);

  const od = orig.data, bd = blurred.data, rd = result.data;
  for (let i = 0; i < od.length; i += 4) {
    if (od[i + 3] === 0) {
      rd[i + 3] = 0;
      continue;
    }
    rd[i]     = clamp(od[i]     + amount * (od[i]     - bd[i]));
    rd[i + 1] = clamp(od[i + 1] + amount * (od[i + 1] - bd[i + 1]));
    rd[i + 2] = clamp(od[i + 2] + amount * (od[i + 2] - bd[i + 2]));
    rd[i + 3] = od[i + 3];
  }
  outCtx.putImageData(result, 0, 0);
  return out;
}
