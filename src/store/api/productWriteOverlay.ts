import type { Product, ProductsResponse, UpdateProductInput } from '@/types/product';

export const PRODUCT_WRITES_STORAGE_KEY = 'inventory-portal:product-writes';

/**
 * Successful writes are replayed onto every products response. DummyJSON does
 * not persist writes, so without this a refresh (or any refetch) would bring
 * the original fixtures back.
 */
export interface ProductWriteOverlay {
  updates: Record<string, UpdateProductInput>;
  deleted: number[];
}

/** Fields in a fixed order, so the same overlay always serialises identically. */
const UPDATE_FIELDS: ReadonlyArray<keyof UpdateProductInput> = [
  'title',
  'description',
  'category',
  'brand',
  'price',
  'stock',
];

function emptyOverlay(): ProductWriteOverlay {
  return { updates: {}, deleted: [] };
}

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function sanitizeUpdate(value: unknown): UpdateProductInput | null {
  if (!value || typeof value !== 'object') return null;

  const candidate = value as Record<string, unknown>;
  const update: UpdateProductInput = {};

  if (typeof candidate.title === 'string') update.title = candidate.title;
  if (typeof candidate.description === 'string') update.description = candidate.description;
  if (typeof candidate.category === 'string') update.category = candidate.category;
  if (typeof candidate.brand === 'string') update.brand = candidate.brand;
  if (typeof candidate.price === 'number' && Number.isFinite(candidate.price)) {
    update.price = candidate.price;
  }
  if (typeof candidate.stock === 'number' && Number.isFinite(candidate.stock)) {
    update.stock = candidate.stock;
  }

  return Object.keys(update).length > 0 ? update : null;
}

function sanitizeOverlay(value: unknown): ProductWriteOverlay {
  if (!value || typeof value !== 'object') return emptyOverlay();

  const candidate = value as {
    updates?: unknown;
    deleted?: unknown;
    u?: unknown;
    d?: unknown;
  };
  const rawUpdates = candidate.updates ?? candidate.u;
  const rawDeleted = candidate.deleted ?? candidate.d;
  const updates: Record<string, UpdateProductInput> = {};

  if (rawUpdates && typeof rawUpdates === 'object') {
    for (const [key, raw] of Object.entries(rawUpdates as Record<string, unknown>)) {
      if (!/^\d+$/.test(key)) continue;
      const update = sanitizeUpdate(raw);
      if (update) updates[key] = update;
    }
  }

  const deleted = Array.isArray(rawDeleted)
    ? rawDeleted.filter((id): id is number => typeof id === 'number' && Number.isInteger(id))
    : [];

  return { updates, deleted };
}

function canonicalizeOverlay(overlay: ProductWriteOverlay): ProductWriteOverlay {
  const updates: Record<string, UpdateProductInput> = {};

  for (const key of Object.keys(overlay.updates).sort((a, b) => Number(a) - Number(b))) {
    const source = overlay.updates[key];
    const ordered: UpdateProductInput = {};
    for (const field of UPDATE_FIELDS) {
      if (source[field] !== undefined) Object.assign(ordered, { [field]: source[field] });
    }
    if (Object.keys(ordered).length > 0) updates[key] = ordered;
  }

  return { updates, deleted: [...new Set(overlay.deleted)].sort((a, b) => a - b) };
}

export function isWriteOverlayEmpty(overlay: ProductWriteOverlay): boolean {
  return Object.keys(overlay.updates).length === 0 && overlay.deleted.length === 0;
}

export function readProductWriteOverlay(): ProductWriteOverlay {
  const storage = getStorage();
  if (!storage) return emptyOverlay();

  const raw = storage.getItem(PRODUCT_WRITES_STORAGE_KEY);
  if (!raw) return emptyOverlay();

  try {
    return sanitizeOverlay(JSON.parse(raw));
  } catch {
    return emptyOverlay();
  }
}

/** Writes the whole overlay, replacing whatever was stored before. */
export function saveProductWriteOverlay(overlay: ProductWriteOverlay): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    const canonical = canonicalizeOverlay(overlay);
    if (isWriteOverlayEmpty(canonical)) {
      storage.removeItem(PRODUCT_WRITES_STORAGE_KEY);
      return;
    }
    storage.setItem(PRODUCT_WRITES_STORAGE_KEY, JSON.stringify(canonical));
  } catch {
    // Storage can be full or blocked - persistence is best effort.
  }
}

export function recordProductUpdate(
  id: number,
  data: UpdateProductInput,
  overwrite = true,
): ProductWriteOverlay {
  const overlay = readProductWriteOverlay();
  if (overlay.deleted.includes(id)) return overlay;

  const key = String(id);
  const existing = overlay.updates[key] ?? {};
  // A late settlement of an older write must not overwrite a newer one, but it
  // can still contribute fields the newer write did not touch.
  overlay.updates[key] = overwrite ? { ...existing, ...data } : { ...data, ...existing };
  saveProductWriteOverlay(overlay);
  return overlay;
}

export function recordProductDelete(id: number): ProductWriteOverlay {
  const overlay = readProductWriteOverlay();
  delete overlay.updates[String(id)];
  if (!overlay.deleted.includes(id)) overlay.deleted.push(id);
  saveProductWriteOverlay(overlay);
  return overlay;
}

/**
 * Encodes the overlay for the shareable URL, or `null` when there is nothing to
 * share. The URL is the only place a write state can travel to another browser,
 * because the API itself does not persist writes.
 */
export function toWriteOverlayParam(overlay: ProductWriteOverlay): string | null {
  const canonical = canonicalizeOverlay(overlay);
  if (isWriteOverlayEmpty(canonical)) return null;
  return JSON.stringify({ u: canonical.updates, d: canonical.deleted });
}

export function parseWriteOverlayParam(raw: string | null | undefined): ProductWriteOverlay {
  if (!raw) return emptyOverlay();

  try {
    return sanitizeOverlay(JSON.parse(raw));
  } catch {
    return emptyOverlay();
  }
}

/** Applies the persisted write state to a single product. */
export function applyProductWriteOverlay(product: Product): Product {
  const update = readProductWriteOverlay().updates[String(product.id)];
  return update ? { ...product, ...update } : product;
}

/** Applies the persisted write state to a products page and its total. */
export function applyProductsWriteOverlay(response: ProductsResponse): ProductsResponse {
  const overlay = readProductWriteOverlay();
  const deleted = new Set(overlay.deleted);
  const products: Product[] = [];
  let removedFromPage = 0;

  for (const product of response.products ?? []) {
    if (deleted.has(product.id)) {
      removedFromPage += 1;
      continue;
    }

    const update = overlay.updates[String(product.id)];
    products.push(update ? { ...product, ...update } : product);
  }

  return {
    ...response,
    products,
    total: Math.max(0, response.total - removedFromPage),
  };
}
