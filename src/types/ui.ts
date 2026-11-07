import type { CreateProductInput, UpdateProductInput } from './product';

/**
 * Retry metadata is stored in Redux, so it must stay serializable.
 * Only data - never functions - is kept here.
 */
export type RetryPayload =
  | { kind: 'delete'; id: number }
  | { kind: 'update'; id: number; data: UpdateProductInput }
  | { kind: 'create'; data: CreateProductInput };

export type ToastType = 'success' | 'error' | 'info';

export interface ToastState {
  id: string;
  type: ToastType;
  message: string;
  retry?: RetryPayload;
}

export type ViewMode = 'table' | 'card';
