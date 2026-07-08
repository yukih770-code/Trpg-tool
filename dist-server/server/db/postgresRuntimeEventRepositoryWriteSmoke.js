import { createPostgresUserRepository } from '../adapters/postgresUserRepository.js';
import { createPostgresCampaignRepository } from '../adapters/postgresCampaignRepository.js';
import { createPostgresActorRepository } from '../adapters/postgresActorRepository.js';
import { createPostgresRuntimeEventRepository, } from '../adapters/postgresRuntimeEventRepository.js';
import { checkPostgresHealth, withPostgresClient } from './postgresClient.js';
import { checkPostgresRuntimeEventSchemaReadiness, } from './postgresRuntimeEventSchemaReadiness.js';
const SMOKE_OWNER_USER_ID = 'user_runtime_write_smoke';
const SMOKE_OWNER_PROVIDER_KIND = 'localAnonymous';
const SMOKE_OWNER_PROVIDER_SUBJECT = 'runtime-write-smoke';
const SMOKE_OWNER_HANDLE = 'runtime-write-smoke';
const SMOKE_CAMPAIGN_ID = 'campaign_runtime_write_smoke';
const SMOKE_ACTOR_ID = 'actor_runtime_write_smoke';
const SMOKE_SESSION_ID = 'runtimeSession_write_smoke';
const SMOKE_EVENT_A = 'runtimeEvent_write_smoke_a';
const SMOKE_EVENT_B = 'runtimeEvent_write_smoke_b';
const SMOKE_EVENT_C = 'runtimeEvent_write_smoke_c';
const SMOKE_EVENT_C_RETRY = 'runtimeEvent_write_smoke_c_retry';
const SMOKE_IDEMPOTENCY_KEY = 'idem-runtime-write-smoke-c';
function makeClientExecutor(clientQuery) {
    return {
        query: (text, values) => clientQuery(text, values),
    };
}
function failedStep(name, errorKind) {
    return { name, ok: false, errorKind };
}
async function runWritePath(executor) {
    const steps = [];
    const userRepository = createPostgresUserRepository(executor, { useInternalTransactions: false });
    const createUser = await userRepository.createUserWithIdentity({
        identity: {
            userId: SMOKE_OWNER_USER_ID,
            providerKind: SMOKE_OWNER_PROVIDER_KIND,
            providerUserId: SMOKE_OWNER_PROVIDER_SUBJECT,
            displayName: 'Runtime Write Smoke Owner',
        },
        profile: { handle: SMOKE_OWNER_HANDLE, displayName: 'Runtime Write Smoke Owner', tags: [], visibility: 'private', pinned: [], sectionVisibility: {} },
    });
    if (createUser.ok === false)
        return [failedStep('createOwnerUser', createUser.error.kind)];
    steps.push({ name: 'createOwnerUser', ok: true });
    const campaignRepository = createPostgresCampaignRepository(executor, { useInternalTransactions: false });
    const createCampaign = await campaignRepository.createCampaign({
        campaignId: SMOKE_CAMPAIGN_ID,
        ownerId: SMOKE_OWNER_USER_ID,
        title: 'Runtime Write Smoke Campaign',
        systemId: 'dnd5e-2024',
    });
    if (createCampaign.ok === false)
        return [...steps, failedStep('createCampaign', createCampaign.error.kind)];
    steps.push({ name: 'createCampaign', ok: true });
    const actorRepository = createPostgresActorRepository(executor, { useInternalTransactions: false });
    const createActor = await actorRepository.createActor({
        actorId: SMOKE_ACTOR_ID,
        ownerId: SMOKE_OWNER_USER_ID,
        systemId: 'dnd5e-2024',
        localActorId: 'local_runtime_write_smoke',
        displayName: 'Runtime Write Smoke Actor',
        payload: { sheet: { note: 'rollback-only' } },
    });
    if (createActor.ok === false)
        return [...steps, failedStep('createActor', createActor.error.kind)];
    steps.push({ name: 'createActor', ok: true });
    const runtimeRepository = createPostgresRuntimeEventRepository(executor, { useInternalTransactions: false });
    const createSession = await runtimeRepository.createRuntimeSession({
        runtimeSessionId: SMOKE_SESSION_ID,
        campaignId: SMOKE_CAMPAIGN_ID,
        hostUserId: SMOKE_OWNER_USER_ID,
        roomId: 'room-runtime-write-smoke',
        title: 'Runtime Write Smoke Session',
    });
    if (createSession.ok === false)
        return [...steps, failedStep('createRuntimeSession', createSession.error.kind)];
    steps.push({ name: 'createRuntimeSession', ok: true });
    const appendA = await runtimeRepository.appendRuntimeEvent({
        runtimeEventId: SMOKE_EVENT_A,
        runtimeSessionId: SMOKE_SESSION_ID,
        campaignId: SMOKE_CAMPAIGN_ID,
        eventKind: 'smoke.note',
        createdByUserId: SMOKE_OWNER_USER_ID,
        payload: { step: 'A' },
    });
    if (appendA.ok === false)
        return [...steps, failedStep('appendEventA', appendA.error.kind)];
    if (appendA.value.seq !== 1)
        return [...steps, failedStep('appendEventA', `seq_expected_1_got_${appendA.value.seq}`)];
    steps.push({ name: 'appendEventA', ok: true });
    const appendB = await runtimeRepository.appendRuntimeEvent({
        runtimeEventId: SMOKE_EVENT_B,
        runtimeSessionId: SMOKE_SESSION_ID,
        campaignId: SMOKE_CAMPAIGN_ID,
        eventKind: 'smoke.note',
        actorId: SMOKE_ACTOR_ID,
        causedByEventId: SMOKE_EVENT_A,
        createdByUserId: SMOKE_OWNER_USER_ID,
        payload: { step: 'B' },
    });
    if (appendB.ok === false)
        return [...steps, failedStep('appendEventB', appendB.error.kind)];
    if (appendB.value.seq !== 2)
        return [...steps, failedStep('appendEventB', `seq_expected_2_got_${appendB.value.seq}`)];
    steps.push({ name: 'appendEventB', ok: true });
    const appendC = await runtimeRepository.appendRuntimeEvent({
        runtimeEventId: SMOKE_EVENT_C,
        runtimeSessionId: SMOKE_SESSION_ID,
        campaignId: SMOKE_CAMPAIGN_ID,
        eventKind: 'smoke.idempotent',
        idempotencyKey: SMOKE_IDEMPOTENCY_KEY,
        createdByUserId: SMOKE_OWNER_USER_ID,
        payload: { step: 'C' },
    });
    if (appendC.ok === false)
        return [...steps, failedStep('appendEventC', appendC.error.kind)];
    if (appendC.value.seq !== 3)
        return [...steps, failedStep('appendEventC', `seq_expected_3_got_${appendC.value.seq}`)];
    steps.push({ name: 'appendEventC', ok: true });
    // Retry the SAME idempotency key with a different id: must return the existing
    // event (same id + seq), NOT create a new row.
    const appendCRetry = await runtimeRepository.appendRuntimeEvent({
        runtimeEventId: SMOKE_EVENT_C_RETRY,
        runtimeSessionId: SMOKE_SESSION_ID,
        campaignId: SMOKE_CAMPAIGN_ID,
        eventKind: 'smoke.idempotent',
        idempotencyKey: SMOKE_IDEMPOTENCY_KEY,
        createdByUserId: SMOKE_OWNER_USER_ID,
        payload: { step: 'C-retry' },
    });
    if (appendCRetry.ok === false)
        return [...steps, failedStep('appendEventCIdempotentRetry', appendCRetry.error.kind)];
    if (appendCRetry.value.runtimeEventId !== SMOKE_EVENT_C || appendCRetry.value.seq !== 3) {
        return [...steps, failedStep('appendEventCIdempotentRetry', 'idempotency_not_deduplicated')];
    }
    steps.push({ name: 'appendEventCIdempotentRetry', ok: true });
    const eventById = await runtimeRepository.getRuntimeEventById(SMOKE_EVENT_A);
    if (eventById.ok === false)
        return [...steps, failedStep('getRuntimeEventById', eventById.error.kind)];
    if (!eventById.value || eventById.value.runtimeEventId !== SMOKE_EVENT_A) {
        return [...steps, failedStep('getRuntimeEventById', 'not_found')];
    }
    steps.push({ name: 'getRuntimeEventById', ok: true });
    const listFrom0 = await runtimeRepository.listRuntimeEvents(SMOKE_SESSION_ID, { afterSeq: 0 });
    if (listFrom0.ok === false)
        return [...steps, failedStep('listRuntimeEventsAfterSeq0', listFrom0.error.kind)];
    if (listFrom0.value.length !== 3) {
        return [...steps, failedStep('listRuntimeEventsAfterSeq0', `expected_3_got_${listFrom0.value.length}`)];
    }
    steps.push({ name: 'listRuntimeEventsAfterSeq0', ok: true });
    const listFrom1 = await runtimeRepository.listRuntimeEvents(SMOKE_SESSION_ID, { afterSeq: 1 });
    if (listFrom1.ok === false)
        return [...steps, failedStep('listRuntimeEventsAfterSeq1', listFrom1.error.kind)];
    if (listFrom1.value.length !== 2 || listFrom1.value.some((e) => e.seq <= 1)) {
        return [...steps, failedStep('listRuntimeEventsAfterSeq1', `expected_2_after_seq1_got_${listFrom1.value.length}`)];
    }
    steps.push({ name: 'listRuntimeEventsAfterSeq1', ok: true });
    const ended = await runtimeRepository.endRuntimeSession(SMOKE_SESSION_ID);
    if (ended.ok === false)
        return [...steps, failedStep('endRuntimeSession', ended.error.kind)];
    if (!ended.value || ended.value.status !== 'ended' || !ended.value.endedAt) {
        return [...steps, failedStep('endRuntimeSession', 'stale_read')];
    }
    steps.push({ name: 'endRuntimeSession', ok: true });
    const archived = await runtimeRepository.archiveRuntimeSession(SMOKE_SESSION_ID);
    if (archived.ok === false)
        return [...steps, failedStep('archiveRuntimeSession', archived.error.kind)];
    if (!archived.value || !archived.value.archivedAt) {
        return [...steps, failedStep('archiveRuntimeSession', 'stale_read')];
    }
    steps.push({ name: 'archiveRuntimeSession', ok: true });
    const restored = await runtimeRepository.restoreRuntimeSession(SMOKE_SESSION_ID);
    if (restored.ok === false)
        return [...steps, failedStep('restoreRuntimeSession', restored.error.kind)];
    if (!restored.value || restored.value.archivedAt) {
        return [...steps, failedStep('restoreRuntimeSession', 'stale_read')];
    }
    steps.push({ name: 'restoreRuntimeSession', ok: true });
    return steps;
}
export async function runPostgresRuntimeEventRepositoryRollbackWriteSmoke() {
    const database = await checkPostgresHealth();
    if (database.configured === false) {
        return { status: 'not_configured', database, schema: { status: 'not_configured' }, transaction: { attempted: false, rolledBack: false }, steps: [] };
    }
    if (database.status !== 'ok') {
        return {
            status: 'unreachable',
            database,
            schema: { status: 'unreachable', errorKind: database.errorKind, latencyMs: database.latencyMs },
            transaction: { attempted: false, rolledBack: false },
            steps: [],
            errorKind: database.errorKind,
        };
    }
    const schema = await checkPostgresRuntimeEventSchemaReadiness();
    if (schema.status !== 'ready') {
        // All non-ready schema statuses are members of the write-smoke status union.
        return { status: schema.status, database, schema, transaction: { attempted: false, rolledBack: false }, steps: [], errorKind: schema.errorKind };
    }
    const steps = [];
    let rolledBack = false;
    try {
        const transactionSteps = await withPostgresClient(async (client) => {
            await client.query('BEGIN');
            try {
                return await runWritePath(makeClientExecutor((text, values) => client.query(text, values ? [...values] : undefined)));
            }
            finally {
                await client.query('ROLLBACK');
                rolledBack = true;
            }
        });
        steps.push(...transactionSteps);
        const failed = steps.find((step) => !step.ok);
        return {
            status: failed ? 'repository_failed' : 'rolled_back',
            database,
            schema,
            transaction: { attempted: true, rolledBack },
            steps,
            errorKind: failed?.errorKind,
        };
    }
    catch (_error) {
        return {
            status: 'transaction_failed',
            database,
            schema,
            transaction: { attempted: true, rolledBack },
            steps,
            errorKind: 'transaction_failed',
        };
    }
}
