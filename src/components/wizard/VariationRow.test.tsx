import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { UseFormRegister } from 'react-hook-form';
import type { ProductFormValues } from '@/schemas/productSchemas';
import { VariationRow, type VariationRowProps } from './VariationRow';

/**
 * `register` is invoked once per field while the row renders, so counting the
 * calls is a direct measure of whether `memo` bailed out.
 */
function makeProps(overrides: Partial<VariationRowProps> = {}) {
  const register = vi.fn(() => ({})) as unknown as UseFormRegister<ProductFormValues>;
  return {
    props: { index: 0, register, onRemove: vi.fn(), ...overrides } as VariationRowProps,
    registerSpy: register as unknown as ReturnType<typeof vi.fn>,
  };
}

describe('VariationRow memoisation', () => {
  it('skips re-rendering when only unrelated parent state changed', () => {
    const { props, registerSpy } = makeProps();

    const { rerender } = render(<VariationRow {...props} />);
    expect(registerSpy).toHaveBeenCalledTimes(4);

    registerSpy.mockClear();
    rerender(<VariationRow {...props} />);

    expect(registerSpy).not.toHaveBeenCalled();
  });

  it('re-renders when its own error message changes', () => {
    const { props, registerSpy } = makeProps();

    const { rerender } = render(<VariationRow {...props} />);
    registerSpy.mockClear();

    rerender(<VariationRow {...props} colorError="Colour is required" />);

    expect(registerSpy).toHaveBeenCalledTimes(4);
  });
});
