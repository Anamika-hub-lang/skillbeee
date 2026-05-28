/** User-facing message from thrown errors (PostgREST, RPC, generic). */
export function getDataErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object' && 'message' in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === 'string' && m.length) return m;
  }
  return 'Something went wrong.';
}
