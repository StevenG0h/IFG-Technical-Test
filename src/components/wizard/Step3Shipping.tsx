'use client';

import { Checkbox, Field, Input, Textarea } from '@/components/ui/Field';
import type { ProductFormValues } from '@/schemas/productSchemas';
import { useFormContext } from 'react-hook-form';

export function Step3Shipping() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<ProductFormValues>();

  const isFragile = watch('fragile') === true;

  return (
    <div className="flex flex-col gap-4">
      <Field label="Weight (kg)" htmlFor="product-weight" error={errors.weight?.message}>
        <Input
          id="product-weight"
          type="number"
          min="0"
          step="0.01"
          {...register('weight', { valueAsNumber: true })}
        />
      </Field>

      <fieldset className="rounded-lg border border-slate-200 p-3">
        <legend className="px-1 text-xs font-semibold text-slate-500">
          Dimensions (cm)
        </legend>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Width" htmlFor="product-width" error={errors.dimensions?.width?.message}>
            <Input
              id="product-width"
              type="number"
              min="0"
              step="0.1"
              {...register('dimensions.width', { valueAsNumber: true })}
            />
          </Field>
          <Field label="Height" htmlFor="product-height" error={errors.dimensions?.height?.message}>
            <Input
              id="product-height"
              type="number"
              min="0"
              step="0.1"
              {...register('dimensions.height', { valueAsNumber: true })}
            />
          </Field>
          <Field label="Depth" htmlFor="product-depth" error={errors.dimensions?.depth?.message}>
            <Input
              id="product-depth"
              type="number"
              min="0"
              step="0.1"
              {...register('dimensions.depth', { valueAsNumber: true })}
            />
          </Field>
        </div>
      </fieldset>

      <div className="flex items-center gap-2">
        <Checkbox id="product-fragile" {...register('fragile')} />
        <label htmlFor="product-fragile" className="text-sm font-medium text-slate-700">
          This product is fragile
        </label>
      </div>

      {isFragile ? (
        <div className="flex flex-col gap-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-2">
            <Checkbox
              id="product-hazardous-disclaimer"
              {...register('hazardousDisclaimer')}
            />
            <div>
              <label
                htmlFor="product-hazardous-disclaimer"
                className="text-sm font-medium text-amber-900"
              >
                I confirm the item is packed to survive transit
              </label>
              {errors.hazardousDisclaimer?.message ? (
                <p role="alert" className="text-xs font-medium text-red-600">
                  {errors.hazardousDisclaimer.message}
                </p>
              ) : null}
            </div>
          </div>

          <Field
            label="Special shipping notes"
            htmlFor="product-shipping-notes"
            hint="Required for fragile items - at least 10 characters."
            error={errors.specialShippingNotes?.message}
          >
            <Textarea
              id="product-shipping-notes"
              rows={3}
              placeholder="Handle with care, do not stack…"
              {...register('specialShippingNotes')}
            />
          </Field>
        </div>
      ) : null}
    </div>
  );
}
