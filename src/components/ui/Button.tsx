import type { ComponentProps } from 'react';
import { cn } from '@/utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-slate-900 text-white hover:bg-slate-700',
  secondary: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-100',
  ghost: 'text-slate-700 hover:bg-slate-100',
  danger: 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-sm sm:px-2.5 sm:py-1.5 sm:text-xs',
  md: 'px-4 py-2.5 text-base sm:py-2 sm:text-sm',
};

export interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
      {...props}
    />
  );
}
