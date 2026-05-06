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
