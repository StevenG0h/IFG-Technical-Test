import { delay, http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { makeStore } from '@/store';
import { productsApi } from '@/store/api/productsApi';
import { readProductWriteOverlay } from '@/store/api/productWriteOverlay';
import { getFailureRate } from '@/store/api/baseQuery';
import { API } from '@/test/handlers';
import { server } from '@/test/server';
import type { Product } from '@/types/product';
import type { AppStore } from '@/store';

const ARGS = { page: 1, limit: 12 };

async function seedProducts(store: AppStore): Promise<void> {
  await store.dispatch(productsApi.endpoints.getProducts.initiate(ARGS)).unwrap();
}

function cachedProducts(store: AppStore): Product[] {
  return productsApi.endpoints.getProducts.select(ARGS)(store.getState()).data?.products ?? [];
}

const cachedIds = (store: AppStore) => cachedProducts(store).map((product) => product.id);

describe('optimistic mutations', () => {
  it('removes a product immediately and restores it when the delete fails', async () => {
    server.use(
      http.delete(`${API}/products/:id`, async () => {
        await delay(200);
        return HttpResponse.json({ message: 'Server error' }, { status: 500 });
      }),
    );

    const store = makeStore();
    await seedProducts(store);
    expect(cachedIds(store)).toEqual([1, 2, 3]);

    const mutation = store.dispatch(productsApi.endpoints.deleteProduct.initiate({ id: 1 }));

    await vi.waitFor(() => expect(cachedIds(store)).toEqual([2, 3]));
    expect(productsApi.endpoints.getProducts.select(ARGS)(store.getState()).data?.total).toBe(2);

    await mutation;

    expect(cachedIds(store)).toEqual([1, 2, 3]);
    expect(productsApi.endpoints.getProducts.select(ARGS)(store.getState()).data?.total).toBe(3);
    expect(store.getState().ui.toast).toMatchObject({
      type: 'error',
      retry: { kind: 'delete', id: 1 },
    });
  });

  it('keeps the product removed after a successful delete', async () => {
    const store = makeStore();
    await seedProducts(store);

    await store.dispatch(productsApi.endpoints.deleteProduct.initiate({ id: 2 }));

    expect(cachedIds(store)).toEqual([1, 3]);
    expect(store.getState().ui.toast).toMatchObject({ type: 'success' });
  });

  it('applies the update optimistically across cached pages and rolls it back', async () => {
    server.use(
      http.put(`${API}/products/:id`, async () => {
        await delay(200);
        return HttpResponse.json({ message: 'Server error' }, { status: 500 });
      }),
    );

    const secondPageArgs = { page: 2, limit: 2 };
    const store = makeStore();
    await seedProducts(store);
    await store.dispatch(productsApi.endpoints.getProducts.initiate(secondPageArgs)).unwrap();

    const mutation = store.dispatch(
      productsApi.endpoints.updateProduct.initiate({ id: 1, data: { price: 12.5 } }),
    );

    await vi.waitFor(() =>
      expect(cachedProducts(store).find((product) => product.id === 1)?.price).toBe(12.5),
    );
    expect(
      productsApi.endpoints.getProducts.select(secondPageArgs)(store.getState()).data?.products,
    ).toHaveLength(1);

    await mutation;

    expect(cachedProducts(store).find((product) => product.id === 1)?.price).toBe(999);
    expect(store.getState().ui.toast).toMatchObject({
      type: 'error',
      retry: { kind: 'update', id: 1 },
    });
  });

  it('keeps the optimistic update after a successful request', async () => {
    const store = makeStore();
    await seedProducts(store);

    await store.dispatch(
      productsApi.endpoints.updateProduct.initiate({ id: 1, data: { price: 42 } }),
    );

    expect(cachedProducts(store).find((product) => product.id === 1)?.price).toBe(42);
  });
  it('does not let a late failure revert another product updated meanwhile', async () => {
    server.use(
      http.put(`${API}/products/:id`, async ({ params, request }) => {
        const id = Number(params.id);

        if (id === 1) {
          await delay(300);
          return HttpResponse.json({ message: 'Server error' }, { status: 500 });
        }

        await delay(20);
        const body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ ...body, id });
      }),
    );

    const store = makeStore();
    await seedProducts(store);

    const failing = store.dispatch(
      productsApi.endpoints.updateProduct.initiate({ id: 1, data: { price: 5 } }),
    );
    const succeeding = store.dispatch(
      productsApi.endpoints.updateProduct.initiate({ id: 2, data: { price: 7 } }),
    );

    await succeeding.unwrap();
    await failing;

    const products = cachedProducts(store);
    // Product 1 is rolled back, product 2 keeps its optimistic value even
    // though product 1's rollback happened afterwards.
    expect(products.find((product) => product.id === 1)?.price).toBe(999);
    expect(products.find((product) => product.id === 2)?.price).toBe(7);
  });

  it('does not persist failed writes', async () => {
    server.use(
      http.put(`${API}/products/:id`, () =>
        HttpResponse.json({ message: 'Server error' }, { status: 500 }),
      ),
      http.delete(`${API}/products/:id`, () =>
        HttpResponse.json({ message: 'Server error' }, { status: 500 }),
      ),
    );

    const store = makeStore();
    await seedProducts(store);

    await store.dispatch(productsApi.endpoints.updateProduct.initiate({ id: 1, data: { price: 5 } }));
    await store.dispatch(productsApi.endpoints.deleteProduct.initiate({ id: 2 }));

    expect(readProductWriteOverlay()).toEqual({ updates: {}, deleted: [] });
  });

  it('keeps the newest change when an older update for the same product fails later', async () => {
    server.use(
      http.put(`${API}/products/:id`, async ({ params, request }) => {
        const body = (await request.json()) as { price?: number };

        if (body.price === 5) {
          await delay(300);
          return HttpResponse.json({ message: 'Server error' }, { status: 500 });
        }

        await delay(20);
        return HttpResponse.json({ ...body, id: Number(params.id) });
      }),
    );

    const store = makeStore();
    await seedProducts(store);

    const older = store.dispatch(
      productsApi.endpoints.updateProduct.initiate({ id: 1, data: { price: 5 } }),
    );
    const newer = store.dispatch(
      productsApi.endpoints.updateProduct.initiate({ id: 1, data: { price: 42 } }),
    );

    await newer.unwrap();
    await older;

    expect(cachedProducts(store).find((product) => product.id === 1)?.price).toBe(42);

    const messages = [store.getState().ui.toast, ...store.getState().ui.toastQueue]
      .filter((toast): toast is NonNullable<typeof toast> => toast !== null)
      .map((toast) => toast.message);

    expect(messages.some((message) => message.includes('newer change'))).toBe(true);
  });

});

describe('failure simulation', () => {
  it('defaults to a 20% failure rate when unset', () => {
    const original = process.env.NEXT_PUBLIC_FAILURE_RATE;
    delete process.env.NEXT_PUBLIC_FAILURE_RATE;
    expect(getFailureRate()).toBe(0.2);
    process.env.NEXT_PUBLIC_FAILURE_RATE = original;
  });

  it('clamps the configured rate into 0..1', () => {
    const original = process.env.NEXT_PUBLIC_FAILURE_RATE;

    process.env.NEXT_PUBLIC_FAILURE_RATE = '5';
    expect(getFailureRate()).toBe(1);

    process.env.NEXT_PUBLIC_FAILURE_RATE = '-1';
    expect(getFailureRate()).toBe(0);

    process.env.NEXT_PUBLIC_FAILURE_RATE = 'not-a-number';
    expect(getFailureRate()).toBe(0.2);

    process.env.NEXT_PUBLIC_FAILURE_RATE = original;
  });

  it('returns a simulated error for mutations when the rate is 1', async () => {
    const original = process.env.NEXT_PUBLIC_FAILURE_RATE;
    process.env.NEXT_PUBLIC_FAILURE_RATE = '1';
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);

    const store = makeStore();
    const result = await store.dispatch(
      productsApi.endpoints.deleteProduct.initiate({ id: 1 }),
    );

    expect(result.error).toMatchObject({
      status: 'CUSTOM_ERROR',
      error: 'Simulated network failure. Please retry.',
    });

    randomSpy.mockRestore();
    process.env.NEXT_PUBLIC_FAILURE_RATE = original;
  });
});
