import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { ProductsClient } from '@/app/products/ProductsClient';
import { productsApi } from '@/store/api/productsApi';
import { setSearch } from '@/store/slices/filtersSlice';
import { API, makeProduct } from '@/test/handlers';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/utils';
import { parseFilters } from '@/utils/filters';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: vi.fn(),
    push: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => '/products',
  useSearchParams: () => new URLSearchParams(),
}));

const SEARCH_URL = `${API}/products/search`;

function renderDirectory() {
  return renderWithProviders(
    <ProductsClient initialFilters={parseFilters(new URLSearchParams())} />,
  );
}

describe('product search race conditions', () => {
  it('aborts the superseded request and never renders its late response', async () => {
    const user = userEvent.setup();
    let firstStarted = false;
    let aborted = false;

    server.use(
      http.get(SEARCH_URL, async ({ request }) => {
        const term = new URL(request.url).searchParams.get('q') ?? '';

        if (term === 'phone') {
          return HttpResponse.json({
            products: [makeProduct({ id: 1, title: 'iPhone 15' })],
            total: 1,
            skip: 0,
            limit: 12,
          });
        }

        firstStarted = true;
        request.signal.addEventListener('abort', () => {
          aborted = true;
        });
        await delay(800);
        return HttpResponse.json({
          products: [makeProduct({ id: 99, title: 'STALE PHONE' })],
          total: 1,
          skip: 0,
          limit: 12,
        });
      }),
    );

    renderDirectory();
    const input = screen.getByLabelText('Search products');

    await user.type(input, 'pho');
    await vi.waitFor(() => expect(firstStarted).toBe(true), { timeout: 5000 });

    // The debounce fires while the first request is still in flight.
    await user.type(input, 'ne');

    await vi.waitFor(() => expect(aborted).toBe(true), { timeout: 5000 });
    expect(await screen.findByText('iPhone 15', undefined, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.queryByText('STALE PHONE')).not.toBeInTheDocument();
  });
});

describe('products client hydration', () => {
  it('hydrates before requesting, even when the store already holds filters', async () => {
    const requestedTerms: string[] = [];

    server.use(
      http.get(SEARCH_URL, ({ request }) => {
        requestedTerms.push(new URL(request.url).searchParams.get('q') ?? '');
        return HttpResponse.json({ products: [], total: 0, skip: 0, limit: 12 });
      }),
    );

    const initialFilters = parseFilters(new URLSearchParams('search=iPhone'));

    const first = renderWithProviders(<ProductsClient initialFilters={initialFilters} />);
    await waitFor(() => expect(requestedTerms).toContain('iPhone'));
    first.unmount();

    // Simulate a stale value left behind in the singleton store (the way a
    // client-side navigation back into /products can) and an empty cache, so
    // the next mount must issue a real request.
    first.store.dispatch(setSearch('stale'));
    first.store.dispatch(productsApi.util.resetApiState());

    requestedTerms.length = 0;
    renderWithProviders(<ProductsClient initialFilters={initialFilters} />, {
      store: first.store,
    });

    await waitFor(() => expect(requestedTerms.length).toBeGreaterThan(0));
    expect(requestedTerms).not.toContain('stale');
    expect(requestedTerms[0]).toBe('iPhone');
    expect(await screen.findByLabelText('Search products')).toHaveValue('iPhone');
  });
});
