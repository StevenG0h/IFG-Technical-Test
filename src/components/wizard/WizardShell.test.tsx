import { screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WizardShell } from '@/components/wizard/WizardShell';
import { renderWithProviders } from '@/test/utils';
import type { ProductDraft } from '@/types/product';
import { DRAFT_STORAGE_KEY } from '@/utils/draftStorage';
import { createEmptyDraft } from '@/utils/productDraft';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push,
    replace: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => '/products/new',
  useSearchParams: () => new URLSearchParams(),
}));

async function fillStep1(user: UserEvent) {
  await user.type(screen.getByLabelText('Title'), 'Studio headphones');
  await user.type(
    screen.getByLabelText('Description'),
    'Comfortable over-ear headphones for the studio.',
  );
  await screen.findByRole('option', { name: 'Smartphones' });
  await user.selectOptions(screen.getByLabelText('Category'), 'smartphones');
}

async function goToStep2(user: UserEvent) {
  await fillStep1(user);
  await user.click(screen.getByRole('button', { name: 'Next' }));
  await screen.findByLabelText('Base price');
}

async function fillStep2Numbers(user: UserEvent) {
  const basePrice = screen.getByLabelText('Base price');
  await user.clear(basePrice);
  await user.type(basePrice, '199.99');

  const discount = screen.getByLabelText('Discount %');
  await user.clear(discount);
  await user.type(discount, '10');

  const stock = screen.getByLabelText('Stock');
  await user.clear(stock);
  await user.type(stock, '25');
}

describe('WizardShell', () => {
  beforeEach(() => {
    push.mockClear();
  });

  it('walks through all four steps and submits the product', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WizardShell />);

    await goToStep2(user);
    await fillStep2Numbers(user);

    await user.click(screen.getByRole('button', { name: 'Add variation' }));
    await user.type(screen.getByLabelText('Colour'), 'Red');
    await user.type(screen.getByLabelText('Size'), 'M');
    await user.type(screen.getByLabelText('SKU code'), 'SKU-RED-0001');
    await user.type(screen.getByLabelText('Extra price'), '5');

    await user.click(screen.getByRole('button', { name: 'Next' }));

    const weight = await screen.findByLabelText('Weight (kg)');
    await user.type(weight, '0.4');
    await user.type(screen.getByLabelText('Width'), '20');
    await user.type(screen.getByLabelText('Height'), '18');
    await user.type(screen.getByLabelText('Depth'), '8');

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('Studio headphones')).toBeInTheDocument();
    expect(screen.getByText('$199.99')).toBeInTheDocument();
    expect(screen.getByText('Red/M (SKU-RED-0001)')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Create product' }));

    expect(await screen.findByText('Product created.')).toBeInTheDocument();
    expect(push).toHaveBeenCalledWith('/products');
  });

  it('blocks invalid steps and validates SKU formats and duplicates', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WizardShell />);

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Title is required')).toBeInTheDocument();

    await goToStep2(user);
    await fillStep2Numbers(user);

    await user.click(screen.getByRole('button', { name: 'Add variation' }));
    await user.type(screen.getByLabelText('Colour'), 'Red');
    await user.type(screen.getByLabelText('Size'), 'M');
    await user.type(screen.getByLabelText('SKU code'), 'RED-1');

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Use the format SKU-ABC-1234')).toBeInTheDocument();

    const skuInput = screen.getByLabelText('SKU code');
    await user.clear(skuInput);
    await user.type(skuInput, 'SKU-RED-0001');

    await user.click(screen.getByRole('button', { name: 'Add variation' }));
    expect(await screen.findByText('Variation 2')).toBeInTheDocument();

    const skuInputs = screen.getAllByLabelText('SKU code');
    await user.type(skuInputs[1], 'SKU-RED-0001');
    await user.type(screen.getAllByLabelText('Colour')[1], 'Blue');
    await user.type(screen.getAllByLabelText('Size')[1], 'L');
    await user.click(screen.getAllByRole('button', { name: /Remove variation 2/ })[0]);

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByLabelText('Weight (kg)')).toBeInTheDocument();
  });

  it('shows the fragile conditional fields and validates them', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WizardShell />);

    await goToStep2(user);
    await fillStep2Numbers(user);
    await user.click(screen.getByRole('button', { name: 'Next' }));

    const weight = await screen.findByLabelText('Weight (kg)');
    await user.type(weight, '1');
    await user.type(screen.getByLabelText('Width'), '10');
    await user.type(screen.getByLabelText('Height'), '10');
    await user.type(screen.getByLabelText('Depth'), '10');

    expect(screen.queryByLabelText('Special shipping notes')).not.toBeInTheDocument();

    await user.click(screen.getByLabelText('This product is fragile'));
    expect(await screen.findByLabelText('Special shipping notes')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('You must accept the disclaimer')).toBeInTheDocument();
    expect(
      await screen.findByText('Shipping notes must be at least 10 characters'),
    ).toBeInTheDocument();

    await user.click(screen.getByLabelText(/I confirm the item is packed/));
    await user.type(
      screen.getByLabelText('Special shipping notes'),
      'Handle with care, do not stack.',
    );

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByRole('button', { name: 'Create product' })).toBeInTheDocument();
    expect(screen.getByText('Handle with care, do not stack.')).toBeInTheDocument();
    expect(screen.getAllByText('Yes')).toHaveLength(2);
  });

  it('keeps nested fields editable after a draft snapshot has been stored', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WizardShell />);

    await goToStep2(user);
    await fillStep2Numbers(user);

    // Let the debounced draft snapshot run: its values are deep frozen once
    // they land in the store.
    await new Promise((resolve) => setTimeout(resolve, 700));
    expect(window.localStorage.getItem(DRAFT_STORAGE_KEY)).toContain('199.99');

    await user.click(screen.getByRole('button', { name: 'Next' }));

    const height = await screen.findByLabelText('Height');
    await user.type(height, '12');

    expect(height).toHaveValue(12);
  });

  it('offers to resume a saved draft after a refresh', async () => {
    const draft: ProductDraft = {
      ...createEmptyDraft(),
      title: 'Saved draft headphones',
      category: 'smartphones',
    };
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));

    const user = userEvent.setup();
    renderWithProviders(<WizardShell />);

    expect(await screen.findByText('Resume saved draft?')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Resume draft' }));

    expect(screen.getByLabelText('Title')).toHaveValue('Saved draft headphones');
    await screen.findByRole('option', { name: 'Smartphones' });
    expect(screen.getByLabelText('Category')).toHaveValue('smartphones');
  });

  it('does not turn the Next button into the submit button on the shipping step', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WizardShell />);

    await goToStep2(user);
    await fillStep2Numbers(user);
    await user.click(screen.getByRole('button', { name: 'Next' }));

    const weight = await screen.findByLabelText('Weight (kg)');
    await user.type(weight, '0.4');
    await user.type(screen.getByLabelText('Width'), '20');
    await user.type(screen.getByLabelText('Height'), '18');
    await user.type(screen.getByLabelText('Depth'), '8');

    const nextButton = screen.getByRole('button', { name: 'Next' });
    await user.click(nextButton);

    expect(await screen.findByRole('button', { name: 'Create product' })).toBeInTheDocument();
    // A browser runs a click's default action after React re-renders. Reusing
    // this node as the submit button made the same click create the product.
    expect(nextButton.isConnected).toBe(false);
    expect(screen.queryByText('Product created.')).not.toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it('can discard a saved draft', async () => {
    window.localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({ ...createEmptyDraft(), title: 'Discarded draft' }),
    );

    const user = userEvent.setup();
    renderWithProviders(<WizardShell />);

    expect(await screen.findByText('Resume saved draft?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Start fresh' }));

    expect(screen.getByLabelText('Title')).toHaveValue('');
    expect(window.localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });
});
