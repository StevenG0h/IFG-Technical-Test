'use client';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectViewMode, setViewMode } from '@/store/slices/uiSlice';
import type { ViewMode } from '@/types/ui';
import { cn } from '@/utils/cn';

const OPTIONS: ReadonlyArray<{ value: ViewMode; label: string }> = [
  { value: 'table', label: 'Table view' },
  { value: 'card', label: 'Card view' },
];

export function ViewToggle() {
  const viewMode = useAppSelector(selectViewMode);
  const dispatch = useAppDispatch();

  return (
    <div
      role="group"
      aria-label="View mode"
      className="inline-flex h-9 rounded-lg border border-slate-300 bg-white p-1"
    >
      {OPTIONS.map((option) => {
        const active = viewMode === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => dispatch(setViewMode(option.value))}
            className={cn(
              'inline-flex h-full items-center justify-center rounded-md px-3 text-xs font-medium transition',
              active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
