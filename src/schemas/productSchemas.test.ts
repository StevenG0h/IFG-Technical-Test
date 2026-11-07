import { describe, expect, it } from 'vitest';
import { productDraftSchema, step3Schema } from '@/schemas/productSchemas';
import type { ProductDraft } from '@/types/product';
import { createEmptyDraft } from '@/utils/productDraft';

function validDraft(overrides: Partial<ProductDraft> = {}): ProductDraft {
  return {
    ...createEmptyDraft(),
    title: 'Noise cancelling headphones',
    description: 'Comfortable over-ear headphones with 30h battery.',
    category: 'audio',
    basePrice: 199.99,
    discountPercentage: 10,
    stock: 25,
    weight: 0.4,
    dimensions: { width: 20, height: 18, depth: 8 },
    ...overrides,
  };
}

describe('productDraftSchema', () => {
  it('accepts a complete draft', () => {
    expect(() => productDraftSchema.validateSync(validDraft())).not.toThrow();
  });

  it('requires a positive base price', () => {
    expect(() => productDraftSchema.validateSync(validDraft({ basePrice: 0 }))).toThrow(
      /greater than 0/,
    );
    expect(() => productDraftSchema.validateSync(validDraft({ basePrice: -5 }))).toThrow(
      /greater than 0/,
    );
  });

  it('requires stock to be a whole number of zero or more', () => {
    expect(() => productDraftSchema.validateSync(validDraft({ stock: 2.5 }))).toThrow(
      /whole number/,
    );
    expect(() => productDraftSchema.validateSync(validDraft({ stock: -1 }))).toThrow(
      /cannot be negative/,
    );
  });

  it('rejects a SKU that does not match SKU-ABC-1234', () => {
    expect(() =>
      productDraftSchema.validateSync(
        validDraft({
          variations: [{ color: 'Red', size: 'M', skuCode: 'RED-1', extraPrice: 0 }],
        }),
      ),
    ).toThrow(/SKU-ABC-1234/);
  });

  it('accepts a well formed SKU', () => {
    expect(() =>
      productDraftSchema.validateSync(
        validDraft({
          variations: [{ color: 'Red', size: 'M', skuCode: 'SKU-RED-0001', extraPrice: 0 }],
        }),
      ),
    ).not.toThrow();
  });

  it('rejects duplicate SKU codes across variations', () => {
    expect(() =>
      productDraftSchema.validateSync(
        validDraft({
          variations: [
            { color: 'Red', size: 'M', skuCode: 'SKU-RED-0001', extraPrice: 0 },
            { color: 'Blue', size: 'L', skuCode: 'SKU-RED-0001', extraPrice: 5 },
          ],
        }),
      ),
    ).toThrow(/Duplicate SKU codes/);
  });

  it('requires the disclaimer and notes only when the item is fragile', () => {
    const notFragile = validDraft({ fragile: false });
    expect(() => step3Schema.validateSync(notFragile)).not.toThrow();

    expect(() =>
      step3Schema.validateSync({
        weight: 1,
        dimensions: { width: 1, height: 1, depth: 1 },
        fragile: true,
        hazardousDisclaimer: false,
        specialShippingNotes: 'Handle with care, do not stack.',
      }),
    ).toThrow(/accept the disclaimer/);

    expect(() =>
      step3Schema.validateSync({
        weight: 1,
        dimensions: { width: 1, height: 1, depth: 1 },
        fragile: true,
        hazardousDisclaimer: true,
        specialShippingNotes: 'short',
      }),
    ).toThrow(/at least 10 characters/);

    expect(() =>
      step3Schema.validateSync({
        weight: 1,
        dimensions: { width: 1, height: 1, depth: 1 },
        fragile: true,
        hazardousDisclaimer: true,
        specialShippingNotes: 'Handle with care, do not stack.',
      }),
    ).not.toThrow();
  });

  it('requires a title, description and category', () => {
    expect(() => productDraftSchema.validateSync(validDraft({ title: '' }))).toThrow(
      /Title is required/,
    );
    expect(() => productDraftSchema.validateSync(validDraft({ description: 'too short' }))).toThrow(
      /at least 10 characters/,
    );
    expect(() => productDraftSchema.validateSync(validDraft({ category: '' }))).toThrow(
      /Category is required/,
    );
  });
});
