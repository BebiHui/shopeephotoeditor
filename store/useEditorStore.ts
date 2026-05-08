import { create } from 'zustand';
import type {
  Photo,
  PhotoStatus,
  Logo,
  EnhancementPreset,
  EnhancementParams,
  LogoConfig,
  CanvasConfig,
  TopRightLogosConfig,
  TopRightLogo,
  ProductTextContent,
  ProductTitleConfig,
  ProductCodeConfig,
  FitmentConfig,
  TextStyle,
  BoxStyle,
  TextPresetKey,
} from '@/lib/types';
import {
  PRESET_PARAMS,
  DEFAULT_TOP_RIGHT_LOGOS_CFG,
  DEFAULT_PRODUCT_TEXT_CONTENT,
  TEXT_PRESETS,
} from '@/lib/types';
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

  // Logo config (main store logo)
  logoConfig: LogoConfig;
  setLogoConfig: (patch: Partial<LogoConfig>) => void;

  // Canvas config
  canvasConfig: CanvasConfig;
  setCanvasConfig: (patch: Partial<CanvasConfig>) => void;

  // Additional top-right logos
  topRightLogosCfg: TopRightLogosConfig;
  setTopRightLogosCfg: (patch: Partial<TopRightLogosConfig>) => void;
  setTopRightLogo: (slot: 'logo1' | 'logo2', patch: Partial<TopRightLogo>) => void;
  uploadTopRightLogo: (slot: 'logo1' | 'logo2', file: File) => void;
  clearTopRightLogo: (slot: 'logo1' | 'logo2') => void;

  // Product text content (Title / Code / Fitment)
  textContent: ProductTextContent;
  setTitle: (patch: Partial<ProductTitleConfig>) => void;
  setTitleStyle: (patch: Partial<TextStyle>) => void;
  setTitleBackground: (patch: Partial<BoxStyle>) => void;
  setCode: (patch: Partial<ProductCodeConfig>) => void;
  setCodeStyle: (patch: Partial<TextStyle>) => void;
  setLabelStyle: (patch: Partial<TextStyle>) => void;
  setLabelBackground: (patch: Partial<BoxStyle>) => void;
  setFitment: (patch: Partial<FitmentConfig>) => void;
  setFitmentStyle: (patch: Partial<TextStyle>) => void;
  setFitmentBackground: (patch: Partial<BoxStyle>) => void;
  applyTextPreset: (key: TextPresetKey) => void;

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

  // ----- Logo config (main) -----
  logoConfig: DEFAULT_LOGO_CFG,
  setLogoConfig: (patch) =>
    set((s) => ({ logoConfig: { ...s.logoConfig, ...patch } })),

  // ----- Canvas config -----
  canvasConfig: DEFAULT_CANVAS_CFG,
  setCanvasConfig: (patch) =>
    set((s) => ({ canvasConfig: { ...s.canvasConfig, ...patch } })),

  // ----- Top-right logos -----
  topRightLogosCfg: DEFAULT_TOP_RIGHT_LOGOS_CFG,
  setTopRightLogosCfg: (patch) =>
    set((s) => ({ topRightLogosCfg: { ...s.topRightLogosCfg, ...patch } })),
  setTopRightLogo: (slot, patch) =>
    set((s) => {
      const old = s.topRightLogosCfg[slot];
      if (patch.url !== undefined && old.url && old.url !== patch.url) {
        URL.revokeObjectURL(old.url);
      }
      return {
        topRightLogosCfg: { ...s.topRightLogosCfg, [slot]: { ...old, ...patch } },
      };
    }),
  uploadTopRightLogo: (slot, file) => {
    const url = URL.createObjectURL(file);
    set((s) => {
      const old = s.topRightLogosCfg[slot];
      if (old.url) URL.revokeObjectURL(old.url);
      return {
        topRightLogosCfg: {
          ...s.topRightLogosCfg,
          [slot]: { ...old, url, fileName: file.name, enabled: true },
        },
      };
    });
  },
  clearTopRightLogo: (slot) =>
    set((s) => {
      const old = s.topRightLogosCfg[slot];
      if (old.url) URL.revokeObjectURL(old.url);
      return {
        topRightLogosCfg: { ...s.topRightLogosCfg, [slot]: { enabled: false } },
      };
    }),

  // ----- Product Text Content -----
  textContent: DEFAULT_PRODUCT_TEXT_CONTENT,
  setTitle: (patch) =>
    set((s) => ({ textContent: { ...s.textContent, title: { ...s.textContent.title, ...patch } } })),
  setTitleStyle: (patch) =>
    set((s) => ({
      textContent: {
        ...s.textContent,
        title: { ...s.textContent.title, style: { ...s.textContent.title.style, ...patch } },
      },
    })),
  setTitleBackground: (patch) =>
    set((s) => ({
      textContent: {
        ...s.textContent,
        title: { ...s.textContent.title, background: { ...s.textContent.title.background, ...patch } },
      },
    })),
  setCode: (patch) =>
    set((s) => ({ textContent: { ...s.textContent, code: { ...s.textContent.code, ...patch } } })),
  setCodeStyle: (patch) =>
    set((s) => ({
      textContent: {
        ...s.textContent,
        code: { ...s.textContent.code, style: { ...s.textContent.code.style, ...patch } },
      },
    })),
  setLabelStyle: (patch) =>
    set((s) => ({
      textContent: {
        ...s.textContent,
        code: { ...s.textContent.code, labelStyle: { ...s.textContent.code.labelStyle, ...patch } },
      },
    })),
  setLabelBackground: (patch) =>
    set((s) => ({
      textContent: {
        ...s.textContent,
        code: {
          ...s.textContent.code,
          labelBackground: { ...s.textContent.code.labelBackground, ...patch },
        },
      },
    })),
  setFitment: (patch) =>
    set((s) => ({ textContent: { ...s.textContent, fitment: { ...s.textContent.fitment, ...patch } } })),
  setFitmentStyle: (patch) =>
    set((s) => ({
      textContent: {
        ...s.textContent,
        fitment: { ...s.textContent.fitment, style: { ...s.textContent.fitment.style, ...patch } },
      },
    })),
  setFitmentBackground: (patch) =>
    set((s) => ({
      textContent: {
        ...s.textContent,
        fitment: {
          ...s.textContent.fitment,
          background: { ...s.textContent.fitment.background, ...patch },
        },
      },
    })),
  applyTextPreset: (key) => {
    const preset = TEXT_PRESETS.find((p) => p.key === key);
    if (!preset) return;
    set((s) => ({
      textContent: {
        ...s.textContent,
        title: {
          ...s.textContent.title,
          style: { ...s.textContent.title.style, ...(preset.apply.title ?? {}) },
        },
        code: {
          ...s.textContent.code,
          style: { ...s.textContent.code.style, ...(preset.apply.code ?? {}) },
        },
        fitment: {
          ...s.textContent.fitment,
          style: { ...s.textContent.fitment.style, ...(preset.apply.fitment ?? {}) },
        },
      },
    }));
  },

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
