import { beforeEach, describe, expect, it } from 'vitest';
import { makeProduct } from '@/test/handlers';
import type { ProductsResponse } from '@/types/product';
import {
  PRODUCT_WRITES_STORAGE_KEY,
  applyProductWriteOverlay,
  applyProductsWriteOverlay,
  readProductWriteOverlay,
  recordProductDelete,
  recordProductUpdate,
} from './productWriteOverlay';

function makeResponse(products = [makeProduct({ id: 1 }), makeProduct({ id: 2 })]): ProductsResponse {
  return { products, total: products.length, skip: 0, limit: 12 };
}

describe('product write overlay', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('merges updates and applies them to fetched products', () => {
    recordProductUpdate(1, { price: 42 });
    recordProductUpdate(1, { stock: 3 });

    expect(readProductWriteOverlay()).toEqual({
      updates: { '1': { price: 42, stock: 3 } },
      deleted: [],
    });

    const product = makeProduct({ id: 1, price: 999, stock: 12 });
    expect(applyProductWriteOverlay(product)).toMatchObject({ price: 42, stock: 3 });
    expect(applyProductsWriteOverlay(makeResponse([product])).products[0]).toMatchObject({
      price: 42,
      stock: 3,
    });
  });

  it('removes deleted products and adjusts the total', () => {
    recordProductDelete(2);

    const result = applyProductsWriteOverlay(makeResponse());

    expect(result.products.map((product) => product.id)).toEqual([1]);
    expect(result.total).toBe(1);
  });

  it('lets a delete supersede an earlier update for the same product', () => {
    recordProductUpdate(1, { price: 42 });
    recordProductDelete(1);

    expect(readProductWriteOverlay()).toEqual({ updates: {}, deleted: [1] });
    expect(applyProductsWriteOverlay(makeResponse()).products.map((product) => product.id)).toEqual(
      [2],
    );
  });

  it('keeps newer fields when an older write settles late', () => {
    recordProductUpdate(1, { price: 42 });
    recordProductUpdate(1, { price: 5, stock: 1 }, false);

    expect(readProductWriteOverlay().updates['1']).toEqual({ price: 42, stock: 1 });

    recordProductDelete(1);
    recordProductUpdate(1, { price: 7 });
    expect(readProductWriteOverlay().updates).toEqual({});
  });

  it('ignores corrupt or malformed storage', () => {
    window.localStorage.setItem(PRODUCT_WRITES_STORAGE_KEY, '{not json');
    expect(readProductWriteOverlay()).toEqual({ updates: {}, deleted: [] });

    window.localStorage.setItem(
      PRODUCT_WRITES_STORAGE_KEY,
      JSON.stringify({ updates: { nope: { price: 1 }, '2': { price: 'free' } }, deleted: ['x', 3] }),
    );
    expect(readProductWriteOverlay()).toEqual({ updates: {}, deleted: [3] });
  });
});
