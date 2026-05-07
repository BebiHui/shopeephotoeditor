/**
 * Canvas composer:
 *  - Takes the cutout (transparent PNG of the product)
 *  - Auto-fits the product to a square marketplace canvas with padding
 *  - Paints the chosen background (white, transparent, gray, custom)
 *  - Stamps the store logo on top, in the chosen position
 *  - LAST: stamps up to 2 additional logos vertically in the top-right corner
 *    (so they're always on top of everything, including the product & main logo)
 *
 * The output is always a square PNG suitable for Shopee (1024x1024 default).
 */

import type {
  CanvasConfig,
  EnhancementParams,
  LogoConfig,
  TopRightLogosConfig,
} from './types';
import { enhanceImage } from './imageEnhancement';
import { getOpaqueBounds, loadImage } from './utils';

export interface ComposeArgs {
  cutoutBlob: Blob;          // transparent PNG from background removal
  logoUrl?: string;           // optional main store logo url
  enhancement: EnhancementParams;
  canvasCfg: CanvasConfig;
  logoCfg: LogoConfig;
  /** Optional: 2 stacked logos in the top-right corner (added last). */
  topRightLogosCfg?: TopRightLogosConfig;
}

export interface ComposeResult {
  blob: Blob;
  dataUrl: string;
}

export async function composeFinalImage(args: ComposeArgs): Promise<ComposeResult> {
  const { cutoutBlob, logoUrl, enhancement, canvasCfg, logoCfg, topRightLogosCfg } = args;

  // Load cutout
  const cutoutImg = await loadImage(cutoutBlob);

  // Step 1: enhance the cutout (color, sharpness)
  const enhancedCanvas = enhanceImage(cutoutImg, enhancement);

  // Step 2: trim to opaque bounding box so auto-fit is accurate
  const trimmed = trimTransparent(enhancedCanvas);

  // Step 3: build target square canvas
  const size = canvasCfg.size;
  const out = document.createElement('canvas');
  out.width = size;
  out.height = size;
  const ctx = out.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Background
  paintBackground(ctx, size, canvasCfg);

  // Step 4: auto-fit product
  const padding = canvasCfg.padding ?? 0.08;
  const maxDim = size * (1 - 2 * padding);
  const scale = Math.min(maxDim / trimmed.width, maxDim / trimmed.height);
  const drawW = trimmed.width * scale;
  const drawH = trimmed.height * scale;
  const drawX = (size - drawW) / 2;
  const drawY = (size - drawH) / 2;
  ctx.drawImage(trimmed, drawX, drawY, drawW, drawH);

  // Step 5: stamp main store logo on top
  if (logoUrl) {
    const logoImg = await loadImage(logoUrl);
    drawLogo(ctx, logoImg, size, logoCfg);
  }

  // Step 6 (LAST): stamp the 2 additional top-right logos so they're always
  // on top of the product and the main store logo.
  if (topRightLogosCfg) {
    await drawTopRightLogos(ctx, size, topRightLogosCfg);
  }

  const dataUrl = out.toDataURL('image/png');
  const blob = await canvasToBlob(out);
  return { blob, dataUrl };
}

function paintBackground(
  ctx: CanvasRenderingContext2D,
  size: number,
  cfg: CanvasConfig
) {
  ctx.clearRect(0, 0, size, size);
  if (cfg.background === 'transparent') return;
  let fill = '#ffffff';
  if (cfg.background === 'white') fill = '#ffffff';
  else if (cfg.background === 'gray') fill = '#f5f5f5';
  else if (cfg.background === 'custom') fill = cfg.customColor || '#ffffff';
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, size, size);
}

function drawLogo(
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement,
  canvasSize: number,
  cfg: LogoConfig
) {
  const ratio = Math.min(0.5, Math.max(0.04, cfg.sizeRatio));
  const logoW = canvasSize * ratio;
  const aspect = logo.naturalHeight / logo.naturalWidth;
  const logoH = logoW * aspect;
  const margin = Math.max(0, cfg.margin);

  let x = 0, y = 0;
  switch (cfg.position) {
    case 'top-left':
      x = margin; y = margin; break;
    case 'top-right':
      x = canvasSize - logoW - margin; y = margin; break;
    case 'top-center':
      x = (canvasSize - logoW) / 2; y = margin; break;
    case 'bottom-left':
      x = margin; y = canvasSize - logoH - margin; break;
    case 'bottom-right':
      x = canvasSize - logoW - margin; y = canvasSize - logoH - margin; break;
    case 'bottom-center':
      x = (canvasSize - logoW) / 2; y = canvasSize - logoH - margin; break;
    case 'custom':
      x = clamp(cfg.customX * canvasSize - logoW / 2, 0, canvasSize - logoW);
      y = clamp(cfg.customY * canvasSize - logoH / 2, 0, canvasSize - logoH);
      break;
  }

  ctx.save();
  ctx.globalAlpha = clamp(cfg.opacity, 0, 1);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(logo, x, y, logoW, logoH);
  ctx.restore();
}

/**
 * Draw up to 2 logos stacked vertically at the top-right corner.
 * - Logo 1 is the upper one, logo 2 is below it.
 * - All sizes specified in `cfg` are at 1024x1024 reference; we scale them
 *   to the actual canvas size so 800/1080/1200 outputs look proportional.
 * - Aspect ratio of each logo is preserved (logo width is fixed; height = w * aspect).
 * - Logos are drawn LAST so they always sit on top of the product and store logo.
 */
async function drawTopRightLogos(
  ctx: CanvasRenderingContext2D,
  canvasSize: number,
  cfg: TopRightLogosConfig
) {
  const slots: { url: string }[] = [];
  if (cfg.logo1.enabled && cfg.logo1.url) slots.push({ url: cfg.logo1.url });
  if (cfg.logo2.enabled && cfg.logo2.url) slots.push({ url: cfg.logo2.url });
  if (slots.length === 0) return;

  // Scale all reference px values from 1024 to actual canvas size
  const k = canvasSize / 1024;
  const widthPx = Math.max(1, cfg.widthPx * k);
  const marginTop = Math.max(0, cfg.marginTopPx * k);
  const marginRight = Math.max(0, cfg.marginRightPx * k);
  const gap = Math.max(0, cfg.gapPx * k);

  ctx.save();
  ctx.globalAlpha = clamp(cfg.opacity, 0, 1);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  let cursorY = marginTop;
  for (const s of slots) {
    let img: HTMLImageElement;
    try {
      img = await loadImage(s.url);
    } catch {
      // Skip a logo we can't load instead of failing the whole render.
      continue;
    }
    const aspect = img.naturalHeight / Math.max(1, img.naturalWidth);
    const drawW = widthPx;
    const drawH = drawW * aspect;
    // Right-align: x = canvas - width - rightMargin
    const x = canvasSize - drawW - marginRight;
    // Clamp so it never overflows the canvas (defense; small logos won't trigger this)
    const y = Math.min(cursorY, canvasSize - drawH);
    ctx.drawImage(img, x, y, drawW, drawH);
    cursorY = y + drawH + gap;
  }

  ctx.restore();
}

function clamp(v: number, min = 0, max = 1) {
  return v < min ? min : v > max ? max : v;
}

/** Crop transparent margins so product is tight. Returns a new canvas. */
function trimTransparent(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const bounds = getOpaqueBounds(img);
  if (!bounds) return canvas;
  const out = document.createElement('canvas');
  out.width = bounds.w;
  out.height = bounds.h;
  out.getContext('2d')!.drawImage(canvas, -bounds.x, -bounds.y);
  return out;
}

function canvasToBlob(c: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    c.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
      'image/png',
      1.0
    );
  });
}

/** Used for the "background-removed only" preview tile in the comparison view. */
export async function renderCutoutPreview(blob: Blob, size = 512): Promise<string> {
  const img = await loadImage(blob);
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  // Draw checker so transparency is visible in the preview
  // (we just leave it transparent; CSS handles the checker)
  const scale = Math.min(size / img.naturalWidth, size / img.naturalHeight) * 0.92;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  ctx.drawImage(img, (size - dw) / 2, (size - dh) / 2, dw, dh);
  return c.toDataURL('image/png');
}
