import type { PostgresRuntimeEventRepository } from '../adapters/postgresRuntimeEventRepository.js';
import {
  type RuntimeEventPersistenceAppendInput,
  type RuntimeEventPersistenceRepositoryPort,
  type RuntimeEventPersistenceRepositoryResult,
} from './runtimeEventPersistenceBridge.js';

type RuntimeAppendRepository = Pick<PostgresRuntimeEventRepository, 'appendRuntimeEvent'>;

export function createRuntimeEventRepositoryPort(
  repository: RuntimeAppendRepository,
): RuntimeEventPersistenceRepositoryPort {
  return {
    async appendRuntimeEvent(
      input: RuntimeEventPersistenceAppendInput,
    ): Promise<RuntimeEventPersistenceRepositoryResult> {
      const result = await repository.appendRuntimeEvent({
        runtimeEventId: input.runtimeEventId,
        runtimeSessionId: input.runtimeSessionId,
        campaignId: input.campaignId,
        eventKind: input.eventKind,
        visibility: input.visibility,
        idempotencyKey: input.idempotencyKey,
        actorId: input.actorId,
        causedByEventId: input.causedByEventId,
        payload: input.payload,
        schemaVersion: input.schemaVersion,
        createdByUserId: input.createdByUserId,
      });
      if (result.ok === false) return result;
      return {
        ok: true,
        value: {
          runtimeEventId: result.value.runtimeEventId,
          seq: result.value.seq,
          record: result.value,
        },
      };
    },
  };
}
