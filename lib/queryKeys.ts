/** Central TanStack Query keys for consistent invalidation + caching. */
export const queryKeys = {
  gigs: ['gigs'] as const,
  clientRequirements: ['requirements', 'mine'] as const,
  gig: (id: string) => ['gig', id] as const,
  requirementApplications: (id: string) => ['applications', 'requirement', id] as const,
  studentApplications: ['applications', 'student'] as const,
  clientApplicationCounts: ['applications', 'client-counts'] as const,
  dashboard: ['dashboard'] as const,
  notifications: ['notifications'] as const,
  inbox: ['inbox'] as const,
  messages: (requirementId: string) => ['messages', requirementId] as const,
  authMe: ['auth', 'me'] as const,
};
