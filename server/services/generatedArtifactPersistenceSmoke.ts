import assert from 'node:assert/strict';
import { createPostgresGeneratedArtifactPersistence } from './generatedArtifactPersistence.js';

const artifact = { artifactId: 'artifact-1', ownerId: 'user-1', campaignId: 'campaign-1', artifactKind: 'campaign_ai_preparation_brief', title: '备团', contentFormat: 'structured_json', visibilityScope: 'user_private', payload: {}, sourcePayload: {}, modelPayload: {}, schemaVersion: 1 };
const source = { contextSourceId: 'source-1', ownerId: 'user-1', campaignId: 'campaign-1', artifactId: 'artifact-1', sourceKind: 'campaign_summary', sourceRefId: 'campaign-1', sourcePayload: {}, schemaVersion: 1 };
const memory = { memoryEntryId: 'memory-1', ownerId: 'user-1', campaignId: 'campaign-1', sourceArtifactId: 'artifact-1', memoryKind: 'campaign_creative_adoption', memoryScope: 'campaign', title: '采用提案', contentText: '内容', visibilityScope: 'user_private', payload: {}, sourcePayload: {}, schemaVersion: 1 };
const memorySource = { ...source, contextSourceId: 'source-memory-1', artifactId: undefined, memoryEntryId: 'memory-1', sourceKind: 'generated_artifact', sourceRefId: 'artifact-1' };

async function run(kind: 'artifact' | 'memory', sourceFails: boolean) {
  const calls: string[] = [];
  const persistence = createPostgresGeneratedArtifactPersistence({
    runInTransaction: async (execute) => execute({ query: async (sql: string) => { calls.push(sql); return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as never; } }),
    repositoryFactory: () => ({
      createGeneratedArtifact: async () => ({ ok: true, value: artifact }),
      createAiMemoryEntry: async () => ({ ok: true, value: memory }),
      createAiContextSource: async () => sourceFails ? { ok: false, error: { kind: 'database_error', message: 'safe failure', retryable: true } } : { ok: true, value: kind === 'artifact' ? source : memorySource },
    }),
  });
  const result = kind === 'artifact'
    ? await persistence.createArtifactWithSources({ artifact, sources: [source] })
    : await persistence.createMemoryWithSources({ memory, sources: [memorySource] });
  return { calls, result };
}

const success = await run('artifact', false);
assert.equal(success.result.ok, true);
assert.deepEqual(success.calls, ['BEGIN', 'COMMIT']);

const failure = await run('artifact', true);
assert.equal(failure.result.ok, false);
assert.deepEqual(failure.calls, ['BEGIN', 'ROLLBACK']);

const memorySuccess = await run('memory', false);
assert.equal(memorySuccess.result.ok, true);
assert.deepEqual(memorySuccess.calls, ['BEGIN', 'COMMIT']);

const memoryFailure = await run('memory', true);
assert.equal(memoryFailure.result.ok, false);
assert.deepEqual(memoryFailure.calls, ['BEGIN', 'ROLLBACK']);

console.log('generated artifact and curated memory atomic persistence smoke passed');
