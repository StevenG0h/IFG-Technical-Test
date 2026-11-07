import { describe, expect, it } from 'vitest';
import { buildProductsPath } from '@/store/api/productsApi';

describe('buildProductsPath', () => {
  it('uses the plain collection for the default view', () => {
    expect(buildProductsPath({ page: 1, limit: 12 })).toBe('/products?limit=12&skip=0');
  });

  it('applies pagination offsets', () => {
    expect(buildProductsPath({ page: 3, limit: 10 })).toBe('/products?limit=10&skip=20');
  });

  it('prioritises search over category', () => {
    const path = buildProductsPath({ search: 'phone', category: 'smartphones', page: 1, limit: 12 });
    expect(path.startsWith('/products/search?')).toBe(true);
    expect(path).toContain('q=phone');
  });

  it('falls back to the category endpoint', () => {
    expect(buildProductsPath({ category: 'smart phones', page: 1, limit: 12 })).toBe(
      '/products/category/smart%20phones?limit=12&skip=0',
    );
  });

  it('forwards sort parameters', () => {
    const path = buildProductsPath({ sort: 'price_desc', page: 1, limit: 12 });
    expect(path).toContain('sortBy=price');
    expect(path).toContain('order=desc');
  });
});
