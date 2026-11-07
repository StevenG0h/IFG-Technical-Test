import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { API, makeProduct } from '@/test/handlers';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/utils';
import { EditProductModal } from './EditProductModal';

const product = makeProduct({ id: 1, title: 'iPhone 15', price: 999, stock: 12 });

describe('EditProductModal', () => {
  it('validates with the shared schema and does not close', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(<EditProductModal product={product} onClose={onClose} />);

    const price = screen.getByLabelText('Price');
    await user.clear(price);
    await user.type(price, '0');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Price must be greater than 0')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes only after the write succeeds', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(<EditProductModal product={product} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Product updated.')).toBeInTheDocument();
  });

  it('stays open when the request fails so the values can be corrected', async () => {
    server.use(
      http.put(`${API}/products/:id`, () =>
        HttpResponse.json({ message: 'boom' }, { status: 500 }),
      ),
    );

    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(<EditProductModal product={product} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText(/Update failed/)).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Edit product' })).toBeInTheDocument();
  });
});
