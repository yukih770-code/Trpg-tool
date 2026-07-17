import { readLanRuntimeConfig, type LanRuntimeConfig } from './lanRuntimeConfig.js';

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
  | 'cloudPrivateAlpha'
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
  devAuthRequested?: boolean;
  /** Safe booleans only. Invite/session secret values never leave server auth code. */
  privateAlphaAuthEnabled?: boolean;
  privateAlphaAuthConfigured?: boolean;
  /** LAN Alpha is localDev-only and exposes no credentials or permission bypass. */
  lanAlpha?: LanRuntimeConfig;
  warnings?: string[];
}

export type ServerStartupValidation = {
  errors: string[];
  warnings: string[];
};

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
    rawEnvironment === 'cloudPrivateAlpha' ||
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
function readDevAuthRequested(env: ServerRuntimeEnv): boolean {
  return readString(env, 'POSTGRES_USER_DEV_API_ENABLED') === 'true';
}

function readDevUserApiEnabled(environment: ServerDeploymentEnvironment, requested: boolean): boolean {
  return environment === 'localDev' && requested;
}

/**
 * Pure config reader for future server wiring. Production still requires an
 * explicit public endpoint before this boundary should be connected to runtime
 * startup.
 */
export function readServerRuntimeConfigFromEnv(env: ServerRuntimeEnv): ServerRuntimeConfig {
  const environment = readEnvironment(env);
  const runtimeMode = readRuntimeMode(env);
  const requestedLanAlpha = readLanRuntimeConfig(env, { backendPort: readPort(env) });
  const lanAlpha = environment === 'localDev'
    ? requestedLanAlpha
    : {
      ...requestedLanAlpha,
      enabled: false,
      endpoints: [],
      allowedOrigins: [],
      allowedOriginsSource: 'none' as const,
      warnings: requestedLanAlpha.enabled
        ? [...requestedLanAlpha.warnings, 'LAN Alpha is ignored outside localDev.']
        : requestedLanAlpha.warnings,
    };
  const shouldUseLocalEndpointDefaults = environment === 'localDev' && runtimeMode === 'local';
  const publicHttpUrl =
    readFirstString(env, ['APP_PUBLIC_HTTP_URL', 'ROOM_PUBLIC_HTTP_URL', 'ROOM_SERVER_PUBLIC_HTTP_URL']) ??
    (shouldUseLocalEndpointDefaults ? DEFAULT_LOCAL_SERVER_RUNTIME_CONFIG.publicHttpUrl : undefined);
  const publicWsUrl =
    readFirstString(env, ['APP_PUBLIC_WS_URL', 'ROOM_PUBLIC_WS_URL', 'ROOM_SERVER_PUBLIC_WS_URL']) ??
    (shouldUseLocalEndpointDefaults ? DEFAULT_LOCAL_SERVER_RUNTIME_CONFIG.publicWsUrl : undefined);
  const allowedOrigins = [...new Set([
    ...readAllowedOrigins(env, shouldUseLocalEndpointDefaults),
    ...(lanAlpha.enabled ? lanAlpha.allowedOrigins : []),
  ])];
  const warnings: string[] = [];

  const devAuthRequested = readDevAuthRequested(env);
  const privateAlphaAuthEnabled = readString(env, 'PRIVATE_ALPHA_AUTH_ENABLED') === 'true';
  const privateAlphaAuthConfigured = privateAlphaAuthEnabled
    && readString(env, 'PRIVATE_ALPHA_INVITE_CODE') !== undefined
    && readString(env, 'PRIVATE_ALPHA_SESSION_SECRET') !== undefined;
  if (environment !== 'localDev' && devAuthRequested) {
    warnings.push('Dev auth was requested but is disabled outside localDev.');
  }
  warnings.push(...lanAlpha.warnings);
  if (environment !== 'localDev' && runtimeMode === 'cloud') {
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
    httpPort: lanAlpha.enabled ? lanAlpha.backendPort : readPort(env),
    publicHttpUrl,
    publicWsUrl,
    allowedOrigins,
    devUserApiEnabled: readDevUserApiEnabled(environment, devAuthRequested),
    devAuthRequested,
    privateAlphaAuthEnabled,
    privateAlphaAuthConfigured,
    lanAlpha,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

function isLocalUrl(value: string | undefined): boolean {
  return !value || /(?:localhost|127\.0\.0\.1)/i.test(value);
}

/**
 * Validate only safe, deployment-shape inputs. This never opens a database
 * connection and never includes a URL value in its output.
 */
export function validateServerStartupConfig(
  config: ServerRuntimeConfig,
  databaseConfigured: boolean,
): ServerStartupValidation {
  const errors: string[] = [];
  const warnings = [...(config.warnings ?? [])];
  if (config.environment === 'localDev') return { errors, warnings };

  if (config.runtimeMode !== 'cloud') errors.push('Cloud deployment mode requires SERVER_RUNTIME_MODE=cloud.');
  if (!databaseConfigured) errors.push('Cloud deployment mode requires backend DATABASE_URL configuration.');
  if (config.allowedOrigins.length === 0) errors.push('Cloud deployment mode requires explicit ROOM_ALLOWED_ORIGINS.');
  if (config.allowedOrigins.includes('*')) errors.push('Cloud deployment mode does not allow wildcard ROOM_ALLOWED_ORIGINS.');
  if (config.devAuthRequested) errors.push('Cloud deployment mode must not enable POSTGRES_USER_DEV_API_ENABLED.');
  if (!config.privateAlphaAuthEnabled) errors.push('Cloud deployment mode requires PRIVATE_ALPHA_AUTH_ENABLED=true.');
  if (!config.privateAlphaAuthConfigured) errors.push('Cloud deployment mode requires private alpha invite and session secret configuration.');
  if (isLocalUrl(config.publicHttpUrl)) errors.push('Cloud deployment mode requires a non-local APP_PUBLIC_HTTP_URL.');
  if (isLocalUrl(config.publicWsUrl)) errors.push('Cloud deployment mode requires a non-local APP_PUBLIC_WS_URL.');
  return { errors, warnings };
}
