/**
 * Text drawing utilities for the final canvas composer.
 *
 * Handles:
 *   - font loading wait (document.fonts.load) so canvas uses the actual font
 *   - line wrapping (manual + explicit \n)
 *   - letterSpacing (native ctx.letterSpacing where supported, fallback to per-line measure)
 *   - outline (stroke) + fill + shadow + opacity
 *   - rounded background box
 *   - auto-shrink to fit a maxHeight (used by Fitment)
 *   - all measurements specified at 1024 reference, scaled by `scale = canvasSize/1024`
 */

import type {
  ProductTextContent,
  ProductTitleConfig,
  ProductCodeConfig,
  FitmentConfig,
  TextStyle,
  BoxStyle,
} from './types';
import { fontFamilyCss } from './fonts';

interface DrawTextBlockArgs {
  ctx: CanvasRenderingContext2D;
  text: string;
  style: TextStyle;
  /** Position of the top-left corner of the text block (BEFORE box padding). */
  x: number;
  y: number;
  /** Anchor used when computing y from a bottom-anchored origin. */
  anchor?: 'top-left' | 'bottom-left';
  /** Wrap text to this width in actual canvas px. Use Infinity for no wrap. */
  maxWidth: number;
  /** Optional rounded bg box drawn behind the text. */
  background?: BoxStyle;
  /** scale = canvasSize / 1024. Used to scale style px values. */
  scale: number;
  /** When set, font size is auto-reduced so the rendered block height ≤ maxHeight. */
  maxHeight?: number;
}

interface DrawTextBlockResult {
  /** Text block size BEFORE any background padding. */
  textWidth: number;
  textHeight: number;
  /** Including background padding (or same as text size when no bg). */
  blockX: number;
  blockY: number;
  blockWidth: number;
  blockHeight: number;
  /** Bottom Y of the block (incl. bg padding) — useful for stacking. */
  bottom: number;
}

const SUPPORTS_LETTER_SPACING =
  typeof globalThis !== 'undefined' &&
  typeof (globalThis as { CanvasRenderingContext2D?: { prototype?: unknown } }).CanvasRenderingContext2D !== 'undefined' &&
  'letterSpacing' in (globalThis as { CanvasRenderingContext2D: { prototype: object } }).CanvasRenderingContext2D.prototype;

/** Make sure the font is loaded before we try to render. Resolves silently on errors. */
async function ensureFontReady(family: string, weight: number, sizePx: number) {
  if (typeof document === 'undefined' || !document.fonts) return;
  try {
    await document.fonts.load(`${weight} ${Math.max(8, Math.round(sizePx))}px "${family}"`);
  } catch {
    /* non-fatal */
  }
}

function applyFont(ctx: CanvasRenderingContext2D, style: TextStyle, sizePx: number) {
  ctx.font = `${style.fontWeight} ${sizePx}px ${fontFamilyCss(style.fontFamily)}`;
  ctx.textBaseline = 'top';
  if (SUPPORTS_LETTER_SPACING) {
    // Browser-native letter spacing (Chromium/Safari). Safe to assign on supporting contexts.
    (ctx as unknown as { letterSpacing: string }).letterSpacing = `${style.letterSpacing}px`;
  }
}

function measureLineWidth(ctx: CanvasRenderingContext2D, line: string, letterSpacing: number): number {
  const m = ctx.measureText(line);
  if (SUPPORTS_LETTER_SPACING) return m.width;
  // Fallback: emulate letter-spacing by adding (n-1) * spacing
  return m.width + Math.max(0, line.length - 1) * letterSpacing;
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  letterSpacing: number
): string[] {
  const out: string[] = [];
  for (const paragraph of text.split('\n')) {
    if (!paragraph) {
      out.push('');
      continue;
    }
    const words = paragraph.split(/\s+/);
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (measureLineWidth(ctx, candidate, letterSpacing) <= maxWidth) {
        line = candidate;
      } else {
        if (line) out.push(line);
        // If the word alone is wider than maxWidth, hard-break it.
        if (measureLineWidth(ctx, word, letterSpacing) > maxWidth) {
          let chunk = '';
          for (const ch of word) {
            const t = chunk + ch;
            if (measureLineWidth(ctx, t, letterSpacing) <= maxWidth) chunk = t;
            else {
              if (chunk) out.push(chunk);
              chunk = ch;
            }
          }
          line = chunk;
        } else {
          line = word;
        }
      }
    }
    if (line) out.push(line);
  }
  return out;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  color: string,
  opacity: number
) {
  ctx.save();
  ctx.globalAlpha = clamp(opacity, 0, 1);
  ctx.fillStyle = color;
  ctx.beginPath();
  const radius = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  // Use ctx.roundRect when available, otherwise build the path manually.
  type RoundCtx = CanvasRenderingContext2D & {
    roundRect?: (x: number, y: number, w: number, h: number, r: number) => void;
  };
  const rctx = ctx as RoundCtx;
  if (typeof rctx.roundRect === 'function') {
    rctx.roundRect!(x, y, w, h, radius);
  } else {
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }
  ctx.fill();
  ctx.restore();
}

function clamp(v: number, lo = 0, hi = 1) {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Draw a single text block (multi-line, optional bg). Returns layout info. */
async function drawTextBlock(args: DrawTextBlockArgs): Promise<DrawTextBlockResult> {
  const { ctx, text, style, x, y, maxWidth, background, scale, maxHeight, anchor = 'top-left' } = args;
  if (!text) {
    return { textWidth: 0, textHeight: 0, blockX: x, blockY: y, blockWidth: 0, blockHeight: 0, bottom: y };
  }

  // Scale all px values from 1024 reference to actual canvas
  let fontSizePx = style.fontSize * scale;
  const letterSpacingPx = (style.letterSpacing || 0) * scale;
  const outlineWidthPx = Math.max(0, style.outlineWidth) * scale;

  await ensureFontReady(style.fontFamily, style.fontWeight, fontSizePx);

  // Initial measure
  applyFont(ctx, { ...style }, fontSizePx);
  let lines = wrapLines(ctx, text, maxWidth, letterSpacingPx);

  // Auto-shrink to fit maxHeight (used by Fitment)
  if (maxHeight && maxHeight > 0) {
    const minSize = Math.max(8, fontSizePx * 0.45);
    let attempts = 0;
    while (attempts < 12) {
      const lineHeight = fontSizePx * style.lineHeight;
      const totalH = lines.length * lineHeight;
      if (totalH <= maxHeight || fontSizePx <= minSize) break;
      fontSizePx = Math.max(minSize, fontSizePx * 0.92);
      applyFont(ctx, style, fontSizePx);
      lines = wrapLines(ctx, text, maxWidth, letterSpacingPx);
      attempts++;
    }
  }

  // Final measurements
  const lineHeight = fontSizePx * style.lineHeight;
  const widths = lines.map((l) => measureLineWidth(ctx, l, letterSpacingPx));
  const textWidth = widths.length ? Math.max(...widths) : 0;
  const textHeight = lines.length * lineHeight;

  // Resolve top-left corner of the text block
  const textX = x;
  const textY = anchor === 'bottom-left' ? y - textHeight : y;

  // Background box (drawn behind the text)
  let blockX = textX;
  let blockY = textY;
  let blockWidth = textWidth;
  let blockHeight = textHeight;
  if (background?.enabled) {
    const padding = Math.max(0, background.padding) * scale;
    const radius = Math.max(0, background.borderRadius) * scale;
    blockX = textX - padding;
    blockY = textY - padding;
    blockWidth = textWidth + padding * 2;
    blockHeight = textHeight + padding * 2;
    drawRoundedRect(ctx, blockX, blockY, blockWidth, blockHeight, radius, background.color, background.opacity);
  }

  // Text drawing — Canva-style:
  //  1) (optional) shadow pass drawn once based on the glyph silhouette
  //  2) dilated outline (many fillText copies offset around (x,y) by `outlineWidth`)
  //     → outline stays OUTSIDE the glyph (no body-eating) and has no spike artifacts
  //  3) final fill text on top
  ctx.save();
  ctx.globalAlpha = clamp(style.opacity, 0, 1);
  applyFont(ctx, style, fontSizePx);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineW = widths[i];
    let drawX = textX;
    if (style.textAlign === 'center') drawX = textX + (textWidth - lineW) / 2;
    if (style.textAlign === 'right') drawX = textX + (textWidth - lineW);
    const drawY = textY + i * lineHeight;

    drawStyledLine(ctx, line, drawX, drawY, style, outlineWidthPx, scale);
  }
  ctx.restore();

  return {
    textWidth,
    textHeight,
    blockX,
    blockY,
    blockWidth,
    blockHeight,
    bottom: blockY + blockHeight,
  };
}

/**
 * Render a single line of text with the marketplace-spiky outline look.
 *
 * Uses ctx.strokeText() so the outline follows the EXACT glyph path — this
 * preserves the font's natural character. Display fonts like Gagalin have
 * grunge/spike texture built into their glyph outlines; with strokeText
 * that character is faithfully reproduced (matches what Canva shows).
 *
 * Shadow is set BEFORE the first draw (the stroke) so it casts from the
 * outline silhouette, then cleared so the fill doesn't add a second shadow.
 *
 *   1. Apply shadow on the context.
 *   2. strokeText with thick lineWidth and sharp miter joins.
 *   3. Clear shadow (otherwise the fill pass would stack a 2nd shadow).
 *   4. fillText on top.
 */
function drawStyledLine(
  ctx: CanvasRenderingContext2D,
  line: string,
  x: number,
  y: number,
  style: TextStyle,
  outlineWidth: number,
  scale: number
) {
  const hasShadow = style.shadowEnabled;
  const hasOutline = outlineWidth > 0;

  // 1) Shadow (once, so it doesn't stack between stroke & fill)
  if (hasShadow) {
    ctx.shadowColor = style.shadowColor;
    ctx.shadowBlur = Math.max(0, style.shadowBlur) * scale;
    ctx.shadowOffsetX = style.shadowOffsetX * scale;
    ctx.shadowOffsetY = style.shadowOffsetY * scale;
  }

  // 2) Outline pass — strokeText follows the glyph path, preserving spikes/grunge.
  // 'miter' join with high miterLimit keeps the spikes pronounced (don't round them off).
  if (hasOutline) {
    ctx.lineWidth = outlineWidth;
    ctx.strokeStyle = style.outlineColor;
    ctx.lineJoin = 'miter';
    ctx.miterLimit = 12;
    ctx.strokeText(line, x, y);

    // 3) Disable shadow before fill so we don't stack a second shadow.
    if (hasShadow) {
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
  }

  // 4) Fill on top of the outline (which means fill sits inside the stroked path)
  ctx.fillStyle = style.color;
  ctx.fillText(line, x, y);
}

/* ───────── High-level entry point ───────── */

interface DrawProductTextArgs {
  ctx: CanvasRenderingContext2D;
  canvasSize: number;
  content: ProductTextContent;
}

/** Draws Title, Code (+optional ORIGINAL label), and Fitment per their configs. */
export async function drawProductText({
  ctx,
  canvasSize,
  content,
}: DrawProductTextArgs): Promise<void> {
  const scale = canvasSize / 1024;

  // 1) Title — anchored top-left
  if (content.title.enabled && content.title.text) {
    await drawTitle(ctx, canvasSize, scale, content.title);
  }

  // 2) Product Code (+ optional Original 100% label) — anchored top-left
  if (content.code.enabled && content.code.text) {
    await drawCode(ctx, canvasSize, scale, content.code);
  }

  // 3) Fitment — anchored bottom-left
  if (content.fitment.enabled && content.fitment.text) {
    await drawFitment(ctx, canvasSize, scale, content.fitment);
  }
}

async function drawTitle(
  ctx: CanvasRenderingContext2D,
  canvasSize: number,
  scale: number,
  cfg: ProductTitleConfig
) {
  const x = cfg.marginLeftPx * scale;
  const y = cfg.marginTopPx * scale;
  const maxW = Math.min(cfg.maxWidthPx * scale, canvasSize - x - 8);
  await drawTextBlock({
    ctx,
    text: cfg.text,
    style: cfg.style,
    x,
    y,
    maxWidth: maxW,
    background: cfg.background,
    scale,
  });
}

async function drawCode(
  ctx: CanvasRenderingContext2D,
  canvasSize: number,
  scale: number,
  cfg: ProductCodeConfig
) {
  const x = cfg.marginLeftPx * scale;
  const y = cfg.marginTopPx * scale;
  const codeText = `KODE ${cfg.text}`.trim();
  const codeBlock = await drawTextBlock({
    ctx,
    text: codeText,
    style: cfg.style,
    x,
    y,
    maxWidth: canvasSize - x - 8,
    scale,
  });

  // Optional ORIGINAL 100% label below the code
  if (cfg.labelEnabled && cfg.labelText) {
    const gap = (cfg.labelGapPx || 0) * scale;
    await drawTextBlock({
      ctx,
      text: cfg.labelText,
      style: cfg.labelStyle,
      x,
      y: codeBlock.bottom + gap,
      maxWidth: canvasSize - x - 8,
      background: cfg.labelBackground,
      scale,
    });
  }
}

async function drawFitment(
  ctx: CanvasRenderingContext2D,
  canvasSize: number,
  scale: number,
  cfg: FitmentConfig
) {
  const x = cfg.marginLeftPx * scale;
  // Anchor bottom-left: y is the canvas bottom minus marginBottom
  const y = canvasSize - cfg.marginBottomPx * scale;
  const maxW = Math.min(cfg.maxWidthPx * scale, canvasSize - x - 8);
  const maxH = cfg.maxHeightPx > 0 ? cfg.maxHeightPx * scale : undefined;
  await drawTextBlock({
    ctx,
    text: cfg.text,
    style: cfg.style,
    x,
    y,
    anchor: 'bottom-left',
    maxWidth: maxW,
    background: cfg.background,
    scale,
    maxHeight: maxH,
  });
}
