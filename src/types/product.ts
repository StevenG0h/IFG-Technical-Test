/**
 * Domain types aligned with the DummyJSON product shape.
 * https://dummyjson.com/docs/products
 */

export interface ProductDimensions {
  width: number;
  height: number;
  depth: number;
}

export interface ProductReview {
  rating: number;
  comment: string;
  date: string;
  reviewerName: string;
  reviewerEmail: string;
}

export interface ProductMeta {
  createdAt: string;
  updatedAt: string;
  barcode: string;
  qrCode: string;
}

export interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  tags: string[];
  brand?: string;
  sku: string;
  weight: number;
  dimensions: ProductDimensions;
  warrantyInformation: string;
  shippingInformation: string;
  availabilityStatus: string;
  reviews: ProductReview[];
  returnPolicy: string;
  minimumOrderQuantity: number;
  meta: ProductMeta;
  images: string[];
  thumbnail: string;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

export interface Category {
  slug: string;
  name: string;
  url: string;
}

export type SortOption =
  | 'featured'
  | 'price_asc'
  | 'price_desc'
  | 'title_asc'
  | 'title_desc'
  | 'rating_desc';

/**
 * A single RTK Query cache key. Every distinct combination of these values
 * produces an independent cache entry, which is what keeps stale in-flight
 * responses from overwriting the currently requested view.
 */
export interface ProductQueryArgs {
  search?: string;
  category?: string;
  sort?: SortOption;
  page: number;
  limit: number;
}

export interface ProductVariation {
  color: string;
  size: string;
  skuCode: string;
  extraPrice: number;
}

export interface ProductDraft {
  title: string;
  description: string;
  category: string;
  brand?: string;
  basePrice: number;
  discountPercentage: number;
  stock: number;
  variations: ProductVariation[];
  weight: number;
  dimensions: ProductDimensions;
  fragile: boolean;
  hazardousDisclaimer: boolean;
  specialShippingNotes?: string;
}

export interface CreateProductInput {
  title: string;
  description: string;
  category: string;
  brand?: string;
  price: number;
  discountPercentage: number;
  stock: number;
  sku: string;
  weight: number;
  dimensions: ProductDimensions;
  variations: ProductVariation[];
  fragile: boolean;
  hazardousDisclaimer: boolean;
  specialShippingNotes?: string;
}

export type UpdateProductInput = Partial<
  Pick<Product, 'title' | 'description' | 'category' | 'brand' | 'price' | 'stock'>
>;
