import { configureStore } from '@reduxjs/toolkit';
import { productsApi } from './api/productsApi';
import filtersReducer from './slices/filtersSlice';
import uiReducer from './slices/uiSlice';
import wizardReducer from './slices/wizardSlice';
import writesReducer from './slices/writesSlice';

export const makeStore = () =>
  configureStore({
    reducer: {
      filters: filtersReducer,
      ui: uiReducer,
      wizard: wizardReducer,
      writes: writesReducer,
      [productsApi.reducerPath]: productsApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(productsApi.middleware),
    devTools: process.env.NODE_ENV !== 'production',
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
