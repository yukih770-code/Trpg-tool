import type { CombatRuntimeTableState } from '../combat/combatRuntimeTypes';
import type { MapBoardState } from '../map/mapRuntimeTypes';

export const SCENE_RUNTIME_SNAPSHOT_SCHEMA_VERSION = 1 as const;

export type SceneRuntimeSnapshotContext = {
  roomId?: string;
  campaignId?: string;
  runtimeSessionId?: string;
};

export type SceneRuntimeSnapshot = {
  schemaVersion: typeof SCENE_RUNTIME_SNAPSHOT_SCHEMA_VERSION;
  exportedAt: string;
  appFeature: 'scene-runtime-snapshot';
  roomId?: string;
  campaignId?: string;
  runtimeSessionId?: string;
  combat?: CombatRuntimeTableState;
  map?: { board: MapBoardState };
  metadata?: {
    title?: string;
    notes?: string;
  };
};

export type SceneRuntimeSnapshotSummary = {
  hasCombat: boolean;
  hasMap: boolean;
  combatantCount: number;
  tokenCount: number;
  hasMapBackground: boolean;
};

export type SceneRuntimeSnapshotWarning =
  | 'room_mismatch'
  | 'campaign_mismatch'
  | 'runtime_session_mismatch';

export type SceneRuntimeSnapshotValidation =
  | {
      ok: true;
      snapshot: SceneRuntimeSnapshot;
      warnings: SceneRuntimeSnapshotWarning[];
    }
  | {
      ok: false;
      errors: string[];
    };

export type SceneRuntimeSnapshotImportResult = SceneRuntimeSnapshotValidation;
