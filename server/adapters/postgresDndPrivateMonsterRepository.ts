import type { QueryResult, QueryResultRow } from 'pg';

import type { DndPrivateMonsterTemplate, DndMonsterImportBatch } from '../../src/lib/dnd/dndMonsterTemplateTypes.js';
import { PostgresDatabaseError, queryPostgres } from '../db/postgresClient.js';

export type DndPrivateMonsterRepositoryErrorKind = 'not_configured' | 'schema_missing' | 'conflict' | 'not_found' | 'database_error';
export type DndPrivateMonsterRepositoryResult<T> = { ok: true; value: T } | { ok: false; error: { kind: DndPrivateMonsterRepositoryErrorKind; message: string; retryable?: boolean } };
export interface DndPrivateMonsterRepositoryExecutor { query<T extends QueryResultRow>(text: string, values?: readonly unknown[]): Promise<QueryResult<T>>; }

export type CreatePrivateMonsterTemplateInput = Omit<DndPrivateMonsterTemplate, 'createdAt' | 'updatedAt' | 'archivedAt'>;
export type UpdatePrivateMonsterTemplateInput = Partial<Pick<DndPrivateMonsterTemplate,
  'name' | 'slug' | 'size' | 'creatureType' | 'alignment' | 'armorClass' | 'hitPointsAverage' | 'hitPointsFormula' | 'speed' | 'abilities' | 'savingThrows' | 'skills' | 'senses' | 'languages' | 'challengeRating' | 'proficiencyBonus' | 'traits' | 'actions' | 'reactions' | 'legendaryActions' | 'spellcasting' | 'tags'>> & { monsterTemplateId: string };

const MONSTER_COLS = 'monster_template_id,world_server_id,created_by_user_id,import_batch_id,name,slug,size,creature_type,alignment,armor_class,hit_points_average,hit_points_formula,speed_json,abilities_json,saving_throws_json,skills_json,senses_json,languages,challenge_rating,proficiency_bonus,traits_json,actions_json,reactions_json,legendary_actions_json,spellcasting_json,tags,source_format,source_hash,visibility,schema_version,created_at,updated_at,archived_at';
const BATCH_COLS = 'import_batch_id,world_server_id,created_by_user_id,source_format,source_hash,import_status,total_records,imported_records,skipped_records,error_count,created_at,completed_at';
const objectOf = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const arrayOf = <T>(value: unknown): T[] => Array.isArray(value) ? value as T[] : [];
const iso = (value: Date | string | null | undefined) => value ? value instanceof Date ? value.toISOString() : value : undefined;

function monster(row: Record<string, unknown>): DndPrivateMonsterTemplate {
  return {
    monsterTemplateId: String(row.monster_template_id), worldServerId: String(row.world_server_id), createdByUserId: row.created_by_user_id ? String(row.created_by_user_id) : undefined, importBatchId: row.import_batch_id ? String(row.import_batch_id) : undefined,
    name: String(row.name), slug: String(row.slug), size: row.size ? String(row.size) : undefined, creatureType: row.creature_type ? String(row.creature_type) : undefined, alignment: row.alignment ? String(row.alignment) : undefined,
    armorClass: row.armor_class === null || row.armor_class === undefined ? undefined : Number(row.armor_class), hitPointsAverage: row.hit_points_average === null || row.hit_points_average === undefined ? undefined : Number(row.hit_points_average), hitPointsFormula: row.hit_points_formula ? String(row.hit_points_formula) : undefined,
    speed: objectOf(row.speed_json), abilities: objectOf(row.abilities_json) as DndPrivateMonsterTemplate['abilities'], savingThrows: objectOf(row.saving_throws_json) as DndPrivateMonsterTemplate['savingThrows'], skills: objectOf(row.skills_json) as DndPrivateMonsterTemplate['skills'], senses: objectOf(row.senses_json), languages: row.languages ? String(row.languages) : undefined, challengeRating: row.challenge_rating ? String(row.challenge_rating) : undefined, proficiencyBonus: row.proficiency_bonus === null || row.proficiency_bonus === undefined ? undefined : Number(row.proficiency_bonus),
    traits: arrayOf(row.traits_json), actions: arrayOf(row.actions_json), reactions: arrayOf(row.reactions_json), legendaryActions: arrayOf(row.legendary_actions_json), spellcasting: row.spellcasting_json ? objectOf(row.spellcasting_json) : undefined, tags: arrayOf<string>(row.tags), sourceFormat: row.source_format ? String(row.source_format) : undefined, sourceHash: row.source_hash ? String(row.source_hash) : undefined, visibility: 'private', schemaVersion: 1, createdAt: iso(row.created_at as Date | string | null), updatedAt: iso(row.updated_at as Date | string | null), archivedAt: iso(row.archived_at as Date | string | null),
  };
}
function batch(row: Record<string, unknown>): DndMonsterImportBatch {
  return { importBatchId: String(row.import_batch_id), worldServerId: String(row.world_server_id), createdByUserId: row.created_by_user_id ? String(row.created_by_user_id) : undefined, sourceFormat: row.source_format ? String(row.source_format) : undefined, sourceHash: row.source_hash ? String(row.source_hash) : undefined, importStatus: String(row.import_status) as DndMonsterImportBatch['importStatus'], totalRecords: Number(row.total_records), importedRecords: Number(row.imported_records), skippedRecords: Number(row.skipped_records), errorCount: Number(row.error_count), createdAt: iso(row.created_at as Date | string | null), completedAt: iso(row.completed_at as Date | string | null) };
}
function failure(error: unknown): DndPrivateMonsterRepositoryResult<never> {
  if (error instanceof PostgresDatabaseError && error.kind === 'not_configured') return { ok: false, error: { kind: 'not_configured', message: 'Private monster repository is not configured.' } };
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  if (code === '42P01') return { ok: false, error: { kind: 'schema_missing', message: 'Private monster schema is missing.' } };
  if (code === '23505') return { ok: false, error: { kind: 'conflict', message: 'A private monster with this slug already exists.' } };
  return { ok: false, error: { kind: 'database_error', message: 'Private monster request failed.' } };
}

export interface PostgresDndPrivateMonsterRepository {
  listPrivateMonsterTemplates(worldServerId: string, options?: { includeArchived?: boolean; search?: string; creatureType?: string; challengeRating?: string; tag?: string; limit?: number }): Promise<DndPrivateMonsterRepositoryResult<DndPrivateMonsterTemplate[]>>;
  getPrivateMonsterTemplate(monsterTemplateId: string): Promise<DndPrivateMonsterRepositoryResult<DndPrivateMonsterTemplate | null>>;
  createPrivateMonsterTemplate(input: CreatePrivateMonsterTemplateInput): Promise<DndPrivateMonsterRepositoryResult<DndPrivateMonsterTemplate>>;
  updatePrivateMonsterTemplate(input: UpdatePrivateMonsterTemplateInput): Promise<DndPrivateMonsterRepositoryResult<DndPrivateMonsterTemplate | null>>;
  archivePrivateMonsterTemplate(monsterTemplateId: string): Promise<DndPrivateMonsterRepositoryResult<DndPrivateMonsterTemplate | null>>;
  createMonsterImportBatch(input: Omit<DndMonsterImportBatch, 'createdAt' | 'completedAt' | 'importStatus'> & { importStatus?: DndMonsterImportBatch['importStatus'] }): Promise<DndPrivateMonsterRepositoryResult<DndMonsterImportBatch>>;
  completeMonsterImportBatch(input: Pick<DndMonsterImportBatch, 'importBatchId' | 'importedRecords' | 'skippedRecords' | 'errorCount'> & { importStatus?: 'completed' | 'failed' }): Promise<DndPrivateMonsterRepositoryResult<DndMonsterImportBatch | null>>;
}

export function createPostgresDndPrivateMonsterRepository(executor: DndPrivateMonsterRepositoryExecutor = { query: queryPostgres }): PostgresDndPrivateMonsterRepository {
  async function one<T>(text: string, values: readonly unknown[], map: (row: Record<string, unknown>) => T): Promise<DndPrivateMonsterRepositoryResult<T | null>> { try { const result = await executor.query<Record<string, unknown>>(text, values); return { ok: true, value: result.rows[0] ? map(result.rows[0]) : null }; } catch (error) { return failure(error); } }
  const limit = (value: number | undefined) => Number.isInteger(value) && (value as number) > 0 ? Math.min(value as number, 200) : 100;
  return {
    async listPrivateMonsterTemplates(worldServerId, options = {}) {
      const where = ['world_server_id=$1']; const values: unknown[] = [worldServerId];
      if (!options.includeArchived) where.push('archived_at IS NULL');
      if (options.search?.trim()) { values.push(`%${options.search.trim()}%`); where.push(`(name ILIKE $${values.length} OR slug ILIKE $${values.length})`); }
      if (options.creatureType?.trim()) { values.push(options.creatureType.trim()); where.push(`creature_type=$${values.length}`); }
      if (options.challengeRating?.trim()) { values.push(options.challengeRating.trim()); where.push(`challenge_rating=$${values.length}`); }
      if (options.tag?.trim()) { values.push(options.tag.trim()); where.push(`$${values.length}=ANY(tags)`); }
      values.push(limit(options.limit));
      try { const result = await executor.query<Record<string, unknown>>(`SELECT ${MONSTER_COLS} FROM dnd_private_monster_templates WHERE ${where.join(' AND ')} ORDER BY updated_at DESC LIMIT $${values.length}`, values); return { ok: true, value: result.rows.map(monster) }; } catch (error) { return failure(error); }
    },
    getPrivateMonsterTemplate: (id) => one(`SELECT ${MONSTER_COLS} FROM dnd_private_monster_templates WHERE monster_template_id=$1 LIMIT 1`, [id], monster),
    async createPrivateMonsterTemplate(input) {
      const now = new Date().toISOString();
      const result = await one(`INSERT INTO dnd_private_monster_templates (${MONSTER_COLS}) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14::jsonb,$15::jsonb,$16::jsonb,$17::jsonb,$18,$19,$20,$21::jsonb,$22::jsonb,$23::jsonb,$24::jsonb,$25::jsonb,$26,$27,$28,'private',$29,$30,$30,NULL) RETURNING ${MONSTER_COLS}`,
        [input.monsterTemplateId,input.worldServerId,input.createdByUserId ?? null,input.importBatchId ?? null,input.name,input.slug,input.size ?? null,input.creatureType ?? null,input.alignment ?? null,input.armorClass ?? null,input.hitPointsAverage ?? null,input.hitPointsFormula ?? null,JSON.stringify(input.speed),JSON.stringify(input.abilities),JSON.stringify(input.savingThrows),JSON.stringify(input.skills),JSON.stringify(input.senses),input.languages ?? null,input.challengeRating ?? null,input.proficiencyBonus ?? null,JSON.stringify(input.traits),JSON.stringify(input.actions),JSON.stringify(input.reactions),JSON.stringify(input.legendaryActions),input.spellcasting ? JSON.stringify(input.spellcasting) : null,input.tags,input.sourceFormat ?? null,input.sourceHash ?? null,input.schemaVersion ?? 1,now], monster);
      return result.ok && result.value ? { ok: true, value: result.value } : result.ok ? { ok: false, error: { kind: 'database_error', message: 'Private monster was not created.' } } : result;
    },
    updatePrivateMonsterTemplate: (input) => one(`UPDATE dnd_private_monster_templates SET name=COALESCE($2,name),slug=COALESCE($3,slug),size=COALESCE($4,size),creature_type=COALESCE($5,creature_type),alignment=COALESCE($6,alignment),armor_class=COALESCE($7,armor_class),hit_points_average=COALESCE($8,hit_points_average),hit_points_formula=COALESCE($9,hit_points_formula),speed_json=COALESCE($10::jsonb,speed_json),abilities_json=COALESCE($11::jsonb,abilities_json),saving_throws_json=COALESCE($12::jsonb,saving_throws_json),skills_json=COALESCE($13::jsonb,skills_json),senses_json=COALESCE($14::jsonb,senses_json),languages=COALESCE($15,languages),challenge_rating=COALESCE($16,challenge_rating),proficiency_bonus=COALESCE($17,proficiency_bonus),traits_json=COALESCE($18::jsonb,traits_json),actions_json=COALESCE($19::jsonb,actions_json),reactions_json=COALESCE($20::jsonb,reactions_json),legendary_actions_json=COALESCE($21::jsonb,legendary_actions_json),spellcasting_json=COALESCE($22::jsonb,spellcasting_json),tags=COALESCE($23,tags),updated_at=$24 WHERE monster_template_id=$1 AND archived_at IS NULL RETURNING ${MONSTER_COLS}`,
      [input.monsterTemplateId,input.name?.trim() || null,input.slug?.trim() || null,input.size?.trim() || null,input.creatureType?.trim() || null,input.alignment?.trim() || null,input.armorClass ?? null,input.hitPointsAverage ?? null,input.hitPointsFormula?.trim() || null,input.speed ? JSON.stringify(input.speed) : null,input.abilities ? JSON.stringify(input.abilities) : null,input.savingThrows ? JSON.stringify(input.savingThrows) : null,input.skills ? JSON.stringify(input.skills) : null,input.senses ? JSON.stringify(input.senses) : null,input.languages?.trim() || null,input.challengeRating?.trim() || null,input.proficiencyBonus ?? null,input.traits ? JSON.stringify(input.traits) : null,input.actions ? JSON.stringify(input.actions) : null,input.reactions ? JSON.stringify(input.reactions) : null,input.legendaryActions ? JSON.stringify(input.legendaryActions) : null,input.spellcasting ? JSON.stringify(input.spellcasting) : null,input.tags ?? null,new Date().toISOString()], monster),
    archivePrivateMonsterTemplate: (id) => one(`UPDATE dnd_private_monster_templates SET archived_at=$2,updated_at=$2 WHERE monster_template_id=$1 AND archived_at IS NULL RETURNING ${MONSTER_COLS}`, [id,new Date().toISOString()], monster),
    async createMonsterImportBatch(input) { const now = new Date().toISOString(); const result = await one(`INSERT INTO dnd_private_monster_import_batches (${BATCH_COLS}) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NULL) RETURNING ${BATCH_COLS}`, [input.importBatchId,input.worldServerId,input.createdByUserId ?? null,input.sourceFormat ?? null,input.sourceHash ?? null,input.importStatus ?? 'running',input.totalRecords,input.importedRecords,input.skippedRecords,input.errorCount,now], batch); return result.ok && result.value ? { ok: true, value: result.value } : result.ok ? { ok: false, error: { kind: 'database_error', message: 'Import batch was not created.' } } : result; },
    completeMonsterImportBatch: (input) => one(`UPDATE dnd_private_monster_import_batches SET import_status=$2,imported_records=$3,skipped_records=$4,error_count=$5,completed_at=$6 WHERE import_batch_id=$1 RETURNING ${BATCH_COLS}`, [input.importBatchId,input.importStatus ?? 'completed',input.importedRecords,input.skippedRecords,input.errorCount,new Date().toISOString()], batch),
  };
}
