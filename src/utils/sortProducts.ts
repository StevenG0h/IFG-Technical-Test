import type { Product, SortOption } from '@/types/product';

export const SORT_OPTIONS: ReadonlyArray<{ value: SortOption; label: string }> = [
  { value: 'featured', label: 'Featured' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'title_asc', label: 'Name: A to Z' },
  { value: 'title_desc', label: 'Name: Z to A' },
  { value: 'rating_desc', label: 'Rating: best first' },
];

const SORT_VALUES = new Set<string>(SORT_OPTIONS.map((option) => option.value));

export function isSortOption(value: string | null | undefined): value is SortOption {
  return typeof value === 'string' && SORT_VALUES.has(value);
}

export function sortProducts(products: readonly Product[], sort: SortOption): Product[] {
  const next = [...products];

  switch (sort) {
    case 'price_asc':
      return next.sort((a, b) => a.price - b.price);
    case 'price_desc':
      return next.sort((a, b) => b.price - a.price);
    case 'title_asc':
      return next.sort((a, b) => a.title.localeCompare(b.title));
    case 'title_desc':
      return next.sort((a, b) => b.title.localeCompare(a.title));
    case 'rating_desc':
      return next.sort((a, b) => b.rating - a.rating);
    case 'featured':
    default:
      return next;
  }
}

export interface ServerSort {
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export function toServerSort(sort: SortOption): ServerSort {
  switch (sort) {
    case 'price_asc':
      return { sortBy: 'price', order: 'asc' };
    case 'price_desc':
      return { sortBy: 'price', order: 'desc' };
    case 'title_asc':
      return { sortBy: 'title', order: 'asc' };
    case 'title_desc':
      return { sortBy: 'title', order: 'desc' };
    case 'rating_desc':
      return { sortBy: 'rating', order: 'desc' };
    case 'featured':
    default:
      return {};
  }
}
