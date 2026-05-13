'use client';
import { useEffect, useState } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { Button } from './ui/Button';
import { cn } from '@/lib/utils';
import {
  Save,
  Upload,
  Copy,
  Trash2,
  Star,
  StarOff,
  Pencil,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';

/**
 * Preset Manager UI — central place to save / load / update / delete / duplicate
 * editor presets, and to mark one as the default that auto-loads on app boot.
 *
 * All preset state lives in localStorage and is JSON-only (logos are referenced
 * by `logoId`, with the actual blobs in IndexedDB via Logo Library).
 */
export function PresetManager() {
  const presets = useEditorStore((s) => s.presets);
  const currentPresetId = useEditorStore((s) => s.currentPresetId);
  const defaultPresetId = useEditorStore((s) => s.defaultPresetId);
  const presetWarning = useEditorStore((s) => s.presetWarning);
  const setPresetWarning = useEditorStore((s) => s.setPresetWarning);

  const saveCurrentAsPreset = useEditorStore((s) => s.saveCurrentAsPreset);
  const updatePreset = useEditorStore((s) => s.updatePreset);
  const deletePreset = useEditorStore((s) => s.deletePreset);
  const duplicatePreset = useEditorStore((s) => s.duplicatePreset);
  const loadPreset = useEditorStore((s) => s.loadPreset);
  const renamePreset = useEditorStore((s) => s.renamePreset);
  const setDefaultPreset = useEditorStore((s) => s.setDefaultPreset);

  const [selectedId, setSelectedId] = useState<string | null>(currentPresetId);
  const [includeText, setIncludeText] = useState(false);
  const [newName, setNewName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Keep selected in sync when a preset is loaded from somewhere else
  useEffect(() => {
    if (currentPresetId && currentPresetId !== selectedId) {
      setSelectedId(currentPresetId);
    }
    // we intentionally ignore selectedId here — only react to currentPresetId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPresetId]);

  const selected = presets.find((p) => p.id === selectedId) ?? null;

  const onSaveNew = () => {
    const name = newName.trim();
    if (!name) {
      alert('Beri nama preset terlebih dahulu.');
      return;
    }
    const id = saveCurrentAsPreset(name, { includeTextContent: includeText });
    setSelectedId(id);
    setNewName('');
  };

  const onUpdate = () => {
    if (!selected) return;
    if (!confirm(`Update preset "${selected.name}" dengan setting saat ini?`)) return;
    updatePreset(selected.id, { includeTextContent: includeText });
  };

  const onDelete = () => {
    if (!selected) return;
    if (!confirm(`Hapus preset "${selected.name}"? Tidak bisa di-undo.`)) return;
    deletePreset(selected.id);
    setSelectedId(null);
  };

  const onDuplicate = () => {
    if (!selected) return;
    const newId = duplicatePreset(selected.id);
    if (newId) setSelectedId(newId);
  };

  const onLoad = () => {
    if (!selected) return;
    loadPreset(selected.id);
  };

  const onToggleDefault = () => {
    if (!selected) return;
    setDefaultPreset(defaultPresetId === selected.id ? null : selected.id);
  };

  const onStartRename = () => {
    if (!selected) return;
    setRenamingId(selected.id);
    setRenameValue(selected.name);
  };

  const onCommitRename = () => {
    if (renamingId && renameValue.trim()) {
      renamePreset(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  };

  return (
    <div className="space-y-4">
      {presetWarning && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div className="flex-1">{presetWarning}</div>
          <button
            type="button"
            onClick={() => setPresetWarning(null)}
            className="text-amber-700 hover:text-amber-900"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Save as new */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-700">
          Simpan setting saat ini sebagai preset baru
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSaveNew()}
            placeholder="Nama preset (mis. Template Honda Original)"
            className="h-9 flex-1 rounded-md border border-gray-200 px-3 text-sm focus:border-brand-500 focus:outline-none"
          />
          <Button size="sm" onClick={onSaveNew}>
            <Save className="h-3.5 w-3.5" />
            Save
          </Button>
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={includeText}
            onChange={(e) => setIncludeText(e.target.checked)}
            className="h-3.5 w-3.5 accent-brand-500"
          />
          Include current text content (judul / kode / peruntukan motor)
        </label>
      </div>

      {/* Preset list */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-700">
            Preset tersimpan {presets.length > 0 ? `(${presets.length})` : ''}
          </span>
        </div>
        {presets.length === 0 ? (
          <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-3 py-6 text-center text-xs text-gray-500">
            Belum ada preset. Atur semua setting Anda, lalu klik <strong>Save</strong> di atas.
          </div>
        ) : (
          <ul className="max-h-64 space-y-1 overflow-y-auto rounded-md border border-gray-200 bg-white p-1">
            {presets.map((p) => {
              const isSelected = p.id === selectedId;
              const isDefault = p.id === defaultPresetId;
              const isCurrent = p.id === currentPresetId;
              const isRenaming = renamingId === p.id;
              return (
                <li
                  key={p.id}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                    isSelected ? 'bg-brand-50' : 'hover:bg-gray-50'
                  )}
                >
                  {isRenaming ? (
                    <>
                      <input
                        type="text"
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') onCommitRename();
                          if (e.key === 'Escape') setRenamingId(null);
                        }}
                        className="h-7 flex-1 rounded border border-gray-300 px-2 text-xs"
                      />
                      <button
                        onClick={onCommitRename}
                        className="text-emerald-600 hover:text-emerald-700"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setRenamingId(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedId(p.id)}
                      className="flex flex-1 items-center gap-2 truncate text-left"
                    >
                      {isDefault ? (
                        <Star className="h-3.5 w-3.5 flex-shrink-0 fill-amber-400 text-amber-500" />
                      ) : (
                        <span className="h-3.5 w-3.5 flex-shrink-0" />
                      )}
                      <span
                        className={cn(
                          'truncate',
                          isCurrent ? 'font-semibold text-gray-900' : 'text-gray-700'
                        )}
                      >
                        {p.name}
                      </span>
                      {isCurrent && (
                        <span className="rounded-full bg-brand-100 px-1.5 text-[9px] font-medium uppercase tracking-wide text-brand-700">
                          Active
                        </span>
                      )}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Actions for selected preset */}
      {selected && (
        <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="text-xs font-medium text-gray-700">
            Aksi untuk:{' '}
            <span className="font-semibold text-gray-900">{selected.name}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button size="sm" onClick={onLoad}>
              <Upload className="h-3.5 w-3.5" />
              Load
            </Button>
            <Button size="sm" variant="outline" onClick={onUpdate}>
              <Save className="h-3.5 w-3.5" />
              Update
            </Button>
            <Button size="sm" variant="outline" onClick={onDuplicate}>
              <Copy className="h-3.5 w-3.5" />
              Duplicate
            </Button>
            <Button size="sm" variant="outline" onClick={onStartRename}>
              <Pencil className="h-3.5 w-3.5" />
              Rename
            </Button>
            <Button size="sm" variant="outline" onClick={onToggleDefault}>
              {defaultPresetId === selected.id ? (
                <>
                  <StarOff className="h-3.5 w-3.5" />
                  Unset default
                </>
              ) : (
                <>
                  <Star className="h-3.5 w-3.5" />
                  Set default
                </>
              )}
            </Button>
            <Button size="sm" variant="danger" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
          <p className="text-[10px] text-gray-500">
            <strong>Default</strong> akan otomatis ter-load setiap kali aplikasi dibuka di browser yang sama (kalau tidak ada last session).
          </p>
        </div>
      )}
    </div>
  );
}
