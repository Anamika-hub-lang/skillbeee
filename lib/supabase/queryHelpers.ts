import type { PostgrestError, PostgrestResponse } from '@supabase/supabase-js';

/**
 * Shared helpers for PostgREST calls via `supabase.from(...)`.
 * Keeps error handling consistent and avoids huge `.in()` URL payloads on mobile.
 */

/** Typical safe chunk size for `.in('id', [...])` filters (PostgREST URL limits). */
export const DEFAULT_IN_CHUNK_SIZE = 100;

export function throwOnPostgrestError(error: PostgrestError | null): asserts error is null {
  if (error) throw new Error(error.message);
}

export function requireNonNull<T>(row: T | null | undefined, message = 'Not found'): T {
  if (row === null || row === undefined) throw new Error(message);
  return row;
}

/** Unwrap `{ data, error }` when `data` may be null but error must be absent. */
export function takeData<T>(res: PostgrestResponse<T>): T[] {
  throwOnPostgrestError(res.error);
  return res.data ?? [];
}

/**
 * Run a select with `.in(idColumn, chunk)` for each chunk of ids, merging rows.
 * Use when the id list can exceed ~100 entries (deep links, power users).
 */
export async function selectWhereInChunks<T>(
  ids: string[],
  chunkSize: number,
  run: (chunk: string[]) => PromiseLike<PostgrestResponse<T>>,
): Promise<T[]> {
  if (ids.length === 0) return [];
  const unique = [...new Set(ids)];
  const out: T[] = [];
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const res = await run(chunk);
    throwOnPostgrestError(res.error);
    out.push(...(res.data ?? []));
  }
  return out;
}
