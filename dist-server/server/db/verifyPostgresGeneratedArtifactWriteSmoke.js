import { closePostgresPool } from './postgresClient.js';
import { runPostgresGeneratedArtifactRepositoryRollbackWriteSmoke } from './postgresGeneratedArtifactRepositoryWriteSmoke.js';
async function main() {
    const strict = process.argv.includes('--strict');
    const result = await runPostgresGeneratedArtifactRepositoryRollbackWriteSmoke();
    const report = {
        checkedAt: new Date().toISOString(),
        strict,
        ...result,
        notes: [
            'This script runs a ROLLBACK-ONLY write smoke — it commits nothing.',
            'It creates a deterministic smoke owner user + campaign + actor + runtime session + event + generated artifact + memory entry + context sources inside one transaction, then rolls back.',
            'It calls no AI model, runs no embeddings, and does not print the connection string or raw driver errors.',
            'It does not create tables or run migrations.',
            'Use --strict to exit nonzero unless the status is rolled_back.',
        ],
    };
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(report, null, 2));
    if (strict && result.status !== 'rolled_back') {
        process.exitCode = 1;
    }
}
try {
    await main();
}
finally {
    await closePostgresPool();
}
