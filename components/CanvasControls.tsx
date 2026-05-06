'use client';
import { useEditorStore } from '@/store/useEditorStore';
import { cn } from '@/lib/utils';
import type { CanvasSize, BackgroundType } from '@/lib/types';
import { Slider } from './ui/Slider';

const sizes: CanvasSize[] = [800, 1024, 1080, 1200];
const backgrounds: { key: BackgroundType; label: string; sample: string }[] = [
  { key: 'white',       label: 'Putih bersih',   sample: '#ffffff' },
  { key: 'transparent', label: 'Transparan',     sample: 'transparent' },
  { key: 'gray',        label: 'Abu marketplace',sample: '#f5f5f5' },
  { key: 'custom',      label: 'Custom',         sample: '#ee4d2d' },
];

export function CanvasControls() {
  const cfg = useEditorStore((s) => s.canvasConfig);
  const set = useEditorStore((s) => s.setCanvasConfig);

  return (
    <div className="space-y-5">
      <div>
        <h4 className="mb-2 text-sm font-medium text-gray-900">Ukuran output</h4>
        <div className="grid grid-cols-4 gap-2">
          {sizes.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => set({ size: s })}
              className={cn(
                'rounded-lg border py-2 text-sm font-medium transition-colors',
                cfg.size === s
                  ? 'border-brand-500 bg-brand-50 text-brand-600'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              )}
            >
              {s}×{s}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Default 1024×1024 — disarankan untuk Shopee.
        </p>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-medium text-gray-900">Background</h4>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {backgrounds.map((b) => (
            <button
              key={b.key}
              type="button"
              onClick={() => set({ background: b.key })}
              className={cn(
                'rounded-lg border p-2 transition-colors',
                cfg.background === b.key
                  ? 'border-brand-500 ring-1 ring-brand-300'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div
                className={cn(
                  'mx-auto h-8 w-8 rounded',
                  b.key === 'transparent' ? 'checker' : ''
                )}
                style={{ background: b.key === 'transparent' ? undefined : b.sample, border: '1px solid #e5e7eb' }}
              />
              <div className="mt-1 text-[11px] text-gray-700">{b.label}</div>
            </button>
          ))}
        </div>

        {cfg.background === 'custom' && (
          <div className="mt-3 flex items-center gap-3">
            <input
              type="color"
              value={cfg.customColor}
              onChange={(e) => set({ customColor: e.target.value })}
              className="h-9 w-12 cursor-pointer rounded border border-gray-200"
            />
            <input
              type="text"
              value={cfg.customColor}
              onChange={(e) => set({ customColor: e.target.value })}
              className="h-9 flex-1 rounded border border-gray-200 px-3 text-sm font-mono"
            />
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <Slider
          label="Padding produk dari pinggir canvas"
          value={Math.round(cfg.padding * 100)}
          min={0}
          max={20}
          onChange={(v) => set({ padding: v / 100 })}
          unit="%"
        />
        <p className="mt-1 text-xs text-gray-500">
          Padding kecil = produk lebih besar di canvas. Default 8% (cocok untuk hampir semua produk).
        </p>
      </div>
    </div>
  );
}
