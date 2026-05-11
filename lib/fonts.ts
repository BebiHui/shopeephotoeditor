/**
 * Curated list of fonts for the text overlays.
 *
 * Loading strategy:
 *  - google: true  → loaded automatically via Google Fonts CDN
 *                     (URL built by buildGoogleFontsUrl(), injected in app/layout.tsx)
 *  - google: false → loaded by @font-face declarations in app/globals.css
 *                     (place the actual font files in /public/fonts/)
 *
 * For Canvas2D rendering, lib/textComposer.ts always calls document.fonts.load(...)
 * before drawing, so as long as the font is declared (either way), it will be
 * used in the final exported image.
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
  | 'Impact'
  | 'Gagalin'              // local @font-face
  | 'ITC Motter Corpus'    // local @font-face
  | 'Lilita One';          // Google Font

export interface FontInfo {
  family: FontFamily;
  category: 'Bold / Strong' | 'Clean / Professional' | 'Playful / Marketplace' | 'Compact / Narrow';
  weights: number[];
  /** true = loaded from Google Fonts CDN, false = local @font-face in /public/fonts */
  google: boolean;
}

export const FONT_LIST: FontInfo[] = [
  // Local / system fallback
  { family: 'Gagalin',            category: 'Bold / Strong',         weights: [400],                      google: false },
  { family: 'ITC Motter Corpus',  category: 'Bold / Strong',         weights: [400],                      google: false },
  // Google Fonts
  { family: 'Lilita One',         category: 'Bold / Strong',         weights: [400],                      google: true  },
  { family: 'Anton',              category: 'Compact / Narrow',      weights: [400],                      google: true  },
  { family: 'Bebas Neue',         category: 'Compact / Narrow',      weights: [400],                      google: true  },
  { family: 'Oswald',             category: 'Bold / Strong',         weights: [400, 600, 700],            google: true  },
  { family: 'Archivo Black',      category: 'Bold / Strong',         weights: [400],                      google: true  },
  { family: 'Bangers',            category: 'Playful / Marketplace', weights: [400],                      google: true  },
  { family: 'Luckiest Guy',       category: 'Playful / Marketplace', weights: [400],                      google: true  },
  { family: 'Montserrat',         category: 'Clean / Professional',  weights: [400, 600, 700, 800, 900],  google: true  },
  { family: 'Poppins',            category: 'Clean / Professional',  weights: [400, 600, 700, 800],       google: true  },
  { family: 'Inter',              category: 'Clean / Professional',  weights: [400, 600, 700, 800],       google: true  },
  // System fallback (no network)
  { family: 'Impact',             category: 'Bold / Strong',         weights: [400],                      google: false },
];

/**
 * Builds the Google Fonts CSS URL for all `google: true` families.
 * Used in app/layout.tsx as a <link href={...}> tag.
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
