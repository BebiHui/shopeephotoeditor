'use client';
import { useState } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { Trash2, Eye, Download, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn, padNum } from '@/lib/utils';
import { downloadSinglePhoto } from '@/lib/zipExport';
import { PhotoPreview } from './PhotoPreview';
import type { Photo, PhotoStatus } from '@/lib/types';

const STATUS_LABEL: Record<PhotoStatus, string> = {
  'pending':     'Belum diproses',
  'removing-bg': 'Menghapus background…',
  'enhancing':   'Auto enhance…',
  'compositing': 'Compositing & logo…',
  'done':        'Selesai',
  'error':       'Error',
};

export function PhotoGrid() {
  const photos = useEditorStore((s) => s.photos);
  const removePhoto = useEditorStore((s) => s.removePhoto);
  const fileNamePrefix = useEditorStore((s) => s.fileNamePrefix);
  const [previewOf, setPreviewOf] = useState<Photo | null>(null);

  if (photos.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {photos.map((p, idx) => (
          <div
            key={p.id}
            className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
          >
            <div className="relative aspect-square w-full bg-gray-100">
              {/* Show final if available, else original */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.finalUrl || p.originalUrl}
                alt={p.fileName}
                className="absolute inset-0 h-full w-full object-contain"
              />
              {p.finalUrl && (
                <span className="absolute left-2 top-2 rounded-full bg-emerald-500/95 px-2 py-0.5 text-[10px] font-medium text-white shadow">
                  AFTER
                </span>
              )}
              {!p.finalUrl && (
                <span className="absolute left-2 top-2 rounded-full bg-gray-700/90 px-2 py-0.5 text-[10px] font-medium text-white shadow">
                  ORIGINAL
                </span>
              )}

              <StatusOverlay status={p.status} />

              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => setPreviewOf(p)}
                  className="rounded-md bg-white/90 p-1.5 text-gray-700 hover:bg-white"
                  title="Preview"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <div className="flex gap-1">
                  {p.finalBlob && (
                    <button
                      type="button"
                      onClick={() => downloadSinglePhoto(p, idx + 1, fileNamePrefix)}
                      className="rounded-md bg-white/90 p-1.5 text-gray-700 hover:bg-white"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removePhoto(p.id)}
                    className="rounded-md bg-white/90 p-1.5 text-red-500 hover:bg-white"
                    title="Hapus"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="px-3 py-2">
              <div className="truncate text-xs font-medium text-gray-700">
                {fileNamePrefix}-{padNum(idx + 1)}.png
              </div>
              <StatusBadge status={p.status} message={p.errorMessage} />
            </div>
          </div>
        ))}
      </div>

      {previewOf && (
        <PhotoPreview
          photo={previewOf}
          onClose={() => setPreviewOf(null)}
        />
      )}
    </>
  );
}

function StatusOverlay({ status }: { status: PhotoStatus }) {
  if (status === 'done' || status === 'pending') return null;
  if (status === 'error') {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-red-500/10 backdrop-blur-sm">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
    );
  }
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm">
      <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
    </div>
  );
}

function StatusBadge({ status, message }: { status: PhotoStatus; message?: string }) {
  if (status === 'done') {
    return (
      <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600">
        <CheckCircle2 className="h-3 w-3" /> {STATUS_LABEL[status]}
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className="mt-1 truncate text-[10px] text-red-600" title={message}>
        {message || STATUS_LABEL[status]}
      </div>
    );
  }
  return (
    <div
      className={cn(
        'mt-1 text-[10px]',
        status === 'pending' ? 'text-gray-500' : 'text-brand-600'
      )}
    >
      {STATUS_LABEL[status]}
    </div>
  );
}
