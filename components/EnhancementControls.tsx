'use client';
import { useEditorStore } from '@/store/useEditorStore';
import { Slider } from './ui/Slider';
import { cn } from '@/lib/utils';
import type { EnhancementPreset } from '@/lib/types';

const presets: { key: EnhancementPreset; label: string; desc: string }[] = [
  { key: 'natural', label: 'Natural Marketplace', desc: 'Warna natural, sedikit dipertajam.' },
  { key: 'bright',  label: 'Bright Clean',        desc: 'Lebih cerah & bersih, cocok produk fashion / pakaian.' },
  { key: 'premium', label: 'Premium Product',     desc: 'Kontras lebih, terlihat eksklusif.' },
];

export function EnhancementControls() {
  const preset = useEditorStore((s) => s.preset);
  const setPreset = useEditorStore((s) => s.setPreset);
  const params = useEditorStore((s) => s.manualEnhancement);
  const setManual = useEditorStore((s) => s.setManualEnhancement);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {presets.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPreset(p.key)}
            className={cn(
              'rounded-xl border p-3 text-left transition-all',
              preset === p.key
                ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-300'
                : 'border-gray-200 bg-white hover:border-gray-300'
            )}
          >
            <div className="text-sm font-medium text-gray-900">{p.label}</div>
            <div className="mt-1 text-xs text-gray-500">{p.desc}</div>
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900">
            Manual adjustment
          </h4>
          {preset === 'custom' && (
            <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
              Custom
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Slider
            label="Brightness"
            value={params.brightness}
            min={-50}
            max={50}
            onChange={(v) => setManual({ brightness: v })}
          />
          <Slider
            label="Contrast"
            value={params.contrast}
            min={-50}
            max={50}
            onChange={(v) => setManual({ contrast: v })}
          />
          <Slider
            label="Saturation"
            value={params.saturation}
            min={-50}
            max={50}
            onChange={(v) => setManual({ saturation: v })}
          />
          <Slider
            label="Sharpness"
            value={params.sharpness}
            min={0}
            max={100}
            onChange={(v) => setManual({ sharpness: v })}
          />
          <Slider
            label="Warmth"
            value={params.warmth}
            min={-50}
            max={50}
            onChange={(v) => setManual({ warmth: v })}
          />
        </div>
      </div>
    </div>
  );
}
