import { checkPostgresHealth, closePostgresPool } from './postgresClient.js';
import { checkPostgresGeneratedArtifactSchemaReadiness } from './postgresGeneratedArtifactSchemaReadiness.js';
import { runPostgresGeneratedArtifactRepositoryReadOnlySmoke } from './postgresGeneratedArtifactRepositorySmoke.js';
async function main() {
    const strict = process.argv.includes('--strict');
    const database = await checkPostgresHealth();
    const schema = await checkPostgresGeneratedArtifactSchemaReadiness();
    const smoke = await runPostgresGeneratedArtifactRepositoryReadOnlySmoke();
    const report = {
        checkedAt: new Date().toISOString(),
        strict,
        database,
        schema,
        smoke,
        notes: [
            'This script is read-only.',
            'It does not print the database connection string.',
            'It does not create tables, run migrations, or write smoke rows.',
            'It calls no AI model and runs no embeddings/vector search.',
            'GeneratedArtifact schema depends on the User, Campaign, and RuntimeEvent schemas.',
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
