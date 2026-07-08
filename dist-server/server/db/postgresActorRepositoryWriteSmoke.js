import { createPostgresUserRepository } from '../adapters/postgresUserRepository.js';
import { createPostgresActorRepository, } from '../adapters/postgresActorRepository.js';
import { checkPostgresHealth, withPostgresClient } from './postgresClient.js';
import { checkPostgresActorSchemaReadiness, } from './postgresActorSchemaReadiness.js';
const SMOKE_OWNER_USER_ID = 'user_actor_write_smoke';
const SMOKE_OWNER_PROVIDER_KIND = 'localAnonymous';
const SMOKE_OWNER_PROVIDER_SUBJECT = 'actor-write-smoke';
const SMOKE_OWNER_HANDLE = 'actor-write-smoke';
const SMOKE_ACTOR_ID = 'actor_write_smoke';
const SMOKE_ACTOR_SYSTEM_ID = 'dnd5e-2024';
const SMOKE_ACTOR_LOCAL_ID = 'local_actor_write_smoke';
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
    // 1) Create the smoke owner user (FK target) with the same transactional executor.
    const userRepository = createPostgresUserRepository(executor, { useInternalTransactions: false });
    const createUser = await userRepository.createUserWithIdentity({
        identity: {
            userId: SMOKE_OWNER_USER_ID,
            providerKind: SMOKE_OWNER_PROVIDER_KIND,
            providerUserId: SMOKE_OWNER_PROVIDER_SUBJECT,
            displayName: 'Actor Write Smoke Owner',
        },
        profile: { handle: SMOKE_OWNER_HANDLE, displayName: 'Actor Write Smoke Owner', tags: [], visibility: 'private', pinned: [], sectionVisibility: {} },
    });
    if (createUser.ok === false)
        return [failedStep('createOwnerUser', createUser.error.kind)];
    steps.push({ name: 'createOwnerUser', ok: true });
    const actorRepository = createPostgresActorRepository(executor, { useInternalTransactions: false });
    const created = await actorRepository.createActor({
        actorId: SMOKE_ACTOR_ID,
        ownerId: SMOKE_OWNER_USER_ID,
        systemId: SMOKE_ACTOR_SYSTEM_ID,
        localActorId: SMOKE_ACTOR_LOCAL_ID,
        displayName: 'Actor Write Smoke',
        payload: { sheet: { name: 'Actor Write Smoke', level: 1, note: 'rollback-only' } },
    });
    if (created.ok === false)
        return [...steps, failedStep('createActor', created.error.kind)];
    steps.push({ name: 'createActor', ok: true });
    const byId = await actorRepository.getActorById(SMOKE_ACTOR_ID);
    if (byId.ok === false)
        return [...steps, failedStep('getActorById', byId.error.kind)];
    if (!byId.value || byId.value.actorId !== SMOKE_ACTOR_ID) {
        return [...steps, failedStep('getActorById', 'not_found')];
    }
    steps.push({ name: 'getActorById', ok: true });
    const byOrigin = await actorRepository.getActorByOrigin(SMOKE_OWNER_USER_ID, SMOKE_ACTOR_SYSTEM_ID, SMOKE_ACTOR_LOCAL_ID);
    if (byOrigin.ok === false)
        return [...steps, failedStep('getActorByOrigin', byOrigin.error.kind)];
    if (!byOrigin.value || byOrigin.value.actorId !== SMOKE_ACTOR_ID) {
        return [...steps, failedStep('getActorByOrigin', 'not_found')];
    }
    steps.push({ name: 'getActorByOrigin', ok: true });
    const listed = await actorRepository.listActorsByOwner(SMOKE_OWNER_USER_ID);
    if (listed.ok === false)
        return [...steps, failedStep('listActorsByOwner', listed.error.kind)];
    if (!listed.value.some((a) => a.actorId === SMOKE_ACTOR_ID)) {
        return [...steps, failedStep('listActorsByOwner', 'not_found')];
    }
    steps.push({ name: 'listActorsByOwner', ok: true });
    const updated = await actorRepository.updateActor({
        actorId: SMOKE_ACTOR_ID,
        displayName: 'Actor Write Smoke Updated',
        payload: { sheet: { name: 'Actor Write Smoke Updated', level: 2, note: 'rollback-only' } },
    });
    if (updated.ok === false)
        return [...steps, failedStep('updateActor', updated.error.kind)];
    if (!updated.value || updated.value.displayName !== 'Actor Write Smoke Updated') {
        return [...steps, failedStep('updateActor', 'stale_read')];
    }
    steps.push({ name: 'updateActor', ok: true });
    const archived = await actorRepository.archiveActor(SMOKE_ACTOR_ID);
    if (archived.ok === false)
        return [...steps, failedStep('archiveActor', archived.error.kind)];
    if (!archived.value || !archived.value.archivedAt) {
        return [...steps, failedStep('archiveActor', 'stale_read')];
    }
    steps.push({ name: 'archiveActor', ok: true });
    const restored = await actorRepository.restoreActor(SMOKE_ACTOR_ID);
    if (restored.ok === false)
        return [...steps, failedStep('restoreActor', restored.error.kind)];
    if (!restored.value || restored.value.archivedAt) {
        return [...steps, failedStep('restoreActor', 'stale_read')];
    }
    steps.push({ name: 'restoreActor', ok: true });
    return steps;
}
export async function runPostgresActorRepositoryRollbackWriteSmoke() {
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
    const schema = await checkPostgresActorSchemaReadiness();
    if (schema.status !== 'ready') {
        const status = schema.status === 'schema_missing'
            ? 'schema_missing'
            : schema.status === 'user_schema_missing'
                ? 'user_schema_missing'
                : schema.status;
        return { status, database, schema, transaction: { attempted: false, rolledBack: false }, steps: [], errorKind: schema.errorKind };
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
