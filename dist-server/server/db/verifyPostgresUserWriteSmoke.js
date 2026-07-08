import { closePostgresPool } from './postgresClient.js';
import { runPostgresUserRepositoryRollbackWriteSmoke } from './postgresUserRepositoryWriteSmoke.js';
async function main() {
    const strict = process.argv.includes('--strict');
    const smoke = await runPostgresUserRepositoryRollbackWriteSmoke();
    const report = {
        checkedAt: new Date().toISOString(),
        strict,
        smoke,
        notes: [
            'This script performs a rollback-only transactional write smoke.',
            'It does not print DATABASE_URL.',
            'It does not create permanent users by default.',
            'It does not run migrations or create tables.',
            'Use --strict to exit nonzero unless the write smoke status is rolled_back.',
        ],
    };
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(report, null, 2));
    if (strict && smoke.status !== 'rolled_back') {
        process.exitCode = 1;
    }
}
try {
    await main();
}
finally {
    await closePostgresPool();
}
