import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Postgres migration registry (P5.25) — server-only DB tooling.
 *
 * Discovers the manual SQL migrations under `server/db/migrations`, parses the
 * `NNNN` migration id from each filename, computes a content checksum, and returns
 * deterministically-sorted definitions. Pure filesystem/crypto — NO DB connection,
 * NO connection string, and it never prints SQL bodies.
 */

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'migrations');

const MIGRATION_FILENAME_RE = /^(\d{4})_[A-Za-z0-9_]+\.sql$/;

export interface PostgresMigrationDefinition {
  migrationId: string;
  filename: string;
  filepath: string;
  checksum: string;
  sql: string;
}

export interface PostgresMigrationRecord {
  migrationId: string;
  filename: string;
  checksum: string;
  appliedAt: string;
  executionMs: number | null;
  schemaVersion: number;
}

export type PostgresMigrationState =
  | 'pending'
  | 'applied'
  | 'checksum_mismatch'
  | 'missing_file'
  | 'out_of_order'
  | 'duplicate';

export interface PostgresMigrationStatusEntry {
  migrationId: string;
  filename: string;
  checksum: string;
  state: PostgresMigrationState;
  appliedAt?: string;
  executionMs?: number | null;
  notes: string[];
}

export function parsePostgresMigrationFilename(filename: string): { migrationId: string; valid: boolean; notes: string[] } {
  const match = MIGRATION_FILENAME_RE.exec(filename);
  if (!match) {
    return { migrationId: '', valid: false, notes: [`Filename "${filename}" must match NNNN_name.sql`] };
  }
  return { migrationId: match[1], valid: true, notes: [] };
}

export function computePostgresMigrationChecksum(sql: string): string {
  // Normalize line endings so CRLF/LF differences don't spuriously mismatch.
  const normalized = sql.replace(/\r\n/g, '\n');
  return `sha256:${createHash('sha256').update(normalized, 'utf8').digest('hex').slice(0, 32)}`;
}

function listSqlFilenames(): string[] {
  try {
    return readdirSync(MIGRATIONS_DIR)
      .filter((name) => name.toLowerCase().endsWith('.sql'))
      .sort();
  } catch {
    return [];
  }
}

/** All valid-named migration definitions, deterministically sorted by (id, filename). */
export function loadPostgresMigrationDefinitions(): PostgresMigrationDefinition[] {
  const defs: PostgresMigrationDefinition[] = [];
  for (const filename of listSqlFilenames()) {
    const parsed = parsePostgresMigrationFilename(filename);
    if (!parsed.valid) continue;
    const filepath = join(MIGRATIONS_DIR, filename);
    let sql = '';
    try {
      sql = readFileSync(filepath, 'utf8');
    } catch {
      continue;
    }
    defs.push({ migrationId: parsed.migrationId, filename, filepath, checksum: computePostgresMigrationChecksum(sql), sql });
  }
  defs.sort((a, b) => (a.migrationId === b.migrationId ? a.filename.localeCompare(b.filename) : a.migrationId.localeCompare(b.migrationId)));
  return defs;
}

/** Filenames present in the migrations dir that do NOT match the required pattern. */
export function getInvalidMigrationFilenames(): string[] {
  return listSqlFilenames().filter((name) => !parsePostgresMigrationFilename(name).valid);
}

/** Migration ids that appear on more than one file (deterministic, sorted). */
export function getDuplicateMigrationIds(defs: PostgresMigrationDefinition[] = loadPostgresMigrationDefinitions()): string[] {
  const seen = new Map<string, number>();
  for (const def of defs) seen.set(def.migrationId, (seen.get(def.migrationId) ?? 0) + 1);
  return [...seen.entries()].filter(([, count]) => count > 1).map(([id]) => id).sort();
}
