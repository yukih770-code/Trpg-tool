/**
 * Server runtime config boundary (v0).
 *
 * AI-LANDMARK: SERVER_RUNTIME_CONFIG_BOUNDARY_V0
 *
 * This module describes environment-driven server configuration. It is not
 * wired into the current Room Server entry yet, and it does not perform
 * deployment, auth, database, storage, or protocol setup.
 */

export type ServerDeploymentEnvironment =
  | 'localDev'
  | 'cloudDev'
  | 'staging'
  | 'production';

export type ServerRuntimeMode =
  | 'local'
  | 'cloud';

export interface ServerRuntimeConfig {
  environment: ServerDeploymentEnvironment;
  runtimeMode: ServerRuntimeMode;
  httpPort: number;
  publicHttpUrl?: string;
  publicWsUrl?: string;
  allowedOrigins: string[];
  /**
   * P5.10G dev-only gate: when true, the server may mount read-only dev User
   * routes (`/api/dev/users/*`). Server-only (env `POSTGRES_USER_DEV_API_ENABLED`,
   * NO `VITE_` prefix), default false, and ALWAYS false in production. Optional so
   * existing config literals stay valid; treat undefined as false.
   */
  devUserApiEnabled?: boolean;
  warnings?: string[];
}

export const DEFAULT_LOCAL_SERVER_RUNTIME_CONFIG: ServerRuntimeConfig = {
  environment: 'localDev',
  runtimeMode: 'local',
  httpPort: 8787,
  publicHttpUrl: 'http://localhost:8787',
  publicWsUrl: 'ws://localhost:8787',
  allowedOrigins: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ],
  devUserApiEnabled: false,
};

export type ServerRuntimeEnv = Record<string, string | undefined>;

function readString(env: ServerRuntimeEnv, key: string): string | undefined {
  const value = env[key]?.trim();
  return value === '' ? undefined : value;
}

function readPort(env: ServerRuntimeEnv): number {
  const rawPort = readString(env, 'PORT') ?? readString(env, 'ROOM_SERVER_PORT');
  const parsedPort = rawPort === undefined ? NaN : Number(rawPort);
  return Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : DEFAULT_LOCAL_SERVER_RUNTIME_CONFIG.httpPort;
}

function readFirstString(env: ServerRuntimeEnv, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = readString(env, key);
    if (value !== undefined) return value;
  }
  return undefined;
}

function readAllowedOrigins(env: ServerRuntimeEnv, useLocalDefaults: boolean): string[] {
  const rawOrigins = readFirstString(env, ['ROOM_ALLOWED_ORIGINS', 'ROOM_SERVER_ALLOWED_ORIGINS']);
  if (rawOrigins === undefined) {
    return useLocalDefaults ? DEFAULT_LOCAL_SERVER_RUNTIME_CONFIG.allowedOrigins : [];
  }

  return rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin !== '');
}

function readEnvironment(env: ServerRuntimeEnv): ServerDeploymentEnvironment {
  const rawEnvironment = readFirstString(env, ['ROOM_SERVER_ENV', 'SERVER_DEPLOYMENT_ENVIRONMENT']);
  if (
    rawEnvironment === 'localDev' ||
    rawEnvironment === 'cloudDev' ||
    rawEnvironment === 'staging' ||
    rawEnvironment === 'production'
  ) {
    return rawEnvironment;
  }

  return DEFAULT_LOCAL_SERVER_RUNTIME_CONFIG.environment;
}

function readRuntimeMode(env: ServerRuntimeEnv): ServerRuntimeMode {
  const rawRuntimeMode = readFirstString(env, ['ROOM_SERVER_RUNTIME_MODE', 'SERVER_RUNTIME_MODE']);
  if (rawRuntimeMode === 'local' || rawRuntimeMode === 'cloud') {
    return rawRuntimeMode;
  }

  return DEFAULT_LOCAL_SERVER_RUNTIME_CONFIG.runtimeMode;
}

/**
 * Read the dev-only User API gate. Server-only; NEVER enabled in production.
 * Anything other than the literal string 'true' is treated as false.
 */
function readDevUserApiEnabled(env: ServerRuntimeEnv, environment: ServerDeploymentEnvironment): boolean {
  if (environment === 'production') return false;
  return readString(env, 'POSTGRES_USER_DEV_API_ENABLED') === 'true';
}

/**
 * Pure config reader for future server wiring. Production still requires an
 * explicit public endpoint before this boundary should be connected to runtime
 * startup.
 */
export function readServerRuntimeConfigFromEnv(env: ServerRuntimeEnv): ServerRuntimeConfig {
  const environment = readEnvironment(env);
  const runtimeMode = readRuntimeMode(env);
  const shouldUseLocalEndpointDefaults = environment === 'localDev' && runtimeMode === 'local';
  const publicHttpUrl =
    readFirstString(env, ['ROOM_PUBLIC_HTTP_URL', 'ROOM_SERVER_PUBLIC_HTTP_URL']) ??
    (shouldUseLocalEndpointDefaults ? DEFAULT_LOCAL_SERVER_RUNTIME_CONFIG.publicHttpUrl : undefined);
  const publicWsUrl =
    readFirstString(env, ['ROOM_PUBLIC_WS_URL', 'ROOM_SERVER_PUBLIC_WS_URL']) ??
    (shouldUseLocalEndpointDefaults ? DEFAULT_LOCAL_SERVER_RUNTIME_CONFIG.publicWsUrl : undefined);
  const allowedOrigins = readAllowedOrigins(env, shouldUseLocalEndpointDefaults);
  const warnings: string[] = [];

  if (environment === 'production' && runtimeMode === 'cloud') {
    if (!publicHttpUrl || publicHttpUrl.includes('localhost') || publicHttpUrl.includes('127.0.0.1')) {
      warnings.push('production cloud config should set ROOM_PUBLIC_HTTP_URL to a non-localhost URL.');
    }
    if (!publicWsUrl || publicWsUrl.includes('localhost') || publicWsUrl.includes('127.0.0.1')) {
      warnings.push('production cloud config should set ROOM_PUBLIC_WS_URL to a non-localhost URL.');
    }
    if (allowedOrigins.length === 0 || allowedOrigins.includes('*')) {
      warnings.push('production cloud config should set ROOM_ALLOWED_ORIGINS to explicit frontend origins.');
    }
  }

  return {
    environment,
    runtimeMode,
    httpPort: readPort(env),
    publicHttpUrl,
    publicWsUrl,
    allowedOrigins,
    devUserApiEnabled: readDevUserApiEnabled(env, environment),
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
