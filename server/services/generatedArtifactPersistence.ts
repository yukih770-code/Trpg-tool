import type {
  AiContextSourceRecord,
  AiMemoryEntryRecord,
  CreateAiContextSourceInput,
  CreateAiMemoryEntryInput,
  CreateGeneratedArtifactInput,
  GeneratedArtifactRecord,
  PostgresGeneratedArtifactRepositoryExecutor,
} from '../adapters/postgresGeneratedArtifactRepository.js';
import { createPostgresGeneratedArtifactRepository } from '../adapters/postgresGeneratedArtifactRepository.js';
import { withPostgresClient } from '../db/postgresClient.js';

export type GeneratedArtifactPersistenceResult =
  | { ok: true; artifact: GeneratedArtifactRecord; sources: AiContextSourceRecord[] }
  | { ok: false; kind: 'not_configured' | 'schema_missing' | 'conflict' | 'database_error'; retryable: boolean };

export type AiMemoryPersistenceResult =
  | { ok: true; memory: AiMemoryEntryRecord; sources: AiContextSourceRecord[] }
  | { ok: false; kind: 'not_configured' | 'schema_missing' | 'conflict' | 'database_error'; retryable: boolean };

export interface GeneratedArtifactPersistencePort {
  createArtifactWithSources(input: { artifact: CreateGeneratedArtifactInput; sources: CreateAiContextSourceInput[] }): Promise<GeneratedArtifactPersistenceResult>;
  createMemoryWithSources(input: { memory: CreateAiMemoryEntryInput; sources: CreateAiContextSourceInput[] }): Promise<AiMemoryPersistenceResult>;
}

type WriteRepository = Pick<ReturnType<typeof createPostgresGeneratedArtifactRepository>, 'createGeneratedArtifact' | 'createAiMemoryEntry' | 'createAiContextSource'>;

function persistenceFailure(error: unknown): { ok: false; kind: 'not_configured' | 'schema_missing' | 'conflict' | 'database_error'; retryable: boolean } {
  const message = error instanceof Error ? error.message : '';
  const kind = message.includes('not_configured') ? 'not_configured'
    : message.includes('schema_missing') ? 'schema_missing'
      : message.includes('conflict') ? 'conflict'
        : 'database_error';
  return { ok: false, kind, retryable: kind === 'database_error' };
}

export function createPostgresGeneratedArtifactPersistence(options: {
  runInTransaction?: <T>(run: (client: PostgresGeneratedArtifactRepositoryExecutor) => Promise<T>) => Promise<T>;
  repositoryFactory?: (client: PostgresGeneratedArtifactRepositoryExecutor) => WriteRepository;
} = {}): GeneratedArtifactPersistencePort {
  const runInTransaction = options.runInTransaction ?? ((run) => withPostgresClient(run));
  const repositoryFactory = options.repositoryFactory ?? ((client) => createPostgresGeneratedArtifactRepository(client, { useInternalTransactions: false }));
  return {
    async createArtifactWithSources(input) {
      try {
        return await runInTransaction(async (client) => {
          await client.query('BEGIN');
          try {
            const repository = repositoryFactory(client);
            const artifact = await repository.createGeneratedArtifact(input.artifact);
            if ('error' in artifact) throw new Error(`artifact:${artifact.error.kind}`);
            const sources: AiContextSourceRecord[] = [];
            for (const source of input.sources) {
              const created = await repository.createAiContextSource(source);
              if ('error' in created) throw new Error(`source:${created.error.kind}`);
              sources.push(created.value);
            }
            await client.query('COMMIT');
            return { ok: true, artifact: artifact.value, sources } as const;
          } catch (error) {
            try { await client.query('ROLLBACK'); } catch { /* preserve original failure */ }
            throw error;
          }
        });
      } catch (error) { return persistenceFailure(error); }
    },
    async createMemoryWithSources(input) {
      try {
        return await runInTransaction(async (client) => {
          await client.query('BEGIN');
          try {
            const repository = repositoryFactory(client);
            const memory = await repository.createAiMemoryEntry(input.memory);
            if ('error' in memory) throw new Error(`memory:${memory.error.kind}`);
            const sources: AiContextSourceRecord[] = [];
            for (const source of input.sources) {
              const created = await repository.createAiContextSource(source);
              if ('error' in created) throw new Error(`source:${created.error.kind}`);
              sources.push(created.value);
            }
            await client.query('COMMIT');
            return { ok: true, memory: memory.value, sources } as const;
          } catch (error) {
            try { await client.query('ROLLBACK'); } catch { /* preserve original failure */ }
            throw error;
          }
        });
      } catch (error) { return persistenceFailure(error); }
    },
  };
}
