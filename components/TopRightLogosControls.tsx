'use client';
import { useRef } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { Slider } from './ui/Slider';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Additional Top Right Logos:
 * - Two slots, each independently enable/upload/clear
 * - Global controls: width, margin top, margin right, gap, opacity
 * - All measurements are in px @ 1024 reference canvas (auto-scaled by composer)
 *
 * Live mini-preview is provided through the existing PhotoPreview/PhotoGrid flow
 * after the user clicks Process All / Re-process.
 */
export function TopRightLogosControls() {
  const cfg = useEditorStore((s) => s.topRightLogosCfg);
  const setCfg = useEditorStore((s) => s.setTopRightLogosCfg);
  const setSlot = useEditorStore((s) => s.setTopRightLogo);
  const upload = useEditorStore((s) => s.uploadTopRightLogo);
  const clear = useEditorStore((s) => s.clearTopRightLogo);

  return (
    <div className="space-y-5">
      <p className="text-xs text-gray-500">
        Tempel hingga 2 logo di pojok kanan atas (mis. badge &ldquo;Original&rdquo; + logo brand).
        Logo selalu di depan produk dan logo toko utama.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <LogoSlot
          label="Logo 1 (atas)"
          slot="logo1"
          enabled={cfg.logo1.enabled}
          url={cfg.logo1.url}
          fileName={cfg.logo1.fileName}
          onToggle={(v) => setSlot('logo1', { enabled: v })}
          onUpload={(f) => upload('logo1', f)}
          onClear={() => clear('logo1')}
        />
        <LogoSlot
          label="Logo 2 (bawah)"
          slot="logo2"
          enabled={cfg.logo2.enabled}
          url={cfg.logo2.url}
          fileName={cfg.logo2.fileName}
          onToggle={(v) => setSlot('logo2', { enabled: v })}
          onUpload={(f) => upload('logo2', f)}
          onClear={() => clear('logo2')}
        />
      </div>

      <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <Slider
          label="Logo width"
          value={cfg.widthPx}
          min={40}
          max={400}
          onChange={(v) => setCfg({ widthPx: v })}
          unit="px"
        />
        <Slider
          label="Margin top"
          value={cfg.marginTopPx}
          min={0}
          max={120}
          onChange={(v) => setCfg({ marginTopPx: v })}
          unit="px"
        />
        <Slider
          label="Margin right"
          value={cfg.marginRightPx}
          min={0}
          max={120}
          onChange={(v) => setCfg({ marginRightPx: v })}
          unit="px"
        />
        <Slider
          label="Gap antar logo"
          value={cfg.gapPx}
          min={0}
          max={80}
          onChange={(v) => setCfg({ gapPx: v })}
          unit="px"
        />
        <Slider
          label="Opacity"
          value={Math.round(cfg.opacity * 100)}
          min={20}
          max={100}
          onChange={(v) => setCfg({ opacity: v / 100 })}
          unit="%"
        />
        <p className="text-[11px] text-gray-500">
          Semua nilai dalam px untuk canvas 1024×1024. Saat output diubah ke
          800/1080/1200, ukuran &amp; jarak otomatis di-skala proporsional —
          aspect ratio logo selalu dijaga.
        </p>
      </div>

      <MiniPreview />
    </div>
  );
}

function LogoSlot({
  label,
  enabled,
  url,
  fileName,
  onToggle,
  onUpload,
  onClear,
}: {
  label: string;
  slot: 'logo1' | 'logo2';
  enabled: boolean;
  url?: string;
  fileName?: string;
  onToggle: (v: boolean) => void;
  onUpload: (f: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div
      className={cn(
        'rounded-xl border p-3 transition-colors',
        enabled && url
          ? 'border-brand-300 bg-brand-50/40'
          : 'border-gray-200 bg-white'
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900">{label}</span>
        <label className="inline-flex items-center gap-1 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
            disabled={!url}
            className="h-3.5 w-3.5 accent-brand-500"
          />
          Aktif
        </label>
      </div>

      <div className="checker mb-2 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-md">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={fileName || label}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <span className="text-[11px] text-gray-400">Belum diupload</span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp,.svg"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUpload(f);
          e.target.value = '';
        }}
      />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-md border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          <Plus className="h-3.5 w-3.5" />
          {url ? 'Ganti' : 'Upload'}
        </button>
        {url && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600"
            title="Hapus logo ini"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {fileName && (
        <p className="mt-1 truncate text-[10px] text-gray-500" title={fileName}>
          {fileName}
        </p>
      )}
    </div>
  );
}

/**
 * Tiny live wireframe of where the logos will land on the final canvas.
 * Pure CSS; no canvas paint — instant feedback while user tweaks sliders.
 */
function MiniPreview() {
  const cfg = useEditorStore((s) => s.topRightLogosCfg);
  const canvasSize = useEditorStore((s) => s.canvasConfig.size);

  const slots = [
    cfg.logo1.enabled && cfg.logo1.url ? cfg.logo1 : null,
    cfg.logo2.enabled && cfg.logo2.url ? cfg.logo2 : null,
  ].filter(Boolean) as { url?: string; enabled: boolean }[];

  // Render at a fixed visual size (240 px) but scale all values by the same
  // ratio used in the composer — so what user sees ≈ what gets rendered.
  const previewPx = 240;
  // Composer scale factor: actualCanvas / 1024. Then preview / actualCanvas
  // collapses to: preview / 1024.
  const k = previewPx / 1024;
  const widthPx = cfg.widthPx * k;
  const marginTop = cfg.marginTopPx * k;
  const marginRight = cfg.marginRightPx * k;
  const gap = cfg.gapPx * k;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-700">Preview posisi</span>
        <span className="text-[10px] text-gray-400">
          target output {canvasSize}×{canvasSize}
        </span>
      </div>
      <div
        className="relative mx-auto rounded-md border border-gray-200 bg-white"
        style={{ width: previewPx, height: previewPx }}
      >
        {/* Mock product placeholder */}
        <div className="absolute left-1/2 top-1/2 h-[55%] w-[55%] -translate-x-1/2 -translate-y-1/2 rounded-md bg-gray-100 ring-1 ring-gray-200" />

        {/* Stacked top-right logos */}
        {slots.map((s, i) => {
          const prevHeight = slots
            .slice(0, i)
            .reduce((acc) => acc + widthPx + gap, 0);
          // Without natural aspect we render as squares in the wireframe.
          // Real canvas keeps each logo's true aspect.
          return (
            <div
              key={i}
              className="absolute overflow-hidden rounded-sm bg-white shadow ring-1 ring-gray-300"
              style={{
                width: widthPx,
                height: widthPx,
                top: marginTop + prevHeight,
                right: marginRight,
                opacity: cfg.opacity,
              }}
            >
              {s?.url && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={s.url}
                  alt=""
                  className="h-full w-full object-contain"
                />
              )}
            </div>
          );
        })}

        {slots.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-md bg-gray-50 px-2 py-1 text-[10px] text-gray-400">
              Aktifkan logo untuk preview
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
