import { closePostgresPool } from './postgresClient.js';
import { runPostgresDndPrivateMonsterRepositoryReadOnlySmoke } from './postgresDndPrivateMonsterRepositorySmoke.js';
try { const strict = process.argv.includes('--strict'); const result = await runPostgresDndPrivateMonsterRepositoryReadOnlySmoke(); console.log(JSON.stringify(result, null, 2)); if (strict && result.status !== 'ready') process.exitCode = 1; } finally { await closePostgresPool(); }
