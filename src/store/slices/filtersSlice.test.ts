import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FILTERS,
  hydrateFilters,
  resetFilters,
  setCategory,
  setLimit,
  setPage,
  setSearch,
  setSort,
} from '@/store/slices/filtersSlice';
import filtersReducer from '@/store/slices/filtersSlice';
import type { FiltersState } from '@/store/slices/filtersSlice';

/** Hydrated slice state with the defaults, overridable per test. */
function hydrated(overrides: Partial<FiltersState> = {}): FiltersState {
  return { ...DEFAULT_FILTERS, hydratedFor: 'screen-1', ...overrides };
}

describe('filtersSlice', () => {
  it('starts from the defaults', () => {
    expect(filtersReducer(undefined, { type: '@@init' })).toEqual({
      ...DEFAULT_FILTERS,
      hydratedFor: null,
    });
  });

  it('updates the search term and resets the page', () => {
    const state = filtersReducer(hydrated({ page: 4 }), setSearch('phone'));
    expect(state.search).toBe('phone');
    expect(state.page).toBe(1);
  });

  it('updates category and sort, resetting the page', () => {
    let state = filtersReducer(hydrated({ page: 3 }), setCategory('beauty'));
    expect(state.category).toBe('beauty');
    expect(state.page).toBe(1);

    state = filtersReducer({ ...state, page: 3 }, setSort('price_desc'));
    expect(state.sort).toBe('price_desc');
    expect(state.page).toBe(1);
  });

  it('never goes below page 1', () => {
    expect(filtersReducer(hydrated(), setPage(0)).page).toBe(1);
    expect(filtersReducer(hydrated(), setPage(-7)).page).toBe(1);
    expect(filtersReducer(hydrated(), setPage(6)).page).toBe(6);
  });

  it('resets the page when the page size changes', () => {
    const state = filtersReducer(hydrated({ page: 5 }), setLimit(24));
    expect(state.limit).toBe(24);
    expect(state.page).toBe(1);
  });

  it('hydrates partial state and falls back to defaults', () => {
    const state = filtersReducer(
      hydrated({ limit: 50 }),
      hydrateFilters({ search: 'shoes', page: 3 }),
    );
    expect(state).toMatchObject({
      search: 'shoes',
      category: '',
      sort: 'featured',
      page: 3,
      limit: DEFAULT_FILTERS.limit,
      hydratedFor: 'screen-1',
    });
  });

  it('resets every filter but keeps the hydrated instance', () => {
    const state = filtersReducer(
      {
        search: 'a',
        category: 'b',
        sort: 'title_asc',
        page: 9,
        limit: 40,
        hydratedFor: 'screen-1',
      },
      resetFilters(),
    );
    expect(state).toEqual({ ...DEFAULT_FILTERS, hydratedFor: 'screen-1' });
  });

  it('records which screen instance hydrated the filters', () => {
    const first = filtersReducer(
      undefined,
      hydrateFilters({ search: 'phone', instanceId: 'screen-1' }),
    );
    expect(first.hydratedFor).toBe('screen-1');

    // Back/forward navigation rehydrates through the URL sync, which must not
    // make the current screen look un-hydrated.
    const backNavigation = filtersReducer(first, hydrateFilters({ search: 'lamp' }));
    expect(backNavigation.search).toBe('lamp');
    expect(backNavigation.hydratedFor).toBe('screen-1');
  });
});

