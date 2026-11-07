import { describe, expect, it } from 'vitest';
import { makeProduct } from '@/test/handlers';
import type { Product } from '@/types/product';
import { isSortOption, sortProducts, toServerSort } from '@/utils/sortProducts';

const products: Product[] = [
  makeProduct({ id: 1, title: 'Charlie', price: 30, rating: 4.2 }),
  makeProduct({ id: 2, title: 'Alpha', price: 10, rating: 4.9 }),
  makeProduct({ id: 3, title: 'Bravo', price: 20, rating: 3.5 }),
];

const ids = (list: Product[]) => list.map((product) => product.id);

describe('sortProducts', () => {
  it('keeps the original order for the featured option', () => {
    expect(ids(sortProducts(products, 'featured'))).toEqual([1, 2, 3]);
  });

  it('sorts by price', () => {
    expect(ids(sortProducts(products, 'price_asc'))).toEqual([2, 3, 1]);
    expect(ids(sortProducts(products, 'price_desc'))).toEqual([1, 3, 2]);
  });

  it('sorts by title', () => {
    expect(ids(sortProducts(products, 'title_asc'))).toEqual([2, 3, 1]);
    expect(ids(sortProducts(products, 'title_desc'))).toEqual([1, 3, 2]);
  });

  it('sorts by best rating', () => {
    expect(ids(sortProducts(products, 'rating_desc'))).toEqual([2, 1, 3]);
  });

  it('does not mutate the input array', () => {
    const copy = [...products];
    sortProducts(products, 'price_desc');
    expect(ids(products)).toEqual(ids(copy));
  });

  it('maps sort options to server parameters', () => {
    expect(toServerSort('price_asc')).toEqual({ sortBy: 'price', order: 'asc' });
    expect(toServerSort('rating_desc')).toEqual({ sortBy: 'rating', order: 'desc' });
    expect(toServerSort('featured')).toEqual({});
  });

  it('guards unknown sort values', () => {
    expect(isSortOption('price_asc')).toBe(true);
    expect(isSortOption('unknown')).toBe(false);
    expect(isSortOption(null)).toBe(false);
  });
});
