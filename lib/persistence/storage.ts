/**
 * High-level persistence helpers for presets and last session.
 *
 * All preset data is JSON-serializable and lives in localStorage. The actual
 * logo blobs live in IndexedDB (see ./idb.ts) and are referenced by `logoId`.
 */

import type { Preset, SerializableEditorState } from '@/lib/types';

const K_PRESETS = 'spe:presets';
const K_DEFAULT_PRESET_ID = 'spe:defaultPresetId';
const K_LAST_SESSION = 'spe:lastSession';

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // QuotaExceededError or similar — log but don't crash the app
    console.warn('[storage] failed to write', key, e);
  }
}

/* ───────── Presets ───────── */

export function listPresets(): Preset[] {
  return readJson<Preset[]>(K_PRESETS, []);
}

export function savePresetList(list: Preset[]): void {
  writeJson(K_PRESETS, list);
}

export function getDefaultPresetId(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(K_DEFAULT_PRESET_ID);
}

export function setDefaultPresetIdStored(id: string | null): void {
  if (!isBrowser()) return;
  if (id) localStorage.setItem(K_DEFAULT_PRESET_ID, id);
  else localStorage.removeItem(K_DEFAULT_PRESET_ID);
}

/* ───────── Last session ───────── */

export function getLastSession(): SerializableEditorState | null {
  return readJson<SerializableEditorState | null>(K_LAST_SESSION, null);
}

export function saveLastSession(state: SerializableEditorState): void {
  writeJson(K_LAST_SESSION, state);
}

export function clearLastSession(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(K_LAST_SESSION);
}

/** Debounced writer for last-session — call freely on every change. */
let lastSessionTimer: ReturnType<typeof setTimeout> | null = null;
export function debouncedSaveLastSession(state: SerializableEditorState, delayMs = 400): void {
  if (lastSessionTimer) clearTimeout(lastSessionTimer);
  lastSessionTimer = setTimeout(() => {
    saveLastSession(state);
    lastSessionTimer = null;
  }, delayMs);
}
