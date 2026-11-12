const LOCAL_HOST = /^(?:127\.0\.0\.1|localhost|\[::1\])(?::[1-9]\d{0,4})?$/i;

export function isLocalHost(host: string | null): boolean {
  return !!host && LOCAL_HOST.test(host);
}

export function isAllowedMutationOrigin(
  origin: string | null,
  host: string | null,
  fetchSite: string | null,
): boolean {
  if (!isLocalHost(host) || fetchSite === 'cross-site') return false;
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    return parsed.protocol === 'http:' && parsed.host.toLowerCase() === host!.toLowerCase();
  } catch {
    return false;
  }
}
