'use client';
import { useRef, useState } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { Button } from './ui/Button';
import { Plus, Trash2, Check, Pencil, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LogoLibrary() {
  const inputRef = useRef<HTMLInputElement>(null);
  const logos = useEditorStore((s) => s.logos);
  const selectedLogoId = useEditorStore((s) => s.selectedLogoId);
  const topRightCfg = useEditorStore((s) => s.topRightLogosCfg);
  const addLogos = useEditorStore((s) => s.addLogos);
  const removeLogo = useEditorStore((s) => s.removeLogo);
  const renameLogo = useEditorStore((s) => s.renameLogo);
  const selectLogo = useEditorStore((s) => s.selectLogo);
  const setTopRightLogoFromLibrary = useEditorStore((s) => s.setTopRightLogoFromLibrary);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const startRename = (id: string, current: string) => {
    setRenamingId(id);
    setRenameValue(current);
  };
  const commitRename = () => {
    if (renamingId && renameValue.trim()) {
      void renameLogo(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp,.svg"
        multiple
        className="hidden"
        onChange={(e) => {
          const fs = e.target.files;
          if (!fs) return;
          void addLogos(Array.from(fs));
          e.target.value = '';
        }}
      />

      {logos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
          <p className="text-sm text-gray-600">
            Belum ada logo. Upload logo toko, brand, atau badge (PNG transparan paling rapi).
          </p>
          <Button
            type="button"
            size="sm"
            className="mt-3"
            onClick={() => inputRef.current?.click()}
          >
            <Plus className="h-4 w-4" />
            Upload Logo
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {logos.map((logo) => {
              const isStore = logo.id === selectedLogoId;
              const isTR1 = topRightCfg.logo1.logoId === logo.id;
              const isTR2 = topRightCfg.logo2.logoId === logo.id;
              const isRenaming = renamingId === logo.id;
              return (
                <div
                  key={logo.id}
                  className={cn(
                    'relative rounded-xl border-2 p-2 transition-all',
                    isStore
                      ? 'border-brand-500 bg-brand-50 shadow-sm'
                      : 'border-gray-200 bg-white'
                  )}
                >
                  <div className="checker flex aspect-square items-center justify-center overflow-hidden rounded-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logo.url}
                      alt={logo.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  {/* Name + rename */}
                  <div className="mt-2 flex items-center gap-1">
                    {isRenaming ? (
                      <>
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitRename();
                            if (e.key === 'Escape') setRenamingId(null);
                          }}
                          className="h-6 flex-1 rounded border border-gray-300 px-1 text-[11px]"
                        />
                        <button onClick={commitRename} className="text-emerald-600">
                          <Check className="h-3 w-3" />
                        </button>
                        <button onClick={() => setRenamingId(null)} className="text-gray-400">
                          <X className="h-3 w-3" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 truncate text-[11px] text-gray-700" title={logo.name}>
                          {logo.name}
                        </span>
                        <button
                          onClick={() => startRename(logo.id, logo.name)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Rename"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus logo "${logo.name}"?`)) void removeLogo(logo.id);
                          }}
                          className="text-gray-400 hover:text-red-500"
                          title="Hapus dari library"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Assign buttons */}
                  <div className="mt-2 grid grid-cols-3 gap-1">
                    <button
                      type="button"
                      onClick={() => selectLogo(isStore ? null : logo.id)}
                      className={cn(
                        'rounded-md py-1 text-[9px] font-medium uppercase tracking-wide transition-colors',
                        isStore
                          ? 'bg-brand-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      )}
                      title="Use as main store logo"
                    >
                      Toko
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setTopRightLogoFromLibrary('logo1', isTR1 ? null : logo.id)
                      }
                      className={cn(
                        'rounded-md py-1 text-[9px] font-medium uppercase tracking-wide transition-colors',
                        isTR1
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      )}
                      title="Use as Top Right Logo 1"
                    >
                      TR-1
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setTopRightLogoFromLibrary('logo2', isTR2 ? null : logo.id)
                      }
                      className={cn(
                        'rounded-md py-1 text-[9px] font-medium uppercase tracking-wide transition-colors',
                        isTR2
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      )}
                      title="Use as Top Right Logo 2"
                    >
                      TR-2
                    </button>
                  </div>

                  {isStore && (
                    <div className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => inputRef.current?.click()}
          >
            <Plus className="h-4 w-4" />
            Tambah Logo
          </Button>
        </>
      )}
      <p className="text-[10px] text-gray-500">
        Klik tombol <strong>Toko</strong>, <strong>TR-1</strong>, atau <strong>TR-2</strong> untuk menetapkan logo tersebut. Klik lagi untuk lepas. Logo tersimpan otomatis di browser (IndexedDB) dan ikut saat Anda save preset.
      </p>
    </div>
  );
}
