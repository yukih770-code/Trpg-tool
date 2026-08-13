export type RoomServerReadinessBlocker =
  | 'database_unavailable'
  | 'database_schema_not_ready'
  | 'startup_recovery_pending'
  | 'startup_recovery_failed';

export interface RoomServerHealthReadinessInput {
  databaseConfigured: boolean;
  databaseStatus: string;
  requiredSchemaStatuses: string[];
  startupRecoveryStatus: 'pending' | 'ready' | 'failed';
}

export interface RoomServerHealthReadiness {
  status: 'ready' | 'not_ready';
  blockers: RoomServerReadinessBlocker[];
  databaseSchemasReady: boolean;
  readySchemaCount: number;
  requiredSchemaCount: number;
}

/** Pure service-readiness policy shared by health diagnostics and smoke tests. */
export function evaluateRoomServerHealthReadiness(
  input: RoomServerHealthReadinessInput,
): RoomServerHealthReadiness {
  const blockers: RoomServerReadinessBlocker[] = [];
  const requiredSchemaCount = input.databaseConfigured ? input.requiredSchemaStatuses.length : 0;
  const readySchemaCount = input.databaseConfigured
    ? input.requiredSchemaStatuses.filter((status) => status === 'ready').length
    : 0;
  const databaseSchemasReady = !input.databaseConfigured || (
    requiredSchemaCount > 0 && readySchemaCount === requiredSchemaCount
  );

  if (input.databaseConfigured && input.databaseStatus !== 'ok') blockers.push('database_unavailable');
  if (input.databaseConfigured && !databaseSchemasReady) blockers.push('database_schema_not_ready');
  if (input.startupRecoveryStatus === 'pending') blockers.push('startup_recovery_pending');
  if (input.startupRecoveryStatus === 'failed') blockers.push('startup_recovery_failed');

  return {
    status: blockers.length === 0 ? 'ready' : 'not_ready',
    blockers,
    databaseSchemasReady,
    readySchemaCount,
    requiredSchemaCount,
  };
}
