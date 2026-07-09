import type { QueryResultRow } from 'pg';

import { readDatabaseRuntimeConfigFromEnv } from '../config/databaseRuntimeConfig.js';
import { checkPostgresHealth, queryPostgres, withPostgresClient } from './postgresClient.js';
import {
  loadPostgresMigrationDefinitions,
  getInvalidMigrationFilenames,
  getDuplicateMigrationIds,
  computePostgresMigrationChecksum,
  type PostgresMigrationDefinition,
  type PostgresMigrationStatusEntry,
} from './postgresMigrationRegistry.js';

/**
 * Postgres migration runner (P5.26) — server-only DB tooling.
 *
 * Computes migration status, applies pending migrations (dry-run by default, explicit
 * apply required), and safely bootstraps the `schema_migrations` history table. Fails
 * closed on any anomaly (checksum mismatch, missing applied file, out-of-order,
 * duplicate id, invalid filename). NEVER prints the connection string or SQL bodies,
 * NEVER auto-applies on server startup or /health, NEVER does a destructive rollback.
 */

export type PostgresMigrationRunnerStatus =
  | 'not_configured'
  | 'unreachable'
  | 'ready'
  | 'applied'
  | 'dry_run'
  | 'blocked'
  | 'error';

export interface MigrationRunnerResult {
  status: 'not_configured' | 'unreachable' | 'ready' | 'error';
  notes: string[];
  errorKind?: string;
}

export interface PostgresMigrationStatusResult {
  status: 'not_configured' | 'unreachable' | 'ready' | 'blocked' | 'error';
  configured: boolean;
  reachable: boolean;
  entries: PostgresMigrationStatusEntry[];
  totalDefinitions: number;
  appliedCount: number;
  pendingCount: number;
  blockingIssues: string[];
  notes: string[];
}

export interface PostgresMigrationApplyResult {
  status: PostgresMigrationRunnerStatus;
  dryRun: boolean;
  plannedMigrations: { migrationId: string; filename: string }[];
  appliedMigrations: { migrationId: string; filename: string; executionMs: number }[];
  blockingIssues: string[];
  errorKind?: string;
  notes: string[];
}

interface MigrationHistoryRow extends QueryResultRow {
  migration_id: string;
  filename: string;
  checksum: string;
  applied_at: Date | string;
  execution_ms: number | null;
  schema_version: number;
}

const MIGRATION_HISTORY_DDL = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    migration_id TEXT PRIMARY KEY,
    filename TEXT NOT NULL UNIQUE,
    checksum TEXT NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    execution_ms INTEGER,
    schema_version INTEGER NOT NULL DEFAULT 1,
    applied_by TEXT,
    notes TEXT
  );
`;

const HISTORY_MIGRATION_ID = '0000';

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

function healthErrorKind(errorKind: string): 'unreachable' | 'error' {
  return errorKind === 'connection_refused' || errorKind === 'connection_timeout' || errorKind === 'host_not_found' || errorKind === 'authentication_failed' || errorKind === 'database_not_found'
    ? 'unreachable'
    : 'error';
}

export async function ensurePostgresMigrationHistoryTable(): Promise<MigrationRunnerResult> {
  const config = readDatabaseRuntimeConfigFromEnv(process.env);
  if (!config.configured) return { status: 'not_configured', notes: ['Database env is not configured.'] };
  const health = await checkPostgresHealth(config);
  if (health.status !== 'ok') {
    const kind = health.status === 'not_configured' ? 'not_configured' : healthErrorKind(health.errorKind);
    return { status: kind === 'not_configured' ? 'not_configured' : kind, notes: ['Database not reachable.'], errorKind: health.status === 'error' ? health.errorKind : undefined };
  }
  try {
    await queryPostgres(MIGRATION_HISTORY_DDL, [], config);
    return { status: 'ready', notes: ['schema_migrations ensured.'] };
  } catch (error) {
    return { status: 'error', notes: ['Failed to ensure schema_migrations.'], errorKind: error instanceof Error ? 'ensure_failed' : 'ensure_failed' };
  }
}

async function readMigrationRecords(): Promise<Map<string, MigrationHistoryRow>> {
  const result = await queryPostgres<MigrationHistoryRow>(
    `SELECT migration_id, filename, checksum, applied_at, execution_ms, schema_version FROM schema_migrations ORDER BY migration_id ASC`,
  );
  const byId = new Map<string, MigrationHistoryRow>();
  for (const row of result.rows) byId.set(row.migration_id, row);
  return byId;
}

/** Registry-level (DB-independent) blocking issues: invalid filenames + duplicate ids. */
function registryBlockingIssues(defs: PostgresMigrationDefinition[]): string[] {
  const issues: string[] = [];
  for (const name of getInvalidMigrationFilenames()) issues.push(`invalid_filename:${name}`);
  for (const id of getDuplicateMigrationIds(defs)) issues.push(`duplicate_migration_id:${id}`);
  return issues;
}

export async function getPostgresMigrationStatus(): Promise<PostgresMigrationStatusResult> {
  const config = readDatabaseRuntimeConfigFromEnv(process.env);
  const defs = loadPostgresMigrationDefinitions();
  const blockingIssues = registryBlockingIssues(defs);

  const baseEntries: PostgresMigrationStatusEntry[] = defs.map((d) => ({
    migrationId: d.migrationId,
    filename: d.filename,
    checksum: d.checksum,
    state: 'pending',
    notes: [],
  }));

  if (!config.configured) {
    return {
      status: blockingIssues.length > 0 ? 'blocked' : 'not_configured',
      configured: false,
      reachable: false,
      entries: baseEntries,
      totalDefinitions: defs.length,
      appliedCount: 0,
      pendingCount: defs.length,
      blockingIssues,
      notes: ['Database env is not configured; showing file registry only.'],
    };
  }

  const health = await checkPostgresHealth(config);
  if (health.status !== 'ok') {
    const kind = health.status === 'not_configured' ? 'not_configured' : healthErrorKind(health.errorKind);
    return {
      status: kind === 'not_configured' ? 'not_configured' : kind === 'unreachable' ? 'unreachable' : 'error',
      configured: true,
      reachable: false,
      entries: baseEntries,
      totalDefinitions: defs.length,
      appliedCount: 0,
      pendingCount: defs.length,
      blockingIssues,
      notes: ['Database not reachable.'],
    };
  }

  await ensurePostgresMigrationHistoryTable();
  const records = await readMigrationRecords();

  const appliedIds = defs.filter((d) => records.has(d.migrationId)).map((d) => d.migrationId);
  const maxAppliedId = appliedIds.length > 0 ? appliedIds.reduce((a, b) => (a > b ? a : b)) : '';

  const entries: PostgresMigrationStatusEntry[] = defs.map((d) => {
    const record = records.get(d.migrationId);
    if (!record) {
      // Pending. Out-of-order if an already-applied migration has a higher id.
      if (maxAppliedId !== '' && d.migrationId < maxAppliedId) {
        blockingIssues.push(`out_of_order:${d.migrationId}`);
        return { migrationId: d.migrationId, filename: d.filename, checksum: d.checksum, state: 'out_of_order', notes: ['A later migration was applied before this one.'] };
      }
      return { migrationId: d.migrationId, filename: d.filename, checksum: d.checksum, state: 'pending', notes: [] };
    }
    if (record.checksum !== d.checksum) {
      blockingIssues.push(`checksum_mismatch:${d.migrationId}`);
      return { migrationId: d.migrationId, filename: d.filename, checksum: d.checksum, state: 'checksum_mismatch', appliedAt: toIso(record.applied_at), executionMs: record.execution_ms, notes: ['Applied checksum differs from current file.'] };
    }
    return { migrationId: d.migrationId, filename: d.filename, checksum: d.checksum, state: 'applied', appliedAt: toIso(record.applied_at), executionMs: record.execution_ms, notes: [] };
  });

  // Records with no matching definition file → missing_file (do not include their content).
  const defIds = new Set(defs.map((d) => d.migrationId));
  for (const [migrationId, record] of records) {
    if (!defIds.has(migrationId)) {
      blockingIssues.push(`missing_file:${migrationId}`);
      entries.push({ migrationId, filename: record.filename, checksum: record.checksum, state: 'missing_file', appliedAt: toIso(record.applied_at), executionMs: record.execution_ms, notes: ['Applied migration has no matching file.'] });
    }
  }

  entries.sort((a, b) => (a.migrationId === b.migrationId ? a.filename.localeCompare(b.filename) : a.migrationId.localeCompare(b.migrationId)));
  const appliedCount = entries.filter((e) => e.state === 'applied').length;
  const pendingCount = entries.filter((e) => e.state === 'pending').length;

  return {
    status: blockingIssues.length > 0 ? 'blocked' : 'ready',
    configured: true,
    reachable: true,
    entries,
    totalDefinitions: defs.length,
    appliedCount,
    pendingCount,
    blockingIssues,
    notes: blockingIssues.length > 0 ? ['Resolve blocking issues before applying.'] : [],
  };
}

export async function applyPendingPostgresMigrations(options: {
  dryRun?: boolean;
  targetMigrationId?: string;
  maxMigrations?: number;
} = {}): Promise<PostgresMigrationApplyResult> {
  const dryRun = options.dryRun ?? true;
  const status = await getPostgresMigrationStatus();

  if (status.status === 'not_configured') {
    return { status: 'not_configured', dryRun, plannedMigrations: [], appliedMigrations: [], blockingIssues: status.blockingIssues, notes: ['Database env is not configured.'] };
  }
  if (status.status === 'unreachable') {
    return { status: 'unreachable', dryRun, plannedMigrations: [], appliedMigrations: [], blockingIssues: status.blockingIssues, notes: ['Database not reachable.'] };
  }
  if (status.status === 'error') {
    return { status: 'error', dryRun, plannedMigrations: [], appliedMigrations: [], blockingIssues: status.blockingIssues, notes: ['Migration status error.'] };
  }
  if (status.status === 'blocked') {
    return { status: 'blocked', dryRun, plannedMigrations: [], appliedMigrations: [], blockingIssues: status.blockingIssues, notes: ['Blocked; refusing to apply. Resolve blocking issues first.'] };
  }

  const defs = loadPostgresMigrationDefinitions();
  const pendingIds = new Set(status.entries.filter((e) => e.state === 'pending').map((e) => e.migrationId));
  let planned = defs.filter((d) => pendingIds.has(d.migrationId));
  if (options.targetMigrationId) planned = planned.filter((d) => d.migrationId <= options.targetMigrationId!);
  if (Number.isInteger(options.maxMigrations) && (options.maxMigrations as number) > 0) planned = planned.slice(0, options.maxMigrations);

  const plannedMigrations = planned.map((d) => ({ migrationId: d.migrationId, filename: d.filename }));

  if (dryRun) {
    return {
      status: 'dry_run',
      dryRun: true,
      plannedMigrations,
      appliedMigrations: [],
      blockingIssues: [],
      notes: [`Dry run: ${plannedMigrations.length} migration(s) would be applied. Pass --apply to execute.`],
    };
  }

  const appliedMigrations: { migrationId: string; filename: string; executionMs: number }[] = [];
  for (const def of planned) {
    const startedAt = Date.now();
    try {
      await withPostgresClient(async (client) => {
        await client.query('BEGIN');
        try {
          await client.query(def.sql);
          const executionMs = Date.now() - startedAt;
          await client.query(
            `INSERT INTO schema_migrations (migration_id, filename, checksum, applied_at, execution_ms, schema_version)
             VALUES ($1, $2, $3, $4, $5, 1)
             ON CONFLICT (migration_id) DO NOTHING`,
            [def.migrationId, def.filename, computePostgresMigrationChecksum(def.sql), new Date().toISOString(), executionMs],
          );
          await client.query('COMMIT');
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        }
      });
      appliedMigrations.push({ migrationId: def.migrationId, filename: def.filename, executionMs: Date.now() - startedAt });
    } catch {
      return {
        status: 'error',
        dryRun: false,
        plannedMigrations,
        appliedMigrations,
        blockingIssues: [],
        errorKind: 'apply_failed',
        notes: [`Failed applying ${def.filename}; rolled back that migration and stopped.`],
      };
    }
  }

  return {
    status: 'applied',
    dryRun: false,
    plannedMigrations,
    appliedMigrations,
    blockingIssues: [],
    notes: [`Applied ${appliedMigrations.length} migration(s) in order.`],
  };
}

export { HISTORY_MIGRATION_ID };
