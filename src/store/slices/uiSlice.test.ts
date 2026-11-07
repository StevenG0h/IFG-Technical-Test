import { describe, expect, it } from 'vitest';
import uiReducer, {
  clearToast,
  MAX_QUEUED_TOASTS,
  selectQueuedToastCount,
  showToast,
} from '@/store/slices/uiSlice';

describe('uiSlice toast queue', () => {
  it('queues a second notification instead of discarding the first retry payload', () => {
    let state = uiReducer(
      undefined,
      showToast({ type: 'error', message: 'first', retry: { kind: 'delete', id: 1 } }),
    );
    state = uiReducer(
      state,
      showToast({ type: 'error', message: 'second', retry: { kind: 'delete', id: 2 } }),
    );

    expect(state.toast?.message).toBe('first');
    expect(state.toast?.retry).toEqual({ kind: 'delete', id: 1 });
    expect(state.toastQueue.map((toast) => toast.message)).toEqual(['second']);
    expect(selectQueuedToastCount({ ui: state })).toBe(1);

    state = uiReducer(state, clearToast());
    expect(state.toast?.message).toBe('second');
    expect(state.toast?.retry).toEqual({ kind: 'delete', id: 2 });
    expect(state.toastQueue).toEqual([]);
  });

  it('caps the queue so a burst of failures cannot grow without bound', () => {
    let state = uiReducer(undefined, { type: '@@init' });

    for (let index = 0; index < MAX_QUEUED_TOASTS + 4; index += 1) {
      state = uiReducer(state, showToast({ type: 'info', message: `message-${index}` }));
    }

    expect(state.toast?.message).toBe('message-0');
    expect(state.toastQueue).toHaveLength(MAX_QUEUED_TOASTS);
    expect(state.toastQueue.at(-1)?.message).toBe(`message-${MAX_QUEUED_TOASTS + 3}`);
  });

  it('clears back to nothing once the queue is drained', () => {
    const state = uiReducer(
      undefined,
      showToast({ type: 'success', message: 'only one' }),
    );
    expect(uiReducer(state, clearToast()).toast).toBeNull();
  });
});
