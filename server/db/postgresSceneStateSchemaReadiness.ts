import { readDatabaseRuntimeConfigFromEnv } from '../config/databaseRuntimeConfig.js';
import { PostgresDatabaseError, queryPostgres } from './postgresClient.js';
import { checkPostgresRuntimeEventSchemaReadiness } from './postgresRuntimeEventSchemaReadiness.js';
import { checkPostgresWorldServerSchemaReadiness } from './postgresWorldServerSchemaReadiness.js';

export type PostgresSceneStateSchemaReadinessResult = { status: 'not_configured' | 'unreachable' | 'runtime_schema_missing' | 'world_schema_missing' | 'schema_missing' | 'ready' | 'error'; missingColumns?: string[]; errorKind?: string };
const REQUIRED = ['scene_state_id','world_server_id','campaign_id','room_id','runtime_session_id','title','description','schema_version','state_json','created_by_user_id','created_at','updated_at','archived_at','source_scene_state_id'];
export async function checkPostgresSceneStateSchemaReadiness(): Promise<PostgresSceneStateSchemaReadinessResult> {
  if (!readDatabaseRuntimeConfigFromEnv(process.env).configured) return { status: 'not_configured' };
  const runtime = await checkPostgresRuntimeEventSchemaReadiness();
  if (runtime.status === 'not_configured') return { status: 'not_configured' };
  if (runtime.status === 'unreachable') return { status: 'unreachable', errorKind: runtime.errorKind };
  if (runtime.status !== 'ready') return { status: 'runtime_schema_missing' };
  const world = await checkPostgresWorldServerSchemaReadiness();
  if (world.status === 'not_configured') return { status: 'not_configured' };
  if (world.status === 'unreachable') return { status: 'unreachable', errorKind: world.errorKind };
  if (world.status !== 'ready') return { status: 'world_schema_missing' };
  try { const result = await queryPostgres<{ column_name: string }>(`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='scene_state_documents'`, []); const columns = new Set(result.rows.map((row) => row.column_name)); const missingColumns = REQUIRED.filter((column) => !columns.has(column)); return missingColumns.length ? { status: 'schema_missing', missingColumns } : { status: 'ready' }; } catch (error) { if (error instanceof PostgresDatabaseError && error.message === 'schema_missing') return { status: 'schema_missing', missingColumns: REQUIRED }; return { status: 'error', errorKind: error instanceof PostgresDatabaseError ? error.message : 'database_error' }; }
}
