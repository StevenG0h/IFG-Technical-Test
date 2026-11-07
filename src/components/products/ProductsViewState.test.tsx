import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ProductsClient } from '@/app/products/ProductsClient';
import { parseWriteOverlayParam } from '@/store/api/productWriteOverlay';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/utils';
import { parseFilters } from '@/utils/filters';
import { WRITES_PARAM } from '@/utils/viewState';

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace,
    push: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => '/products',
  useSearchParams: () => new URLSearchParams(),
}));

function isProductsListRequest(request: Request): boolean {
  const url = new URL(request.url);
  return (
    request.method === 'GET' &&
    (url.pathname === '/products' ||
      url.pathname === '/products/search' ||
      url.pathname.startsWith('/products/category/'))
  );
}

/**
 * Records every products-list request so a test can tell an optimistic cache
 * patch (no network) from a refetch.
 */
function trackProductsRequests() {
  const urls: URL[] = [];
  const listener = ({ request }: { request: Request }) => {
    if (isProductsListRequest(request)) urls.push(new URL(request.url));
  };

  server.events.on('request:start', listener);

  return {
    urls,
    stop: () => server.events.removeListener('request:start', listener),
  };
}

function renderDirectory(search = '') {
  return renderWithProviders(
    <ProductsClient initialFilters={parseFilters(new URLSearchParams(search))} />,
  );
}

function renderSharedLink(search: string) {
  const params = new URLSearchParams(search);
  return renderWithProviders(
    <ProductsClient
      initialFilters={parseFilters(params)}
      initialWrites={parseWriteOverlayParam(params.get(WRITES_PARAM))}
    />,
  );
}

describe('products view state', () => {
  it('keeps the current filters and does not refetch after a successful edit', async () => {
    const tracker = trackProductsRequests();

    try {
      const user = userEvent.setup();
      renderDirectory('search=phone&sort=price_desc');

      await screen.findByText('iPhone 15');
      expect(tracker.urls).toHaveLength(1);

      await user.click(screen.getByRole('button', { name: 'Edit iPhone 15' }));

      const price = await screen.findByLabelText('Price');
      await user.clear(price);
      await user.type(price, '123');
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      expect(await screen.findByText('Product updated.')).toBeInTheDocument();
      expect(await screen.findByText('$123.00')).toBeInTheDocument();
      expect(screen.getByLabelText('Search products')).toHaveValue('phone');
      expect(screen.getByLabelText('Sort by')).toHaveValue('price_desc');
      expect(tracker.urls).toHaveLength(1);
    } finally {
      tracker.stop();
    }
  });

  it('keeps the current filters and does not refetch after a successful delete', async () => {
    const tracker = trackProductsRequests();

    try {
      const user = userEvent.setup();
      renderDirectory('search=a&limit=2');

      await screen.findByText('Galaxy S24');
      expect(tracker.urls).toHaveLength(1);

      await user.click(screen.getByRole('button', { name: 'Card view' }));
      expect(await screen.findByTestId('product-card-2')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Delete Galaxy S24' }));

      await waitFor(() =>
        expect(screen.queryByTestId('product-card-2')).not.toBeInTheDocument(),
      );
      expect(await screen.findByText('Product deleted.')).toBeInTheDocument();
      expect(screen.getByTestId('product-card-3')).toBeInTheDocument();
      expect(screen.getByLabelText('Search products')).toHaveValue('a');
      expect(screen.getByText(/Page 1 of 1/)).toBeInTheDocument();
      expect(screen.queryByTestId('product-row-1')).not.toBeInTheDocument();
      expect(tracker.urls).toHaveLength(1);
    } finally {
      tracker.stop();
    }
  });

  it('refetches when the page, sort or category changes', async () => {
    const tracker = trackProductsRequests();

    try {
      const user = userEvent.setup();
      renderDirectory('limit=1');

      await screen.findByText('iPhone 15');
      expect(tracker.urls).toHaveLength(1);

      await user.click(screen.getByRole('button', { name: 'Next' }));
      await waitFor(() => expect(tracker.urls).toHaveLength(2));
      expect(tracker.urls[1].searchParams.get('skip')).toBe('1');

      await user.selectOptions(screen.getByLabelText('Sort by'), 'price_desc');
      await waitFor(() => expect(tracker.urls).toHaveLength(3));
      expect(tracker.urls[2].searchParams.get('sortBy')).toBe('price');
      expect(tracker.urls[2].searchParams.get('order')).toBe('desc');

      await user.selectOptions(screen.getByLabelText('Category'), 'beauty');
      await waitFor(() => expect(tracker.urls).toHaveLength(4));
      expect(tracker.urls[3].pathname).toBe('/products/category/beauty');
    } finally {
      tracker.stop();
    }
  });

  it('keeps an edit after a refresh and after later filter refetches', async () => {
    const user = userEvent.setup();
    const first = renderDirectory('search=phone');

    await screen.findByText('iPhone 15');

    await user.click(screen.getByRole('button', { name: 'Edit iPhone 15' }));
    const price = await screen.findByLabelText('Price');
    await user.clear(price);
    await user.type(price, '123');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Product updated.')).toBeInTheDocument();
    expect(screen.getByText('$123.00')).toBeInTheDocument();

    first.unmount();

    renderDirectory('search=phone');
    expect(await screen.findByText('iPhone 15')).toBeInTheDocument();
    expect(screen.getByText('$123.00')).toBeInTheDocument();

    const afterRefresh = userEvent.setup();
    await afterRefresh.clear(screen.getByLabelText('Search products'));
    expect(
      await screen.findByText('Galaxy S24', undefined, { timeout: 4000 }),
    ).toBeInTheDocument();
    expect(screen.getByText('$123.00')).toBeInTheDocument();
  });

  it('keeps a delete after a refresh and after later filter refetches', async () => {
    const user = userEvent.setup();
    const first = renderDirectory('search=a&limit=2');

    await screen.findByText('Galaxy S24');

    await user.click(screen.getByRole('button', { name: 'Delete Galaxy S24' }));
    await waitFor(() =>
      expect(screen.queryByTestId('product-row-2')).not.toBeInTheDocument(),
    );
    expect(await screen.findByText('Product deleted.')).toBeInTheDocument();

    first.unmount();

    renderDirectory('search=a&limit=2');
    expect(await screen.findByText('Matte Lipstick')).toBeInTheDocument();
    expect(screen.queryByText('Galaxy S24')).not.toBeInTheDocument();
    expect(await screen.findByText(/1 products/)).toBeInTheDocument();

    const afterRefresh = userEvent.setup();
    await afterRefresh.clear(screen.getByLabelText('Search products'));
    expect(await screen.findByText(/2 products/, undefined, { timeout: 4000 })).toBeInTheDocument();
    expect(screen.queryByText('Galaxy S24')).not.toBeInTheDocument();
  });

  it('puts the write overlay in the URL after an edit so the link can be shared', async () => {
    replace.mockClear();

    const user = userEvent.setup();
    renderDirectory('search=phone');

    await screen.findByText('iPhone 15');

    await user.click(screen.getByRole('button', { name: 'Edit iPhone 15' }));
    const price = await screen.findByLabelText('Price');
    await user.clear(price);
    await user.type(price, '123');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Product updated.')).toBeInTheDocument();

    await waitFor(() => {
      const lastCall = replace.mock.calls.at(-1)?.[0];
      expect(typeof lastCall).toBe('string');
      expect(lastCall).toContain(`${WRITES_PARAM}=`);
    });

    const lastUrl = new URL(replace.mock.calls.at(-1)?.[0] as string, 'http://localhost');
    expect(lastUrl.searchParams.get('search')).toBe('phone');
    expect(parseWriteOverlayParam(lastUrl.searchParams.get(WRITES_PARAM))).toEqual({
      updates: { '1': { price: 123, stock: 12 } },
      deleted: [],
    });
  });

  it('renders the same data from a shared link without any local state', async () => {
    const writes = JSON.stringify({ u: { '1': { price: 123 } }, d: [2] });
    const search = `search=phone&${WRITES_PARAM}=${encodeURIComponent(writes)}`;

    renderSharedLink(search);

    expect(await screen.findByText('iPhone 15')).toBeInTheDocument();
    expect(screen.getByText('$123.00')).toBeInTheDocument();
    expect(screen.queryByText('Galaxy S24')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Search products')).toHaveValue('phone');
  });
});
