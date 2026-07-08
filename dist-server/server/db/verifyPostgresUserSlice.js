import { checkPostgresHealth, closePostgresPool } from './postgresClient.js';
import { checkPostgresUserSchemaReadiness } from './postgresSchemaReadiness.js';
import { runPostgresUserRepositoryReadOnlySmoke } from './postgresUserRepositorySmoke.js';
async function main() {
    const strict = process.argv.includes('--strict');
    const database = await checkPostgresHealth();
    const schema = await checkPostgresUserSchemaReadiness();
    const smoke = await runPostgresUserRepositoryReadOnlySmoke();
    const report = {
        checkedAt: new Date().toISOString(),
        strict,
        database,
        schema,
        smoke,
        notes: [
            'This script is read-only.',
            'It does not print DATABASE_URL.',
            'It does not create tables, run migrations, or write smoke users.',
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
