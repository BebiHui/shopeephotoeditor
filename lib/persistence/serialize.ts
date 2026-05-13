/**
 * Convert between live editor state and persistable JSON.
 *
 * The persistable shape strips object URLs (since they don't survive a refresh)
 * and keeps only stable identifiers (logoId) + config. On load we rehydrate
 * object URLs from the in-memory Logo Library.
 */

import type {
  Logo,
  ProductTextContent,
  SerializableEditorState,
  EnhancementPreset,
  EnhancementParams,
  LogoConfig,
  CanvasConfig,
  TopRightLogosConfig,
} from '@/lib/types';

interface LiveStateSnapshot {
  selectedLogoId: string | null;
  preset: EnhancementPreset;
  manualEnhancement: EnhancementParams;
  logoConfig: LogoConfig;
  canvasConfig: CanvasConfig;
  topRightLogosCfg: TopRightLogosConfig;
  textContent: ProductTextContent;
  fileNamePrefix: string;
}

export function extractSerializableState(
  s: LiveStateSnapshot,
  opts: { includeTextContent: boolean }
): SerializableEditorState {
  return {
    selectedLogoId: s.selectedLogoId,
    preset: s.preset,
    manualEnhancement: s.manualEnhancement,
    logoConfig: s.logoConfig,
    canvasConfig: s.canvasConfig,
    topRightLogosCfg: {
      logo1: {
        enabled: s.topRightLogosCfg.logo1.enabled,
        logoId: s.topRightLogosCfg.logo1.logoId,
        fileName: s.topRightLogosCfg.logo1.fileName,
      },
      logo2: {
        enabled: s.topRightLogosCfg.logo2.enabled,
        logoId: s.topRightLogosCfg.logo2.logoId,
        fileName: s.topRightLogosCfg.logo2.fileName,
      },
      widthPx: s.topRightLogosCfg.widthPx,
      marginTopPx: s.topRightLogosCfg.marginTopPx,
      marginRightPx: s.topRightLogosCfg.marginRightPx,
      gapPx: s.topRightLogosCfg.gapPx,
      opacity: s.topRightLogosCfg.opacity,
    },
    textContent: opts.includeTextContent ? s.textContent : undefined,
    fileNamePrefix: s.fileNamePrefix,
  };
}

export interface ApplyOptions {
  /** Logos currently available (for url rehydration via logoId lookup) */
  logos: Logo[];
}

export interface ApplyResult {
  patch: {
    selectedLogoId: string | null;
    preset: EnhancementPreset;
    manualEnhancement: EnhancementParams;
    logoConfig: LogoConfig;
    canvasConfig: CanvasConfig;
    topRightLogosCfg: TopRightLogosConfig;
    textContent?: ProductTextContent;
    fileNamePrefix: string;
  };
  /** logoIds referenced by the state that weren't found in the library */
  missingLogoIds: string[];
}

/**
 * Build a patch object suitable for set() on the editor store. Resolves logo
 * URLs from the current library; flags missing IDs in `missingLogoIds`.
 */
export function buildApplyPatch(
  state: SerializableEditorState,
  opts: ApplyOptions
): ApplyResult {
  const missing: string[] = [];
  const findUrl = (logoId?: string): string | undefined => {
    if (!logoId) return undefined;
    const hit = opts.logos.find((l) => l.id === logoId);
    if (!hit) {
      missing.push(logoId);
      return undefined;
    }
    return hit.url;
  };

  // Check main store logo too
  if (state.selectedLogoId) {
    if (!opts.logos.find((l) => l.id === state.selectedLogoId)) {
      missing.push(state.selectedLogoId);
    }
  }

  const rebuiltTopRight: TopRightLogosConfig = {
    logo1: {
      enabled: state.topRightLogosCfg.logo1.enabled,
      logoId: state.topRightLogosCfg.logo1.logoId,
      fileName: state.topRightLogosCfg.logo1.fileName,
      url: findUrl(state.topRightLogosCfg.logo1.logoId),
    },
    logo2: {
      enabled: state.topRightLogosCfg.logo2.enabled,
      logoId: state.topRightLogosCfg.logo2.logoId,
      fileName: state.topRightLogosCfg.logo2.fileName,
      url: findUrl(state.topRightLogosCfg.logo2.logoId),
    },
    widthPx: state.topRightLogosCfg.widthPx,
    marginTopPx: state.topRightLogosCfg.marginTopPx,
    marginRightPx: state.topRightLogosCfg.marginRightPx,
    gapPx: state.topRightLogosCfg.gapPx,
    opacity: state.topRightLogosCfg.opacity,
  };

  return {
    patch: {
      selectedLogoId: state.selectedLogoId,
      preset: state.preset,
      manualEnhancement: state.manualEnhancement,
      logoConfig: state.logoConfig,
      canvasConfig: state.canvasConfig,
      topRightLogosCfg: rebuiltTopRight,
      textContent: state.textContent,
      fileNamePrefix: state.fileNamePrefix,
    },
    missingLogoIds: Array.from(new Set(missing)),
  };
}
