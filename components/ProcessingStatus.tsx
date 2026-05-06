'use client';
import { useEditorStore } from '@/store/useEditorStore';

export function ProcessingStatus() {
  const photos = useEditorStore((s) => s.photos);
  const isProcessing = useEditorStore((s) => s.isProcessing);
  const modelLoading = useEditorStore((s) => s.modelLoading);
  const modelLoadProgress = useEditorStore((s) => s.modelLoadProgress);

  const total = photos.length;
  const done = photos.filter((p) => p.status === 'done').length;
  const errors = photos.filter((p) => p.status === 'error').length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  if (modelLoading) {
    const mp = Math.round(modelLoadProgress * 100);
    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
        <div className="mb-1 font-medium">
          Mengunduh model AI background removal… ({mp}%)
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-blue-100">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${mp}%` }}
          />
        </div>
        <div className="mt-1 text-xs text-blue-700">
          Hanya pertama kali. Selanjutnya proses langsung jalan.
        </div>
      </div>
    );
  }

  if (!isProcessing && total === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 text-sm">
      <div className="mb-1 flex items-center justify-between">
        <span className="font-medium text-gray-900">
          {isProcessing ? 'Memproses foto…' : `${done} / ${total} selesai`}
        </span>
        <span className="text-gray-500 tabular-nums">{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full bg-brand-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      {errors > 0 && (
        <div className="mt-1 text-xs text-red-600">{errors} foto gagal</div>
      )}
    </div>
  );
}
