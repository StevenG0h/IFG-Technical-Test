'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { saveProductWriteOverlay } from '@/store/api/productWriteOverlay';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { hydrateFilters, selectFilters } from '@/store/slices/filtersSlice';
import { selectWriteOverlay, setWriteOverlay } from '@/store/slices/writesSlice';
import { parseViewParams, viewSignature, viewToSearchParams } from '@/utils/viewState';

/**
 * Two-way sync between the URL and the shareable view state: the filters plus
 * the successful writes, so a shared link reproduces the same screen even
 * though the API does not persist writes.
 *
 * - URL -> Redux runs for back/forward navigation and shared links bootstrapped
 *   from a client-side transition.
 * - Redux -> URL runs with a canonical signature comparison so the two
 *   directions never ping-pong.
 * - `active` stays false until the server-provided searchParams have been
 *   hydrated, which prevents the defaults from overwriting a deep link.
 */
export function useProductUrlSync(active: boolean): void {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = useAppSelector(selectFilters);
  const writes = useAppSelector(selectWriteOverlay);

  const signature = searchParams.toString();
  const lastKnownSignature = useRef<string | null>(null);

  useEffect(() => {
    if (!active) return;

    if (lastKnownSignature.current === null) {
      // First render already used the server-parsed filters.
      lastKnownSignature.current = viewSignature(new URLSearchParams(signature));
      return;
    }

    if (lastKnownSignature.current === signature) return;

    const next = parseViewParams(new URLSearchParams(signature));
    // The following fetch must see the writes the URL describes.
    saveProductWriteOverlay(next.writes);
    dispatch(setWriteOverlay(next.writes));
    dispatch(hydrateFilters(next.filters));
    lastKnownSignature.current = signature;
  }, [active, dispatch, signature]);

  useEffect(() => {
    if (!active) return;

    const nextParams = viewToSearchParams(filters, writes);
    const nextSignature = nextParams.toString();
    const currentSignature = viewSignature(new URLSearchParams(signature));

    if (nextSignature === currentSignature) return;

    lastKnownSignature.current = nextSignature;
    router.replace(nextSignature ? `${pathname}?${nextSignature}` : pathname, {
      scroll: false,
    });
  }, [active, filters, pathname, router, signature, writes]);
}
