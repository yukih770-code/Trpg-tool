import { checkPostgresHealth, closePostgresPool } from './postgresClient.js';
import { checkPostgresRuntimeEventSchemaReadiness } from './postgresRuntimeEventSchemaReadiness.js';
import { runPostgresRuntimeEventRepositoryReadOnlySmoke } from './postgresRuntimeEventRepositorySmoke.js';
async function main() {
    const strict = process.argv.includes('--strict');
    const database = await checkPostgresHealth();
    const schema = await checkPostgresRuntimeEventSchemaReadiness();
    const smoke = await runPostgresRuntimeEventRepositoryReadOnlySmoke();
    const report = {
        checkedAt: new Date().toISOString(),
        strict,
        database,
        schema,
        smoke,
        notes: [
            'This script is read-only.',
            'It does not print the database connection string.',
            'It does not create tables, run migrations, or append smoke events.',
            'RuntimeEvent schema depends on the User, Campaign, and Actor schemas.',
            'runtime_events is append-only; this DB is long-term persistence, not live authority.',
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
