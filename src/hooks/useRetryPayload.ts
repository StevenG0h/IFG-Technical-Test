'use client';

import { useCallback, useRef } from 'react';
import { productsApi } from '@/store/api/productsApi';
import { useAppDispatch } from '@/store/hooks';
import type { RetryPayload } from '@/types/ui';

/**
 * Re-dispatches the failed mutation described by a serializable retry payload.
 * The toast never stores the callback itself.
 *
 * Repeats of the same payload are ignored while a retry is still in flight, so
 * a double click cannot apply the same write (and its optimistic patch) twice.
 */
export function useRetryPayload(): (payload: RetryPayload) => void {
  const dispatch = useAppDispatch();
  const inFlight = useRef(new Set<string>());

  return useCallback(
    (payload: RetryPayload) => {
      const key = JSON.stringify(payload);
      if (inFlight.current.has(key)) return;
      inFlight.current.add(key);

      const request =
        payload.kind === 'delete'
          ? dispatch(productsApi.endpoints.deleteProduct.initiate({ id: payload.id }))
          : payload.kind === 'update'
            ? dispatch(
                productsApi.endpoints.updateProduct.initiate({
                  id: payload.id,
                  data: payload.data,
                }),
              )
            : dispatch(productsApi.endpoints.addProduct.initiate(payload.data));

      void request
        .unwrap()
        .catch(() => undefined)
        .finally(() => inFlight.current.delete(key));
    },
    [dispatch],
  );
}
