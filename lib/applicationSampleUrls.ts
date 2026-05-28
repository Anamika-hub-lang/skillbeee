/** Normalize sample URL arrays from PostgREST (camelCase, snake_case, or legacy empty). */
export function normalizeSampleUrls(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((u): u is string => typeof u === 'string' && u.trim().length > 0);
  }
  if (typeof value === 'string' && value.trim()) {
    const trimmed = value.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      return trimmed
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^"|"$/g, ''))
        .filter(Boolean);
    }
    return [trimmed];
  }
  return [];
}

export function isImageSampleUrl(url: string): boolean {
  const path = url.split('?')[0]?.toLowerCase() ?? '';
  return /\.(jpe?g|png|gif|webp|heic|heif|bmp|svg)$/.test(path);
}

export function sampleDisplayLabel(url: string): string {
  try {
    const segment = url.split('?')[0]?.split('/').pop() ?? 'file';
    const name = decodeURIComponent(segment);
    return name.length > 22 ? `${name.slice(0, 19)}…` : name;
  } catch {
    return 'File';
  }
}
