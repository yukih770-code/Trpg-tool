/** Explicit operator opt-in for Railway's encrypted, environment-isolated
 * private network. Never permits plaintext public database connections.
 */
export function isAllowedPilotDatabaseTransport(database: URL, env: Record<string, string | undefined>): boolean {
  if (env.DATABASE_SSL_MODE === 'require') return true;
  if (env.DATABASE_SSL_MODE !== 'disable') return false;
  if (['localhost', '127.0.0.1', '[::1]'].includes(database.hostname)) return true;
  return env.DATABASE_NETWORK === 'railway-private'
    && Boolean(env.RAILWAY_PROJECT_ID && env.RAILWAY_ENVIRONMENT_ID)
    && /^[a-z0-9-]+\.railway\.internal$/.test(database.hostname);
}
