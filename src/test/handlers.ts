import { http, HttpResponse } from 'msw';
import type { Product } from '@/types/product';

export const API = 'https://dummyjson.com';

export function makeProduct(overrides: Partial<Product> = {}): Product {
  const id = overrides.id ?? 1;

  return {
    id,
    title: `Product ${id}`,
    description: 'A product used in tests.',
    category: 'smartphones',
    price: 100 + id,
    discountPercentage: 0,
    rating: 4,
    stock: 12,
    tags: [],
    brand: 'Acme',
    sku: `SKU-ACR-00${id}`,
    weight: 1,
    dimensions: { width: 10, height: 10, depth: 10 },
    warrantyInformation: '1 year',
    shippingInformation: 'Ships in 24 hours',
    availabilityStatus: 'In Stock',
    reviews: [],
    returnPolicy: '30 days',
    minimumOrderQuantity: 1,
    meta: { createdAt: '', updatedAt: '', barcode: '', qrCode: '' },
    images: [`${API}/images/${id}.png`],
    thumbnail: `${API}/images/${id}.png`,
    ...overrides,
  };
}

export const sampleProducts: Product[] = [
  makeProduct({ id: 1, title: 'iPhone 15', category: 'smartphones', price: 999, rating: 4.8 }),
  makeProduct({ id: 2, title: 'Galaxy S24', category: 'smartphones', price: 799, rating: 4.5 }),
  makeProduct({ id: 3, title: 'Matte Lipstick', category: 'beauty', price: 19.99, rating: 4.1 }),
];

export const sampleCategories = [
  { slug: 'beauty', name: 'Beauty', url: `${API}/products/category/beauty` },
  { slug: 'smartphones', name: 'Smartphones', url: `${API}/products/category/smartphones` },
];

function paginate(products: Product[], url: URL) {
  const limit = Number(url.searchParams.get('limit') ?? products.length);
  const skip = Number(url.searchParams.get('skip') ?? '0');

  return {
    products: products.slice(skip, skip + limit),
    total: products.length,
    skip,
    limit,
  };
}

export const handlers = [
  http.get(`${API}/products/categories`, () => HttpResponse.json(sampleCategories)),

  http.get(`${API}/products/search`, ({ request }) => {
    const url = new URL(request.url);
    const term = (url.searchParams.get('q') ?? '').toLowerCase();
    const matches = sampleProducts.filter((product) =>
      product.title.toLowerCase().includes(term),
    );

    return HttpResponse.json(paginate(matches, url));
  }),

  http.get(`${API}/products/category/:slug`, ({ request, params }) => {
    const url = new URL(request.url);
    const matches = sampleProducts.filter((product) => product.category === params.slug);

    return HttpResponse.json(paginate(matches, url));
  }),

  http.get(`${API}/products/:id`, ({ params }) => {
    const product = sampleProducts.find((entry) => entry.id === Number(params.id));
    return product
      ? HttpResponse.json(product)
      : HttpResponse.json({ message: 'Not found' }, { status: 404 });
  }),

  http.get(`${API}/products`, ({ request }) => {
    const url = new URL(request.url);
    return HttpResponse.json(paginate(sampleProducts, url));
  }),

  http.post(`${API}/products/add`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ ...body, id: 195 }, { status: 201 });
  }),

  http.put(`${API}/products/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ ...body, id: Number(params.id) });
  }),

  http.delete(`${API}/products/:id`, ({ params }) =>
    HttpResponse.json({ id: Number(params.id), isDeleted: true }),
  ),
];
