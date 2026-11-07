import type { ProductDraft } from '@/types/product';

export const DRAFT_STORAGE_KEY = 'inventory-portal:product-draft';

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isDraft(value: unknown): value is ProductDraft {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ProductDraft>;

  return (
    typeof candidate.title === 'string' &&
    typeof candidate.description === 'string' &&
    typeof candidate.category === 'string' &&
    typeof candidate.basePrice === 'number' &&
    typeof candidate.stock === 'number' &&
    Array.isArray(candidate.variations) &&
    !!candidate.dimensions &&
    typeof candidate.dimensions.width === 'number'
  );
}

export function loadDraft(): ProductDraft | null {
  const storage = getStorage();
  if (!storage) return null;

  const raw = storage.getItem(DRAFT_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    return isDraft(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function persistDraft(draft: ProductDraft): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Storage can be full or blocked (private mode) - drafts are best effort.
  }
}

export function clearPersistedDraft(): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // Ignore: nothing to recover from.
  }
}
