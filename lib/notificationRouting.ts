import type { NotificationItem, UserRole } from '@/types';

export function notificationHref(
  item: NotificationItem,
  role: UserRole | null,
): string | null {
  const data = item.data;
  if (!data || typeof data !== 'object') return null;
  const row = data as Record<string, unknown>;
  const requirementId =
    typeof row.requirementId === 'string'
      ? row.requirementId
      : typeof row.requirement_id === 'string'
        ? row.requirement_id
        : null;
  if (!requirementId) return null;

  if (role === 'client') {
    if (item.type === 'application' || item.type === 'message' || item.type === 'requirement') {
      return `/client/requirement/${requirementId}`;
    }
    return `/client/requirement/${requirementId}`;
  }

  if (item.type === 'message' || item.type === 'match') {
    return `/chat/${requirementId}`;
  }
  if (item.type === 'application' || item.type === 'task' || item.type === 'payment') {
    return '/my-applications';
  }
  return '/my-applications';
}
