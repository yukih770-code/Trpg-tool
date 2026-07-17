export type LanRuntimeLocation = {
  hostname: string;
  search: string;
};

export type LanRuntimeEndpointOverride = {
  apiBaseUrl?: string;
};

function currentLocation(): LanRuntimeLocation | undefined {
  if (typeof window === 'undefined') return undefined;
  return { hostname: window.location.hostname, search: window.location.search };
}

export function isPrivateIpv4Hostname(hostname: string): boolean {
  const parts = hostname.split('.').map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  return parts[0] === 10
    || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
    || (parts[0] === 192 && parts[1] === 168);
}

export function isLanOrLocalHostname(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase();
  return normalized === 'localhost'
    || normalized === '127.0.0.1'
    || isPrivateIpv4Hostname(normalized)
    || normalized.endsWith('.local');
}

function readSafeUrl(value: string | null, protocols: string[]): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (!protocols.includes(url.protocol) || !isLanOrLocalHostname(url.hostname)) return undefined;
    return url.toString().replace(/\/$/, '');
  } catch {
    return undefined;
  }
}

/**
 * LAN-only runtime URL override. It is accepted only when the current page is
 * itself local/LAN and only for local/private hosts, so a query string cannot
 * silently redirect a cloud page to an arbitrary public API.
 */
export function resolveLanRuntimeEndpointOverride(location: LanRuntimeLocation | undefined = currentLocation()): LanRuntimeEndpointOverride {
  if (!location || !isLanOrLocalHostname(location.hostname)) return {};
  const query = new URLSearchParams(location.search);
  const apiBaseUrl = readSafeUrl(query.get('apiBase'), ['http:', 'https:']);
  return {
    ...(apiBaseUrl ? { apiBaseUrl } : {}),
  };
}

export function createLanJoinUrl(frontendUrl: string, backendUrl: string): string {
  const url = new URL(frontendUrl);
  url.searchParams.set('apiBase', backendUrl.replace(/\/+$/, ''));
  return url.toString();
}
