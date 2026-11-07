import type { CreateProductInput, ProductDraft } from '@/types/product';

export const FALLBACK_SKU = 'SKU-GEN-0000';

/**
 * Deep copy for values that leave React Hook Form.
 * RHF hands out its internal value objects, and Immer (Redux Toolkit) deep
 * freezes anything stored in the store - freezing those references would make
 * the next keystroke throw.
 */
export function cloneDraft(draft: ProductDraft): ProductDraft {
  return JSON.parse(JSON.stringify(draft)) as ProductDraft;
}

export function createEmptyDraft(): ProductDraft {
  return {
    title: '',
    description: '',
    category: '',
    brand: '',
    basePrice: 0,
    discountPercentage: 0,
    stock: 0,
    variations: [],
    weight: 0,
    dimensions: { width: 0, height: 0, depth: 0 },
    fragile: false,
    hazardousDisclaimer: false,
    specialShippingNotes: '',
  };
}

/**
 * The wizard collects a UI-friendly draft; the API expects the DummyJSON
 * product shape. The first variation SKU doubles as the parent SKU because
 * DummyJSON has no notion of variants.
 */
export function draftToCreateInput(draft: ProductDraft): CreateProductInput {
  const firstSku = draft.variations.find((variation) => variation.skuCode.trim() !== '')?.skuCode;

  return {
    title: draft.title.trim(),
    description: draft.description.trim(),
    category: draft.category,
    brand: draft.brand?.trim() ? draft.brand.trim() : undefined,
    price: draft.basePrice,
    discountPercentage: draft.discountPercentage,
    stock: draft.stock,
    sku: firstSku ? firstSku.trim() : FALLBACK_SKU,
    weight: draft.weight,
    dimensions: {
      width: draft.dimensions.width,
      height: draft.dimensions.height,
      depth: draft.dimensions.depth,
    },
    variations: draft.variations.map((variation) => ({
      color: variation.color.trim(),
      size: variation.size.trim(),
      skuCode: variation.skuCode.trim(),
      extraPrice: variation.extraPrice,
    })),
    fragile: draft.fragile,
    hazardousDisclaimer: draft.hazardousDisclaimer,
    specialShippingNotes: draft.specialShippingNotes?.trim()
      ? draft.specialShippingNotes.trim()
      : undefined,
  };
}
