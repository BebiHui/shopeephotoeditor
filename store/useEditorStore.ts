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
  Preset,
  SerializableEditorState,
} from '@/lib/types';
import {
  PRESET_PARAMS,
  DEFAULT_TOP_RIGHT_LOGOS_CFG,
  DEFAULT_PRODUCT_TEXT_CONTENT,
  TEXT_PRESETS,
} from '@/lib/types';
import { uid } from '@/lib/utils';
import {
  idbDeleteLogo,
  idbGetAllLogos,
  idbPutLogo,
  idbUpdateLogoName,
} from '@/lib/persistence/idb';
import {
  clearLastSession,
  debouncedSaveLastSession,
  getDefaultPresetId,
  getLastSession,
  listPresets,
  savePresetList,
  setDefaultPresetIdStored,
} from '@/lib/persistence/storage';
import {
  buildApplyPatch,
  extractSerializableState,
} from '@/lib/persistence/serialize';

export interface HydrateResult {
  /** Whether a last-session was found and applied */
  restoredLastSession: boolean;
  /** Whether a default preset was applied (only when there was no last-session) */
  restoredDefaultPreset: boolean;
  /** Missing logo IDs (from any restoration step) */
  missingLogoIds: string[];
}

export interface EditorState {
  // Photos
  photos: Photo[];
  addPhotos: (files: File[]) => void;
  removePhoto: (id: string) => void;
  clearPhotos: () => void;
  updatePhoto: (id: string, patch: Partial<Photo>) => void;
  setPhotoStatus: (id: string, status: PhotoStatus, errorMessage?: string) => void;

  // Logos (Library)
  logos: Logo[];
  selectedLogoId: string | null;
  addLogos: (files: File[]) => Promise<void>;
  removeLogo: (id: string) => Promise<void>;
  renameLogo: (id: string, name: string) => Promise<void>;
  selectLogo: (id: string | null) => void;
  /** Assign an existing library logo to a top-right slot */
  setTopRightLogoFromLibrary: (slot: 'logo1' | 'logo2', logoId: string | null) => void;

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
  uploadTopRightLogo: (slot: 'logo1' | 'logo2', file: File) => Promise<void>;
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

  // ── Preset Manager ──
  presets: Preset[];
  defaultPresetId: string | null;
  currentPresetId: string | null;
  /** Last warning surfaced by load/restore. Cleared by UI on dismiss. */
  presetWarning: string | null;
  setPresetWarning: (msg: string | null) => void;
  saveCurrentAsPreset: (name: string, opts: { includeTextContent: boolean }) => string;
  updatePreset: (id: string, opts: { includeTextContent: boolean }) => void;
  deletePreset: (id: string) => void;
  duplicatePreset: (id: string, newName?: string) => string | null;
  loadPreset: (id: string) => void;
  renamePreset: (id: string, name: string) => void;
  setDefaultPreset: (id: string | null) => void;

  // ── Hydration / persistence ──
  hydrated: boolean;
  hydrate: () => Promise<HydrateResult>;
  /** Persist a snapshot of current state to localStorage (debounced). */
  scheduleLastSessionSave: () => void;

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

/* helper: derive a snapshot of state fields needed for serialization */
function snapshotForSerialize(s: EditorState) {
  return {
    selectedLogoId: s.selectedLogoId,
    preset: s.preset,
    manualEnhancement: s.manualEnhancement,
    logoConfig: s.logoConfig,
    canvasConfig: s.canvasConfig,
    topRightLogosCfg: s.topRightLogosCfg,
    textContent: s.textContent,
    fileNamePrefix: s.fileNamePrefix,
  };
}

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

  // ----- Logo Library -----
  logos: [],
  selectedLogoId: null,
  addLogos: async (files) => {
    const newLogos: Logo[] = [];
    for (const f of files) {
      const id = uid('l_');
      const url = URL.createObjectURL(f);
      newLogos.push({ id, name: f.name, url });
      // Persist blob to IDB (fire-and-forget per file; errors logged)
      try {
        await idbPutLogo({
          id,
          name: f.name,
          mime: f.type || 'image/png',
          blob: f,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      } catch (e) {
        console.warn('[logo] IDB put failed', e);
      }
    }
    set((s) => ({
      logos: [...s.logos, ...newLogos],
      selectedLogoId: s.selectedLogoId ?? newLogos[0]?.id ?? null,
    }));
    get().scheduleLastSessionSave();
  },
  removeLogo: async (id) => {
    const target = get().logos.find((l) => l.id === id);
    if (target) URL.revokeObjectURL(target.url);
    try {
      await idbDeleteLogo(id);
    } catch (e) {
      console.warn('[logo] IDB delete failed', e);
    }
    set((s) => {
      const remaining = s.logos.filter((l) => l.id !== id);
      // Clear any slot referencing this logo
      const tr = s.topRightLogosCfg;
      const clearSlot = (slot: TopRightLogo): TopRightLogo =>
        slot.logoId === id ? { enabled: false } : slot;
      return {
        logos: remaining,
        selectedLogoId:
          s.selectedLogoId === id ? remaining[0]?.id ?? null : s.selectedLogoId,
        topRightLogosCfg: {
          ...tr,
          logo1: clearSlot(tr.logo1),
          logo2: clearSlot(tr.logo2),
        },
      };
    });
    get().scheduleLastSessionSave();
  },
  renameLogo: async (id, name) => {
    try {
      await idbUpdateLogoName(id, name);
    } catch (e) {
      console.warn('[logo] IDB rename failed', e);
    }
    set((s) => ({
      logos: s.logos.map((l) => (l.id === id ? { ...l, name } : l)),
    }));
    get().scheduleLastSessionSave();
  },
  selectLogo: (id) => {
    set({ selectedLogoId: id });
    get().scheduleLastSessionSave();
  },
  setTopRightLogoFromLibrary: (slot, logoId) => {
    const s = get();
    if (!logoId) {
      // Clear assignment but keep settings
      set({
        topRightLogosCfg: {
          ...s.topRightLogosCfg,
          [slot]: { enabled: false },
        },
      });
      s.scheduleLastSessionSave();
      return;
    }
    const lib = s.logos.find((l) => l.id === logoId);
    if (!lib) return;
    set({
      topRightLogosCfg: {
        ...s.topRightLogosCfg,
        [slot]: {
          enabled: true,
          logoId: lib.id,
          url: lib.url,
          fileName: lib.name,
        },
      },
    });
    s.scheduleLastSessionSave();
  },

  // ----- Enhancement -----
  preset: 'natural',
  manualEnhancement: PRESET_PARAMS.natural,
  setPreset: (p) => {
    set(() => ({
      preset: p,
      manualEnhancement:
        p === 'custom' ? get().manualEnhancement : PRESET_PARAMS[p],
    }));
    get().scheduleLastSessionSave();
  },
  setManualEnhancement: (patch) => {
    set((s) => ({
      preset: 'custom',
      manualEnhancement: { ...s.manualEnhancement, ...patch },
    }));
    get().scheduleLastSessionSave();
  },
  getEffectiveEnhancement: () => get().manualEnhancement,

  // ----- Logo config (main) -----
  logoConfig: DEFAULT_LOGO_CFG,
  setLogoConfig: (patch) => {
    set((s) => ({ logoConfig: { ...s.logoConfig, ...patch } }));
    get().scheduleLastSessionSave();
  },

  // ----- Canvas config -----
  canvasConfig: DEFAULT_CANVAS_CFG,
  setCanvasConfig: (patch) => {
    set((s) => ({ canvasConfig: { ...s.canvasConfig, ...patch } }));
    get().scheduleLastSessionSave();
  },

  // ----- Top-right logos -----
  topRightLogosCfg: DEFAULT_TOP_RIGHT_LOGOS_CFG,
  setTopRightLogosCfg: (patch) => {
    set((s) => ({ topRightLogosCfg: { ...s.topRightLogosCfg, ...patch } }));
    get().scheduleLastSessionSave();
  },
  setTopRightLogo: (slot, patch) => {
    set((s) => {
      const old = s.topRightLogosCfg[slot];
      if (patch.url !== undefined && old.url && old.url !== patch.url) {
        URL.revokeObjectURL(old.url);
      }
      return {
        topRightLogosCfg: { ...s.topRightLogosCfg, [slot]: { ...old, ...patch } },
      };
    });
    get().scheduleLastSessionSave();
  },
  uploadTopRightLogo: async (slot, file) => {
    // 1. Add to library (also persists to IDB)
    await get().addLogos([file]);
    // The newest logo is now last in the array
    const logos = get().logos;
    const fresh = logos[logos.length - 1];
    if (!fresh) return;
    // 2. Assign to slot
    set((s) => {
      const old = s.topRightLogosCfg[slot];
      // Don't revoke old.url here — the library still holds it
      return {
        topRightLogosCfg: {
          ...s.topRightLogosCfg,
          [slot]: {
            enabled: true,
            logoId: fresh.id,
            url: fresh.url,
            fileName: fresh.name,
          },
        },
      };
    });
    get().scheduleLastSessionSave();
  },
  clearTopRightLogo: (slot) => {
    set((s) => ({
      topRightLogosCfg: { ...s.topRightLogosCfg, [slot]: { enabled: false } },
    }));
    get().scheduleLastSessionSave();
  },

  // ----- Product Text Content -----
  textContent: DEFAULT_PRODUCT_TEXT_CONTENT,
  setTitle: (patch) => {
    set((s) => ({ textContent: { ...s.textContent, title: { ...s.textContent.title, ...patch } } }));
    get().scheduleLastSessionSave();
  },
  setTitleStyle: (patch) => {
    set((s) => ({
      textContent: {
        ...s.textContent,
        title: { ...s.textContent.title, style: { ...s.textContent.title.style, ...patch } },
      },
    }));
    get().scheduleLastSessionSave();
  },
  setTitleBackground: (patch) => {
    set((s) => ({
      textContent: {
        ...s.textContent,
        title: { ...s.textContent.title, background: { ...s.textContent.title.background, ...patch } },
      },
    }));
    get().scheduleLastSessionSave();
  },
  setCode: (patch) => {
    set((s) => ({ textContent: { ...s.textContent, code: { ...s.textContent.code, ...patch } } }));
    get().scheduleLastSessionSave();
  },
  setCodeStyle: (patch) => {
    set((s) => ({
      textContent: {
        ...s.textContent,
        code: { ...s.textContent.code, style: { ...s.textContent.code.style, ...patch } },
      },
    }));
    get().scheduleLastSessionSave();
  },
  setLabelStyle: (patch) => {
    set((s) => ({
      textContent: {
        ...s.textContent,
        code: { ...s.textContent.code, labelStyle: { ...s.textContent.code.labelStyle, ...patch } },
      },
    }));
    get().scheduleLastSessionSave();
  },
  setLabelBackground: (patch) => {
    set((s) => ({
      textContent: {
        ...s.textContent,
        code: {
          ...s.textContent.code,
          labelBackground: { ...s.textContent.code.labelBackground, ...patch },
        },
      },
    }));
    get().scheduleLastSessionSave();
  },
  setFitment: (patch) => {
    set((s) => ({ textContent: { ...s.textContent, fitment: { ...s.textContent.fitment, ...patch } } }));
    get().scheduleLastSessionSave();
  },
  setFitmentStyle: (patch) => {
    set((s) => ({
      textContent: {
        ...s.textContent,
        fitment: { ...s.textContent.fitment, style: { ...s.textContent.fitment.style, ...patch } },
      },
    }));
    get().scheduleLastSessionSave();
  },
  setFitmentBackground: (patch) => {
    set((s) => ({
      textContent: {
        ...s.textContent,
        fitment: {
          ...s.textContent.fitment,
          background: { ...s.textContent.fitment.background, ...patch },
        },
      },
    }));
    get().scheduleLastSessionSave();
  },
  applyTextPreset: (key) => {
    const p = TEXT_PRESETS.find((t) => t.key === key);
    if (!p) return;
    set((s) => ({
      textContent: {
        ...s.textContent,
        title: {
          ...s.textContent.title,
          style: { ...s.textContent.title.style, ...(p.apply.title ?? {}) },
        },
        code: {
          ...s.textContent.code,
          style: { ...s.textContent.code.style, ...(p.apply.code ?? {}) },
        },
        fitment: {
          ...s.textContent.fitment,
          style: { ...s.textContent.fitment.style, ...(p.apply.fitment ?? {}) },
        },
      },
    }));
    get().scheduleLastSessionSave();
  },

  // ----- Preset Manager -----
  presets: [],
  defaultPresetId: null,
  currentPresetId: null,
  presetWarning: null,
  setPresetWarning: (msg) => set({ presetWarning: msg }),

  saveCurrentAsPreset: (name, opts) => {
    const s = get();
    const id = uid('pre_');
    const now = new Date().toISOString();
    const newPreset: Preset = {
      id,
      name: name || 'Untitled Preset',
      createdAt: now,
      updatedAt: now,
      state: extractSerializableState(snapshotForSerialize(s), opts),
    };
    const next = [...s.presets, newPreset];
    set({ presets: next, currentPresetId: id });
    savePresetList(next);
    return id;
  },

  updatePreset: (id, opts) => {
    const s = get();
    const idx = s.presets.findIndex((p) => p.id === id);
    if (idx < 0) return;
    const now = new Date().toISOString();
    const updated: Preset = {
      ...s.presets[idx],
      updatedAt: now,
      state: extractSerializableState(snapshotForSerialize(s), opts),
    };
    const next = [...s.presets];
    next[idx] = updated;
    set({ presets: next });
    savePresetList(next);
  },

  deletePreset: (id) => {
    const s = get();
    const next = s.presets.filter((p) => p.id !== id);
    set({
      presets: next,
      currentPresetId: s.currentPresetId === id ? null : s.currentPresetId,
      defaultPresetId: s.defaultPresetId === id ? null : s.defaultPresetId,
    });
    savePresetList(next);
    if (s.defaultPresetId === id) setDefaultPresetIdStored(null);
  },

  duplicatePreset: (id, newName) => {
    const s = get();
    const src = s.presets.find((p) => p.id === id);
    if (!src) return null;
    const newId = uid('pre_');
    const now = new Date().toISOString();
    const copy: Preset = {
      id: newId,
      name: newName || `${src.name} (copy)`,
      createdAt: now,
      updatedAt: now,
      state: src.state,
    };
    const next = [...s.presets, copy];
    set({ presets: next });
    savePresetList(next);
    return newId;
  },

  loadPreset: (id) => {
    const s = get();
    const target = s.presets.find((p) => p.id === id);
    if (!target) return;
    const { patch, missingLogoIds } = buildApplyPatch(target.state, { logos: s.logos });
    set({
      ...patch,
      currentPresetId: id,
      presetWarning:
        missingLogoIds.length > 0
          ? `Logo file not found for ${missingLogoIds.length} reference(s). Please re-upload the logos.`
          : null,
    });
    get().scheduleLastSessionSave();
  },

  renamePreset: (id, name) => {
    const s = get();
    const next = s.presets.map((p) =>
      p.id === id ? { ...p, name, updatedAt: new Date().toISOString() } : p
    );
    set({ presets: next });
    savePresetList(next);
  },

  setDefaultPreset: (id) => {
    set({ defaultPresetId: id });
    setDefaultPresetIdStored(id);
  },

  // ----- Hydration / persistence -----
  hydrated: false,
  hydrate: async () => {
    if (get().hydrated) {
      return { restoredLastSession: false, restoredDefaultPreset: false, missingLogoIds: [] };
    }

    // 1. Load all logos from IDB → create object URLs for the current session
    let logos: Logo[] = [];
    try {
      const records = await idbGetAllLogos();
      logos = records.map((r) => ({
        id: r.id,
        name: r.name,
        url: URL.createObjectURL(r.blob),
      }));
    } catch (e) {
      console.warn('[hydrate] IDB getAll failed', e);
    }

    // 2. Load presets & default
    const presets = listPresets();
    const defaultPresetId = getDefaultPresetId();

    set({ logos, presets, defaultPresetId, hydrated: true });

    // 3. Restore last session first; if none, fall back to default preset
    const last = getLastSession();
    if (last) {
      const { patch, missingLogoIds } = buildApplyPatch(last, { logos });
      set({
        ...patch,
        presetWarning:
          missingLogoIds.length > 0
            ? `Some saved logos couldn't be found (${missingLogoIds.length}). Please re-upload them.`
            : null,
      });
      return { restoredLastSession: true, restoredDefaultPreset: false, missingLogoIds };
    }
    if (defaultPresetId) {
      const def = presets.find((p) => p.id === defaultPresetId);
      if (def) {
        const { patch, missingLogoIds } = buildApplyPatch(def.state, { logos });
        set({
          ...patch,
          currentPresetId: def.id,
          presetWarning:
            missingLogoIds.length > 0
              ? `Default preset references ${missingLogoIds.length} missing logo(s). Please re-upload.`
              : null,
        });
        return { restoredLastSession: false, restoredDefaultPreset: true, missingLogoIds };
      }
    }
    return { restoredLastSession: false, restoredDefaultPreset: false, missingLogoIds: [] };
  },

  scheduleLastSessionSave: () => {
    if (!get().hydrated) return; // don't save until initial hydration finished
    const snap = extractSerializableState(snapshotForSerialize(get()), { includeTextContent: true });
    debouncedSaveLastSession(snap);
  },

  // ----- UI -----
  isProcessing: false,
  setProcessing: (v) => set({ isProcessing: v }),
  modelLoading: false,
  modelLoadProgress: 0,
  setModelLoading: (loading, progress = 0) =>
    set({ modelLoading: loading, modelLoadProgress: progress }),
  fileNamePrefix: 'product-photo',
  setFileNamePrefix: (s) => {
    set({ fileNamePrefix: s });
    get().scheduleLastSessionSave();
  },
}));

/* Helper exposed for components that want a "clear all transient session data" button */
export function resetLastSession() {
  clearLastSession();
}
