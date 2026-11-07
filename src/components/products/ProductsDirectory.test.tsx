import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductsClient } from '@/app/products/ProductsClient';
import { API, makeProduct } from '@/test/handlers';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/utils';
import { parseFilters } from '@/utils/filters';

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

function renderDirectory() {
  return renderWithProviders(
    <ProductsClient initialFilters={parseFilters(new URLSearchParams())} />,
  );
}

describe('products directory', () => {
  beforeEach(() => {
    replace.mockClear();
  });

  it('restores the server-provided filters and lists products', async () => {
    renderWithProviders(
      <ProductsClient
        initialFilters={parseFilters(new URLSearchParams('search=iPhone&sort=price_desc'))}
      />,
    );

    expect(await screen.findByText('iPhone 15')).toBeInTheDocument();
    expect(screen.getByLabelText('Search products')).toHaveValue('iPhone');
    expect(screen.queryByText('Galaxy S24')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Sort by')).toHaveValue('price_desc');
  });

  it('renders the products table, pagination and category options', async () => {
    renderDirectory();

    expect(await screen.findByText('iPhone 15')).toBeInTheDocument();
    expect(screen.getByText('Galaxy S24')).toBeInTheDocument();
    expect(screen.getByText('Matte Lipstick')).toBeInTheDocument();
    expect(screen.getByText(/3 products/)).toBeInTheDocument();

    await waitFor(() =>
      expect(
        screen.getByRole('option', { name: 'Smartphones' }),
      ).toBeInTheDocument(),
    );
  });

  it('debounces the search term, filters results and mirrors it into the URL', async () => {
    const user = userEvent.setup();
    renderDirectory();

    await screen.findByText('Galaxy S24');

    await user.type(screen.getByLabelText('Search products'), 'iPhone');

    await waitFor(
      () => expect(screen.queryByText('Galaxy S24')).not.toBeInTheDocument(),
      { timeout: 4000 },
    );

    expect(screen.getByText('iPhone 15')).toBeInTheDocument();
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith('/products?search=iPhone', { scroll: false }),
    );
  });

  it('trims the debounced search term before committing it', async () => {
    const user = userEvent.setup();
    renderDirectory();

    await screen.findByText('Galaxy S24');

    await user.type(screen.getByLabelText('Search products'), 'iPhone ');

    await waitFor(
      () => expect(replace).toHaveBeenCalledWith('/products?search=iPhone', { scroll: false }),
      { timeout: 4000 },
    );
    expect(replace).not.toHaveBeenCalledWith('/products?search=iPhone+', { scroll: false });
  });

  it('keeps the current rows on screen while the next request is in flight', async () => {
    server.use(
      http.get(`${API}/products/category/:slug`, async () => {
        await delay(300);
        return HttpResponse.json({
          products: [makeProduct({ id: 3, title: 'Matte Lipstick', category: 'beauty' })],
          total: 1,
          skip: 0,
          limit: 12,
        });
      }),
    );

    const user = userEvent.setup();
    renderDirectory();

    await screen.findByText('Galaxy S24');
    await user.selectOptions(screen.getByLabelText('Category'), 'beauty');

    expect(screen.getByText('Galaxy S24')).toBeInTheDocument();
    expect(screen.queryByTestId('products-skeleton')).not.toBeInTheDocument();
    expect(screen.queryByText('No products found')).not.toBeInTheDocument();

    expect(
      await screen.findByText('Matte Lipstick', undefined, { timeout: 4000 }),
    ).toBeInTheDocument();
  });

  it('filters by category and shows the empty state when nothing matches', async () => {
    const user = userEvent.setup();
    renderDirectory();

    await screen.findByText('Galaxy S24');

    await user.selectOptions(screen.getByLabelText('Category'), 'beauty');

    await waitFor(
      () => expect(screen.queryByText('Galaxy S24')).not.toBeInTheDocument(),
      { timeout: 4000 },
    );
    expect(screen.getByText('Matte Lipstick')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Category'), '');
    await user.type(screen.getByLabelText('Search products'), 'zzz');

    expect(await screen.findByTestId('empty-state', undefined, { timeout: 4000 })).toBeInTheDocument();
  });

  it('switches between table and card layouts', async () => {
    const user = userEvent.setup();
    renderDirectory();

    await screen.findByTestId('product-row-1');

    await user.click(screen.getByRole('button', { name: 'Card view' }));

    expect(await screen.findByTestId('product-card-1')).toBeInTheDocument();
    expect(screen.queryByTestId('product-row-1')).not.toBeInTheDocument();
  });

  it('removes a deleted product from the table', async () => {
    const user = userEvent.setup();
    renderDirectory();

    await screen.findByTestId('product-row-1');

    await user.click(screen.getByRole('button', { name: 'Delete iPhone 15' }));

    await waitFor(() => expect(screen.queryByTestId('product-row-1')).not.toBeInTheDocument());
    expect(await screen.findByText('Product deleted.')).toBeInTheDocument();
  });

  it('opens the mobile filter drawer', async () => {
    const user = userEvent.setup();
    renderDirectory();

    await screen.findByText('iPhone 15');

    await user.click(screen.getByRole('button', { name: 'Filters' }));

    expect(screen.getByRole('dialog', { name: 'Filters' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close filters' }));
    expect(screen.queryByRole('dialog', { name: 'Filters' })).not.toBeInTheDocument();
  });

  it('gives each filter panel its own control ids so labels target the visible copy', async () => {
    const user = userEvent.setup();
    renderDirectory();

    await screen.findByText('iPhone 15');
    await user.click(screen.getByRole('button', { name: 'Filters' }));

    const dialog = screen.getByRole('dialog', { name: 'Filters' });
    const drawerSearch = within(dialog).getByLabelText('Search products');

    expect(drawerSearch.id).not.toBe('');
    expect(screen.getAllByLabelText('Search products')).toHaveLength(2);
    expect(document.querySelectorAll(`#${CSS.escape(drawerSearch.id)}`)).toHaveLength(1);
    expect(within(dialog).getByLabelText('Category')).toHaveAttribute('id', expect.stringContaining('category'));
    expect(within(dialog).getByLabelText('Sort by')).toHaveAttribute('id', expect.stringContaining('sort'));
  });

  it('applies a search typed immediately before the drawer closes', async () => {
    const user = userEvent.setup();
    renderDirectory();

    await screen.findByText('Galaxy S24');
    await user.click(screen.getByRole('button', { name: 'Filters' }));

    const dialog = screen.getByRole('dialog', { name: 'Filters' });
    await user.type(within(dialog).getByLabelText('Search products'), 'iPhone');

    // Closing before the debounce fires must not drop the keystrokes.
    await user.click(screen.getByRole('button', { name: 'Close filters' }));

    await waitFor(
      () => expect(screen.queryByText('Galaxy S24')).not.toBeInTheDocument(),
      { timeout: 4000 },
    );
    expect(screen.getByText('iPhone 15')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Filters' }));
    expect(within(screen.getByRole('dialog', { name: 'Filters' })).getByLabelText('Search products')).toHaveValue(
      'iPhone',
    );
  });

  it('shows the error panel when the products request fails', async () => {
    server.use(
      http.get(`${API}/products`, () =>
        HttpResponse.json({ message: 'boom' }, { status: 500 }),
      ),
    );

    renderDirectory();

    expect(await screen.findByText('Could not load products.')).toBeInTheDocument();
  });
});
