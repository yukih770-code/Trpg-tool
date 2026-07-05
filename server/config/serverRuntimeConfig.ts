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

function readAllowedOrigins(env: ServerRuntimeEnv): string[] {
  const rawOrigins = readString(env, 'ROOM_SERVER_ALLOWED_ORIGINS');
  if (rawOrigins === undefined) {
    return DEFAULT_LOCAL_SERVER_RUNTIME_CONFIG.allowedOrigins;
  }

  return rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin !== '');
}

function readEnvironment(env: ServerRuntimeEnv): ServerDeploymentEnvironment {
  const rawEnvironment = readString(env, 'SERVER_DEPLOYMENT_ENVIRONMENT');
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
  const rawRuntimeMode = readString(env, 'SERVER_RUNTIME_MODE');
  if (rawRuntimeMode === 'local' || rawRuntimeMode === 'cloud') {
    return rawRuntimeMode;
  }

  return DEFAULT_LOCAL_SERVER_RUNTIME_CONFIG.runtimeMode;
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

  return {
    environment,
    runtimeMode,
    httpPort: readPort(env),
    publicHttpUrl:
      readString(env, 'ROOM_SERVER_PUBLIC_HTTP_URL') ??
      (shouldUseLocalEndpointDefaults ? DEFAULT_LOCAL_SERVER_RUNTIME_CONFIG.publicHttpUrl : undefined),
    publicWsUrl:
      readString(env, 'ROOM_SERVER_PUBLIC_WS_URL') ??
      (shouldUseLocalEndpointDefaults ? DEFAULT_LOCAL_SERVER_RUNTIME_CONFIG.publicWsUrl : undefined),
    allowedOrigins: readAllowedOrigins(env),
  };
}
