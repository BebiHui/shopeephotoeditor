'use client';
import { useRef } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { Button } from './ui/Button';
import { Plus, Trash2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LogoLibrary() {
  const inputRef = useRef<HTMLInputElement>(null);
  const logos = useEditorStore((s) => s.logos);
  const selectedLogoId = useEditorStore((s) => s.selectedLogoId);
  const addLogos = useEditorStore((s) => s.addLogos);
  const removeLogo = useEditorStore((s) => s.removeLogo);
  const selectLogo = useEditorStore((s) => s.selectLogo);

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp,.svg"
        multiple
        className="hidden"
        onChange={(e) => {
          const fs = e.target.files;
          if (!fs) return;
          addLogos(Array.from(fs));
          e.target.value = '';
        }}
      />

      {logos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
          <p className="text-sm text-gray-600">
            Belum ada logo. Upload logo toko (disarankan PNG transparan).
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
              const selected = logo.id === selectedLogoId;
              return (
                <div
                  key={logo.id}
                  onClick={() => selectLogo(logo.id)}
                  className={cn(
                    'relative cursor-pointer rounded-xl border-2 p-2 transition-all',
                    selected
                      ? 'border-brand-500 bg-brand-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300'
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
                  <div className="mt-2 flex items-center justify-between gap-1">
                    <span className="truncate text-xs text-gray-700">
                      {logo.name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeLogo(logo.id);
                      }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {selected && (
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
            className="mt-3"
            onClick={() => inputRef.current?.click()}
          >
            <Plus className="h-4 w-4" />
            Tambah Logo
          </Button>
        </>
      )}
    </div>
  );
}
