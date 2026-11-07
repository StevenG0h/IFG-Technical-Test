import { DEFAULT_FILTERS, type FilterValues } from '@/store/slices/filtersSlice';
import { isSortOption } from './sortProducts';

export type RawSearchParams =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

const MAX_LIMIT = 100;

function readValue(params: RawSearchParams, key: string): string {
  if (params instanceof URLSearchParams) {
    return (params.get(key) ?? '').trim();
  }

  const value = params[key];
  if (Array.isArray(value)) return (value[0] ?? '').trim();
  return (value ?? '').trim();
}

export function parseFilters(params: RawSearchParams): FilterValues {
  const rawPage = Number(readValue(params, 'page'));
  const rawLimit = Number(readValue(params, 'limit'));
  const sort = readValue(params, 'sort');

  return {
    search: readValue(params, 'search'),
    category: readValue(params, 'category'),
    sort: isSortOption(sort) ? sort : DEFAULT_FILTERS.sort,
    page: Number.isFinite(rawPage) && rawPage >= 1 ? Math.trunc(rawPage) : DEFAULT_FILTERS.page,
    limit:
      Number.isFinite(rawLimit) && rawLimit >= 1
        ? Math.min(Math.trunc(rawLimit), MAX_LIMIT)
        : DEFAULT_FILTERS.limit,
  };
}

/** Omits defaults so shared URLs stay short and canonical. */
export function filtersToSearchParams(filters: FilterValues): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.search !== '') params.set('search', filters.search);
  if (filters.category !== '') params.set('category', filters.category);
  if (filters.sort !== DEFAULT_FILTERS.sort) params.set('sort', filters.sort);
  if (filters.page > DEFAULT_FILTERS.page) params.set('page', String(filters.page));
  if (filters.limit !== DEFAULT_FILTERS.limit) params.set('limit', String(filters.limit));

  return params;
}

/**
 * Canonical form of a URL's filters. Two URLs with the same filters but a
 * different parameter order produce the same signature, which prevents the
 * URL <-> Redux sync from fighting itself.
 */
export function filtersSignature(params: RawSearchParams): string {
  return filtersToSearchParams(parseFilters(params)).toString();
}
