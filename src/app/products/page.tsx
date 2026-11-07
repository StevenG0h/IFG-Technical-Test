import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ProductsPageSkeleton } from '@/components/ui/Skeleton';
import { parseViewParams } from '@/utils/viewState';
import { ProductsClient } from './ProductsClient';

export const metadata: Metadata = {
  title: 'Products · Inventory Portal',
  description: 'Search, filter, sort and manage inventory products.',
};

type ProductsSearchParams = Promise<Record<string, string | string[] | undefined>>;

async function ProductsRoute({ searchParams }: { searchParams: ProductsSearchParams }) {
  const resolved = await searchParams;
  const view = parseViewParams(resolved);
  return <ProductsClient initialFilters={view.filters} initialWrites={view.writes} />;
}

export default function ProductsPage({ searchParams }: { searchParams: ProductsSearchParams }) {
  return (
    <Suspense fallback={<ProductsPageSkeleton />}>
      <ProductsRoute searchParams={searchParams} />
    </Suspense>
  );
}
