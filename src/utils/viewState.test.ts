import { describe, expect, it } from 'vitest';
import { DEFAULT_FILTERS } from '@/store/slices/filtersSlice';
import {
  WRITES_PARAM,
  parseViewParams,
  viewSignature,
  viewToSearchParams,
} from './viewState';

const EMPTY = { updates: {}, deleted: [] };

describe('view state in the URL', () => {
  it('omits the writes parameter when there is nothing to share', () => {
    const params = viewToSearchParams(DEFAULT_FILTERS, EMPTY);
    expect(params.toString()).toBe('');
    expect(params.has(WRITES_PARAM)).toBe(false);
  });

  it('round-trips filters and writes', () => {
    const writes = { updates: { '1': { price: 123 } }, deleted: [2] };
    const filters = { ...DEFAULT_FILTERS, search: 'phone', page: 2, sort: 'price_desc' as const };

    const params = viewToSearchParams(filters, writes);

    expect(params.get('search')).toBe('phone');
    expect(params.get('page')).toBe('2');
    expect(parseViewParams(params)).toEqual({ filters, writes });
    expect(parseViewParams(new URLSearchParams(params.toString()))).toEqual({ filters, writes });
  });

  it('parses the server-side record form', () => {
    const writes = JSON.stringify({ u: { '1': { stock: 4 } }, d: [] });
    const parsed = parseViewParams({
      search: ['phone'],
      [WRITES_PARAM]: writes,
    });

    expect(parsed.filters.search).toBe('phone');
    expect(parsed.writes).toEqual({ updates: { '1': { stock: 4 } }, deleted: [] });
  });

  it('treats a malformed writes payload as no writes', () => {
    const parsed = parseViewParams({ [WRITES_PARAM]: 'not-json' });
    expect(parsed.writes).toEqual(EMPTY);
  });

  it('produces the same signature regardless of parameter order or key order', () => {
    const a = new URLSearchParams(
      `search=phone&${WRITES_PARAM}=${encodeURIComponent(
        JSON.stringify({ u: { '10': { price: 5 }, '2': { stock: 1 } }, d: [3] }),
      )}`,
    );
    const b = new URLSearchParams(
      `search=phone&${WRITES_PARAM}=${encodeURIComponent(
        JSON.stringify({ d: [3], u: { '2': { stock: 1 }, '10': { price: 5 } } }),
      )}`,
    );

    expect(viewSignature(a)).toBe(viewSignature(b));
    expect(viewSignature(b)).toBe(
      viewToSearchParams(parseViewParams(b).filters, parseViewParams(b).writes).toString(),
    );
  });

  it('ignores invalid write entries instead of failing the whole link', () => {
    const raw = JSON.stringify({ u: { nope: { price: 1 }, '1': { price: 7 } }, d: ['x', 4] });
    expect(parseViewParams({ [WRITES_PARAM]: raw }).writes).toEqual({
      updates: { '1': { price: 7 } },
      deleted: [4],
    });
  });
});
