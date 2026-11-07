'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Field';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  resetFilters,
  selectFilters,
  setCategory,
  setSearch,
  setSort,
} from '@/store/slices/filtersSlice';
import type { Category, SortOption } from '@/types/product';
import { SORT_OPTIONS } from '@/utils/sortProducts';

const SEARCH_DEBOUNCE_MS = 300;

export interface ProductFiltersProps {
  categories: Category[];
  categoriesLoading?: boolean;
}

export function ProductFilters({ categories, categoriesLoading = false }: ProductFiltersProps) {
  const filters = useAppSelector(selectFilters);
  const dispatch = useAppDispatch();
  // The panel is rendered twice on small screens (hidden desktop aside + open
  // drawer), so the control ids must be unique per instance or the drawer's
  // labels would resolve to the hidden copy.
  const fieldId = useId();
  const searchId = `${fieldId}-search`;
  const categoryId = `${fieldId}-category`;
  const sortId = `${fieldId}-sort`;
  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);
  /** Canonical (trimmed) value both sides agree on, so they never ping-pong. */
  const lastSyncedSearch = useRef(filters.search);
  const pendingSearch = useRef(searchInput);

  useEffect(() => {
    pendingSearch.current = searchInput;
  }, [searchInput]);

  // Local input -> Redux (debounced). Whitespace is a typing artefact, so the
  // committed term is trimmed: Redux and the URL stay canonical, and
  // "iphone " cannot create a second cache key / request for "iphone".
  useEffect(() => {
    const term = debouncedSearch.trim();
    if (term === lastSyncedSearch.current) return;
    lastSyncedSearch.current = term;
    dispatch(setSearch(term));
  }, [debouncedSearch, dispatch]);

  // Closing the drawer unmounts this instance, which would drop a keystroke
  // that is still inside the debounce window. Flush it instead of losing it.
  useEffect(
    () => () => {
      const term = pendingSearch.current.trim();
      if (term === lastSyncedSearch.current) return;
      lastSyncedSearch.current = term;
      dispatch(setSearch(term));
    },
    [dispatch],
  );

  // Redux/URL -> local input (e.g. reset button, browser back).
  useEffect(() => {
    if (filters.search === lastSyncedSearch.current) return;
    lastSyncedSearch.current = filters.search;
    setSearchInput(filters.search);
  }, [filters.search]);

  const hasActiveFilters =
    filters.search !== '' || filters.category !== '' || filters.sort !== 'featured';

  return (
    <div className="flex flex-col gap-4">
      <Field label="Search products" htmlFor={searchId}>
        <Input
          id={searchId}
          type="search"
          placeholder="Search by name…"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />
      </Field>

      <Field label="Category" htmlFor={categoryId}>
        <Select
          id={categoryId}
          value={filters.category}
          disabled={categoriesLoading}
          onChange={(event) => dispatch(setCategory(event.target.value))}
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Sort by" htmlFor={sortId}>
        <Select
          id={sortId}
          value={filters.sort}
          onChange={(event) => dispatch(setSort(event.target.value as SortOption))}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Field>

      <Button
        variant="secondary"
        onClick={() => {
          setSearchInput('');
          lastSyncedSearch.current = '';
          dispatch(resetFilters());
        }}
        disabled={!hasActiveFilters}
      >
        Reset filters
      </Button>
    </div>
  );
}
