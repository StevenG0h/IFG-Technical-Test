'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import type { ProductFormValues } from '@/schemas/productSchemas';
import type { UseFormRegister } from 'react-hook-form';

export interface VariationRowProps {
  index: number;
  register: UseFormRegister<ProductFormValues>;
  /**
   * Flat, primitive props: `memo`'s shallow compare then only fails for the row
   * whose own message changed. Passing an `{ color, size, ... }` object would
   * allocate a new reference on every parent render and defeat the memo.
   */
  colorError?: string;
  sizeError?: string;
  skuError?: string;
  extraPriceError?: string;
  onRemove: (index: number) => void;
}

/**
 * Memoised so typing in one variation cannot re-render its siblings.
 * `register` is stable, `onRemove` is memoised by the parent, the error props
 * are primitives, and the row is keyed by the `field.id` from useFieldArray.
 */
export const VariationRow = memo(function VariationRow({
  index,
  register,
  colorError,
  sizeError,
  skuError,
  extraPriceError,
  onRemove,
}: VariationRowProps) {
  const fieldId = (name: string) => `variation-${index}-${name}`;

  return (
    <fieldset className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
      <legend className="px-1 text-xs font-semibold text-slate-500">
        Variation {index + 1}
      </legend>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Colour" htmlFor={fieldId('color')} error={colorError}>
          <Input
            id={fieldId('color')}
            placeholder="Red"
            {...register(`variations.${index}.color`)}
          />
        </Field>
        <Field label="Size" htmlFor={fieldId('size')} error={sizeError}>
          <Input
            id={fieldId('size')}
            placeholder="M"
            {...register(`variations.${index}.size`)}
          />
        </Field>
        <Field label="SKU code" htmlFor={fieldId('sku')} error={skuError}>
          <Input
            id={fieldId('sku')}
            placeholder="SKU-RED-0001"
            {...register(`variations.${index}.skuCode`)}
          />
        </Field>
        <Field label="Extra price" htmlFor={fieldId('extra')} error={extraPriceError}>
          <Input
            id={fieldId('extra')}
            type="number"
            min="0"
            step="0.01"
            {...register(`variations.${index}.extraPrice`, { valueAsNumber: true })}
          />
        </Field>
      </div>
      <div className="mt-2 flex justify-end">
        <Button
          size="sm"
          variant="ghost"
          aria-label={`Remove variation ${index + 1}`}
          onClick={() => onRemove(index)}
        >
          Remove
        </Button>
      </div>
    </fieldset>
  );
});
