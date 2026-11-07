'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { useRetryPayload } from '@/hooks/useRetryPayload';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearToast, selectQueuedToastCount, selectToast } from '@/store/slices/uiSlice';
import type { ToastType } from '@/types/ui';
import { cn } from '@/utils/cn';

const AUTODISMISS_MS = 8000;

const STYLES: Record<ToastType, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-red-200 bg-red-50 text-red-900',
  info: 'border-slate-200 bg-white text-slate-800',
};

export function Toast() {
  const toast = useAppSelector(selectToast);
  const queuedCount = useAppSelector(selectQueuedToastCount);
  const dispatch = useAppDispatch();
  const retry = useRetryPayload();

  // A toast that carries a retry payload must not disappear on a timer,
  // otherwise the failed operation becomes unrecoverable.
  useEffect(() => {
    if (!toast || toast.retry) return;
    const timer = window.setTimeout(() => dispatch(clearToast()), AUTODISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [dispatch, toast]);

  if (!toast) return null;

  const retryPayload = toast.retry;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed bottom-4 left-1/2 z-50 flex w-[min(92vw,30rem)] -translate-x-1/2 items-start gap-3 rounded-xl border p-4 shadow-lg',
        STYLES[toast.type],
      )}
    >
      <div className="flex-1">
        <p className="text-sm">{toast.message}</p>
        {queuedCount > 0 ? (
          <p className="mt-1 text-xs opacity-70">
            {queuedCount} more notification{queuedCount === 1 ? '' : 's'} waiting
          </p>
        ) : null}
      </div>
      {retryPayload ? (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            retry(retryPayload);
            dispatch(clearToast());
          }}
        >
          Retry
        </Button>
      ) : null}
      <button
        type="button"
        onClick={() => dispatch(clearToast())}
        aria-label="Dismiss notification"
        className="rounded-md p-1 text-slate-500 transition hover:bg-white/60 hover:text-slate-800"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
}
