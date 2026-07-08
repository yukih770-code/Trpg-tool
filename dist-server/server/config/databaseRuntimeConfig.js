const DEFAULT_POOL_MAX = 5;
const DEFAULT_CONNECTION_TIMEOUT_MS = 3000;
function readPositiveInteger(value, fallback) {
    if (!value)
        return fallback;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0)
        return fallback;
    return parsed;
}
function readSslMode(value) {
    if (value === 'require' || value === 'prefer' || value === 'disable')
        return value;
    return 'disable';
}
export function readDatabaseRuntimeConfigFromEnv(env) {
    const databaseUrl = env.DATABASE_URL?.trim();
    return {
        configured: Boolean(databaseUrl),
        databaseUrl: databaseUrl || undefined,
        sslMode: readSslMode(env.DATABASE_SSL_MODE),
        poolMax: readPositiveInteger(env.DATABASE_POOL_MAX, DEFAULT_POOL_MAX),
        connectionTimeoutMs: readPositiveInteger(env.DATABASE_CONNECTION_TIMEOUT_MS, DEFAULT_CONNECTION_TIMEOUT_MS),
    };
}
