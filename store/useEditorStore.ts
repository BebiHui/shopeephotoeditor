import { create } from 'zustand';
import type {
  Photo,
  PhotoStatus,
  Logo,
  EnhancementPreset,
  EnhancementParams,
  LogoConfig,
  CanvasConfig,
} from '@/lib/types';
import { PRESET_PARAMS } from '@/lib/types';
import { uid } from '@/lib/utils';

export interface EditorState {
  // Photos
  photos: Photo[];
  addPhotos: (files: File[]) => void;
  removePhoto: (id: string) => void;
  clearPhotos: () => void;
  updatePhoto: (id: string, patch: Partial<Photo>) => void;
  setPhotoStatus: (id: string, status: PhotoStatus, errorMessage?: string) => void;

  // Logos
  logos: Logo[];
  selectedLogoId: string | null;
  addLogos: (files: File[]) => void;
  removeLogo: (id: string) => void;
  selectLogo: (id: string | null) => void;

  // Enhancement
  preset: EnhancementPreset;
  manualEnhancement: EnhancementParams;
  setPreset: (p: EnhancementPreset) => void;
  setManualEnhancement: (patch: Partial<EnhancementParams>) => void;
  getEffectiveEnhancement: () => EnhancementParams;

  // Logo config
  logoConfig: LogoConfig;
  setLogoConfig: (patch: Partial<LogoConfig>) => void;

  // Canvas config
  canvasConfig: CanvasConfig;
  setCanvasConfig: (patch: Partial<CanvasConfig>) => void;

  // UI
  isProcessing: boolean;
  setProcessing: (v: boolean) => void;
  modelLoading: boolean;
  modelLoadProgress: number; // 0..1
  setModelLoading: (loading: boolean, progress?: number) => void;
  fileNamePrefix: string;
  setFileNamePrefix: (s: string) => void;
}

const DEFAULT_LOGO_CFG: LogoConfig = {
  position: 'bottom-right',
  sizeRatio: 0.18,
  opacity: 0.95,
  margin: 28,
  customX: 0.85,
  customY: 0.85,
};

const DEFAULT_CANVAS_CFG: CanvasConfig = {
  size: 1024,
  background: 'white',
  customColor: '#ffffff',
  padding: 0.08,
};

export const useEditorStore = create<EditorState>((set, get) => ({
  // ----- Photos -----
  photos: [],
  addPhotos: (files) => {
    const next: Photo[] = files.map((f) => ({
      id: uid('p_'),
      fileName: f.name,
      originalUrl: URL.createObjectURL(f),
      status: 'pending',
    }));
    set((s) => ({ photos: [...s.photos, ...next] }));
  },
  removePhoto: (id) =>
    set((s) => {
      const target = s.photos.find((p) => p.id === id);
      if (target) {
        URL.revokeObjectURL(target.originalUrl);
        if (target.cutoutUrl) URL.revokeObjectURL(target.cutoutUrl);
        if (target.finalUrl) URL.revokeObjectURL(target.finalUrl);
      }
      return { photos: s.photos.filter((p) => p.id !== id) };
    }),
  clearPhotos: () =>
    set((s) => {
      s.photos.forEach((p) => {
        URL.revokeObjectURL(p.originalUrl);
        if (p.cutoutUrl) URL.revokeObjectURL(p.cutoutUrl);
        if (p.finalUrl) URL.revokeObjectURL(p.finalUrl);
      });
      return { photos: [] };
    }),
  updatePhoto: (id, patch) =>
    set((s) => ({
      photos: s.photos.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    })),
  setPhotoStatus: (id, status, errorMessage) =>
    set((s) => ({
      photos: s.photos.map((p) =>
        p.id === id ? { ...p, status, errorMessage } : p
      ),
    })),

  // ----- Logos -----
  logos: [],
  selectedLogoId: null,
  addLogos: (files) => {
    const next: Logo[] = files.map((f) => ({
      id: uid('l_'),
      name: f.name,
      url: URL.createObjectURL(f),
    }));
    set((s) => ({
      logos: [...s.logos, ...next],
      selectedLogoId: s.selectedLogoId ?? next[0]?.id ?? null,
    }));
  },
  removeLogo: (id) =>
    set((s) => {
      const target = s.logos.find((l) => l.id === id);
      if (target) URL.revokeObjectURL(target.url);
      const remaining = s.logos.filter((l) => l.id !== id);
      return {
        logos: remaining,
        selectedLogoId:
          s.selectedLogoId === id ? remaining[0]?.id ?? null : s.selectedLogoId,
      };
    }),
  selectLogo: (id) => set({ selectedLogoId: id }),

  // ----- Enhancement -----
  preset: 'natural',
  manualEnhancement: PRESET_PARAMS.natural,
  setPreset: (p) =>
    set(() => ({
      preset: p,
      manualEnhancement:
        p === 'custom' ? get().manualEnhancement : PRESET_PARAMS[p],
    })),
  setManualEnhancement: (patch) =>
    set((s) => ({
      preset: 'custom',
      manualEnhancement: { ...s.manualEnhancement, ...patch },
    })),
  getEffectiveEnhancement: () => get().manualEnhancement,

  // ----- Logo config -----
  logoConfig: DEFAULT_LOGO_CFG,
  setLogoConfig: (patch) =>
    set((s) => ({ logoConfig: { ...s.logoConfig, ...patch } })),

  // ----- Canvas config -----
  canvasConfig: DEFAULT_CANVAS_CFG,
  setCanvasConfig: (patch) =>
    set((s) => ({ canvasConfig: { ...s.canvasConfig, ...patch } })),

  // ----- UI -----
  isProcessing: false,
  setProcessing: (v) => set({ isProcessing: v }),
  modelLoading: false,
  modelLoadProgress: 0,
  setModelLoading: (loading, progress = 0) =>
    set({ modelLoading: loading, modelLoadProgress: progress }),
  fileNamePrefix: 'product-photo',
  setFileNamePrefix: (s) => set({ fileNamePrefix: s }),
}));
