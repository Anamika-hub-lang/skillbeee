import type { Gig, GigCategory } from '@/types';

const CATEGORIES: GigCategory[] = [
  'shopify',
  'canva',
  'video',
  'framer',
  'ai',
  'resume',
  'ppt',
  'code',
];

function normCategory(c: unknown): GigCategory {
  return typeof c === 'string' && CATEGORIES.includes(c as GigCategory) ? (c as GigCategory) : 'code';
}

/** Coerce API / cache payloads so UI never crashes on partial rows. */
export function normalizeGig(raw: unknown): Gig {
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    title: String(r.title ?? 'Untitled'),
    description: String(r.description ?? ''),
    budget: typeof r.budget === 'number' && Number.isFinite(r.budget) ? r.budget : 0,
    currency: typeof r.currency === 'string' && r.currency.length >= 2 ? r.currency : 'INR',
    deadlineHours:
      typeof r.deadlineHours === 'number' && Number.isFinite(r.deadlineHours) && r.deadlineHours > 0
        ? r.deadlineHours
        : 24,
    urgent: Boolean(r.urgent),
    skills: Array.isArray(r.skills) ? r.skills.map((x) => String(x)) : [],
    clientName: String(r.clientName ?? 'Client'),
    clientAvatar: typeof r.clientAvatar === 'string' && r.clientAvatar.length ? r.clientAvatar : undefined,
    category: normCategory(r.category),
    postedAgo: String(r.postedAgo ?? ''),
    imageUrl: typeof r.imageUrl === 'string' && r.imageUrl.length ? r.imageUrl : undefined,
  };
}

export function normalizeGigList(raw: unknown): Gig[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeGig);
}
