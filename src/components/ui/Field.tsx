import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/utils/cn';

const CONTROL =
  'w-full rounded-lg border bg-white px-3 py-2 text-base text-slate-900 shadow-sm transition focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100 sm:text-sm';

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={cn(CONTROL, 'border-slate-300 placeholder:text-slate-400', className)}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <select className={cn(CONTROL, 'border-slate-300', className)} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(CONTROL, 'border-slate-300 placeholder:text-slate-400', className)}
      {...props}
    />
  );
}

export function Checkbox({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      type="checkbox"
      className={cn(
        'h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500',
        className,
      )}
      {...props}
    />
  );
}

export interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, error, hint, className, children }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {hint && !error ? <p className="text-xs text-slate-500">{hint}</p> : null}
      {error ? (
        <p role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
