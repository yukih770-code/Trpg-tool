import { networkInterfaces } from 'node:os';

export type LanRuntimeEnv = Record<string, string | undefined>;

export type LanHostCandidate = {
  host: string;
  interfaceName?: string;
};

export type LanRuntimeEndpoints = {
  host: string;
  frontendUrl: string;
  backendUrl: string;
  wsUrl: string;
};

export type LanRuntimeConfig = {
  enabled: boolean;
  bindHost: string;
  publicHost?: string;
  frontendPort: number;
  backendPort: number;
  allowedOrigins: string[];
  allowedOriginsSource: 'explicit' | 'generated' | 'none';
  candidates: LanHostCandidate[];
  endpoints: LanRuntimeEndpoints[];
  warnings: string[];
};

type NetworkInterfacesShape = ReturnType<typeof networkInterfaces>;

function readString(env: LanRuntimeEnv, key: string): string | undefined {
  const value = env[key]?.trim();
  return value === '' ? undefined : value;
}

function readPort(env: LanRuntimeEnv, key: string, fallback: number): number {
  const value = readString(env, key);
  const parsed = value === undefined ? NaN : Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 65535 ? parsed : fallback;
}

function readOrigins(env: LanRuntimeEnv): string[] {
  const value = readString(env, 'LAN_ALLOWED_ORIGINS');
  if (!value) return [];
  return [...new Set(value.split(',').map((origin) => origin.trim()).filter(Boolean))];
}

export function isPrivateIpv4(host: string): boolean {
  const parts = host.split('.').map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  return parts[0] === 10
    || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
    || (parts[0] === 192 && parts[1] === 168);
}

export function isSafeLanHost(host: string): boolean {
  const normalized = host.trim().toLowerCase();
  return isPrivateIpv4(normalized)
    || normalized === 'localhost'
    || normalized.endsWith('.local');
}

export function detectLanHostCandidates(interfaces: NetworkInterfacesShape = networkInterfaces()): LanHostCandidate[] {
  const candidates: LanHostCandidate[] = [];
  for (const [interfaceName, addresses] of Object.entries(interfaces)) {
    for (const address of addresses ?? []) {
      if (address.family !== 'IPv4' || address.internal || !isPrivateIpv4(address.address)) continue;
      candidates.push({ host: address.address, interfaceName });
    }
  }
  return candidates
    .sort((left, right) => left.host.localeCompare(right.host) || (left.interfaceName ?? '').localeCompare(right.interfaceName ?? ''))
    .filter((candidate, index, items) => index === 0 || items[index - 1].host !== candidate.host);
}

export function createLanRuntimeEndpoints(hosts: string[], frontendPort: number, backendPort: number): LanRuntimeEndpoints[] {
  return hosts.map((host) => ({
    host,
    frontendUrl: `http://${host}:${frontendPort}`,
    backendUrl: `http://${host}:${backendPort}`,
    wsUrl: `ws://${host}:${backendPort}/ws`,
  }));
}

export function readLanRuntimeConfig(
  env: LanRuntimeEnv,
  options: { backendPort: number; interfaces?: NetworkInterfacesShape } = { backendPort: 8787 },
): LanRuntimeConfig {
  const enabled = readString(env, 'LAN_ALPHA_ENABLED') === 'true';
  const bindHost = readString(env, 'LAN_BIND_HOST') ?? '0.0.0.0';
  const requestedPublicHost = readString(env, 'LAN_PUBLIC_HOST');
  const frontendPort = readPort(env, 'LAN_FRONTEND_PORT', 3000);
  const backendPort = readPort(env, 'LAN_BACKEND_PORT', options.backendPort);
  const warnings: string[] = [];
  const detected = detectLanHostCandidates(options.interfaces);
  const publicHost = requestedPublicHost && isSafeLanHost(requestedPublicHost) ? requestedPublicHost : undefined;
  if (requestedPublicHost && !publicHost) {
    warnings.push('LAN_PUBLIC_HOST must be a private IPv4 address or a .local hostname.');
  }

  const candidates = publicHost ? [{ host: publicHost }] : detected;
  const endpoints = enabled ? createLanRuntimeEndpoints(candidates.map((candidate) => candidate.host), frontendPort, backendPort) : [];
  const explicitOrigins = readOrigins(env);
  const generatedOrigins = endpoints.map((endpoint) => endpoint.frontendUrl);
  const allowedOrigins = explicitOrigins.length > 0 ? explicitOrigins : generatedOrigins;
  const allowedOriginsSource = explicitOrigins.length > 0 ? 'explicit' : generatedOrigins.length > 0 ? 'generated' : 'none';

  if (enabled && candidates.length === 0) {
    warnings.push('No private IPv4 LAN address was detected. Set LAN_PUBLIC_HOST after checking the active network adapter.');
  }
  if (enabled && allowedOriginsSource === 'none') {
    warnings.push('No LAN frontend origin is available for CORS. Players will not be able to call the backend from a LAN browser.');
  }
  if (enabled && bindHost === '127.0.0.1') {
    warnings.push('LAN_BIND_HOST=127.0.0.1 restricts the backend to this machine. Use 0.0.0.0 for LAN hosting.');
  }

  return {
    enabled,
    bindHost,
    publicHost,
    frontendPort,
    backendPort,
    allowedOrigins,
    allowedOriginsSource,
    candidates,
    endpoints,
    warnings,
  };
}
