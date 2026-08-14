import assert from 'node:assert/strict';
import { createPostgresGeneratedArtifactPersistence } from './generatedArtifactPersistence.js';

const artifact = { artifactId: 'artifact-1', ownerId: 'user-1', campaignId: 'campaign-1', artifactKind: 'campaign_ai_preparation_brief', title: '备团', contentFormat: 'structured_json', visibilityScope: 'user_private', payload: {}, sourcePayload: {}, modelPayload: {}, schemaVersion: 1 };
const source = { contextSourceId: 'source-1', ownerId: 'user-1', campaignId: 'campaign-1', artifactId: 'artifact-1', sourceKind: 'campaign_summary', sourceRefId: 'campaign-1', sourcePayload: {}, schemaVersion: 1 };

async function run(sourceFails: boolean) {
  const calls: string[] = [];
  const persistence = createPostgresGeneratedArtifactPersistence({
    runInTransaction: async (execute) => execute({ query: async (sql: string) => { calls.push(sql); return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as never; } }),
    repositoryFactory: () => ({
      createGeneratedArtifact: async () => ({ ok: true, value: artifact }),
      createAiContextSource: async () => sourceFails ? { ok: false, error: { kind: 'database_error', message: 'safe failure', retryable: true } } : { ok: true, value: source },
    }),
  });
  const result = await persistence.createArtifactWithSources({ artifact, sources: [source] });
  return { calls, result };
}

const success = await run(false);
assert.equal(success.result.ok, true);
assert.deepEqual(success.calls, ['BEGIN', 'COMMIT']);

const failure = await run(true);
assert.equal(failure.result.ok, false);
assert.deepEqual(failure.calls, ['BEGIN', 'ROLLBACK']);

console.log('generated artifact atomic persistence smoke passed');
