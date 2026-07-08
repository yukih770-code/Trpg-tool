import { createPostgresUserRepository, } from '../adapters/postgresUserRepository.js';
import { checkPostgresHealth, withPostgresClient } from './postgresClient.js';
import { checkPostgresUserSchemaReadiness, } from './postgresSchemaReadiness.js';
const WRITE_SMOKE_USER_ID = 'user_postgres_write_smoke';
const WRITE_SMOKE_PROVIDER_KIND = 'localAnonymous';
const WRITE_SMOKE_PROVIDER_SUBJECT = 'postgres-write-smoke';
const WRITE_SMOKE_HANDLE = 'postgres-write-smoke';
function makeClientExecutor(clientQuery) {
    return {
        query: (text, values) => clientQuery(text, values),
    };
}
function failedStep(name, errorKind) {
    return { name, ok: false, errorKind };
}
async function runRepositoryWritePath(repository) {
    const steps = [];
    const createResult = await repository.createUserWithIdentity({
        identity: {
            userId: WRITE_SMOKE_USER_ID,
            providerKind: WRITE_SMOKE_PROVIDER_KIND,
            providerUserId: WRITE_SMOKE_PROVIDER_SUBJECT,
            displayName: 'Postgres Write Smoke',
            email: 'postgres-write-smoke@example.invalid',
        },
        profile: {
            handle: WRITE_SMOKE_HANDLE,
            displayName: 'Postgres Write Smoke',
            bio: 'Rollback-only write smoke profile.',
            tags: ['smoke', 'rollback'],
            visibility: 'private',
            pinned: [],
            sectionVisibility: {},
        },
    });
    if (createResult.ok === false)
        return [failedStep('createUserWithIdentity', createResult.error.kind)];
    steps.push({ name: 'createUserWithIdentity', ok: true });
    const byId = await repository.getUserById(WRITE_SMOKE_USER_ID);
    if (byId.ok === false)
        return [...steps, failedStep('getUserById', byId.error.kind)];
    if (!byId.value || byId.value.identity.userId !== WRITE_SMOKE_USER_ID) {
        return [...steps, failedStep('getUserById', 'not_found')];
    }
    steps.push({ name: 'getUserById', ok: true });
    const byIdentity = await repository.getUserByIdentity(WRITE_SMOKE_PROVIDER_KIND, WRITE_SMOKE_PROVIDER_SUBJECT);
    if (byIdentity.ok === false)
        return [...steps, failedStep('getUserByIdentity', byIdentity.error.kind)];
    if (!byIdentity.value || byIdentity.value.identity.userId !== WRITE_SMOKE_USER_ID) {
        return [...steps, failedStep('getUserByIdentity', 'not_found')];
    }
    steps.push({ name: 'getUserByIdentity', ok: true });
    const profile = await repository.getUserProfile(WRITE_SMOKE_USER_ID);
    if (profile.ok === false)
        return [...steps, failedStep('getUserProfile', profile.error.kind)];
    if (!profile.value || profile.value.handle !== WRITE_SMOKE_HANDLE) {
        return [...steps, failedStep('getUserProfile', 'not_found')];
    }
    steps.push({ name: 'getUserProfile', ok: true });
    const updatedProfile = {
        ...profile.value,
        displayName: 'Postgres Write Smoke Updated',
        bio: 'Rollback-only write smoke profile updated.',
        tags: [...profile.value.tags, 'updated'],
    };
    const saveProfile = await repository.saveUserProfile(updatedProfile);
    if (saveProfile.ok === false)
        return [...steps, failedStep('saveUserProfile', saveProfile.error.kind)];
    steps.push({ name: 'saveUserProfile', ok: true });
    const updatedRead = await repository.getUserProfile(WRITE_SMOKE_USER_ID);
    if (updatedRead.ok === false)
        return [...steps, failedStep('getUserProfileAfterSave', updatedRead.error.kind)];
    if (!updatedRead.value || updatedRead.value.displayName !== 'Postgres Write Smoke Updated') {
        return [...steps, failedStep('getUserProfileAfterSave', 'stale_read')];
    }
    steps.push({ name: 'getUserProfileAfterSave', ok: true });
    return steps;
}
export async function runPostgresUserRepositoryRollbackWriteSmoke() {
    const database = await checkPostgresHealth();
    if (database.configured === false) {
        return {
            status: 'not_configured',
            database,
            schema: { status: 'not_configured' },
            transaction: { attempted: false, rolledBack: false },
            steps: [],
        };
    }
    if (database.status !== 'ok') {
        return {
            status: 'unreachable',
            database,
            schema: {
                status: 'unreachable',
                errorKind: database.errorKind,
                latencyMs: database.latencyMs,
            },
            transaction: { attempted: false, rolledBack: false },
            steps: [],
            errorKind: database.errorKind,
        };
    }
    const schema = await checkPostgresUserSchemaReadiness();
    if (schema.status !== 'ready') {
        return {
            status: schema.status === 'schema_missing' ? 'schema_missing' : schema.status,
            database,
            schema,
            transaction: { attempted: false, rolledBack: false },
            steps: [],
            errorKind: schema.errorKind,
        };
    }
    const steps = [];
    let rolledBack = false;
    try {
        const transactionSteps = await withPostgresClient(async (client) => {
            await client.query('BEGIN');
            try {
                const repository = createPostgresUserRepository(makeClientExecutor((text, values) => client.query(text, values ? [...values] : undefined)), { useInternalTransactions: false });
                return await runRepositoryWritePath(repository);
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
