import type { Gig } from '@/types';

/**
 * When a requirement has no `imageUrl`, use a stable-but-unique image per gig
 * (Picsum `seed` = different photo per card, not one shared stock image).
 */
export function gigCardImageUri(gig: Gig): string {
  if (gig.imageUrl?.trim()) return gig.imageUrl.trim();
  const seed = `${gig.id}-${gig.category}`.replace(/[^a-zA-Z0-9]/g, '').slice(0, 40) || 'skillbee';
  return `https://picsum.photos/seed/${seed}/900/1200`;
}
