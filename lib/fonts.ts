/**
 * Curated list of fonts for the text overlays — loaded via Google Fonts in
 * app/layout.tsx so they're available to both CSS preview and Canvas2D draws.
 *
 * For Canvas2D rendering, we ALWAYS call ensureFontReady() in lib/textComposer.ts
 * before drawing so the actual font is used (not the fallback).
 */

export type FontFamily =
  | 'Anton'
  | 'Bebas Neue'
  | 'Oswald'
  | 'Poppins'
  | 'Montserrat'
  | 'Luckiest Guy'
  | 'Bangers'
  | 'Archivo Black'
  | 'Inter'
  | 'Impact';

export interface FontInfo {
  family: FontFamily;
  /** Category label for the dropdown */
  category: 'Bold / Strong' | 'Clean / Professional' | 'Playful / Marketplace' | 'Compact / Narrow';
  /** Font weights available (used to render the dropdown previews) */
  weights: number[];
  /** Whether this font is loaded from Google (true) or system fallback (false) */
  google: boolean;
}

export const FONT_LIST: FontInfo[] = [
  { family: 'Anton',         category: 'Compact / Narrow',       weights: [400],                      google: true },
  { family: 'Bebas Neue',    category: 'Compact / Narrow',       weights: [400],                      google: true },
  { family: 'Oswald',        category: 'Bold / Strong',          weights: [400, 600, 700],            google: true },
  { family: 'Archivo Black', category: 'Bold / Strong',          weights: [400],                      google: true },
  { family: 'Bangers',       category: 'Playful / Marketplace',  weights: [400],                      google: true },
  { family: 'Luckiest Guy',  category: 'Playful / Marketplace',  weights: [400],                      google: true },
  { family: 'Montserrat',    category: 'Clean / Professional',   weights: [400, 600, 700, 800, 900],  google: true },
  { family: 'Poppins',       category: 'Clean / Professional',   weights: [400, 600, 700, 800],       google: true },
  { family: 'Inter',         category: 'Clean / Professional',   weights: [400, 600, 700, 800],       google: true },
  { family: 'Impact',        category: 'Bold / Strong',          weights: [400],                      google: false },
];

/**
 * Builds the Google Fonts CSS URL with all our families & weights.
 * Use this in app/layout.tsx as a <link href={...}> tag.
 */
export function buildGoogleFontsUrl(): string {
  const parts: string[] = [];
  for (const f of FONT_LIST) {
    if (!f.google) continue;
    const family = f.family.replace(/ /g, '+');
    if (f.weights.length === 1 && f.weights[0] === 400) {
      parts.push(`family=${family}`);
    } else {
      parts.push(`family=${family}:wght@${f.weights.join(';')}`);
    }
  }
  return `https://fonts.googleapis.com/css2?${parts.join('&')}&display=swap`;
}

/** CSS font-family string (with safe fallbacks) ready to drop into ctx.font / CSS */
export function fontFamilyCss(family: FontFamily): string {
  return `"${family}", Impact, "Arial Black", sans-serif`;
}
