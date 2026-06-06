export function safeNext(raw: string | null | undefined): string {
  if (!raw) return '/';
  if (!raw?.startsWith('/')) return '/';
  if (raw.startsWith('//') || raw.startsWith('/\\')) return '/';
  return raw;
}
