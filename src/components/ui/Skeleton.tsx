import { cn } from '@/utils/cn';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-slate-200', className)}
    />
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div data-testid="products-skeleton" className="overflow-hidden rounded-xl border border-slate-200">
      <div className="border-b border-slate-200 bg-slate-50 p-4">
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 p-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardGridSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div data-testid="products-skeleton" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: cards }).map((_, index) => (
        <div key={index} className="rounded-xl border border-slate-200 p-4">
          <Skeleton className="mb-3 h-32 w-full" />
          <Skeleton className="mb-2 h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function ProductsPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <Skeleton className="mb-6 h-8 w-56" />
      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <div className="hidden flex-col gap-3 lg:flex">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <TableSkeleton />
      </div>
    </div>
  );
}
