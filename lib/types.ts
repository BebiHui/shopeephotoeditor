import type { FontFamily } from './fonts';

export type PhotoStatus =
  | 'pending'
  | 'removing-bg'
  | 'enhancing'
  | 'compositing'
  | 'done'
  | 'error';

export interface Photo {
  id: string;
  fileName: string;
  originalUrl: string;       // object URL of original upload
  cutoutUrl?: string;        // transparent PNG with bg removed
  finalUrl?: string;         // final composite (canvas + bg + logo)
  finalBlob?: Blob;          // for ZIP export
  status: PhotoStatus;
  errorMessage?: string;
  width?: number;
  height?: number;
}

export interface Logo {
  id: string;
  name: string;
  url: string;               // object URL
}

export type EnhancementPreset = 'natural' | 'bright' | 'premium' | 'custom';

export interface EnhancementParams {
  brightness: number; // -50 .. +50
  contrast: number;   // -50 .. +50
  saturation: number; // -50 .. +50
  sharpness: number;  // 0 .. 100
  warmth: number;     // -50 .. +50
}

export type LogoPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'custom';

export interface LogoConfig {
  position: LogoPosition;
  /** Logo width as a fraction of canvas width (0.05 .. 0.5) */
  sizeRatio: number;
  /** 0 .. 1 */
  opacity: number;
  /** Margin in px from canvas edge */
  margin: number;
  /** Custom position (only used when position === 'custom'), 0..1 of canvas */
  customX: number;
  customY: number;
}

export type CanvasSize = 800 | 1024 | 1080 | 1200;
export type BackgroundType = 'white' | 'transparent' | 'gray' | 'custom';

export interface CanvasConfig {
  size: CanvasSize;
  background: BackgroundType;
  customColor: string; // hex, used when background==='custom'
  /** Padding ratio: subject occupies (1 - 2*padding) of canvas. e.g. 0.08 = 8% padding each side */
  padding: number;
}

export const PRESET_PARAMS: Record<Exclude<EnhancementPreset, 'custom'>, EnhancementParams> = {
  natural: { brightness: 5, contrast: 10, saturation: 5, sharpness: 15, warmth: 0 },
  bright:  { brightness: 15, contrast: 5, saturation: 0, sharpness: 10, warmth: -5 },
  premium: { brightness: 8, contrast: 18, saturation: 10, sharpness: 20, warmth: 4 },
};

/* ───────── Top-right additional logos ───────── */

export interface TopRightLogo {
  enabled: boolean;
  url?: string;
  fileName?: string;
}

export interface TopRightLogosConfig {
  logo1: TopRightLogo;
  logo2: TopRightLogo;
  widthPx: number;
  marginTopPx: number;
  marginRightPx: number;
  gapPx: number;
  opacity: number;
}

export const DEFAULT_TOP_RIGHT_LOGOS_CFG: TopRightLogosConfig = {
  logo1: { enabled: false },
  logo2: { enabled: false },
  widthPx: 150,
  marginTopPx: 20,
  marginRightPx: 20,
  gapPx: 12,
  opacity: 1,
};

/* ───────── Product Text Content (Title / Code / Fitment) ─────────
 * All measurements (font size, margins, padding) are in px @ 1024 reference
 * canvas. The composer scales them by canvasSize/1024 so 800/1080/1200 outputs
 * stay proportional.
 */

export type FontWeightOption = 400 | 500 | 600 | 700 | 800 | 900;
export type TextAlign = 'left' | 'center' | 'right';

/** Visual style applied to a single text block. Any value below in px is @ 1024. */
export interface TextStyle {
  fontFamily: FontFamily;
  fontSize: number;
  fontWeight: FontWeightOption;
  color: string;          // hex
  outlineColor: string;
  outlineWidth: number;   // 0 disables outline
  shadowEnabled: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  letterSpacing: number;
  lineHeight: number;     // multiplier (e.g. 1.1)
  textAlign: TextAlign;
  opacity: number;        // 0..1
}

export interface BoxStyle {
  enabled: boolean;
  color: string;       // hex
  opacity: number;     // 0..1
  padding: number;     // px @ 1024
  borderRadius: number;// px @ 1024
}

export interface ProductTitleConfig {
  enabled: boolean;
  text: string;
  style: TextStyle;
  background: BoxStyle;
  marginTopPx: number;
  marginLeftPx: number;
  maxWidthPx: number;
}

export interface ProductCodeConfig {
  enabled: boolean;
  /** The code itself (e.g. "KVB"). Composer renders "KODE {text}". */
  text: string;
  style: TextStyle;
  marginTopPx: number;
  marginLeftPx: number;
  /** Whether to show the small "ORIGINAL 100%" label below the code */
  labelEnabled: boolean;
  labelText: string;
  labelStyle: TextStyle;
  labelBackground: BoxStyle;
  labelGapPx: number;
}

export interface FitmentConfig {
  enabled: boolean;
  /** Multiline (one motorcycle per line). */
  text: string;
  style: TextStyle;
  background: BoxStyle;
  marginBottomPx: number;
  marginLeftPx: number;
  maxWidthPx: number;
  /** If 0 = no max; otherwise composer auto-shrinks font to fit. */
  maxHeightPx: number;
}

export interface ProductTextContent {
  title: ProductTitleConfig;
  code: ProductCodeConfig;
  fitment: FitmentConfig;
}

/* ───────── Default styles (matches marketplace reference look) ───────── */

const titleStyleDefault: TextStyle = {
  fontFamily: 'Anton',
  fontSize: 96,
  fontWeight: 700,
  color: '#dc2626',         // red
  outlineColor: '#000000',  // black
  outlineWidth: 6,
  shadowEnabled: false,
  shadowColor: '#000000',
  shadowBlur: 6,
  shadowOffsetX: 2,
  shadowOffsetY: 4,
  letterSpacing: 0,
  lineHeight: 1.05,
  textAlign: 'left',
  opacity: 1,
};

const codeStyleDefault: TextStyle = {
  fontFamily: 'Anton',
  fontSize: 76,
  fontWeight: 700,
  color: '#fbbf24',         // yellow
  outlineColor: '#000000',
  outlineWidth: 5,
  shadowEnabled: false,
  shadowColor: '#000000',
  shadowBlur: 4,
  shadowOffsetX: 2,
  shadowOffsetY: 3,
  letterSpacing: 2,
  lineHeight: 1,
  textAlign: 'left',
  opacity: 1,
};

const labelStyleDefault: TextStyle = {
  fontFamily: 'Anton',
  fontSize: 28,
  fontWeight: 700,
  color: '#ffffff',
  outlineColor: '#000000',
  outlineWidth: 0,
  shadowEnabled: false,
  shadowColor: '#000000',
  shadowBlur: 0,
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  letterSpacing: 1,
  lineHeight: 1,
  textAlign: 'left',
  opacity: 1,
};

const fitmentStyleDefault: TextStyle = {
  fontFamily: 'Bebas Neue',
  fontSize: 38,
  fontWeight: 700,
  color: '#fde047',         // yellow-300
  outlineColor: '#dc2626',  // red
  outlineWidth: 3,
  shadowEnabled: false,
  shadowColor: '#000000',
  shadowBlur: 0,
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  letterSpacing: 0.5,
  lineHeight: 1.15,
  textAlign: 'left',
  opacity: 1,
};

export const DEFAULT_PRODUCT_TEXT_CONTENT: ProductTextContent = {
  title: {
    enabled: false,
    text: '',
    style: titleStyleDefault,
    background: { enabled: false, color: '#ffffff', opacity: 0.85, padding: 16, borderRadius: 10 },
    marginTopPx: 60,
    marginLeftPx: 50,
    maxWidthPx: 620,
  },
  code: {
    enabled: false,
    text: '',
    style: codeStyleDefault,
    marginTopPx: 230,
    marginLeftPx: 50,
    labelEnabled: true,
    labelText: 'ORIGINAL 100%',
    labelStyle: labelStyleDefault,
    labelBackground: { enabled: true, color: '#dc2626', opacity: 1, padding: 14, borderRadius: 6 },
    labelGapPx: 14,
  },
  fitment: {
    enabled: false,
    text: '',
    style: fitmentStyleDefault,
    background: { enabled: true, color: '#dc2626', opacity: 1, padding: 18, borderRadius: 12 },
    marginBottomPx: 60,
    marginLeftPx: 50,
    maxWidthPx: 620,
    maxHeightPx: 380,
  },
};

/* ───────── Style presets (apply to title / code / fitment) ───────── */

export type TextPresetKey = 'marketplace_bold' | 'clean_pro' | 'promo_strong' | 'shopee_style';

export interface TextPreset {
  key: TextPresetKey;
  label: string;
  description: string;
  /** Partial style overrides applied on top of current values for each element. */
  apply: {
    title?: Partial<TextStyle>;
    code?: Partial<TextStyle>;
    fitment?: Partial<TextStyle>;
  };
}

export const TEXT_PRESETS: TextPreset[] = [
  {
    key: 'marketplace_bold',
    label: 'Marketplace Bold',
    description: 'Anton/Bebas, outline tebal, sangat mencolok.',
    apply: {
      title:   { fontFamily: 'Anton',      color: '#dc2626', outlineColor: '#000000', outlineWidth: 6, fontWeight: 700 },
      code:    { fontFamily: 'Anton',      color: '#fbbf24', outlineColor: '#000000', outlineWidth: 5, fontWeight: 700 },
      fitment: { fontFamily: 'Bebas Neue', color: '#fde047', outlineColor: '#dc2626', outlineWidth: 3, fontWeight: 700 },
    },
  },
  {
    key: 'clean_pro',
    label: 'Clean Professional',
    description: 'Poppins/Montserrat, outline tipis, rapi profesional.',
    apply: {
      title:   { fontFamily: 'Montserrat', color: '#111827', outlineColor: '#ffffff', outlineWidth: 2, fontWeight: 800 },
      code:    { fontFamily: 'Poppins',    color: '#dc2626', outlineColor: '#ffffff', outlineWidth: 2, fontWeight: 700 },
      fitment: { fontFamily: 'Inter',      color: '#ffffff', outlineColor: '#000000', outlineWidth: 1, fontWeight: 600 },
    },
  },
  {
    key: 'promo_strong',
    label: 'Promo Strong',
    description: 'Bangers/Luckiest Guy, shadow aktif, super eye-catching.',
    apply: {
      title:   { fontFamily: 'Luckiest Guy', color: '#facc15', outlineColor: '#000000', outlineWidth: 7, shadowEnabled: true, shadowColor: '#000000', shadowBlur: 8, shadowOffsetX: 4, shadowOffsetY: 4, fontWeight: 700 },
      code:    { fontFamily: 'Bangers',      color: '#ffffff', outlineColor: '#dc2626', outlineWidth: 6, shadowEnabled: true, shadowColor: '#000000', shadowBlur: 4, shadowOffsetX: 2, shadowOffsetY: 2, fontWeight: 700 },
      fitment: { fontFamily: 'Bangers',      color: '#fde047', outlineColor: '#000000', outlineWidth: 3, fontWeight: 700 },
    },
  },
  {
    key: 'shopee_style',
    label: 'Shopee Style',
    description: 'Mirip foto produk Shopee — bold + outline kontras.',
    apply: {
      title:   { fontFamily: 'Anton', color: '#dc2626', outlineColor: '#000000', outlineWidth: 6, letterSpacing: 1, fontWeight: 700 },
      code:    { fontFamily: 'Anton', color: '#fbbf24', outlineColor: '#000000', outlineWidth: 5, letterSpacing: 2, fontWeight: 700 },
      fitment: { fontFamily: 'Anton', color: '#fde047', outlineColor: '#dc2626', outlineWidth: 3, letterSpacing: 0.5, fontWeight: 700 },
    },
  },
];

/* ───────── Color palette presets ───────── */

export const QUICK_COLORS = [
  '#dc2626', // red
  '#fbbf24', // yellow
  '#fde047', // light yellow
  '#ffffff', // white
  '#000000', // black
  '#1d4ed8', // blue
  '#f97316', // orange
  '#16a34a', // green
];
