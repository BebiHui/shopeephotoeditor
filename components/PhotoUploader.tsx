'use client';
import { useCallback, useRef, useState } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { Button } from './ui/Button';
import { Upload, ImagePlus } from 'lucide-react';

const ACCEPTED = '.jpg,.jpeg,.png,.webp';

export function PhotoUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const addPhotos = useEditorStore((s) => s.addPhotos);
  const photoCount = useEditorStore((s) => s.photos.length);
  const [drag, setDrag] = useState(false);

  const onFiles = useCallback(
    (fs: FileList | null) => {
      if (!fs) return;
      const list = Array.from(fs).filter((f) => /image\/(jpe?g|png|webp)/i.test(f.type));
      if (list.length) addPhotos(list);
    },
    [addPhotos]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        onFiles(e.dataTransfer.files);
      }}
      className={
        'flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-colors ' +
        (drag
          ? 'border-brand-500 bg-brand-50'
          : 'border-gray-300 bg-gray-50 hover:bg-gray-100')
      }
    >
      <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-500 ring-1 ring-brand-200">
        <ImagePlus className="h-7 w-7" />
      </div>
      <h3 className="text-base font-semibold text-gray-900">
        Drop foto produk di sini
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        atau klik tombol di bawah · JPG, PNG, WEBP · upload 5–9 foto sekaligus
      </p>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        multiple
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />
      <Button
        type="button"
        className="mt-4"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-4 w-4" />
        Pilih Foto Produk
      </Button>

      {photoCount > 0 && (
        <p className="mt-3 text-xs text-gray-500">
          {photoCount} foto siap diproses
        </p>
      )}
    </div>
  );
}
