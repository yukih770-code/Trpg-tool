import {
  createRuntimeEventIdempotencyKey,
  normalizeRuntimeEventPersistenceCandidate,
  persistRuntimeEventCandidate,
  type RuntimeEventPersistenceAppendInput,
  type RuntimeEventPersistenceRepositoryPort,
  type RuntimeEventPersistenceRepositoryResult,
} from './runtimeEventPersistenceBridge.js';

export interface RuntimeEventPersistenceBridgeSmokeCase {
  name: string;
  passed: boolean;
  detail?: string;
}

export interface RuntimeEventPersistenceBridgeSmokeReport {
  status: 'passed' | 'failed';
  total: number;
  passed: number;
  failed: number;
  cases: RuntimeEventPersistenceBridgeSmokeCase[];
}

const baseCandidate = () => ({
  worldServerId: 'world-1',
  campaignId: 'campaign-1',
  roomId: 'room-1',
  runtimeSessionId: 'session-1',
  source: 'room_server' as const,
  eventKind: 'runtime.event.appended',
  eventPayload: { text: 'public note', nested: { count: 1 } },
  actorUserId: 'user-1',
  clientEventId: 'client-1',
  occurredAt: '2026-01-01T00:00:00.000Z',
  visibilityScope: 'campaign' as const,
});

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

function fakeRepository(
  result: RuntimeEventPersistenceRepositoryResult = {
    ok: true,
    value: { runtimeEventId: 'event-1', seq: 7 },
  },
): RuntimeEventPersistenceRepositoryPort & { calls: RuntimeEventPersistenceAppendInput[] } {
  const calls: RuntimeEventPersistenceAppendInput[] = [];
  return {
    calls,
    async appendRuntimeEvent(input) {
      calls.push(input);
      return result;
    },
  };
}

export async function runRuntimeEventPersistenceBridgeSmoke(): Promise<RuntimeEventPersistenceBridgeSmokeReport> {
  const cases: RuntimeEventPersistenceBridgeSmokeCase[] = [];
  const test = async (name: string, fn: () => void | Promise<void>): Promise<void> => {
    try {
      await fn();
      cases.push({ name, passed: true });
    } catch (error) {
      cases.push({ name, passed: false, detail: error instanceof Error ? error.message : 'failed' });
    }
  };

  await test('disabled bridge is a no-op', async () => {
    const repository = fakeRepository();
    const result = await persistRuntimeEventCandidate(baseCandidate(), { enabled: false, repository });
    assert(result.status === 'disabled', 'expected disabled');
    assert(repository.calls.length === 0, 'disabled bridge called repository');
  });
  await test('missing campaign context is a no-op', async () => {
    const repository = fakeRepository();
    const result = await persistRuntimeEventCandidate({ ...baseCandidate(), campaignId: undefined }, { repository });
    assert(result.status === 'missing_context', 'expected missing_context');
    assert(repository.calls.length === 0, 'missing context called repository');
  });
  await test('missing runtime session context is a no-op', async () => {
    const repository = fakeRepository();
    const result = await persistRuntimeEventCandidate({ ...baseCandidate(), runtimeSessionId: undefined }, { repository });
    assert(result.status === 'missing_context', 'expected missing_context');
    assert(repository.calls.length === 0, 'missing context called repository');
  });
  await test('missing event kind is a no-op', async () => {
    const repository = fakeRepository();
    const result = await persistRuntimeEventCandidate({ ...baseCandidate(), eventKind: ' ' }, { repository });
    assert(result.status === 'missing_context', 'expected missing_context');
  });
  await test('valid candidate is appended', async () => {
    const repository = fakeRepository();
    const result = await persistRuntimeEventCandidate(baseCandidate(), { repository });
    assert(result.status === 'persisted', 'expected persisted');
    assert(result.persistedEvent?.seq === 7, 'missing repository sequence');
  });
  await test('repository event id is returned', async () => {
    const repository = fakeRepository();
    const result = await persistRuntimeEventCandidate(baseCandidate(), { repository });
    assert(result.persistedEvent?.runtimeEventId === 'event-1', 'missing event id');
  });
  await test('idempotency key is deterministic', () => {
    const input = baseCandidate();
    assert(createRuntimeEventIdempotencyKey(input) === createRuntimeEventIdempotencyKey(input), 'key changed');
  });
  await test('client event id changes idempotency key', () => {
    const input = baseCandidate();
    assert(
      createRuntimeEventIdempotencyKey(input) !== createRuntimeEventIdempotencyKey({ ...input, clientEventId: 'client-2' }),
      'client event id not included',
    );
  });
  await test('idempotency key includes session context', () => {
    const input = baseCandidate();
    assert(
      createRuntimeEventIdempotencyKey(input) !== createRuntimeEventIdempotencyKey({ ...input, runtimeSessionId: 'session-2' }),
      'session not included',
    );
  });
  await test('missing occurredAt keeps retries deterministic', () => {
    const input = { ...baseCandidate(), occurredAt: undefined };
    const first = createRuntimeEventIdempotencyKey({ ...input, occurredAt: undefined });
    const second = createRuntimeEventIdempotencyKey({ ...input, occurredAt: undefined });
    assert(first === second, 'missing occurredAt changed the key');
  });
  await test('normalization does not mutate input', () => {
    const input = baseCandidate();
    const before = JSON.stringify(input);
    normalizeRuntimeEventPersistenceCandidate(input);
    assert(JSON.stringify(input) === before, 'input mutated');
  });
  await test('occurredAt is preserved', () => {
    assert(normalizeRuntimeEventPersistenceCandidate(baseCandidate()).occurredAt === '2026-01-01T00:00:00.000Z', 'occurredAt changed');
  });
  await test('occurredAt defaults when absent', () => {
    const result = normalizeRuntimeEventPersistenceCandidate({ ...baseCandidate(), occurredAt: undefined });
    assert(typeof result.occurredAt === 'string' && result.occurredAt.length > 10, 'occurredAt missing');
  });
  await test('context fields are preserved', () => {
    const result = normalizeRuntimeEventPersistenceCandidate(baseCandidate());
    assert(result.worldServerId === 'world-1' && result.roomId === 'room-1', 'context dropped');
  });
  await test('payload fields are preserved', () => {
    const result = normalizeRuntimeEventPersistenceCandidate(baseCandidate());
    assert(result.eventPayload.nested !== undefined, 'payload dropped');
  });
  await test('payload is JSON safe', () => {
    const result = normalizeRuntimeEventPersistenceCandidate({
      ...baseCandidate(),
      eventPayload: { finite: 1, nonFinite: Number.NaN, missing: undefined, fn: () => 'x' },
    });
    assert(result.eventPayload.finite === 1 && result.eventPayload.nonFinite === null, 'payload unsafe');
    assert(!('missing' in result.eventPayload) && !('fn' in result.eventPayload), 'unsafe values retained');
  });
  await test('source is retained when known', () => {
    assert(normalizeRuntimeEventPersistenceCandidate(baseCandidate()).source === 'room_server', 'source changed');
  });
  await test('unknown source is normalized safely', () => {
    assert(normalizeRuntimeEventPersistenceCandidate({ ...baseCandidate(), source: 'plugin' }).source === 'unknown', 'source not normalized');
  });
  await test('actor user is forwarded as creator metadata', async () => {
    const repository = fakeRepository();
    await persistRuntimeEventCandidate(baseCandidate(), { repository });
    assert(repository.calls[0]?.createdByUserId === 'user-1', 'actor user dropped');
  });
  await test('visibility metadata is forwarded', async () => {
    const repository = fakeRepository();
    await persistRuntimeEventCandidate({ ...baseCandidate(), visibilityScope: 'server' }, { repository });
    assert(repository.calls[0]?.visibility === 'server', 'visibility dropped');
  });
  await test('visibility defaults to campaign', async () => {
    const repository = fakeRepository();
    await persistRuntimeEventCandidate({ ...baseCandidate(), visibilityScope: undefined }, { repository });
    assert(repository.calls[0]?.visibility === 'campaign', 'visibility default missing');
  });
  await test('repository receives schema version one', async () => {
    const repository = fakeRepository();
    await persistRuntimeEventCandidate(baseCandidate(), { repository });
    assert(repository.calls[0]?.schemaVersion === 1, 'schema version mismatch');
  });
  await test('not configured is safe', async () => {
    const repository = fakeRepository({ ok: false, error: { kind: 'not_configured', message: 'secret' } });
    const result = await persistRuntimeEventCandidate(baseCandidate(), { repository });
    assert(result.status === 'not_configured', 'expected not_configured');
    assert(!result.notes.some((note) => note.includes('secret')), 'raw repository error leaked');
  });
  await test('repository error is safe', async () => {
    const repository = fakeRepository({ ok: false, error: { kind: 'database_error', message: 'SQL secret' } });
    const result = await persistRuntimeEventCandidate(baseCandidate(), { repository });
    assert(result.status === 'repository_error', 'expected repository_error');
    assert(!result.notes.some((note) => note.includes('SQL')), 'SQL leaked');
  });
  await test('repository throw is safe', async () => {
    const repository = fakeRepository();
    repository.appendRuntimeEvent = async () => { throw new Error('driver secret'); };
    const result = await persistRuntimeEventCandidate(baseCandidate(), { repository });
    assert(result.status === 'repository_error', 'expected repository_error');
    assert(!result.notes.some((note) => note.includes('driver')), 'driver error leaked');
  });
  await test('repository is called once for valid input', async () => {
    const repository = fakeRepository();
    await persistRuntimeEventCandidate(baseCandidate(), { repository });
    assert(repository.calls.length === 1, 'unexpected repository call count');
  });
  await test('repository is not called for missing event kind', async () => {
    const repository = fakeRepository();
    await persistRuntimeEventCandidate({ ...baseCandidate(), eventKind: '' }, { repository });
    assert(repository.calls.length === 0, 'repository called for invalid input');
  });
  await test('explicit idempotency key is preserved', async () => {
    const repository = fakeRepository();
    const result = await persistRuntimeEventCandidate({ ...baseCandidate(), idempotencyKey: 'provided-key' }, { repository });
    assert(result.idempotencyKey === 'provided-key' && repository.calls[0]?.idempotencyKey === 'provided-key', 'key changed');
  });
  await test('event kind is preserved', async () => {
    const repository = fakeRepository();
    await persistRuntimeEventCandidate({ ...baseCandidate(), eventKind: 'room.updated' }, { repository });
    assert(repository.calls[0]?.eventKind === 'room.updated', 'event kind changed');
  });
  await test('empty notes are safe', () => {
    const result = normalizeRuntimeEventPersistenceCandidate({ ...baseCandidate(), notes: undefined });
    assert(Array.isArray(result.notes) && result.notes.length === 0, 'notes not normalized');
  });
  await test('notes are trimmed', () => {
    const result = normalizeRuntimeEventPersistenceCandidate({ ...baseCandidate(), notes: ['  note  ', 1 as never] });
    assert(result.notes.length === 1 && result.notes[0] === 'note', 'notes not trimmed');
  });
  await test('runtime bridge does not make permission decisions', async () => {
    const repository = fakeRepository();
    const result = await persistRuntimeEventCandidate(baseCandidate(), { repository });
    assert(result.status === 'persisted', 'bridge added permission decision');
  });
  await test('no update or delete repository calls are required', () => {
    const repository = fakeRepository();
    assert(typeof repository.appendRuntimeEvent === 'function', 'append port missing');
    assert(!('updateRuntimeEvent' in repository) && !('deleteRuntimeEvent' in repository), 'mutable API exposed');
  });
  await test('bridge keeps live authority outside persistence', async () => {
    const repository = fakeRepository();
    const result = await persistRuntimeEventCandidate(baseCandidate(), { repository });
    assert(result.notes.join(' ').includes('long-term persistence'), 'authority boundary not explicit');
  });

  const passed = cases.filter((item) => item.passed).length;
  return {
    status: passed === cases.length ? 'passed' : 'failed',
    total: cases.length,
    passed,
    failed: cases.length - passed,
    cases,
  };
}
