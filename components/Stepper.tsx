'use client';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Step {
  num: number;
  label: string;
  done: boolean;
}

export function Stepper({ steps }: { steps: Step[] }) {
  return (
    <ol className="flex flex-wrap items-center gap-2 text-sm">
      {steps.map((s, i) => (
        <li key={s.num} className="flex items-center gap-2">
          <div
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1',
              s.done
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-gray-200 bg-white text-gray-600'
            )}
          >
            {s.done ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <Circle className="h-3.5 w-3.5" />
            )}
            <span className="text-xs font-medium">
              {s.num}. {s.label}
            </span>
          </div>
          {i < steps.length - 1 && <span className="text-gray-300">›</span>}
        </li>
      ))}
    </ol>
  );
}
