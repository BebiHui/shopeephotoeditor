'use client';
import { useEditorStore } from '@/store/useEditorStore';
import { Slider } from './ui/Slider';
import { cn } from '@/lib/utils';
import type { LogoPosition } from '@/lib/types';

const positions: { key: LogoPosition; label: string; grid: string }[] = [
  { key: 'top-left',      label: 'Kiri Atas',     grid: 'col-start-1 row-start-1' },
  { key: 'top-center',    label: 'Tengah Atas',   grid: 'col-start-2 row-start-1' },
  { key: 'top-right',     label: 'Kanan Atas',    grid: 'col-start-3 row-start-1' },
  { key: 'bottom-left',   label: 'Kiri Bawah',    grid: 'col-start-1 row-start-3' },
  { key: 'bottom-center', label: 'Tengah Bawah',  grid: 'col-start-2 row-start-3' },
  { key: 'bottom-right',  label: 'Kanan Bawah',   grid: 'col-start-3 row-start-3' },
];

export function LogoControls() {
  const cfg = useEditorStore((s) => s.logoConfig);
  const set = useEditorStore((s) => s.setLogoConfig);

  return (
    <div className="space-y-5">
      <div>
        <h4 className="mb-2 text-sm font-medium text-gray-900">Posisi logo</h4>
        <div className="grid aspect-square w-full max-w-xs grid-cols-3 grid-rows-3 gap-1.5 rounded-xl border border-gray-200 bg-gray-50 p-2">
          {positions.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => set({ position: p.key })}
              className={cn(
                'rounded-md text-[10px] font-medium transition-colors',
                p.grid,
                cfg.position === p.key
                  ? 'bg-brand-500 text-white shadow'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              )}
            >
              {p.label}
            </button>
          ))}
          <div className="col-start-2 row-start-2 flex items-center justify-center text-[10px] text-gray-400">
            Produk
          </div>
        </div>
        <button
          type="button"
          onClick={() => set({ position: 'custom' })}
          className={cn(
            'mt-2 w-full rounded-md border px-3 py-2 text-xs font-medium transition-colors',
            cfg.position === 'custom'
              ? 'border-brand-500 bg-brand-50 text-brand-600'
              : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
          )}
        >
          Custom (drag posisi pakai slider X / Y di bawah)
        </button>
      </div>

      <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <Slider
          label="Ukuran logo (% canvas)"
          value={Math.round(cfg.sizeRatio * 100)}
          min={5}
          max={50}
          onChange={(v) => set({ sizeRatio: v / 100 })}
          unit="%"
        />
        <Slider
          label="Opacity"
          value={Math.round(cfg.opacity * 100)}
          min={10}
          max={100}
          onChange={(v) => set({ opacity: v / 100 })}
          unit="%"
        />
        <Slider
          label="Margin dari pinggir"
          value={cfg.margin}
          min={0}
          max={120}
          onChange={(v) => set({ margin: v })}
          unit="px"
        />
        {cfg.position === 'custom' && (
          <>
            <Slider
              label="Custom X"
              value={Math.round(cfg.customX * 100)}
              min={0}
              max={100}
              onChange={(v) => set({ customX: v / 100 })}
              unit="%"
            />
            <Slider
              label="Custom Y"
              value={Math.round(cfg.customY * 100)}
              min={0}
              max={100}
              onChange={(v) => set({ customY: v / 100 })}
              unit="%"
            />
          </>
        )}
      </div>
    </div>
  );
}
