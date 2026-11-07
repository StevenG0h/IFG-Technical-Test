'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { useDeleteProductMutation } from '@/store/api/productsApi';
import type { Product } from '@/types/product';

export interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
}

function stockTone(stock: number): string {
  if (stock === 0) return 'text-red-600';
  if (stock < 10) return 'text-amber-600';
  return 'text-slate-700';
}

export function ProductTable({ products, onEdit }: ProductTableProps) {
  const [deleteProduct] = useDeleteProductMutation();

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th scope="col" className="px-3 py-3 sm:px-4">Product</th>
            <th scope="col" className="hidden px-4 py-3 md:table-cell">Category</th>
            <th scope="col" className="px-3 py-3 sm:px-4">Price</th>
            <th scope="col" className="px-3 py-3 sm:px-4">Stock</th>
            <th scope="col" className="hidden px-4 py-3 md:table-cell">Rating</th>
            <th scope="col" className="px-3 py-3 text-right sm:px-4">
              <span className="sr-only sm:hidden">Actions</span>
              <span className="hidden sm:inline">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {products.map((product) => (
            <tr key={product.id} data-testid={`product-row-${product.id}`}>
              <td className="px-3 py-3 sm:px-4">
                <div className="flex items-center gap-3">
                  <Image
                    src={product.thumbnail}
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 shrink-0 rounded-md border border-slate-200 object-cover"
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 sm:truncate">{product.title}</p>
                    <p className="truncate text-xs text-slate-500">
                      {product.brand ?? product.sku}
                    </p>
                  </div>
                </div>
              </td>
              <td className="hidden px-4 py-3 capitalize text-slate-600 md:table-cell">{product.category}</td>
              <td className="whitespace-nowrap px-3 py-3 font-medium text-slate-900 sm:px-4">
                ${product.price.toFixed(2)}
              </td>
              <td className={`whitespace-nowrap px-3 py-3 sm:px-4 ${stockTone(product.stock)}`}>{product.stock}</td>
              <td className="hidden px-4 py-3 text-slate-600 md:table-cell">{product.rating.toFixed(1)}</td>
              <td className="px-3 py-3 sm:px-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button
                    size="sm"
                    variant="secondary"
                    aria-label={`Edit ${product.title}`}
                    onClick={() => onEdit(product)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    aria-label={`Delete ${product.title}`}
                    onClick={() => {
                      deleteProduct({ id: product.id });
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
