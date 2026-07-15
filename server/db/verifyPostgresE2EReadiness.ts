import { closePostgresPool } from './postgresClient.js';
import { applyPendingPostgresMigrations, getPostgresMigrationStatus } from './postgresMigrationRunner.js';
import { checkAllPostgresSchemaReadiness } from './postgresAllSchemaReadiness.js';
import { runPostgresUserRepositoryRollbackWriteSmoke } from './postgresUserRepositoryWriteSmoke.js';
import { runPostgresCampaignRepositoryRollbackWriteSmoke } from './postgresCampaignRepositoryWriteSmoke.js';
import { runPostgresActorRepositoryRollbackWriteSmoke } from './postgresActorRepositoryWriteSmoke.js';
import { runPostgresAssetRepositoryRollbackWriteSmoke } from './postgresAssetRepositoryWriteSmoke.js';
import { runPostgresRuntimeEventRepositoryRollbackWriteSmoke } from './postgresRuntimeEventRepositoryWriteSmoke.js';
import { runPostgresGeneratedArtifactRepositoryRollbackWriteSmoke } from './postgresGeneratedArtifactRepositoryWriteSmoke.js';
import { runPostgresWorldServerRepositoryRollbackWriteSmoke } from './postgresWorldServerRepositoryWriteSmoke.js';
import { runPostgresVisibilityRepositoryRollbackWriteSmoke } from './postgresVisibilityRepositoryWriteSmoke.js';
import { runPostgresPlatformFoundationRepositoryRollbackWriteSmoke } from './postgresPlatformFoundationRepositoryWriteSmoke.js';

type SmokeSummary = {
  name: string;
  status: string;
  transaction?: { attempted: boolean; rolledBack: boolean };
  failedStep?: string;
  errorKind?: string;
};

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

function safeErrorKind(error: unknown): string {
  return error instanceof Error ? 'verification_error' : 'verification_error';
}

async function runWriteSmoke(
  name: string,
  runner: () => Promise<{ status: string; transaction?: { attempted: boolean; rolledBack: boolean }; steps?: Array<{ name: string; ok: boolean; errorKind?: string }>; errorKind?: string }>,
): Promise<SmokeSummary> {
  try {
    const result = await runner();
    const failedStep = result.steps?.find((step) => !step.ok);
    return {
      name,
      status: result.status,
      transaction: result.transaction,
      failedStep: failedStep?.name,
      errorKind: result.errorKind ?? failedStep?.errorKind,
    };
  } catch (error) {
    return { name, status: 'error', errorKind: safeErrorKind(error) };
  }
}

async function main(): Promise<void> {
  const strict = hasFlag('--strict');
  const includeWriteSmokes = hasFlag('--include-write-smokes');
  const applyMigrations = hasFlag('--apply-migrations');

  const migrationStatusBefore = await getPostgresMigrationStatus();
  const migration = await applyPendingPostgresMigrations({ dryRun: !applyMigrations });
  const migrationStatusAfter = applyMigrations
    ? await getPostgresMigrationStatus()
    : migrationStatusBefore;
  const readiness = await checkAllPostgresSchemaReadiness();

  let writeSmokes: SmokeSummary[] = [];
  if (includeWriteSmokes) {
    if (readiness.status === 'not_configured') {
      writeSmokes = [{ name: 'all', status: 'skipped', errorKind: 'database_not_configured' }];
    } else {
      writeSmokes = await Promise.all([
        runWriteSmoke('user', runPostgresUserRepositoryRollbackWriteSmoke),
        runWriteSmoke('campaign', runPostgresCampaignRepositoryRollbackWriteSmoke),
        runWriteSmoke('actor', runPostgresActorRepositoryRollbackWriteSmoke),
        runWriteSmoke('asset', runPostgresAssetRepositoryRollbackWriteSmoke),
        runWriteSmoke('runtime', runPostgresRuntimeEventRepositoryRollbackWriteSmoke),
        runWriteSmoke('generated', runPostgresGeneratedArtifactRepositoryRollbackWriteSmoke),
        runWriteSmoke('world', runPostgresWorldServerRepositoryRollbackWriteSmoke),
        runWriteSmoke('visibility', runPostgresVisibilityRepositoryRollbackWriteSmoke),
        runWriteSmoke('platform', runPostgresPlatformFoundationRepositoryRollbackWriteSmoke),
      ]);
    }
  }

  const migrationFailed = migration.status === 'blocked' || migration.status === 'error' || migration.status === 'unreachable' || migration.status === 'not_configured';
  const readinessFailed = readiness.status !== 'ready';
  const writeFailed = includeWriteSmokes && writeSmokes.some((smoke) => smoke.status !== 'rolled_back');
  const strictFailed = strict && (migrationFailed || readinessFailed || writeFailed);

  // eslint-disable-next-line no-console
  console.log(JSON.stringify({
    checkedAt: new Date().toISOString(),
    strict,
    includeWriteSmokes,
    applyMigrations,
    status: strictFailed ? 'failed' : readiness.status === 'not_configured' ? 'not_configured' : readiness.status,
    migration: {
      before: {
        status: migrationStatusBefore.status,
        appliedCount: migrationStatusBefore.appliedCount,
        pendingCount: migrationStatusBefore.pendingCount,
        blockingIssues: migrationStatusBefore.blockingIssues,
      },
      plan: {
        status: migration.status,
        dryRun: migration.dryRun,
        plannedCount: migration.plannedMigrations.length,
        appliedCount: migration.appliedMigrations.length,
        blockingIssues: migration.blockingIssues,
      },
      after: {
        status: migrationStatusAfter.status,
        appliedCount: migrationStatusAfter.appliedCount,
        pendingCount: migrationStatusAfter.pendingCount,
        blockingIssues: migrationStatusAfter.blockingIssues,
      },
    },
    schemas: {
      status: readiness.status,
      configured: readiness.configured,
      reachable: readiness.reachable,
      readyCount: readiness.readyCount,
      totalSchemas: readiness.totalSchemas,
      states: readiness.schemas,
    },
    writeSmokes,
    notes: [
      'Default mode is read-only: migrations are dry-run and write smokes are disabled.',
      'Pass --apply-migrations to apply pending migrations explicitly.',
      'Pass --include-write-smokes to run rollback-only schema write smokes explicitly.',
      'No database URL, SQL body, or raw database error is printed.',
    ],
  }, null, 2));

  if (strictFailed) process.exitCode = 1;
}

try {
  await main();
} finally {
  await closePostgresPool();
}
