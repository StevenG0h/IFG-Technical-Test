import {
  parseWriteOverlayParam,
  toWriteOverlayParam,
  type ProductWriteOverlay,
} from '@/store/api/productWriteOverlay';
import type { FilterValues } from '@/store/slices/filtersSlice';
import { filtersToSearchParams, parseFilters, type RawSearchParams } from './filters';

export const WRITES_PARAM = 'writes';

function readRaw(params: RawSearchParams, key: string): string | null {
  if (params instanceof URLSearchParams) return params.get(key);

  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

/**
 * The shareable view is the filters *plus* the successful writes. The API does
 * not persist writes, so a link can only reproduce the same screen if the write
 * overlay travels in the URL with the filters.
 */
export function parseViewParams(params: RawSearchParams): {
  filters: FilterValues;
  writes: ProductWriteOverlay;
} {
  return {
    filters: parseFilters(params),
    writes: parseWriteOverlayParam(readRaw(params, WRITES_PARAM)),
  };
}

export function viewToSearchParams(
  filters: FilterValues,
  writes: ProductWriteOverlay,
): URLSearchParams {
  const params = filtersToSearchParams(filters);
  const encoded = toWriteOverlayParam(writes);
  if (encoded) params.set(WRITES_PARAM, encoded);
  return params;
}

/**
 * Canonical form of a URL's whole view. Two URLs that describe the same view but
 * differ in parameter order or in a redundant write payload produce the same
 * signature, which prevents the URL <-> Redux sync from fighting itself.
 */
export function viewSignature(params: RawSearchParams): string {
  const { filters, writes } = parseViewParams(params);
  return viewToSearchParams(filters, writes).toString();
}
