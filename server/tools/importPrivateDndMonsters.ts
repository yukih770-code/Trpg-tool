import { randomUUID } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { closePostgresPool } from '../db/postgresClient.js';
import { createPostgresDndPrivateMonsterRepository } from '../adapters/postgresDndPrivateMonsterRepository.js';
import { parsePrivateMonsterFile } from './privateDndMonsterImportParser.js';

function argument(name: string) { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1]?.trim() : undefined; }
const inputDir = argument('--input') ?? process.env.DND_PRIVATE_MONSTER_IMPORT_DIR?.trim();
const worldServerId = argument('--world-server-id') ?? process.env.DND_PRIVATE_MONSTER_WORLD_SERVER_ID?.trim();
const createdByUserId = argument('--created-by-user-id') ?? process.env.DND_PRIVATE_MONSTER_CREATED_BY_USER_ID?.trim();
const apply = process.argv.includes('--apply');
const dryRun = process.argv.includes('--dry-run') || !apply;

async function main() {
  if (!inputDir || !worldServerId || !createdByUserId) { console.error('Missing input directory, world server id, or creator id.'); process.exitCode = 1; return; }
  const entries = await readdir(inputDir, { withFileTypes: true }).catch(() => undefined);
  if (!entries) { console.error('Input directory is unavailable.'); process.exitCode = 1; return; }
  const names = entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
  const supported = names.filter((name) => /\.(json|jsonl|csv|md)$/i.test(name));
  const unsupportedFiles = names.length - supported.length;
  const records = []; const issues = [];
  for (const name of supported) { const parsed = parsePrivateMonsterFile(name, await readFile(join(inputDir, name), 'utf8')); records.push(...parsed.records); issues.push(...parsed.issues); }
  const skippedRecords = issues.length + unsupportedFiles;
  if (dryRun) { console.log(JSON.stringify({ mode: 'dry-run', supportedFiles: supported.length, unsupportedFiles, parsedRecords: records.length, skippedRecords, errors: issues.length }, null, 2)); return; }
  const repository = createPostgresDndPrivateMonsterRepository(); const batchId = randomUUID();
  const batch = await repository.createMonsterImportBatch({ importBatchId: batchId, worldServerId, createdByUserId, sourceFormat: 'local-machine-readable', sourceHash: undefined, totalRecords: records.length, importedRecords: 0, skippedRecords, errorCount: issues.length });
  if (!batch.ok) { console.error('Private monster import service is unavailable.'); process.exitCode = 1; return; }
  let imported = 0; let errors = issues.length;
  for (const record of records) { const created = await repository.createPrivateMonsterTemplate({ ...record, monsterTemplateId: randomUUID(), worldServerId, createdByUserId, importBatchId: batchId, visibility: 'private', schemaVersion: 1 }); if (created.ok) imported += 1; else errors += 1; }
  const finalSkippedRecords = skippedRecords + (records.length - imported);
  await repository.completeMonsterImportBatch({ importBatchId: batchId, importedRecords: imported, skippedRecords: finalSkippedRecords, errorCount: errors, importStatus: errors ? 'failed' : 'completed' });
  console.log(JSON.stringify({ mode: 'apply', supportedFiles: supported.length, unsupportedFiles, importedRecords: imported, skippedRecords: finalSkippedRecords, errors }, null, 2));
}
try { await main(); } finally { if (apply) await closePostgresPool(); }
