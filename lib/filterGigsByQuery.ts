import type { Gig } from '@/types';

function gigSearchBlob(gig: Gig): string {
  return [
    gig.title,
    gig.description,
    gig.clientName,
    gig.category,
    gig.currency,
    String(gig.budget),
    ...(gig.skills ?? []),
  ]
    .join(' ')
    .toLowerCase();
}

function parseKeywords(raw: string): string[] {
  return raw
    .toLowerCase()
    .split(/[\s,]+/)
    .map((w) => w.trim())
    .filter(Boolean);
}

/** Each keyword must match somewhere on the gig (title, skills, description, etc.). */
export function filterGigsByQuery(gigs: Gig[], query: string): Gig[] {
  const trimmed = query.trim();
  if (!trimmed) return gigs;

  const keywords = parseKeywords(trimmed);
  if (keywords.length === 0) return gigs;

  return gigs.filter((gig) => {
    const blob = gigSearchBlob(gig);
    return keywords.every((word) => blob.includes(word));
  });
}

export function gigSearchResultLabel(count: number, query: string): string | null {
  const trimmed = query.trim();
  if (!trimmed) return null;
  if (count === 0) return `No gigs for “${trimmed}”`;
  if (count === 1) return `1 gig matches “${trimmed}”`;
  return `${count} gigs match “${trimmed}”`;
}
