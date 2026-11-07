import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { Provider } from 'react-redux';
import { Toast } from '@/components/ui/Toast';
import { makeStore, type AppStore } from '@/store';

export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  store?: AppStore;
}

/** Mirrors the app shell: Redux provider plus the single global toast. */
export function renderWithProviders(
  ui: ReactElement,
  { store = makeStore(), ...options }: RenderWithProvidersOptions = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        {children}
        <Toast />
      </Provider>
    );
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...options }) };
}
