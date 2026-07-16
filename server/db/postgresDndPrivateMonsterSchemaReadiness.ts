import { readDatabaseRuntimeConfigFromEnv } from '../config/databaseRuntimeConfig.js';
import { PostgresDatabaseError, queryPostgres } from './postgresClient.js';
import { checkPostgresWorldServerSchemaReadiness } from './postgresWorldServerSchemaReadiness.js';

export type PostgresDndPrivateMonsterSchemaReadinessResult = { status: 'not_configured' | 'unreachable' | 'world_schema_missing' | 'schema_missing' | 'ready' | 'error'; missingColumns?: string[]; errorKind?: string };
const REQUIRED = ['monster_template_id','world_server_id','created_by_user_id','import_batch_id','name','slug','armor_class','hit_points_average','speed_json','abilities_json','actions_json','tags','visibility','schema_version','created_at','updated_at','archived_at'];

export async function checkPostgresDndPrivateMonsterSchemaReadiness(): Promise<PostgresDndPrivateMonsterSchemaReadinessResult> {
  if (!readDatabaseRuntimeConfigFromEnv(process.env).configured) return { status: 'not_configured' };
  const world = await checkPostgresWorldServerSchemaReadiness();
  if (world.status === 'not_configured') return { status: 'not_configured' };
  if (world.status === 'unreachable') return { status: 'unreachable', errorKind: world.errorKind };
  if (world.status !== 'ready') return { status: 'world_schema_missing' };
  try {
    const result = await queryPostgres<{ column_name: string }>(`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='dnd_private_monster_templates'`, []);
    const columns = new Set(result.rows.map((row) => row.column_name));
    const missingColumns = REQUIRED.filter((column) => !columns.has(column));
    return missingColumns.length ? { status: 'schema_missing', missingColumns } : { status: 'ready' };
  } catch (error) {
    if (error instanceof PostgresDatabaseError && error.message === 'schema_missing') return { status: 'schema_missing', missingColumns: REQUIRED };
    return { status: 'error', errorKind: error instanceof PostgresDatabaseError ? error.message : 'database_error' };
  }
}
