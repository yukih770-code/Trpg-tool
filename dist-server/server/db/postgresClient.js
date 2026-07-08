import pg from 'pg';
import { readDatabaseRuntimeConfigFromEnv, } from '../config/databaseRuntimeConfig.js';
const { Pool } = pg;
export class PostgresDatabaseError extends Error {
    kind;
    constructor(kind, message) {
        super(message);
        this.name = 'PostgresDatabaseError';
        this.kind = kind;
    }
}
let sharedPool = null;
let sharedPoolUrl;
function getSslConfig(config) {
    if (config.sslMode === 'disable')
        return false;
    return { rejectUnauthorized: config.sslMode === 'require' };
}
export function getPostgresPool(config = readDatabaseRuntimeConfigFromEnv(process.env)) {
    if (!config.configured || !config.databaseUrl)
        return null;
    if (sharedPool && sharedPoolUrl === config.databaseUrl)
        return sharedPool;
    sharedPool = new Pool({
        connectionString: config.databaseUrl,
        max: config.poolMax,
        connectionTimeoutMillis: config.connectionTimeoutMs,
        ssl: getSslConfig(config),
    });
    sharedPoolUrl = config.databaseUrl;
    return sharedPool;
}
function classifyDatabaseError(error) {
    const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
    if (code === 'ECONNREFUSED')
        return 'connection_refused';
    if (code === 'ETIMEDOUT')
        return 'connection_timeout';
    if (code === 'ENOTFOUND')
        return 'host_not_found';
    if (code === '28P01')
        return 'authentication_failed';
    if (code === '3D000')
        return 'database_not_found';
    if (code === '42P01')
        return 'schema_missing';
    return 'database_error';
}
export async function queryPostgres(text, values, config = readDatabaseRuntimeConfigFromEnv(process.env)) {
    const pool = getPostgresPool(config);
    if (!pool) {
        throw new PostgresDatabaseError('not_configured', 'DATABASE_URL is not configured.');
    }
    try {
        return await pool.query(text, values ? [...values] : undefined);
    }
    catch (error) {
        throw new PostgresDatabaseError('query_error', classifyDatabaseError(error));
    }
}
export async function withPostgresClient(run, config = readDatabaseRuntimeConfigFromEnv(process.env)) {
    const pool = getPostgresPool(config);
    if (!pool) {
        throw new PostgresDatabaseError('not_configured', 'DATABASE_URL is not configured.');
    }
    const client = await pool.connect();
    try {
        return await run(client);
    }
    finally {
        client.release();
    }
}
export async function checkPostgresHealth(config = readDatabaseRuntimeConfigFromEnv(process.env)) {
    if (!config.configured || !config.databaseUrl) {
        return { configured: false, status: 'not_configured' };
    }
    const startedAt = Date.now();
    try {
        await queryPostgres('SELECT 1 AS ok', [], config);
        return { configured: true, status: 'ok', latencyMs: Date.now() - startedAt };
    }
    catch (error) {
        const errorKind = error instanceof PostgresDatabaseError ? error.message : classifyDatabaseError(error);
        return {
            configured: true,
            status: 'error',
            latencyMs: Date.now() - startedAt,
            errorKind,
        };
    }
}
export async function closePostgresPool() {
    if (!sharedPool)
        return;
    const pool = sharedPool;
    sharedPool = null;
    sharedPoolUrl = undefined;
    await pool.end();
}
