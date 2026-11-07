'use client';

import { useEffect, useId, useRef } from 'react';
import { ProductsDirectory } from '@/components/products/ProductsDirectory';
import { ProductsPageSkeleton } from '@/components/ui/Skeleton';
import { useProductUrlSync } from '@/hooks/useProductUrlSync';
import {
  readProductWriteOverlay,
  saveProductWriteOverlay,
  type ProductWriteOverlay,
} from '@/store/api/productWriteOverlay';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  hydrateFilters,
  selectFiltersHydratedFor,
  type FilterValues,
} from '@/store/slices/filtersSlice';
import { setWriteOverlay } from '@/store/slices/writesSlice';

export interface ProductsClientProps {
  initialFilters: FilterValues;
  /**
   * Writes carried by a shared link. When present it replaces the local copy so
   * the link reproduces exactly the sender's screen.
   */
  initialWrites?: ProductWriteOverlay;
}

/**
 * The server wrapper resolves `searchParams` and hands the parsed filters and
 * writes over, so the first render already shows the shared view. Only after
 * that does the URL <-> Redux sync take over.
 *
 * Readiness is tied to this mount's `useId` rather than the slice's boolean
 * flag: the store outlives the component, so a flag left over from a previous
 * visit would let a remount render — and request — the old filters before the
 * new ones are hydrated.
 */
export function ProductsClient({ initialFilters, initialWrites }: ProductsClientProps) {
  const dispatch = useAppDispatch();
  const initialFiltersRef = useRef(initialFilters);
  const initialWritesRef = useRef(initialWrites);
  const instanceId = useId();
  const hydratedFor = useAppSelector(selectFiltersHydratedFor);

  useEffect(() => {
    // The writes must be in place before the directory mounts, because the
    // fetch applies the persisted overlay.
    const sharedWrites = initialWritesRef.current;
    if (sharedWrites) {
      saveProductWriteOverlay(sharedWrites);
      dispatch(setWriteOverlay(sharedWrites));
    } else {
      dispatch(setWriteOverlay(readProductWriteOverlay()));
    }

    dispatch(hydrateFilters({ ...initialFiltersRef.current, instanceId }));
  }, [dispatch, instanceId]);

  const isReady = hydratedFor === instanceId;

  useProductUrlSync(isReady);

  if (!isReady) return <ProductsPageSkeleton />;

  return <ProductsDirectory />;
}
