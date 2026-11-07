import { createApi } from '@reduxjs/toolkit/query/react';
import type {
  Category,
  CreateProductInput,
  Product,
  ProductQueryArgs,
  ProductsResponse,
  UpdateProductInput,
} from '@/types/product';
import { normalizeCategories } from '@/utils/normalizeCategories';
import { sortProducts, toServerSort } from '@/utils/sortProducts';
import { baseQuery } from './baseQuery';
import {
  applyProductWriteOverlay,
  applyProductsWriteOverlay,
  recordProductDelete,
  recordProductUpdate,
} from './productWriteOverlay';
import { showToast } from '../slices/uiSlice';
import { setWriteOverlay } from '../slices/writesSlice';

export const PRODUCTS_TAG = 'Product' as const;
export const CATEGORIES_TAG = 'Category' as const;
export const PRODUCTS_LIST_TAG_ID = 'LIST';

/**
 * The newest optimistic write per product id. A rollback is only applied when
 * the failing mutation is still the latest one for that product, so a late
 * failure cannot revert a newer successful change.
 */
const latestWriteByProduct = new Map<number, symbol>();

/**
 * Successful writes are persisted in start order so a late response from an
 * older update cannot replace a newer value in the overlay.
 */
let writeSequence = 0;
const lastPersistedSequenceByProduct = new Map<number, number>();

/**
 * DummyJSON cannot combine `search` + `category` + `sort` in one request, so
 * the URL is built with an explicit priority: search > category > everything.
 * Sorting is requested from the server *and* re-applied client-side so the
 * order is stable even when a page is already partially sorted.
 */
export function buildProductsPath({ search, category, sort, page, limit }: ProductQueryArgs): string {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  params.set('skip', String(Math.max(0, (page - 1) * limit)));

  const { sortBy, order } = toServerSort(sort ?? 'featured');
  if (sortBy && order) {
    params.set('sortBy', sortBy);
    params.set('order', order);
  }

  const query = params.toString();
  // Trailing/leading whitespace is a typing artefact, not part of the term.
  const term = search?.trim() ?? '';

  if (term) {
    params.set('q', term);
    return `/products/search?${params.toString()}`;
  }

  if (category) {
    return `/products/category/${encodeURIComponent(category)}?${query}`;
  }

  return `/products?${query}`;
}

export const productsApi = createApi({
  reducerPath: 'productsApi',
  baseQuery,
  tagTypes: [PRODUCTS_TAG, CATEGORIES_TAG],
  keepUnusedDataFor: 120,
  endpoints: (builder) => ({
    getProducts: builder.query<ProductsResponse, ProductQueryArgs>({
      query: (args) => buildProductsPath(args),
      /**
       * 0 keeps only the currently subscribed argument in the cache. When the
       * argument changes, RTK Query therefore aborts the superseded request
       * instead of letting it run to completion, and evicts its entry so a late
       * (or aborted) response can never be re-read by a later navigation.
       */
      keepUnusedDataFor: 0,
      transformResponse: (response: ProductsResponse, _meta, arg) => {
        const result = applyProductsWriteOverlay(response);
        return {
          ...result,
          products: sortProducts(result.products ?? [], arg.sort ?? 'featured'),
        };
      },
      providesTags: (result) =>
        result
          ? [
              { type: PRODUCTS_TAG, id: PRODUCTS_LIST_TAG_ID },
              ...result.products.map((product) => ({
                type: PRODUCTS_TAG,
                id: product.id,
              })),
            ]
          : [{ type: PRODUCTS_TAG, id: PRODUCTS_LIST_TAG_ID }],
    }),

    getCategories: builder.query<Category[], void>({
      query: () => '/products/categories',
      transformResponse: (response: unknown) => normalizeCategories(response),
      providesTags: [CATEGORIES_TAG],
    }),

    getProduct: builder.query<Product, number>({
      query: (id) => `/products/${id}`,
      transformResponse: (response: Product) => applyProductWriteOverlay(response),
      providesTags: (_result, _error, id) => [{ type: PRODUCTS_TAG, id }],
    }),

    addProduct: builder.mutation<Product, CreateProductInput>({
      query: (body) => ({
        url: '/products/add',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: PRODUCTS_TAG, id: PRODUCTS_LIST_TAG_ID }],
    }),

    updateProduct: builder.mutation<Product, { id: number; data: UpdateProductInput }>({
      query: ({ id, data }) => ({
        url: `/products/${id}`,
        method: 'PUT',
        body: data,
      }),
      async onQueryStarted({ id, data }, { dispatch, getState, queryFulfilled }) {
        const token = Symbol('update');
        latestWriteByProduct.set(id, token);
        const sequence = ++writeSequence;

        const cachedArgs = productsApi.util.selectCachedArgsForQuery(getState(), 'getProducts');
        const patches = cachedArgs.map((args) =>
          dispatch(
            productsApi.util.updateQueryData('getProducts', args, (draft) => {
              // Mutate the entity in place instead of replacing the array, so
              // the generated patches only cover the changed fields and undo
              // cannot revert another product's concurrent optimistic change.
              const target = draft.products.find((product) => product.id === id);
              if (target) Object.assign(target, data);
            }),
          ),
        );

        patches.push(
          dispatch(
            productsApi.util.updateQueryData('getProduct', id, (draft) => {
              Object.assign(draft, data);
            }),
          ),
        );

        try {
          await queryFulfilled;
          const lastPersisted = lastPersistedSequenceByProduct.get(id) ?? 0;
          const overlay = recordProductUpdate(id, data, sequence >= lastPersisted);
          lastPersistedSequenceByProduct.set(id, Math.max(lastPersisted, sequence));
          dispatch(setWriteOverlay(overlay));
          if (latestWriteByProduct.get(id) === token) latestWriteByProduct.delete(id);
          dispatch(showToast({ type: 'success', message: 'Product updated.' }));
        } catch {
          if (latestWriteByProduct.get(id) === token) {
            latestWriteByProduct.delete(id);
            patches.forEach((patch) => patch.undo());
            dispatch(
              showToast({
                type: 'error',
                message: 'Update failed. Previous values restored.',
                retry: { kind: 'update', id, data },
              }),
            );
          } else {
            dispatch(
              showToast({
                type: 'error',
                message: 'Update failed, but a newer change for this product was kept.',
              }),
            );
          }
        }
      },
    }),

    deleteProduct: builder.mutation<{ id: number; isDeleted: boolean }, { id: number }>({
      query: ({ id }) => ({
        url: `/products/${id}`,
        method: 'DELETE',
      }),
      async onQueryStarted({ id }, { dispatch, getState, queryFulfilled }) {
        const token = Symbol('delete');
        latestWriteByProduct.set(id, token);

        const cachedArgs = productsApi.util.selectCachedArgsForQuery(getState(), 'getProducts');
        const patches = cachedArgs.map((args) =>
          dispatch(
            productsApi.util.updateQueryData('getProducts', args, (draft) => {
              const index = draft.products.findIndex((product) => product.id === id);
              if (index === -1) return;
              draft.products.splice(index, 1);
              draft.total = Math.max(0, draft.total - 1);
            }),
          ),
        );

        try {
          await queryFulfilled;
          dispatch(setWriteOverlay(recordProductDelete(id)));
          if (latestWriteByProduct.get(id) === token) latestWriteByProduct.delete(id);
          dispatch(showToast({ type: 'success', message: 'Product deleted.' }));
        } catch {
          if (latestWriteByProduct.get(id) === token) {
            latestWriteByProduct.delete(id);
            patches.forEach((patch) => patch.undo());
            dispatch(
              showToast({
                type: 'error',
                message: 'Delete failed. State restored.',
                retry: { kind: 'delete', id },
              }),
            );
          } else {
            dispatch(
              showToast({
                type: 'error',
                message: 'Delete failed, but a newer change for this product was kept.',
              }),
            );
          }
        }
      },
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetCategoriesQuery,
  useGetProductQuery,
  useAddProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = productsApi;
