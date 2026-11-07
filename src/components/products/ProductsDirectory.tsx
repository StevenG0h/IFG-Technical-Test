'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { EditProductModal } from '@/components/products/EditProductModal';import { ProductCardGrid } from '@/components/products/ProductCardGrid';
import { ProductFilters } from '@/components/products/ProductFilters';
import { ProductTable } from '@/components/products/ProductTable';
import { ProductsPagination } from '@/components/products/ProductsPagination';
import { ViewToggle } from '@/components/products/ViewToggle';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardGridSkeleton, TableSkeleton } from '@/components/ui/Skeleton';
import { useGetCategoriesQuery, useGetProductsQuery } from '@/store/api/productsApi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { resetFilters, selectFilters } from '@/store/slices/filtersSlice';
import {
  selectFilterDrawerOpen,
  selectViewMode,
  setFilterDrawerOpen,
} from '@/store/slices/uiSlice';
import type { Product, ProductQueryArgs, ProductsResponse } from '@/types/product';

export function ProductsDirectory() {
  const filters = useAppSelector(selectFilters);
  const viewMode = useAppSelector(selectViewMode);
  const isDrawerOpen = useAppSelector(selectFilterDrawerOpen);
  const dispatch = useAppDispatch();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const queryArgs = useMemo<ProductQueryArgs>(
    () => ({
      search: filters.search || undefined,
      category: filters.category || undefined,
      sort: filters.sort,
      page: filters.page,
      limit: filters.limit,
    }),
    [filters.category, filters.limit, filters.page, filters.search, filters.sort],
  );

  const { data, isFetching, isError, refetch } = useGetProductsQuery(queryArgs);
  const { data: categories = [], isFetching: categoriesLoading } = useGetCategoriesQuery();

  // Keep the last rendered page on screen while the next argument loads. The
  // cache itself only holds the current argument (keepUnusedDataFor: 0), so the
  // component remembers it to avoid a skeleton/empty-state flash on every
  // keystroke, including the frame before the new request is even registered.
  const [lastResult, setLastResult] = useState<ProductsResponse | null>(null);
  if (data && data !== lastResult) setLastResult(data);

  const result = data ?? (isError ? null : lastResult);

  const products = result?.products ?? [];
  const showSkeleton = !result && !isError;
  const isRefreshing = isFetching && Boolean(result);

  const filterPanel = (
    <ProductFilters categories={categories} categoriesLoading={categoriesLoading} />
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Products</h1>
          <p className="text-sm text-slate-600">
            Browse, edit and remove inventory items. Filters and edits are stored in the URL, so a
            shared link shows the same view.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            className="lg:hidden"
            onClick={() => dispatch(setFilterDrawerOpen(true))}
          >
            Filters
          </Button>
          <ViewToggle />
          <Link
            href="/products/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            New product
          </Link>
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[16rem_1fr]">
        <aside className="hidden lg:block">
          <div className="rounded-xl border border-slate-200 bg-white p-4">{filterPanel}</div>
        </aside>

        {/* min-w-0 lets the table scroll inside its wrapper instead of widening
            the grid track and overflowing the page on small screens. */}
        <section className="flex min-w-0 flex-col gap-4" aria-busy={isFetching}>
          {isRefreshing ? (
            <p className="text-xs text-slate-500" aria-live="polite">
              Refreshing results…
            </p>
          ) : null}

          {isError ? (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800"
            >
              <p className="font-medium">Could not load products.</p>
              <p className="mt-1">The request failed. Check your connection and try again.</p>
              <Button
                className="mt-3"
                size="sm"
                variant="secondary"
                onClick={() => {
                  void refetch();
                }}
              >
                Try again
              </Button>
            </div>
          ) : showSkeleton ? (
            viewMode === 'table' ? (
              <TableSkeleton />
            ) : (
              <CardGridSkeleton />
            )
          ) : products.length === 0 ? (
            <EmptyState
              title="No products found"
              description="Try a different search term or clear the active filters."
              action={
                <Button variant="secondary" onClick={() => dispatch(resetFilters())}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <>
              {viewMode === 'table' ? (
                <ProductTable products={products} onEdit={setEditingProduct} />
              ) : (
                <ProductCardGrid products={products} onEdit={setEditingProduct} />
              )}
              <ProductsPagination
                total={result?.total ?? 0}
                limit={filters.limit}
                page={filters.page}
              />
            </>
          )}
        </section>
      </div>

      <Drawer
        open={isDrawerOpen}
        title="Filters"
        onClose={() => dispatch(setFilterDrawerOpen(false))}
      >
        {filterPanel}
      </Drawer>

      {editingProduct ? (
        <EditProductModal
          key={editingProduct.id}
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
        />
      ) : null}
    </div>
  );
}
