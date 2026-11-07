'use client';

import { useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import type { ProductFormValues } from '@/schemas/productSchemas';
import { useFieldArray, useFormContext, type FieldErrors } from 'react-hook-form';
import { VariationRow } from './VariationRow';

const EMPTY_VARIATION = { color: '', size: '', skuCode: '', extraPrice: 0 };

type VariationFieldErrors = Partial<
  Record<'color' | 'size' | 'skuCode' | 'extraPrice', { message?: string }>
>;

/**
 * Reads the row's messages as primitives. The parent may re-render for reasons
 * unrelated to this row; because only strings are handed to `VariationRow`, its
 * `memo` keeps the other rows untouched.
 */
function readVariationErrors(errors: FieldErrors<ProductFormValues>, index: number) {
  const variations = errors.variations as unknown as
    | Array<VariationFieldErrors | undefined>
    | undefined;
  const row = variations?.[index];
  return {
    colorError: row?.color?.message,
    sizeError: row?.size?.message,
    skuError: row?.skuCode?.message,
    extraPriceError: row?.extraPrice?.message,
  };
}

function readArrayMessage(errors: FieldErrors<ProductFormValues>): string | undefined {
  const variations = errors.variations as unknown as
    | { message?: string; root?: { message?: string } }
    | undefined;
  return variations?.root?.message ?? variations?.message;
}

export function Step2PricingVariations() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<ProductFormValues>();

  const { fields, append, remove } = useFieldArray({ control, name: 'variations' });

  const handleRemove = useCallback((index: number) => remove(index), [remove]);
  const handleAppend = useCallback(() => append({ ...EMPTY_VARIATION }), [append]);

  const arrayMessage = readArrayMessage(errors);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Base price" htmlFor="product-base-price" error={errors.basePrice?.message}>
          <Input
            id="product-base-price"
            type="number"
            min="0"
            step="0.01"
            {...register('basePrice', { valueAsNumber: true })}
          />
        </Field>
        <Field
          label="Discount %"
          htmlFor="product-discount"
          error={errors.discountPercentage?.message}
        >
          <Input
            id="product-discount"
            type="number"
            min="0"
            max="99"
            step="1"
            {...register('discountPercentage', { valueAsNumber: true })}
          />
        </Field>
        <Field label="Stock" htmlFor="product-stock" error={errors.stock?.message}>
          <Input
            id="product-stock"
            type="number"
            min="0"
            step="1"
            {...register('stock', { valueAsNumber: true })}
          />
        </Field>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Variations</h3>
          <Button size="sm" variant="secondary" onClick={handleAppend}>
            Add variation
          </Button>
        </div>

        {fields.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
            No variations yet. Add one to offer colours, sizes or SKU variants.
          </p>
        ) : null}

        {fields.map((field, index) => (
          <VariationRow
            key={field.id}
            index={index}
            register={register}
            {...readVariationErrors(errors, index)}
            onRemove={handleRemove}
          />
        ))}

        {arrayMessage ? (
          <p role="alert" className="text-xs font-medium text-red-600">
            {arrayMessage}
          </p>
        ) : null}
      </section>
    </div>
  );
}
