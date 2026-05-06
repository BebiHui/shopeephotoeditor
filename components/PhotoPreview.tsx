'use client';
import { X } from 'lucide-react';
import type { Photo } from '@/lib/types';
import { useEffect } from 'react';

export function PhotoPreview({
  photo,
  onClose,
}: {
  photo: Photo;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-gray-100 p-2 text-gray-700 hover:bg-gray-200"
        >
          <X className="h-4 w-4" />
        </button>
        <h3 className="mb-4 text-base font-semibold text-gray-900">
          Preview · {photo.fileName}
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Tile label="1. Original" url={photo.originalUrl} />
          <Tile
            label="2. Background removed"
            url={photo.cutoutUrl}
            checker
            placeholder="Belum diproses"
          />
          <Tile
            label="3. Final (enhanced + logo)"
            url={photo.finalUrl}
            placeholder="Belum diproses"
          />
        </div>
      </div>
    </div>
  );
}

function Tile({
  label,
  url,
  checker,
  placeholder,
}: {
  label: string;
  url?: string;
  checker?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div
        className={
          'relative aspect-square overflow-hidden rounded-xl border border-gray-200 ' +
          (checker ? 'checker' : 'bg-gray-50')
        }
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={label}
            className="absolute inset-0 h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-gray-400">
            {placeholder ?? '—'}
          </div>
        )}
      </div>
    </div>
  );
}
