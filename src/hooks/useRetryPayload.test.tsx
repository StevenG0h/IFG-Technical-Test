import { act, renderHook } from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';
import { makeStore, type AppStore } from '@/store';
import { API } from '@/test/handlers';
import { server } from '@/test/server';
import type { RetryPayload } from '@/types/ui';
import { useRetryPayload } from './useRetryPayload';

function setup(store: AppStore = makeStore()) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  }

  return { store, ...renderHook(() => useRetryPayload(), { wrapper: Wrapper }) };
}

describe('useRetryPayload', () => {
  it('sends one request when the same payload is retried twice in a row', async () => {
    let deleteCalls = 0;
    server.use(
      http.delete(`${API}/products/:id`, async ({ params }) => {
        deleteCalls += 1;
        await delay(80);
        return HttpResponse.json({ id: Number(params.id), isDeleted: true });
      }),
    );

    const { result } = setup();
    const payload: RetryPayload = { kind: 'delete', id: 1 };

    await act(async () => {
      result.current(payload);
      result.current(payload);
      await delay(200);
    });

    expect(deleteCalls).toBe(1);
  });

  it('allows the same payload again once the first attempt settled', async () => {
    let deleteCalls = 0;
    server.use(
      http.delete(`${API}/products/:id`, ({ params }) => {
        deleteCalls += 1;
        return HttpResponse.json({ id: Number(params.id), isDeleted: true });
      }),
    );

    const { result } = setup();
    const payload: RetryPayload = { kind: 'delete', id: 1 };

    await act(async () => {
      result.current(payload);
      await delay(100);
    });
    await act(async () => {
      result.current(payload);
      await delay(100);
    });

    expect(deleteCalls).toBe(2);
  });
});
