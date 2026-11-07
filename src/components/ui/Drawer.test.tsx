import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '@/components/ui/Button';
import { renderWithProviders } from '@/test/utils';
import { Drawer } from './Drawer';

function Harness({ onClose = vi.fn() }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button
        onClick={() => {
          setOpen(true);
        }}
      >
        Open filters
      </Button>
      <Drawer
        open={open}
        title="Filters"
        onClose={() => {
          setOpen(false);
          onClose();
        }}
      >
        <label htmlFor="harness-search">Search</label>
        <input id="harness-search" />
        <Button>Apply</Button>
      </Drawer>
    </div>
  );
}

describe('Drawer', () => {
  it('locks page scrolling while open and restores it on close', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    expect(document.body.style.overflow).toBe('');

    await user.click(screen.getByRole('button', { name: 'Open filters' }));
    expect(screen.getByRole('dialog', { name: 'Filters' })).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('hidden');

    await user.click(screen.getByRole('button', { name: 'Close filters' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(document.body.style.overflow).toBe('');
  });

  it('moves focus into the panel and returns it to the trigger', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    const trigger = screen.getByRole('button', { name: 'Open filters' });
    await user.click(trigger);

    const dialog = screen.getByRole('dialog', { name: 'Filters' });
    await waitFor(() => expect(document.activeElement).toBe(dialog));

    await user.click(screen.getByRole('button', { name: 'Close filters' }));

    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it('closes on Escape', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<Harness onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Open filters' }));
    expect(screen.getByRole('dialog', { name: 'Filters' })).toBeInTheDocument();

    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(onClose).toHaveBeenCalled();
  });

  it('keeps Tab focus inside the panel', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    await user.click(screen.getByRole('button', { name: 'Open filters' }));

    const dialog = screen.getByRole('dialog', { name: 'Filters' });
    const close = screen.getByRole('button', { name: 'Close filters' });
    const apply = screen.getByRole('button', { name: 'Apply' });

    expect(document.activeElement).toBe(dialog);

    apply.focus();
    await user.tab();
    expect(document.activeElement).toBe(close);
  });
});
