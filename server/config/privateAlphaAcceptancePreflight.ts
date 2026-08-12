export type PrivateAlphaAcceptancePreflightInput = {
  configuredUrl?: string;
  frontendReachable?: boolean;
  healthReachable?: boolean;
  health?: unknown;
  authReachable?: boolean;
  auth?: unknown;
};

export type PrivateAlphaAcceptancePreflightCheck = {
  id: string;
  passed: boolean;
  detail: string;
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function resolvePrivateAlphaAcceptanceOrigin(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return undefined;
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1') return undefined;
    return url.origin;
  } catch {
    return undefined;
  }
}

function isSafeCloudWebSocketUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'wss:'
      && !url.username
      && !url.password
      && url.hostname !== 'localhost'
      && url.hostname !== '127.0.0.1'
      && url.hostname !== '::1';
  } catch {
    return false;
  }
}

export function evaluatePrivateAlphaAcceptancePreflight(
  input: PrivateAlphaAcceptancePreflightInput,
): { status: 'ready' | 'blocked'; checks: PrivateAlphaAcceptancePreflightCheck[] } {
  const health = record(input.health);
  const database = record(health.database);
  const worldServerSchema = record(database.worldServerSchema);
  const authEnvelope = record(input.auth);
  const auth = record(authEnvelope.ok === true ? authEnvelope.value : input.auth);
  const remoteUrl = resolvePrivateAlphaAcceptanceOrigin(input.configuredUrl);
  const checks: PrivateAlphaAcceptancePreflightCheck[] = [
    {
      id: 'remote_https_url',
      passed: Boolean(remoteUrl),
      detail: remoteUrl ? 'Remote HTTPS target configured.' : 'Set PRIVATE_ALPHA_SMOKE_URL to the deployed HTTPS origin.',
    },
    {
      id: 'frontend_reachable',
      passed: input.frontendReachable === true,
      detail: input.frontendReachable ? 'Frontend returned a successful response.' : 'Deployed frontend is not reachable.',
    },
    {
      id: 'backend_health',
      passed: input.healthReachable === true && health.ok === true,
      detail: input.healthReachable && health.ok === true ? 'Backend health is OK.' : 'Backend /health is unavailable or unhealthy.',
    },
    {
      id: 'cloud_runtime_mode',
      passed: health.environment === 'cloudPrivateAlpha' && health.runtimeMode === 'cloud',
      detail: health.environment === 'cloudPrivateAlpha' && health.runtimeMode === 'cloud'
        ? 'Cloud Private Alpha runtime contract reported.'
        : 'Backend is not reporting cloudPrivateAlpha/cloud.',
    },
    {
      id: 'private_alpha_auth_mode',
      passed: health.authMode === 'privateAlpha' && health.devUserApiEnabled === false,
      detail: health.authMode === 'privateAlpha' && health.devUserApiEnabled === false
        ? 'Private Alpha auth is active and dev auth is disabled.'
        : 'Backend auth mode is not privateAlpha or dev auth remains enabled.',
    },
    {
      id: 'database_ready',
      passed: database.status === 'ok' && worldServerSchema.status === 'ready',
      detail: database.status === 'ok' && worldServerSchema.status === 'ready'
        ? 'Database and World Server schema are ready.'
        : 'Database or World Server schema is not ready.',
    },
    {
      id: 'login_gate_reachable',
      passed: input.authReachable === true && auth.authenticated === false && auth.authMode === 'unauthenticated',
      detail: input.authReachable === true && auth.authenticated === false && auth.authMode === 'unauthenticated'
        ? 'Unauthenticated login gate responds without creating a session.'
        : 'Auth endpoint did not expose the expected unauthenticated gate.',
    },
    {
      id: 'secure_websocket_url',
      passed: isSafeCloudWebSocketUrl(health.publicWsUrl),
      detail: isSafeCloudWebSocketUrl(health.publicWsUrl)
        ? 'Secure non-local WebSocket origin reported.'
        : 'Backend does not report a secure non-local WebSocket origin.',
    },
  ];
  return { status: checks.every((check) => check.passed) ? 'ready' : 'blocked', checks };
}
