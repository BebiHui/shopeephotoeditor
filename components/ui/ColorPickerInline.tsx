'use client';
import { QUICK_COLORS } from '@/lib/types';
import { cn } from '@/lib/utils';

interface Props {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  className?: string;
}

export function ColorPickerInline({ label, value, onChange, className }: Props) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <span className="text-xs text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-9 cursor-pointer rounded border border-gray-200"
          aria-label={label}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 flex-1 rounded border border-gray-200 px-2 text-xs font-mono"
          spellCheck={false}
        />
      </div>
      <div className="mt-1 flex flex-wrap gap-1">
        {QUICK_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={cn(
              'h-5 w-5 rounded-full border ring-2 ring-transparent transition',
              value.toLowerCase() === c.toLowerCase()
                ? 'border-gray-900 ring-brand-300'
                : 'border-gray-300 hover:border-gray-500'
            )}
            style={{ background: c }}
            aria-label={`Pick ${c}`}
          />
        ))}
      </div>
    </div>
  );
}
