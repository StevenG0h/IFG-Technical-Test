import { describe, expect, it } from 'vitest';
import { DEFAULT_FILTERS } from '@/store/slices/filtersSlice';
import { filtersSignature, filtersToSearchParams, parseFilters } from '@/utils/filters';

describe('parseFilters', () => {
  it('falls back to defaults for missing or invalid values', () => {
    expect(parseFilters(new URLSearchParams(''))).toEqual(DEFAULT_FILTERS);
    expect(parseFilters(new URLSearchParams('page=abc&limit=-2&sort=nope'))).toEqual(
      DEFAULT_FILTERS,
    );
  });

  it('reads every supported parameter', () => {
    expect(
      parseFilters(
        new URLSearchParams('search=phone&category=smartphones&sort=price_desc&page=2&limit=24'),
      ),
    ).toEqual({
      search: 'phone',
      category: 'smartphones',
      sort: 'price_desc',
      page: 2,
      limit: 24,
    });
  });

  it('reads Next.js searchParams records', () => {
    expect(parseFilters({ search: 'lamp', page: ['3'], limit: '12' })).toMatchObject({
      search: 'lamp',
      page: 3,
      limit: 12,
    });
  });

  it('caps the page size', () => {
    expect(parseFilters({ limit: '5000' }).limit).toBe(100);
  });
});

describe('filtersToSearchParams', () => {
  it('omits defaults so shared URLs stay short', () => {
    expect(filtersToSearchParams(DEFAULT_FILTERS).toString()).toBe('');
  });

  it('round-trips non-default filters', () => {
    const filters = {
      search: 'phone',
      category: 'smartphones',
      sort: 'price_asc',
      page: 2,
      limit: 24,
    } as const;

    expect(parseFilters(filtersToSearchParams(filters))).toEqual(filters);
  });

  it('produces a canonical signature regardless of parameter order', () => {
    expect(filtersSignature(new URLSearchParams('page=2&search=phone'))).toBe(
      filtersSignature(new URLSearchParams('search=phone&page=2')),
    );
    expect(filtersSignature(new URLSearchParams('sort=featured&page=1'))).toBe('');
  });
});
