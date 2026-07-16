import { readDatabaseRuntimeConfigFromEnv } from '../config/databaseRuntimeConfig.js';
import { checkPostgresHealth } from './postgresClient.js';
import { checkPostgresUserSchemaReadiness } from './postgresSchemaReadiness.js';
import { checkPostgresCampaignSchemaReadiness } from './postgresCampaignSchemaReadiness.js';
import { checkPostgresActorSchemaReadiness } from './postgresActorSchemaReadiness.js';
import { checkPostgresAssetSchemaReadiness } from './postgresAssetSchemaReadiness.js';
import { checkPostgresRuntimeEventSchemaReadiness } from './postgresRuntimeEventSchemaReadiness.js';
import { checkPostgresGeneratedArtifactSchemaReadiness } from './postgresGeneratedArtifactSchemaReadiness.js';
import { checkPostgresWorldServerSchemaReadiness } from './postgresWorldServerSchemaReadiness.js';
import { checkPostgresVisibilitySchemaReadiness } from './postgresVisibilitySchemaReadiness.js';
import { checkPostgresPlatformFoundationSchemaReadiness } from './postgresPlatformFoundationSchemaReadiness.js';
import { checkPostgresSceneStateSchemaReadiness } from './postgresSceneStateSchemaReadiness.js';
import { checkPostgresDndPrivateMonsterSchemaReadiness } from './postgresDndPrivateMonsterSchemaReadiness.js';

/**
 * Aggregate read-only readiness across all P5.10-P5.19 schema families (P5.27).
 * Server-only, read-only: runs no write smokes, prints no connection string. Shared by
 * the all-schema verify + bootstrap CLIs so importing does not trigger a CLI run.
 */

export type PostgresAllSchemaStatus = 'not_configured' | 'unreachable' | 'ready' | 'partial' | 'error';

export interface PostgresAllSchemaReadinessResult {
  status: PostgresAllSchemaStatus;
  configured: boolean;
  reachable: boolean;
  schemas: Record<string, string>;
  readyCount: number;
  totalSchemas: number;
  notes: string[];
}

const SCHEMA_ORDER = ['user', 'campaign', 'actor', 'asset', 'runtime', 'generated', 'world', 'visibility', 'platformFoundation', 'sceneState', 'dndPrivateMonster'] as const;

export async function checkAllPostgresSchemaReadiness(): Promise<PostgresAllSchemaReadinessResult> {
  const config = readDatabaseRuntimeConfigFromEnv(process.env);
  const emptySchemas: Record<string, string> = {};
  for (const key of SCHEMA_ORDER) emptySchemas[key] = 'not_configured';

  if (!config.configured) {
    return { status: 'not_configured', configured: false, reachable: false, schemas: emptySchemas, readyCount: 0, totalSchemas: SCHEMA_ORDER.length, notes: ['Database env is not configured.'] };
  }

  const health = await checkPostgresHealth(config);
  if (health.status !== 'ok') {
    const kind = health.status === 'error'
      && (health.errorKind === 'connection_refused' || health.errorKind === 'connection_timeout' || health.errorKind === 'host_not_found' || health.errorKind === 'authentication_failed' || health.errorKind === 'database_not_found')
      ? 'unreachable' : 'error';
    const unreachableSchemas: Record<string, string> = {};
    for (const key of SCHEMA_ORDER) unreachableSchemas[key] = kind;
    return { status: kind, configured: true, reachable: false, schemas: unreachableSchemas, readyCount: 0, totalSchemas: SCHEMA_ORDER.length, notes: ['Database not reachable.'] };
  }

  const [user, campaign, actor, asset, runtime, generated, world, visibility, platformFoundation, sceneState, dndPrivateMonster] = await Promise.all([
    checkPostgresUserSchemaReadiness(),
    checkPostgresCampaignSchemaReadiness(),
    checkPostgresActorSchemaReadiness(),
    checkPostgresAssetSchemaReadiness(),
    checkPostgresRuntimeEventSchemaReadiness(),
    checkPostgresGeneratedArtifactSchemaReadiness(),
    checkPostgresWorldServerSchemaReadiness(),
    checkPostgresVisibilitySchemaReadiness(),
    checkPostgresPlatformFoundationSchemaReadiness(),
    checkPostgresSceneStateSchemaReadiness(),
    checkPostgresDndPrivateMonsterSchemaReadiness(),
  ]);

  const schemas: Record<string, string> = {
    user: user.status,
    campaign: campaign.status,
    actor: actor.status,
    asset: asset.status,
    runtime: runtime.status,
    generated: generated.status,
    world: world.status,
    visibility: visibility.status,
    platformFoundation: platformFoundation.status,
    sceneState: sceneState.status,
    dndPrivateMonster: dndPrivateMonster.status,
  };

  const statuses = Object.values(schemas);
  const readyCount = statuses.filter((s) => s === 'ready').length;
  const anyError = statuses.some((s) => s === 'error' || s === 'unreachable');
  let status: PostgresAllSchemaStatus;
  if (readyCount === SCHEMA_ORDER.length) status = 'ready';
  else if (readyCount === 0 && anyError) status = 'error';
  else status = 'partial';

  return {
    status,
    configured: true,
    reachable: true,
    schemas,
    readyCount,
    totalSchemas: SCHEMA_ORDER.length,
    notes: status === 'ready' ? ['All schemas ready.'] : ['Some schemas are not ready; apply pending migrations.'],
  };
}
