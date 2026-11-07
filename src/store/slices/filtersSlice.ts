import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { SortOption } from '@/types/product';

/** The filter values that are mirrored into the URL. */
export interface FilterValues {
  search: string;
  category: string;
  sort: SortOption;
  page: number;
  limit: number;
}

export interface FiltersState extends FilterValues {
  /**
   * Id of the screen instance whose initial filters were applied last. It is
   * not reset when a component unmounts (the store outlives it), so comparing
   * it with the current instance is what stops a remount from rendering — and
   * requesting — the filters left behind by the previous visit.
   */
  hydratedFor: string | null;
}

export const PAGE_SIZE = 12;

export const DEFAULT_FILTERS: FilterValues = {
  search: '',
  category: '',
  sort: 'featured',
  page: 1,
  limit: PAGE_SIZE,
};

const initialState: FiltersState = {
  ...DEFAULT_FILTERS,
  hydratedFor: null,
};

export interface HydrateFiltersPayload extends Partial<FilterValues> {
  /**
   * Set by the screen that owns the mount. Omitted by the URL sync, which must
   * not invalidate the current mount's readiness.
   */
  instanceId?: string;
}

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    hydrateFilters(state, action: PayloadAction<HydrateFiltersPayload>) {
      const { instanceId, ...values } = action.payload;
      const next = { ...DEFAULT_FILTERS, ...values };
      state.search = next.search;
      state.category = next.category;
      state.sort = next.sort;
      state.page = next.page;
      state.limit = next.limit;
      if (instanceId !== undefined) state.hydratedFor = instanceId;
    },
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
      state.page = 1;
    },
    setCategory(state, action: PayloadAction<string>) {
      state.category = action.payload;
      state.page = 1;
    },
    setSort(state, action: PayloadAction<SortOption>) {
      state.sort = action.payload;
      state.page = 1;
    },
    setPage(state, action: PayloadAction<number>) {
      state.page = Math.max(1, Math.trunc(action.payload) || 1);
    },
    setLimit(state, action: PayloadAction<number>) {
      state.limit = Math.max(1, Math.trunc(action.payload) || DEFAULT_FILTERS.limit);
      state.page = 1;
    },
    resetFilters(state) {
      return { ...DEFAULT_FILTERS, hydratedFor: state.hydratedFor };
    },
  },
});

export const {
  hydrateFilters,
  setSearch,
  setCategory,
  setSort,
  setPage,
  setLimit,
  resetFilters,
} = filtersSlice.actions;

export const selectFilters = (state: { filters: FiltersState }): FiltersState => state.filters;

export const selectFiltersHydratedFor = (state: { filters: FiltersState }): string | null =>
  state.filters.hydratedFor;

export default filtersSlice.reducer;
