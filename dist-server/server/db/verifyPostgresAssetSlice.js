import { checkPostgresHealth, closePostgresPool } from './postgresClient.js';
import { checkPostgresAssetSchemaReadiness } from './postgresAssetSchemaReadiness.js';
import { runPostgresAssetRepositoryReadOnlySmoke } from './postgresAssetRepositorySmoke.js';
async function main() {
    const strict = process.argv.includes('--strict');
    const database = await checkPostgresHealth();
    const schema = await checkPostgresAssetSchemaReadiness();
    const smoke = await runPostgresAssetRepositoryReadOnlySmoke();
    const report = {
        checkedAt: new Date().toISOString(),
        strict,
        database,
        schema,
        smoke,
        notes: [
            'This script is read-only.',
            'It does not print the database connection string.',
            'It does not create tables, run migrations, or write smoke assets.',
            'Asset schema depends on the User and Campaign schemas.',
            'Postgres stores metadata only; blobs are never stored here.',
            'Use --strict to exit nonzero unless the read-only smoke status is ready.',
        ],
    };
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(report, null, 2));
    if (strict && smoke.status !== 'ready') {
        process.exitCode = 1;
    }
}
try {
    await main();
}
finally {
    await closePostgresPool();
}
