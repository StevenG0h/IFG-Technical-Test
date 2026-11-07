'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { useDeleteProductMutation } from '@/store/api/productsApi';
import type { Product } from '@/types/product';

export interface ProductCardGridProps {
  products: Product[];
  onEdit: (product: Product) => void;
}

export function ProductCardGrid({ products, onEdit }: ProductCardGridProps) {
  const [deleteProduct] = useDeleteProductMutation();

  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <li
          key={product.id}
          data-testid={`product-card-${product.id}`}
          className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <Image
            src={product.thumbnail}
            alt={product.title}
            width={320}
            height={180}
            className="mb-3 h-36 w-full rounded-lg border border-slate-100 object-cover"
          />
          <h3 className="truncate text-sm font-semibold text-slate-900">{product.title}</h3>
          <p className="truncate text-xs capitalize text-slate-500">{product.category}</p>
          <dl className="mt-3 flex items-center justify-between text-xs text-slate-600">
            <div>
              <dt className="sr-only">Price</dt>
              <dd className="text-base font-semibold text-slate-900">
                ${product.price.toFixed(2)}
              </dd>
            </div>
            <div className="text-right">
              <dt className="sr-only">Stock and rating</dt>
              <dd>
                {product.stock} in stock · ★ {product.rating.toFixed(1)}
              </dd>
            </div>
          </dl>
          <div className="mt-4 flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="flex-1"
              aria-label={`Edit ${product.title}`}
              onClick={() => onEdit(product)}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="danger"
              className="flex-1"
              aria-label={`Delete ${product.title}`}
              onClick={() => {
                deleteProduct({ id: product.id });
              }}
            >
              Delete
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
