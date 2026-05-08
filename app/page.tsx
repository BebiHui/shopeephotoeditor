'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { PhotoUploader } from '@/components/PhotoUploader';
import { LogoLibrary } from '@/components/LogoLibrary';
import { EnhancementControls } from '@/components/EnhancementControls';
import { LogoControls } from '@/components/LogoControls';
import { TopRightLogosControls } from '@/components/TopRightLogosControls';
import { TextContentControls } from '@/components/TextContentControls';
import { CanvasControls } from '@/components/CanvasControls';
import { PhotoGrid } from '@/components/PhotoGrid';
import { ProcessingStatus } from '@/components/ProcessingStatus';
import { Stepper, type Step } from '@/components/Stepper';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Sparkles, Download, RefreshCcw, Wand2 } from 'lucide-react';
import {
  removeImageBackground,
  warmUpBackgroundRemoval,
} from '@/lib/backgroundRemoval';
import { composeFinalImage } from '@/lib/canvasComposer';
import { downloadPhotosAsZip } from '@/lib/zipExport';

export default function HomePage() {
  const photos = useEditorStore((s) => s.photos);
  const logos = useEditorStore((s) => s.logos);
  const selectedLogoId = useEditorStore((s) => s.selectedLogoId);
  const isProcessing = useEditorStore((s) => s.isProcessing);
  const setProcessing = useEditorStore((s) => s.setProcessing);
  const setModelLoading = useEditorStore((s) => s.setModelLoading);
  const setPhotoStatus = useEditorStore((s) => s.setPhotoStatus);
  const updatePhoto = useEditorStore((s) => s.updatePhoto);
  const fileNamePrefix = useEditorStore((s) => s.fileNamePrefix);
  const setFileNamePrefix = useEditorStore((s) => s.setFileNamePrefix);
  const enhancement = useEditorStore((s) => s.manualEnhancement);
  const logoConfig = useEditorStore((s) => s.logoConfig);
  const canvasConfig = useEditorStore((s) => s.canvasConfig);
  const clearPhotos = useEditorStore((s) => s.clearPhotos);

  const [warmedUp, setWarmedUp] = useState(false);

  // Resolve currently selected logo URL
  const selectedLogoUrl = useMemo(
    () => logos.find((l) => l.id === selectedLogoId)?.url,
    [logos, selectedLogoId]
  );

  // Steps
  const steps: Step[] = [
    { num: 1, label: 'Upload Foto', done: photos.length > 0 },
    { num: 2, label: 'Pilih Logo', done: !!selectedLogoUrl },
    { num: 3, label: 'Enhancement', done: true /* always has a default preset */ },
    { num: 4, label: 'Posisi Logo', done: true },
    { num: 5, label: 'Process All', done: photos.length > 0 && photos.every((p) => p.status === 'done') },
    { num: 6, label: 'Download', done: false },
  ];

  // Warm-up model in background after first photo upload
  useEffect(() => {
    if (warmedUp || photos.length === 0) return;
    let cancelled = false;
    setModelLoading(true, 0);
    warmUpBackgroundRemoval((_key, current, total) => {
      if (cancelled || !total) return;
      setModelLoading(true, Math.min(0.99, current / total));
    })
      .then(() => {
        if (cancelled) return;
        setWarmedUp(true);
        setModelLoading(false, 1);
      })
      .catch(() => {
        if (cancelled) return;
        setModelLoading(false, 0);
      });
    return () => {
      cancelled = true;
    };
  }, [photos.length, warmedUp, setModelLoading]);

  // Pipeline: process a single photo end-to-end
  const processOne = useCallback(
    async (photoId: string) => {
      const state = useEditorStore.getState();
      const photo = state.photos.find((p) => p.id === photoId);
      if (!photo) return;

      try {
        // Step 1 — Background removal
        setPhotoStatus(photoId, 'removing-bg');
        const cutoutBlob = await removeImageBackground(photo.originalUrl, {
          highQuality: false,
        });
        const cutoutUrl = URL.createObjectURL(cutoutBlob);
        updatePhoto(photoId, { cutoutUrl });

        // Step 2 — Enhance + Step 3 — Compose with bg + logo (we wrap them)
        setPhotoStatus(photoId, 'enhancing');
        // we already enhance inside composer, so go straight to compositing
        setPhotoStatus(photoId, 'compositing');
        const { blob: finalBlob, dataUrl } = await composeFinalImage({
          cutoutBlob,
          logoUrl: selectedLogoUrl,
          enhancement: state.manualEnhancement,
          canvasCfg: state.canvasConfig,
          logoCfg: state.logoConfig,
          topRightLogosCfg: state.topRightLogosCfg,
          textContent: state.textContent,
        });
        updatePhoto(photoId, {
          finalBlob,
          finalUrl: dataUrl,
          status: 'done',
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error('processOne error', err);
        setPhotoStatus(photoId, 'error', msg);
      }
    },
    [selectedLogoUrl, setPhotoStatus, updatePhoto]
  );

  const handleProcessAll = useCallback(async () => {
    if (photos.length === 0) return;
    setProcessing(true);
    try {
      // Sequential to be RAM-friendly. Could be parallel for small batches.
      for (const p of photos) {
        if (p.status === 'done') continue;
        await processOne(p.id);
      }
    } finally {
      setProcessing(false);
    }
  }, [photos, processOne, setProcessing]);

  const handleReprocess = useCallback(async () => {
    setProcessing(true);
    try {
      for (const p of useEditorStore.getState().photos) {
        await processOne(p.id);
      }
    } finally {
      setProcessing(false);
    }
  }, [processOne, setProcessing]);

  const allDone =
    photos.length > 0 && photos.every((p) => p.status === 'done');

  const handleDownloadAll = useCallback(async () => {
    await downloadPhotosAsZip(photos, fileNamePrefix);
  }, [photos, fileNamePrefix]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <header className="mb-8 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white">
              <Sparkles className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold text-gray-900">
              Shopee Photo Editor
            </h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Auto background removal, auto enhance, dan auto logo — siap upload Shopee.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={fileNamePrefix}
            onChange={(e) => setFileNamePrefix(e.target.value || 'product-photo')}
            className="h-10 w-44 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none"
            placeholder="product-photo"
            title="Prefix nama file export"
          />
          {photos.length > 0 && (
            <Button variant="ghost" size="md" onClick={clearPhotos}>
              Reset semua
            </Button>
          )}
        </div>
      </header>

      <Stepper steps={steps} />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: setup */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader step={1} title="Upload Foto Produk" subtitle="JPG / PNG / WEBP — boleh banyak sekaligus." />
            <CardBody>
              <PhotoUploader />
            </CardBody>
          </Card>

          <Card>
            <CardHeader step={2} title="Logo Toko" subtitle="Upload PNG transparan untuk hasil paling rapi." />
            <CardBody>
              <LogoLibrary />
            </CardBody>
          </Card>

          <Card>
            <CardHeader step={3} title="Auto Enhancement" subtitle="Pilih preset atau atur manual." />
            <CardBody>
              <EnhancementControls />
            </CardBody>
          </Card>

          <Card>
            <CardHeader step={4} title="Posisi & Ukuran Logo" />
            <CardBody>
              <LogoControls />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Additional Top Right Logos"
              subtitle="Tempel 2 logo (mis. badge Original + brand) di pojok kanan atas."
            />
            <CardBody>
              <TopRightLogosControls />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Product Text Content"
              subtitle="Judul, kode, & peruntukan motor — Canva-style styling, live preview."
            />
            <CardBody>
              <TextContentControls />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Canvas Output" subtitle="Ukuran square + background marketplace." />
            <CardBody>
              <CanvasControls />
            </CardBody>
          </Card>
        </div>

        {/* Right column: process & preview */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader
              step={5}
              title="Process All"
              subtitle="Background removal → auto enhance → compose canvas → tempel logo."
              right={
                <div className="flex flex-wrap items-center gap-2">
                  {allDone && (
                    <Button
                      variant="outline"
                      onClick={handleReprocess}
                      disabled={isProcessing}
                    >
                      <RefreshCcw className="h-4 w-4" />
                      Re-process
                    </Button>
                  )}
                  <Button
                    onClick={handleProcessAll}
                    loading={isProcessing}
                    disabled={photos.length === 0}
                    size="lg"
                  >
                    <Wand2 className="h-4 w-4" />
                    {isProcessing ? 'Memproses…' : 'Process All'}
                  </Button>
                </div>
              }
            />
            <CardBody>
              <ProcessingStatus />

              <div className="mt-4">
                {photos.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
                    Upload foto dulu untuk mulai.
                  </div>
                ) : (
                  <PhotoGrid />
                )}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              step={6}
              title="Download Hasil"
              subtitle="Download satu-satu (hover foto) atau semua sekaligus sebagai ZIP."
              right={
                <Button
                  onClick={handleDownloadAll}
                  disabled={!allDone}
                  size="lg"
                  variant={allDone ? 'primary' : 'outline'}
                >
                  <Download className="h-4 w-4" />
                  Download ZIP
                </Button>
              }
            />
            <CardBody>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-sm text-gray-600">
                <Stat label="Total foto" value={photos.length} />
                <Stat label="Sudah selesai" value={photos.filter((p) => p.status === 'done').length} />
                <Stat label="Logo terpilih" value={selectedLogoUrl ? '✓' : '—'} />
              </div>
              <p className="mt-4 text-xs text-gray-500">
                Nama file export: <code className="rounded bg-gray-100 px-1 py-0.5">{fileNamePrefix}-01.png</code>,{' '}
                <code className="rounded bg-gray-100 px-1 py-0.5">{fileNamePrefix}-02.png</code>, …
              </p>
            </CardBody>
          </Card>

          <p className="text-center text-xs text-gray-400">
            Semua proses berjalan di browser Anda — foto tidak diunggah ke server manapun.
          </p>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-gray-900 tabular-nums">{value}</div>
    </div>
  );
}
