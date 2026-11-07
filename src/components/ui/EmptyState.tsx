import type { ReactNode } from 'react';

export interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div
      data-testid="empty-state"
      className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center"
    >
      <span aria-hidden="true" className="text-3xl">
        📦
      </span>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="max-w-md text-sm text-slate-600">{description}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
