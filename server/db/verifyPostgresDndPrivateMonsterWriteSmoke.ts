import { closePostgresPool } from './postgresClient.js';
import { runPostgresDndPrivateMonsterRepositoryRollbackWriteSmoke } from './postgresDndPrivateMonsterRepositoryWriteSmoke.js';
try { const strict = process.argv.includes('--strict'); const result = await runPostgresDndPrivateMonsterRepositoryRollbackWriteSmoke(); console.log(JSON.stringify(result, null, 2)); if (strict && result.status !== 'rolled_back') process.exitCode = 1; } finally { await closePostgresPool(); }
