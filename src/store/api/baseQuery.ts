import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';

export const DUMMYJSON_BASE_URL = 'https://dummyjson.com';
export const DEFAULT_FAILURE_RATE = 0.2;

const rawBaseQuery = fetchBaseQuery({ baseUrl: DUMMYJSON_BASE_URL });

/**
 * Read lazily so the value can be overridden in tests (`NEXT_PUBLIC_FAILURE_RATE=0`).
 * Next.js inlines `process.env.NEXT_PUBLIC_*` at build time in the browser bundle.
 */
export function getFailureRate(): number {
  const raw = process.env.NEXT_PUBLIC_FAILURE_RATE;
  if (raw === undefined || raw.trim() === '') return DEFAULT_FAILURE_RATE;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_FAILURE_RATE;
  return Math.min(Math.max(parsed, 0), 1);
}

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Simulates flaky write operations so the optimistic-update rollback and the
 * retry toast can be exercised without touching the network layer.
 */
export const baseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const method = typeof args === 'string' ? 'GET' : (args.method ?? 'GET').toUpperCase();

  if (MUTATING_METHODS.has(method) && Math.random() < getFailureRate()) {
    return {
      error: {
        status: 'CUSTOM_ERROR',
        error: 'Simulated network failure. Please retry.',
      },
    };
  }

  return rawBaseQuery(args, api, extraOptions);
};
