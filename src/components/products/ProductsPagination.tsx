'use client';

import { Button } from '@/components/ui/Button';
import { useAppDispatch } from '@/store/hooks';
import { setPage } from '@/store/slices/filtersSlice';

export interface ProductsPaginationProps {
  total: number;
  limit: number;
  page: number;
}

export function ProductsPagination({ total, limit, page }: ProductsPaginationProps) {
  const dispatch = useAppDispatch();
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3 pt-4"
    >
      <p className="text-xs text-slate-600">
        Page {page} of {totalPages} · {total} products
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={page <= 1}
          onClick={() => dispatch(setPage(page - 1))}
        >
          Previous
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={page >= totalPages}
          onClick={() => dispatch(setPage(page + 1))}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}
