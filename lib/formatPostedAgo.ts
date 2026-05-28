/** Same semantics as server `formatPostedAgo` for gig cards. */
export function formatPostedAgo(isoOrDate: string | Date): string {
  const createdAt = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  const ms = Date.now() - createdAt.getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}
