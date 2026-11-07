'use client';

import { Button } from '@/components/ui/Button';
import type { ProductFormValues } from '@/schemas/productSchemas';
import { useFormContext } from 'react-hook-form';

export interface Step4ReviewProps {
  onEditStep: (step: number) => void;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-1.5 text-sm last:border-b-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{value}</dd>
    </div>
  );
}

export function Step4Review({ onEditStep }: Step4ReviewProps) {
  const form = useFormContext<ProductFormValues>();
  const values = form.getValues();
  const dimensions = values.dimensions;

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl border border-slate-200 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Basic info</h3>
          <Button size="sm" variant="ghost" onClick={() => onEditStep(0)}>
            Edit basic info
          </Button>
        </div>
        <dl>
          <Row label="Title" value={values.title} />
          <Row label="Description" value={values.description} />
          <Row label="Category" value={values.category} />
          <Row label="Brand" value={values.brand || '—'} />
        </dl>
      </section>

      <section className="rounded-xl border border-slate-200 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Pricing & variations</h3>
          <Button size="sm" variant="ghost" onClick={() => onEditStep(1)}>
            Edit pricing
          </Button>
        </div>
        <dl>
          <Row label="Base price" value={`$${values.basePrice.toFixed(2)}`} />
          <Row label="Discount" value={`${values.discountPercentage}%`} />
          <Row label="Stock" value={String(values.stock)} />
          <Row
            label="Variations"
            value={
              values.variations.length === 0
                ? 'None'
                : values.variations
                    .map((variation) => `${variation.color}/${variation.size} (${variation.skuCode})`)
                    .join(', ')
            }
          />
        </dl>
      </section>

      <section className="rounded-xl border border-slate-200 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Shipping</h3>
          <Button size="sm" variant="ghost" onClick={() => onEditStep(2)}>
            Edit shipping
          </Button>
        </div>
        <dl>
          <Row label="Weight" value={`${values.weight} kg`} />
          <Row
            label="Dimensions"
            value={`${dimensions.width} × ${dimensions.height} × ${dimensions.depth} cm`}
          />
          <Row label="Fragile" value={values.fragile ? 'Yes' : 'No'} />
          {values.fragile ? (
            <>
              <Row label="Disclaimer accepted" value={values.hazardousDisclaimer ? 'Yes' : 'No'} />
              <Row label="Shipping notes" value={values.specialShippingNotes || '—'} />
            </>
          ) : null}
        </dl>
      </section>
    </div>
  );
}
